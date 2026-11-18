import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  verifyPassword,
  verifyDummyPassword,
  sanitizeUserForClient,
  generateSessionToken,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/auth-security";
import {
  findUserByEmailOrUsername,
  createSession,
  logAuditEvent,
} from "@/lib/db";
import { getCanonicalPlayerSummary } from "@/lib/player-session";
import { extractClientIp, sanitizePlainText } from "@/lib/input-security";
import { prisma } from "@/lib/prisma";

const LoginSchema = z.object({
  identifier: z.string().trim().min(3, "Email or username required").max(120),
  password: z.string().min(1, "Password required").max(128),
});

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const userAgent = (req.headers.get("user-agent") || "unknown").slice(0, 200);

  // IP Rate Limit check
  const ipRateLimit = checkRateLimit(`login_ip_${ip}`);
  if (!ipRateLimit.allowed) {
    await logAuditEvent({
      user_id: null,
      event_type: "RATE_LIMITED",
      ip_address: ip,
      details: {
        action: "login_ip_locked",
        lockoutRemainingSeconds: ipRateLimit.lockoutRemainingSeconds,
      },
    });

    return NextResponse.json(
      {
        error: "Too many failed attempts from your IP. Access temporarily suspended.",
        lockoutRemainingSeconds: ipRateLimit.lockoutRemainingSeconds,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      recordFailedAttempt(`login_ip_${ip}`);
      return NextResponse.json(
        { error: "Please enter your email/username and password." },
        { status: 400 }
      );
    }

    const { identifier, password } = validated.data;
    const safeIdentifierLog = sanitizePlainText(identifier, 120);
    const accountRateKey = `login_acct_${identifier.toLowerCase().trim()}`;

    // Account-specific Rate Limit check
    const acctRateLimit = checkRateLimit(accountRateKey);
    if (!acctRateLimit.allowed) {
      await logAuditEvent({
        user_id: null,
        event_type: "RATE_LIMITED",
        ip_address: ip,
        details: {
          identifier: safeIdentifierLog,
          action: "account_bruteforce_protection",
          lockoutRemainingSeconds: acctRateLimit.lockoutRemainingSeconds,
        },
      });

      return NextResponse.json(
        {
          error: "Account security lock engaged due to multiple failed login attempts. Please wait 15 minutes or contact support.",
          lockoutRemainingSeconds: acctRateLimit.lockoutRemainingSeconds,
        },
        { status: 429 }
      );
    }

    const user = await findUserByEmailOrUsername(identifier);

    if (!user) {
      await verifyDummyPassword(password);
      recordFailedAttempt(`login_ip_${ip}`);
      recordFailedAttempt(accountRateKey);

      await logAuditEvent({
        user_id: null,
        event_type: "LOGIN_FAILURE",
        ip_address: ip,
        details: { identifier: safeIdentifierLog, reason: "user_not_found" },
      });

      return NextResponse.json(
        { error: "Invalid credentials. Please verify your username/email and password." },
        { status: 401 }
      );
    }

    // Verify Password using timing-safe PBKDF2 comparison
    const isValid = await verifyPassword(
      password,
      user.password_hash,
      user.salt,
      user.iterations || 100000
    );

    if (!isValid) {
      recordFailedAttempt(`login_ip_${ip}`);
      recordFailedAttempt(accountRateKey);

      await logAuditEvent({
        user_id: user.id,
        event_type: "LOGIN_FAILURE",
        ip_address: ip,
        details: { identifier: safeIdentifierLog, reason: "incorrect_password" },
      });

      const updatedCheck = checkRateLimit(accountRateKey);

      return NextResponse.json(
        {
          error: "Invalid credentials. Please verify your username/email and password.",
          remainingAttempts: updatedCheck.remainingAttempts,
        },
        { status: 401 }
      );
    }

    const canonicalUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { accountStatus: true },
    });
    if (canonicalUser && canonicalUser.accountStatus !== "ACTIVE") {
      const statusMessage =
        canonicalUser.accountStatus === "PENDING_GUARDIAN_CONSENT"
          ? "This account is restricted until guardian consent is approved."
          : "This account is currently suspended or deactivated. Contact support.";
      return NextResponse.json(
        { error: statusMessage },
        { status: 403 },
      );
    }

    // Success! Reset failed attempts
    resetRateLimit(`login_ip_${ip}`);
    resetRateLimit(accountRateKey);

    // Issue Secure Session Token (7-day validity)
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    await createSession({
      id: randomUUID(),
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: userAgent,
      created_at: nowIso,
    });

    await logAuditEvent({
      user_id: user.id,
      event_type: "LOGIN_SUCCESS",
      ip_address: ip,
      details: { username: user.username, role: user.role },
    });

    // Strip secrets and internal counters
    const legacySafeUser = sanitizeUserForClient(user as unknown as Record<string, unknown>);
    const safeUser = {
      ...legacySafeUser,
      ...(await getCanonicalPlayerSummary(user.email)),
    };

    const response = NextResponse.json(
      {
        success: true,
        message: `Welcome back, ${user.display_name}!`,
        user: safeUser,
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );

    response.cookies.set("np_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign-in. Please try again." },
      { status: 500 }
    );
  }
}
