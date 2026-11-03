import { NextResponse } from "next/server";
import { getDbStatus } from "@/lib/db";

export async function GET() {
  try {
    const status = await getDbStatus();
    return NextResponse.json({
      status: "online",
      database: status,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("DB status check error:", err);
    return NextResponse.json(
      { status: "error", message: "Failed to query database status" },
      { status: 500 }
    );
  }
}
