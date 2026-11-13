import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPlayerProfileFromRequest } from "@/lib/player-session";
import { blockEntity, getBlockedEntities, logAuditEvent, unblockEntity } from "@/lib/db";

const BlockSchema = z.object({
  targetName: z.string().trim().min(1).max(80),
  reason: z.string().trim().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const player = await getPlayerProfileFromRequest(request);
  if (!player) {
    return NextResponse.json({ blockedUsers: [] });
  }
  const blockedUsers = await getBlockedEntities(player.user.id);
  return NextResponse.json({ blockedUsers }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in to block an account." }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = BlockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid target account name." }, { status: 400 });
    }

    const blockedUsers = await blockEntity(player.user.id, parsed.data.targetName, parsed.data.reason);
    await logAuditEvent({
      user_id: player.user.id,
      event_type: "USER_BLOCK",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      details: { action: "block", targetName: parsed.data.targetName },
    });

    return NextResponse.json({ blockedUsers }, { status: 201 });
  } catch (error) {
    console.error("Block user failed:", error);
    return NextResponse.json({ error: "Could not block account." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in to manage blocked accounts." }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = BlockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid target account name." }, { status: 400 });
    }

    const blockedUsers = await unblockEntity(player.user.id, parsed.data.targetName);
    return NextResponse.json({ blockedUsers });
  } catch (error) {
    console.error("Unblock user failed:", error);
    return NextResponse.json({ error: "Could not unblock account." }, { status: 500 });
  }
}
