import { NextRequest, NextResponse } from "next/server";
import { sanitizeUserForClient } from "@/lib/auth-security";
import { findSession, findUserById } from "@/lib/db";
import { getCanonicalPlayerSummary } from "@/lib/player-session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("np_session")?.value;

    let token = "";
    if (cookieToken) {
      token = cookieToken.trim();
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const session = await findSession(token);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await findUserById(session.user_id);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Enforce authoritative canonical account status check (blocks suspended/pending-consent accounts)
    try {
      const canonical = await prisma.user.findUnique({
        where: { email: user.email },
        select: { accountStatus: true },
      });
      if (canonical && canonical.accountStatus !== "ACTIVE") {
        return NextResponse.json(
          {
            authenticated: false,
            user: null,
            error: "Account requires active status or guardian consent.",
          },
          { status: 403 },
        );
      }
    } catch {
      // Standalone memory fallback mode without remote Prisma
    }

    const legacySafeUser = sanitizeUserForClient(user as unknown as Record<string, unknown>);
    const safeUser = {
      ...legacySafeUser,
      ...(await getCanonicalPlayerSummary(user.email)),
    };

    return NextResponse.json(
      {
        authenticated: true,
        user: safeUser,
        session: {
          id: session.id,
          expiresAt: session.expires_at,
        },
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (err) {
    console.error("Auth session lookup error:", err);
    return NextResponse.json({ error: "Session verification error" }, { status: 500 });
  }
}
