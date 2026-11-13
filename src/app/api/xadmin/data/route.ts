import { NextRequest, NextResponse } from "next/server";
import { getDbStatus, getAdminLiveFeed } from "@/lib/db";
import { getEcosystemAdminSnapshot } from "@/lib/ecosystem-db";

const ADMIN_SECRET_KEY = "PRIVOTECH";

function isAuthorized(req: NextRequest): boolean {
  const headerKey = req.headers.get("x-admin-key")?.trim().toUpperCase();
  const searchKey = req.nextUrl.searchParams.get("key")?.trim().toUpperCase();
  const cookieKey = req.cookies.get("np_admin_key")?.value?.trim().toUpperCase();
  return headerKey === ADMIN_SECRET_KEY || searchKey === ADMIN_SECRET_KEY || cookieKey === ADMIN_SECRET_KEY;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Access Denied: Invalid or missing administrator clearance key." },
      { status: 401 },
    );
  }

  try {
    const [status, feed, ecosystem] = await Promise.all([
      getDbStatus(),
      getAdminLiveFeed(),
      getEcosystemAdminSnapshot(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      status,
      feed,
      ecosystem,
    });
  } catch (error) {
    console.error("Admin data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to query system administration metrics." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const providedKey = String(body.secretKey || "").trim().toUpperCase();

    if (providedKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: "Invalid clearance key. Access denied." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      authorized: true,
      message: "Secret clearance verified. Welcome to NaijaPlay Root Administration.",
    });

    response.cookies.set("np_admin_key", ADMIN_SECRET_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 4 * 60 * 60, // 4 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Malformed verification payload." },
      { status: 400 },
    );
  }
}
