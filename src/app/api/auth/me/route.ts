import { NextRequest, NextResponse } from "next/server";
import { findSession, findUserById } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("np_session")?.value;
    
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (cookieToken) {
      token = cookieToken.trim();
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

    // Strip sensitive fields
    const { password_hash, salt, ...safeUser } = user;

    return NextResponse.json({
      authenticated: true,
      user: safeUser,
      session: {
        id: session.id,
        expiresAt: session.expires_at,
      },
    });
  } catch (err) {
    console.error("Auth session lookup error:", err);
    return NextResponse.json({ error: "Session verification error" }, { status: 500 });
  }
}
