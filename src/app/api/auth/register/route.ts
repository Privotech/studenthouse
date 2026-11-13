import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  evaluatePasswordStrength,
  hashPassword,
  generateSessionToken,
  checkRateLimit,
  recordFailedAttempt,
} from "@/lib/auth-security";
import { resolveAuthoritativeAgeZone } from "@naijaplay/validation";
import {
  findUserByEmailOrUsername,
  createUser,
  createSession,
  isRemoteDatabaseConfigured,
  logAuditEvent,
  DbUser,
} from "@/lib/db";
import {
  createGuardianConsentRequest,
  isGuardianEmailConfigured,
  sendGuardianConsentEmail,
} from "@/lib/guardian-consent";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(25, "Username must be 25 characters or fewer")
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format."),
  guardianEmail: z.string().email("Enter a valid guardian email address.").optional(),
  school: z.string().min(2, "School/Institution is required").max(100),
  state: z.string().min(2, "State is required").max(50),
  avatarCrest: z.string().default("Scholar"),
});

export async function POST(req: NextRequest) {
  if (!isRemoteDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Neon PostgreSQL is not configured. Registration cannot be saved." },
      { status: 503 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "unknown";

  // Rate Limiting check
  const rateLimit = checkRateLimit(`reg_${ip}`);
  if (!rateLimit.allowed) {
    await logAuditEvent({
      user_id: null,
      event_type: "RATE_LIMITED",
      ip_address: ip,
      details: {
        action: "register_rate_limited",
        lockoutRemainingSeconds: rateLimit.lockoutRemainingSeconds,
      },
    });

    return NextResponse.json(
      {
        error: "Too many registration attempts. Please wait before trying again.",
        lockoutRemainingSeconds: rateLimit.lockoutRemainingSeconds,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const validated = RegisterSchema.safeParse(body);

    if (!validated.success) {
      recordFailedAttempt(`reg_${ip}`);
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      email,
      username,
      password,
      displayName,
      dateOfBirth,
      guardianEmail,
      school,
      state,
      avatarCrest,
    } =
      validated.data;
    let ageDetails: ReturnType<typeof resolveAuthoritativeAgeZone>;
    try {
      ageDetails = resolveAuthoritativeAgeZone(dateOfBirth);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Date of birth is outside the supported age range." },
        { status: 422 }
      );
    }
    const { ageYears: age, ageZone } = ageDetails;
    if (ageDetails.requiresGuardianConsent) {
      if (!guardianEmail) {
        return NextResponse.json(
          { error: "A guardian email is required for players under 18." },
          { status: 400 },
        );
      }
      if (guardianEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
        return NextResponse.json(
          { error: "A guardian must use a different email address." },
          { status: 400 },
        );
      }
      if (!isGuardianEmailConfigured()) {
        return NextResponse.json(
          { error: "Guardian email is not configured. Add the Resend settings to the root .env file." },
          { status: 503 },
        );
      }
    }

    // Strict Password Strength Check
    const strength = evaluatePasswordStrength(password);
    if (!strength.isValid) {
      recordFailedAttempt(`reg_${ip}`);
      return NextResponse.json(
        {
          error: "Password does not meet required security complexity.",
          feedback: strength.feedback,
        },
        { status: 400 }
      );
    }

    // Check duplicate email or username
    const existing = await findUserByEmailOrUsername(email);
    if (existing) {
      recordFailedAttempt(`reg_${ip}`);
      return NextResponse.json(
        { error: "An account with this email address or username already exists." },
        { status: 409 }
      );
    }

    const existingUsername = await findUserByEmailOrUsername(username);
    if (existingUsername) {
      recordFailedAttempt(`reg_${ip}`);
      return NextResponse.json(
        { error: "Username is already registered. Please choose another username." },
        { status: 409 }
      );
    }

    // Initials from Display Name
    const nameParts = displayName.trim().split(/\s+/);
    const avatarInitials =
      nameParts.length > 1
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : displayName.slice(0, 2).toUpperCase();

    // Cryptographic PBKDF2 Hashing
    const { hash, salt, iterations } = await hashPassword(password);

    const userId = randomUUID();
    const nowIso = new Date().toISOString();

    const newUser: DbUser = {
      id: userId,
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      password_hash: hash,
      salt,
      iterations,
      display_name: displayName.trim(),
      date_of_birth: dateOfBirth,
      age,
      age_zone: ageZone,
      school: school.trim(),
      state: state.trim(),
      avatar_crest: avatarCrest,
      avatar_initials: avatarInitials,
      role: "STUDENT",
      level: 1,
      xp: 100, // 100 Welcome XP
      streak_days: 1,
      failed_attempts: 0,
      locked_until: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    await createUser(newUser);

    await logAuditEvent({
      user_id: userId,
      event_type: "REGISTER",
      ip_address: ip,
      details: { email: newUser.email, ageZone, school, iterations },
    });

    if (ageDetails.requiresGuardianConsent) {
      const request = await createGuardianConsentRequest(newUser.email, guardianEmail);
      try {
        await sendGuardianConsentEmail(request.guardianEmail, request.token);
      } catch (error) {
        console.error("Guardian consent email delivery failed.");
        return NextResponse.json(
          {
            error: "The player account was created, but the guardian email could not be delivered. Resend it to continue.",
            accountCreated: true,
            retryGuardianEmail: true,
          },
          { status: 502 },
        );
      }

      return NextResponse.json(
        {
          pendingGuardianConsent: true,
          message: "Account created. A consent request was sent to the guardian email; sign-in is enabled after approval.",
        },
        { status: 202 },
      );
    }

    // Issue Session Token (7-day validity)
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await createSession({
      id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: userAgent,
      created_at: nowIso,
    });

    // Strip sensitive fields
    const { password_hash, salt: userSalt, ...safeUser } = newUser;

    const response = NextResponse.json({
      success: true,
      message: "Registration completed successfully. Welcome to NaijaPlay!",
      sessionToken,
      user: safeUser,
    });

    response.cookies.set("np_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
