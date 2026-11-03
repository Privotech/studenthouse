import { NextRequest, NextResponse } from "next/server";
import { deleteSession, logAuditEvent } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("np_session")?.value;
    
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (cookieToken) {
      token = cookieToken.trim();
    }

    if (token) {
      await deleteSession(token);
      await logAuditEvent({
        user_id: null,
        event_type: "LOGOUT",
        ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: { tokenPreview: token.substring(0, 8) + "..." },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Signed out successfully.",
    });

    response.cookies.delete("np_session");
    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
