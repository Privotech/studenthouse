import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProfileVisibility } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlayerProfileFromRequest } from "@/lib/player-session";
import { logAuditEvent } from "@/lib/db";

const SettingsPatchSchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  avatarCrest: z.string().trim().min(2).max(32).optional(),
  profileVisibility: z.enum(["PRIVATE_GUARDIAN_ONLY", "SCHOOL_AND_CLUB_ONLY", "PUBLIC_OPT_IN"]).optional(),
  dailyScreenTimeLimitMins: z.number().int().min(15).max(360).optional(),
});

export async function GET(request: NextRequest) {
  const player = await getPlayerProfileFromRequest(request);
  if (!player) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({
    username: player.user.username,
    displayName: player.profile.displayName,
    avatarCrest: player.profile.avatarId,
    profileVisibility: player.profile.profileVisibility,
    dailyScreenTimeLimitMins: player.profile.dailyScreenTimeLimitMins,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in to update privacy and profile settings." }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = SettingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings payload.", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates = parsed.data;
    const isMinor = player.profile.ageZone === "JUNIOR" || player.profile.ageZone === "TEEN";
    const resolvedVisibility =
      updates.profileVisibility === "PUBLIC_OPT_IN" && isMinor && !player.user.email
        ? ProfileVisibility.SCHOOL_AND_CLUB_ONLY
        : (updates.profileVisibility as ProfileVisibility | undefined);

    const updated = await prisma.playerProfile.update({
      where: { id: player.profile.id },
      data: {
        ...(updates.displayName ? { displayName: updates.displayName } : {}),
        ...(updates.avatarCrest ? { avatarId: updates.avatarCrest } : {}),
        ...(resolvedVisibility ? { profileVisibility: resolvedVisibility } : {}),
        ...(updates.dailyScreenTimeLimitMins !== undefined
          ? { dailyScreenTimeLimitMins: updates.dailyScreenTimeLimitMins }
          : {}),
      },
    });

    await logAuditEvent({
      user_id: player.user.id,
      event_type: "SETTINGS_UPDATE",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      details: {
        profileVisibility: updated.profileVisibility,
        dailyScreenTimeLimitMins: updated.dailyScreenTimeLimitMins,
      },
    });

    return NextResponse.json({
      username: player.user.username,
      displayName: updated.displayName,
      avatarCrest: updated.avatarId,
      profileVisibility: updated.profileVisibility,
      dailyScreenTimeLimitMins: updated.dailyScreenTimeLimitMins,
    });
  } catch (error) {
    console.error("Failed to update player settings:", error);
    return NextResponse.json({ error: "Could not save profile settings." }, { status: 500 });
  }
}
