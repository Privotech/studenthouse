import { NextRequest, NextResponse } from "next/server";
import { getDbStatus, getAdminLiveFeed, logAuditEvent } from "@/lib/db";
import { getEcosystemAdminSnapshot } from "@/lib/ecosystem-db";
import {
  ADMIN_SESSION_COOKIE,
  isAdminRequestAuthorized,
  isAdminSecretConfigured,
  issueAdminSessionToken,
  revokeAdminSessionToken,
  verifyAdminSecretKey,
} from "@/lib/admin-auth";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth-security";
import { extractClientIp } from "@/lib/input-security";

export async function GET(req: NextRequest) {
  if (!isAdminRequestAuthorized(req)) {
    return NextResponse.json(
      { error: "Access Denied: Invalid or missing administrator clearance session." },
      { status: 401 },
    );
  }

  try {
    const [status, feed, ecosystem] = await Promise.all([
      getDbStatus(),
      getAdminLiveFeed(),
      getEcosystemAdminSnapshot(),
    ]);

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        status,
        feed,
        ecosystem,
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("Admin data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to query system administration metrics." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req.headers);
  const rateKey = `xadmin_auth_${ip}`;

  const rateLimit = checkRateLimit(rateKey);
  if (!rateLimit.allowed) {
    await logAuditEvent({
      user_id: null,
      event_type: "RATE_LIMITED",
      ip_address: ip,
      details: {
        action: "xadmin_bruteforce_locked",
        lockoutRemainingSeconds: rateLimit.lockoutRemainingSeconds,
      },
    });
    return NextResponse.json(
      {
        error: "Too many failed clearance attempts. Console access temporarily locked.",
        lockoutRemainingSeconds: rateLimit.lockoutRemainingSeconds,
      },
      { status: 429 },
    );
  }

  if (!isAdminSecretConfigured()) {
    return NextResponse.json(
      { error: "Root administration clearance key is not configured on this server." },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const providedKey = typeof body?.secretKey === "string" ? body.secretKey : "";

    if (!verifyAdminSecretKey(providedKey)) {
      recordFailedAttempt(rateKey);
      await logAuditEvent({
        user_id: null,
        event_type: "ADMIN_AUTH",
        ip_address: ip,
        details: { outcome: "denied", reason: "invalid_clearance_key" },
      });
      return NextResponse.json(
        { error: "Invalid clearance key. Access denied." },
        { status: 401 },
      );
    }

    resetRateLimit(rateKey);
    const sessionToken = issueAdminSessionToken();
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unable to mint admin session token." },
        { status: 503 },
      );
    }

    await logAuditEvent({
      user_id: null,
      event_type: "ADMIN_AUTH",
      ip_address: ip,
      details: { outcome: "granted" },
    });

    const response = NextResponse.json({
      success: true,
      authorized: true,
      message: "Secret clearance verified. Welcome to NaijaPlay Root Administration.",
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 4 * 60 * 60, // 4 hours
      path: "/",
    });
    response.cookies.delete("np_admin_key");

    return response;
  } catch {
    return NextResponse.json(
      { error: "Malformed verification payload." },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const activeToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (activeToken) {
    revokeAdminSessionToken(activeToken);
  }
  const response = NextResponse.json({ success: true, locked: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
  response.cookies.delete("np_admin_key");
  return response;
}
