import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/admin-auth";
import { getDbStatus, isRemoteDatabaseConfigured } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const isAdmin = isAdminRequestAuthorized(req);
    if (isAdmin) {
      const status = await getDbStatus();
      return NextResponse.json({
        status: "online",
        database: status,
        timestamp: new Date().toISOString(),
      });
    }

    // Minimal public health summary — never expose internal table counts or auth parameters unauthenticated
    return NextResponse.json({
      status: isRemoteDatabaseConfigured() ? "online" : "standby",
      database: {
        provider: "Neon PostgreSQL",
        isConfigured: isRemoteDatabaseConfigured(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("DB status check error:", err);
    return NextResponse.json(
      { status: "error", message: "Service availability check failed" },
      { status: 500 },
    );
  }
}
