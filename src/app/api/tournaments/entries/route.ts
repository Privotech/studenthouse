import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculatePlayerLevelFromXP } from "@naijaplay/game-engine";
import { prisma } from "@/lib/prisma";
import { getPlayerProfileFromRequest } from "@/lib/player-session";

const EntrySchema = z.object({
  tournamentId: z.enum(["tourn-1", "tourn-2", "tourn-3"]),
});

export async function POST(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in with a persisted player account to register." }, { status: 401 });
    }

    const parsed = EntrySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tournament registration request." }, { status: 400 });
    }

    const { tournamentId } = parsed.data;
    const slug = tournamentId === "tourn-1"
      ? `${tournamentId}-${player.profile.ageZone.toLowerCase()}`
      : tournamentId;
    const tournament = await prisma.tournament.findUnique({ where: { slug } });
    if (!tournament || tournament.targetAgeZone !== player.profile.ageZone) {
      return NextResponse.json({ error: "This tournament is not available for your age group." }, { status: 403 });
    }
    if (tournament.status !== "REGISTRATION_OPEN" || tournament.startsAt <= new Date()) {
      return NextResponse.json({ error: "Tournament registration is closed." }, { status: 409 });
    }

    const awardedXP = 50;
    const totalXP = player.profile.totalXp + awardedXP;
    const progression = calculatePlayerLevelFromXP(totalXP);
    const entry = await prisma.$transaction(async (transaction) => {
      const registration = await transaction.tournamentEntry.create({
        data: {
          tournamentId: tournament.id,
          playerProfileId: player.profile.id,
        },
        select: { id: true, registeredAt: true },
      });
      await transaction.$executeRaw`
        INSERT INTO "XPTransaction" (
          id, "playerProfileId", source, "referenceId", "idempotencyKey", amount
        ) VALUES (
          ${randomUUID()}::uuid, ${player.profile.id}::uuid,
          'TOURNAMENT_REGISTRATION', ${tournament.id}::uuid,
          ${`tournament-entry-${tournament.id}-${player.profile.id}`}, ${awardedXP}
        )
      `;
      await transaction.playerProfile.update({
        where: { id: player.profile.id },
        data: { totalXp: totalXP, level: progression.level },
      });
      return registration;
    });

    return NextResponse.json(
      { entry, tournamentId, awardedXP, totalXP, level: progression.level },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "You are already registered for this tournament." }, { status: 409 });
    }
    console.error("Failed to register for tournament:", error);
    return NextResponse.json({ error: "Could not save your tournament registration." }, { status: 500 });
  }
}
