import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AGE_CALIBRATED_QUESTIONS } from "@/data/mockData";
import { calculatePlayerLevelFromXP } from "@naijaplay/game-engine";
import { prisma } from "@/lib/prisma";
import { getPlayerProfileFromRequest } from "@/lib/player-session";

const GAME_IDS = [
  "j-math", "j-science", "j-geo", "j-vocab", "j-spatial", "j-civics",
  "t-algebra", "t-physics", "t-code", "t-chem", "t-lit", "t-econ",
  "y-quant", "y-algo", "y-macro", "y-ai", "y-bio", "y-trade",
  "s-system", "s-finance", "s-law", "s-quant", "s-crypto", "s-juris",
] as const;

const StartSchema = z.object({
  action: z.literal("start"),
  gameId: z.enum(GAME_IDS),
});

const CompleteSchema = z.object({
  action: z.literal("complete"),
  sessionId: z.string().uuid(),
  answers: z.array(z.number().int().min(-1).max(15)).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in with a persisted player account to save drill results." }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsedStart = StartSchema.safeParse(body);
    if (parsedStart.success) {
      const { gameId } = parsedStart.data;
      const questions = AGE_CALIBRATED_QUESTIONS[player.profile.ageZone];
      if (!questions?.length) {
        return NextResponse.json({ error: "No drill questions are configured for this age group." }, { status: 422 });
      }

      const title = gameId
        .slice(2)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const game = await prisma.game.upsert({
        where: { slug: gameId },
        update: {},
        create: {
          slug: gameId,
          title,
          description: "Age-calibrated academic speed drill.",
          category: "TRIVIA",
          minAgeZone: "JUNIOR",
          maxAgeZone: "SENIOR",
          maxPossibleScore: questions.length * 100,
          pointsPerCorrectAnswer: 100,
          maxQuestionsPerSession: questions.length,
          minSecondsPerQuestion: 1.5,
          baseXPReward: 60,
          maxBonusXP: questions.length * 20,
          isPublished: true,
        },
      });

      const session = await prisma.gameSession.create({
        data: {
          gameId: game.id,
          playerProfileId: player.profile.id,
          seedHash: randomBytes(32).toString("hex"),
        },
        select: { id: true, startedAt: true },
      });

      return NextResponse.json({ session }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    const parsedComplete = CompleteSchema.safeParse(body);
    if (!parsedComplete.success) {
      return NextResponse.json(
        { error: "Invalid game session request.", details: parsedComplete.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { sessionId, answers } = parsedComplete.data;
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { game: true },
    });
    if (!session || session.playerProfileId !== player.profile.id) {
      return NextResponse.json({ error: "Game session was not found for this player." }, { status: 404 });
    }

    const existingScore = await prisma.gameScore.findUnique({
      where: { sessionId },
    });
    if (existingScore) {
      const xp = await prisma.xPTransaction.findUnique({
        where: {
          playerProfileId_source_referenceId: {
            playerProfileId: player.profile.id,
            source: "GAME_COMPLETION",
            referenceId: sessionId,
          },
        },
      });
      return NextResponse.json({
        score: existingScore.score,
        awardedXP: xp?.amount ?? 0,
        totalXP: player.profile.totalXp,
        level: player.profile.level,
        alreadyCompleted: true,
      });
    }
    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "This game session can no longer be completed." }, { status: 409 });
    }

    const questions = AGE_CALIBRATED_QUESTIONS[player.profile.ageZone];
    if (!questions || answers.length !== questions.length) {
      return NextResponse.json({ error: "Answer count does not match the server-assigned drill." }, { status: 422 });
    }
    if (answers.some((answer, index) => answer >= (questions[index]?.options.length ?? 0))) {
      return NextResponse.json({ error: "An answer choice is outside the available options." }, { status: 422 });
    }

    const correctAnswers = answers.reduce(
      (count, answer, index) => count + Number(answer === questions[index]?.correctAnswer),
      0,
    );
    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    if (durationSeconds < 5 || durationSeconds > 3600 || durationSeconds < correctAnswers * 1.5) {
      return NextResponse.json({ error: "Drill duration is outside acceptable limits." }, { status: 422 });
    }

    const score = correctAnswers * session.game.pointsPerCorrectAnswer;
    const awardedXP =
      correctAnswers > 0
        ? session.game.baseXPReward +
          Math.round((correctAnswers / questions.length) * session.game.maxBonusXP)
        : 0;
    const totalXP = player.profile.totalXp + awardedXP;
    const progression = calculatePlayerLevelFromXP(totalXP);
    const completedAt = new Date();

    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.gameSession.updateMany({
        where: { id: sessionId, status: "IN_PROGRESS" },
        data: {
          status: "COMPLETED",
          completedAt,
          durationSeconds,
          questionsAnswered: answers.filter((answer) => answer >= 0).length,
          correctAnswers,
          clientEventCount: answers.length,
        },
      });
      if (claimed.count !== 1) {
        throw new Error("Game session has already been completed.");
      }

      await transaction.gameScore.create({
        data: {
          sessionId,
          gameId: session.gameId,
          playerProfileId: player.profile.id,
          score,
          accuracyBasisPoints: Math.round((correctAnswers / questions.length) * 10000),
          durationSeconds,
          isVerified: true,
        },
      });

      if (awardedXP > 0) {
        await transaction.xPTransaction.create({
          data: {
            playerProfileId: player.profile.id,
            source: "GAME_COMPLETION",
            referenceId: sessionId,
            idempotencyKey: `game-session-${sessionId}`,
            amount: awardedXP,
          },
        });
      }

      await transaction.playerProfile.update({
        where: { id: player.profile.id },
        data: { totalXp: totalXP, level: progression.level },
      });
    });

    return NextResponse.json(
      { score, correctAnswers, awardedXP, totalXP, level: progression.level },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to persist game session:", error);
    return NextResponse.json({ error: "Could not save this drill result." }, { status: 500 });
  }
}
