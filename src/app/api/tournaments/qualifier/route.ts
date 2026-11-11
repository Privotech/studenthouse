import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculatePlayerLevelFromXP } from "@naijaplay/game-engine";
import { getPlayerProfileFromRequest } from "@/lib/player-session";
import { prisma } from "@/lib/prisma";
import {
  getShuffledQualifierQuestion,
  TOURNAMENT_QUALIFIER_QUESTIONS,
} from "@/lib/tournament-qualifier";

const StartSchema = z.object({
  action: z.literal("start"),
  tournamentId: z.enum(["tourn-1", "tourn-2", "tourn-3"]),
});

const CompleteSchema = z.object({
  action: z.literal("complete"),
  sessionId: z.string().uuid(),
  answers: z.array(z.number().int().min(0).max(3)).length(TOURNAMENT_QUALIFIER_QUESTIONS.length),
});

export async function POST(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in to take a saved tournament qualifier." }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsedStart = StartSchema.safeParse(body);
    if (parsedStart.success) {
      const { tournamentId } = parsedStart.data;
      const slug = tournamentId === "tourn-1"
        ? `${tournamentId}-${player.profile.ageZone.toLowerCase()}`
        : tournamentId;
      const tournament = await prisma.tournament.findUnique({ where: { slug } });
      if (!tournament || tournament.targetAgeZone !== player.profile.ageZone) {
        return NextResponse.json({ error: "This tournament is not available for your age group." }, { status: 403 });
      }
      const now = new Date();
      if (now < tournament.startsAt) {
        return NextResponse.json({ error: "This tournament qualifier has not opened yet." }, { status: 409 });
      }
      if (now >= tournament.endsAt || tournament.status === "COMPLETED" || tournament.status === "CANCELLED") {
        return NextResponse.json({ error: "This tournament qualifier has closed." }, { status: 409 });
      }

      const [entry, previousResult] = await Promise.all([
        prisma.tournamentEntry.findUnique({
          where: {
            tournamentId_playerProfileId: {
              tournamentId: tournament.id,
              playerProfileId: player.profile.id,
            },
          },
          select: { id: true },
        }),
        prisma.tournamentResult.findUnique({
          where: {
            tournamentId_playerProfileId: {
              tournamentId: tournament.id,
              playerProfileId: player.profile.id,
            },
          },
          select: { id: true },
        }),
      ]);
      if (!entry) {
        return NextResponse.json({ error: "Register for this tournament before starting its qualifier." }, { status: 403 });
      }
      if (previousResult) {
        return NextResponse.json({ error: "This tournament qualifier has already been completed." }, { status: 409 });
      }

      const session = await prisma.gameSession.create({
        data: {
          gameId: tournament.gameId,
          playerProfileId: player.profile.id,
          seedHash: randomBytes(32).toString("hex"),
        },
        select: { id: true, seedHash: true },
      });

      return NextResponse.json({
        sessionId: session.id,
        questions: TOURNAMENT_QUALIFIER_QUESTIONS.map((_, index) => {
          const question = getShuffledQualifierQuestion(index, session.seedHash);
          return {
            discipline: question.discipline,
            question: question.question,
            options: question.options,
          };
        }),
      }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    const parsedComplete = CompleteSchema.safeParse(body);
    if (!parsedComplete.success) {
      return NextResponse.json({ error: "Invalid tournament qualifier submission." }, { status: 400 });
    }

    const { sessionId, answers } = parsedComplete.data;
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { game: true },
    });
    if (!session || session.playerProfileId !== player.profile.id) {
      return NextResponse.json({ error: "Qualifier session was not found for this player." }, { status: 404 });
    }
    if (!session.game.slug.startsWith("tournament-game-tourn-")) {
      return NextResponse.json({ error: "This session is not a tournament qualifier." }, { status: 422 });
    }
    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "This qualifier session can no longer be completed." }, { status: 409 });
    }

    const tournament = await prisma.tournament.findFirst({
      where: {
        gameId: session.gameId,
        targetAgeZone: player.profile.ageZone,
      },
    });
    if (!tournament) {
      return NextResponse.json({ error: "Tournament was not found for this qualifier." }, { status: 404 });
    }
    const now = new Date();
    if (now < tournament.startsAt || now >= tournament.endsAt) {
      return NextResponse.json({ error: "This tournament qualifier is outside its scheduled window." }, { status: 409 });
    }

    const entry = await prisma.tournamentEntry.findUnique({
      where: {
        tournamentId_playerProfileId: {
          tournamentId: tournament.id,
          playerProfileId: player.profile.id,
        },
      },
      select: { id: true },
    });
    if (!entry) {
      return NextResponse.json({ error: "A tournament registration is required to submit this qualifier." }, { status: 403 });
    }

    const previousResult = await prisma.tournamentResult.findUnique({
      where: {
        tournamentId_playerProfileId: {
          tournamentId: tournament.id,
          playerProfileId: player.profile.id,
        },
      },
      select: { id: true },
    });
    if (previousResult) {
      return NextResponse.json({ error: "This tournament qualifier has already been completed." }, { status: 409 });
    }

    const correctAnswers = answers.reduce((count, answer, index) => {
      const { correctIndex } = getShuffledQualifierQuestion(index, session.seedHash);
      return count + Number(answer === correctIndex);
    }, 0);
    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    if (durationSeconds < 5 || durationSeconds > 3600) {
      return NextResponse.json({ error: "Qualifier duration is outside acceptable limits." }, { status: 422 });
    }

    const score = correctAnswers * 100;
    const awardedXP = 120 + correctAnswers * 25;
    const completedAt = new Date();
    const result = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.gameSession.updateMany({
        where: { id: sessionId, status: "IN_PROGRESS" },
        data: {
          status: "COMPLETED",
          completedAt,
          durationSeconds,
          questionsAnswered: answers.length,
          correctAnswers,
          clientEventCount: answers.length,
        },
      });
      if (claimed.count !== 1) {
        throw new Error("Qualifier session has already been completed.");
      }

      await transaction.gameScore.create({
        data: {
          sessionId,
          gameId: session.gameId,
          playerProfileId: player.profile.id,
          score,
          accuracyBasisPoints: Math.round((correctAnswers / answers.length) * 10000),
          durationSeconds,
          isVerified: true,
        },
      });

      const rankPosition =
        (await transaction.tournamentResult.count({
          where: { tournamentId: tournament.id, verifiedBestScore: { gt: score } },
        })) + 1;
      await transaction.tournamentResult.create({
        data: {
          tournamentId: tournament.id,
          playerProfileId: player.profile.id,
          rankPosition,
          verifiedBestScore: score,
          awardedXP,
        },
      });

      await transaction.xPTransaction.create({
        data: {
          playerProfileId: player.profile.id,
          source: "TOURNAMENT_PLACEMENT",
          referenceId: tournament.id,
          idempotencyKey: `tournament-qualifier-${tournament.id}-${player.profile.id}`,
          amount: awardedXP,
        },
      });

      await transaction.$queryRaw`
        SELECT id FROM "PlayerProfile"
        WHERE id = ${player.profile.id}::uuid
        FOR UPDATE
      `;
      const profile = await transaction.playerProfile.findUniqueOrThrow({
        where: { id: player.profile.id },
        select: { totalXp: true },
      });
      const totalXP = profile.totalXp + awardedXP;
      const progression = calculatePlayerLevelFromXP(totalXP);
      await transaction.playerProfile.update({
        where: { id: player.profile.id },
        data: { totalXp: totalXP, level: progression.level },
      });
      return { totalXP, level: progression.level };
    });

    return NextResponse.json({
      score,
      correctAnswers,
      awardedXP,
      totalXP: result.totalXP,
      level: result.level,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "This tournament qualifier has already been completed." }, { status: 409 });
    }
    console.error("Failed to persist tournament qualifier:", error);
    return NextResponse.json({ error: "Could not save this tournament qualifier." }, { status: 500 });
  }
}
