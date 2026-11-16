import { NextRequest, NextResponse } from "next/server";
import { deleteSession, findSession, logAuditEvent } from "@/lib/db";
import { extractClientIp } from "@/lib/input-security";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("np_session")?.value;

    let token = "";
    if (cookieToken) {
      token = cookieToken.trim();
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (token) {
      const existingSession = await findSession(token);
      await deleteSession(token);
      await logAuditEvent({
        user_id: existingSession?.user_id ?? null,
        event_type: "LOGOUT",
        ip_address: extractClientIp(req.headers),
        details: { action: "user_logout" },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully.",
    });

    response.cookies.set("np_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
