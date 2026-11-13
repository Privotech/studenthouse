import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GameCategory } from "@prisma/client";
import { AGE_CALIBRATED_QUESTIONS, NAIJA_TRIVIA_QUESTIONS } from "@/data/mockData";
import { calculatePlayerLevelFromXP } from "@naijaplay/game-engine";
import { prisma } from "@/lib/prisma";
import { getPlayerProfileFromRequest } from "@/lib/player-session";

const GAME_IDS = [
  "j-math", "j-science", "j-geo", "j-vocab", "j-spatial", "j-civics",
  "t-algebra", "t-physics", "t-code", "t-chem", "t-lit", "t-econ",
  "y-quant", "y-algo", "y-macro", "y-ai", "y-bio", "y-trade",
  "s-system", "s-finance", "s-law", "s-quant", "s-crypto", "s-juris",
  "naija-trivia", "brain-rush", "word-challenge", "math-rush", "memory-match", "code-bug-hunter",
] as const;

const DifficultySchema = z.enum(["STANDARD", "CHALLENGER", "MASTER"]).default("STANDARD");
const ModeSchema = z.enum(["TIMED", "UNTIMED"]).default("TIMED");

const StartSchema = z.object({
  action: z.literal("start"),
  gameId: z.enum(GAME_IDS),
  difficulty: DifficultySchema.optional(),
  mode: ModeSchema.optional(),
});

const CompleteSchema = z.object({
  action: z.literal("complete"),
  sessionId: z.string().uuid(),
  answers: z.array(z.number().int().min(-1).max(15)).max(50).optional(),
  questionIds: z.array(z.string().min(1).max(64)).max(50).optional(),
  difficulty: DifficultySchema.optional(),
  mode: ModeSchema.optional(),
  metricCorrect: z.number().int().min(0).max(60).optional(),
  metricTotal: z.number().int().min(1).max(60).optional(),
});

function resolveGameMeta(gameId: string): { title: string; category: GameCategory; baseXp: number } {
  switch (gameId) {
    case "naija-trivia":
      return { title: "Naija Trivia", category: "TRIVIA", baseXp: 70 };
    case "brain-rush":
      return { title: "Brain Rush", category: "LOGIC", baseXp: 65 };
    case "word-challenge":
      return { title: "Word Challenge", category: "WORD", baseXp: 60 };
    case "math-rush":
      return { title: "Math Rush", category: "MATH", baseXp: 60 };
    case "memory-match":
      return { title: "Memory Match", category: "MEMORY", baseXp: 75 };
    case "code-bug-hunter":
      return { title: "Bug Hunter Code Lab", category: "CODING", baseXp: 85 };
    default: {
      const title = gameId
        .slice(2)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const category: GameCategory =
        gameId.includes("math") || gameId.includes("quant") || gameId.includes("algebra")
          ? "MATH"
          : gameId.includes("code") || gameId.includes("algo") || gameId.includes("system") || gameId.includes("crypto")
            ? "CODING"
            : gameId.includes("vocab") || gameId.includes("lit")
              ? "WORD"
              : "TRIVIA";
      return { title: `Brain Rush · ${title}`, category, baseXp: 60 };
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ history: [], stats: null }, { status: 401 });
    }

    const [scores, xpRows] = await Promise.all([
      prisma.gameScore.findMany({
        where: { playerProfileId: player.profile.id },
        orderBy: { recordedAt: "desc" },
        take: 25,
        include: {
          game: { select: { slug: true, title: true, category: true } },
          session: { select: { correctAnswers: true, questionsAnswered: true } },
        },
      }),
      prisma.xPTransaction.aggregate({
        where: { playerProfileId: player.profile.id, source: "GAME_COMPLETION" },
        _sum: { amount: true },
      }),
    ]);

    const history = scores.map((item) => ({
      id: item.id,
      gameSlug: item.game.slug,
      gameTitle: item.game.title,
      category: item.game.category,
      score: item.score,
      accuracyPercent: Math.round(item.accuracyBasisPoints / 100),
      durationSeconds: item.durationSeconds,
      correctAnswers: item.session.correctAnswers,
      questionsAnswered: item.session.questionsAnswered,
      isVerified: item.isVerified,
      recordedAt: item.recordedAt.toISOString(),
    }));

    const gamesPlayed = history.length;
    const averageAccuracy = gamesPlayed
      ? Math.round(history.reduce((sum, h) => sum + h.accuracyPercent, 0) / gamesPlayed)
      : 0;
    const bestScore = gamesPlayed
      ? Math.max(...history.map((h) => h.score))
      : 0;

    const countsByGame = new Map<string, number>();
    for (const row of history) {
      countsByGame.set(row.gameTitle, (countsByGame.get(row.gameTitle) ?? 0) + 1);
    }
    const favoriteGameTitle =
      [...countsByGame.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Naija Trivia";

    return NextResponse.json(
      {
        history,
        stats: {
          gamesPlayed,
          averageAccuracy,
          bestScore,
          totalVerifiedXP: xpRows._sum.amount ?? 0,
          favoriteGameTitle,
          recentHistory: history.slice(0, 10),
        },
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    console.error("Failed to fetch game history:", error);
    return NextResponse.json({ error: "Could not load game history." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const player = await getPlayerProfileFromRequest(request);
    if (!player) {
      return NextResponse.json({ error: "Sign in with a persisted player account to save game results." }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsedStart = StartSchema.safeParse(body);
    if (parsedStart.success) {
      const { gameId } = parsedStart.data;
      const meta = resolveGameMeta(gameId);
      const bankSize =
        gameId === "naija-trivia"
          ? (NAIJA_TRIVIA_QUESTIONS[player.profile.ageZone]?.length ?? 6)
          : (AGE_CALIBRATED_QUESTIONS[player.profile.ageZone]?.length ?? 8);

      const game = await prisma.game.upsert({
        where: { slug: gameId },
        update: { title: meta.title, category: meta.category },
        create: {
          slug: gameId,
          title: meta.title,
          description: "Age-calibrated academic & trivia session.",
          category: meta.category,
          minAgeZone: "JUNIOR",
          maxAgeZone: "SENIOR",
          maxPossibleScore: bankSize * 150,
          pointsPerCorrectAnswer: 100,
          maxQuestionsPerSession: bankSize,
          minSecondsPerQuestion: 1.2,
          baseXPReward: meta.baseXp,
          maxBonusXP: bankSize * 20,
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

    const {
      sessionId,
      answers,
      questionIds,
      difficulty = "STANDARD",
      mode = "TIMED",
      metricCorrect,
      metricTotal,
    } = parsedComplete.data;

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

    const slug = session.game.slug;
    const difficultyMultiplier =
      difficulty === "MASTER" ? 1.5 : difficulty === "CHALLENGER" ? 1.25 : 1.0;

    let correctAnswers = 0;
    let totalQuestions = 0;
    let questionsAnswered = 0;

    const isQuizEngine =
      slug === "naija-trivia" ||
      slug === "brain-rush" ||
      slug.startsWith("j-") ||
      slug.startsWith("t-") ||
      slug.startsWith("y-") ||
      slug.startsWith("s-");

    const rawDurationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    const durationSeconds = Math.max(1, rawDurationSeconds);

    if (isQuizEngine) {
      const bank =
        slug === "naija-trivia"
          ? NAIJA_TRIVIA_QUESTIONS[player.profile.ageZone]
          : AGE_CALIBRATED_QUESTIONS[player.profile.ageZone];

      if (!bank?.length || !answers || answers.length === 0) {
        return NextResponse.json({ error: "Missing quiz answers for session verification." }, { status: 422 });
      }

      const orderedQuestions =
        questionIds && questionIds.length === answers.length
          ? questionIds
              .map((qid) => bank.find((q) => q.id === qid))
              .filter((q): q is NonNullable<typeof q> => Boolean(q))
          : bank;

      if (orderedQuestions.length !== answers.length) {
        return NextResponse.json({ error: "Answer count or question IDs do not match the server bank." }, { status: 422 });
      }

      if (answers.some((answer, index) => answer >= (orderedQuestions[index]?.options.length ?? 0))) {
        return NextResponse.json({ error: "An answer choice is outside the available options." }, { status: 422 });
      }

      totalQuestions = orderedQuestions.length;
      questionsAnswered = answers.filter((answer) => answer >= 0).length;
      correctAnswers = answers.reduce(
        (count, answer, index) => count + Number(answer === orderedQuestions[index]?.correctAnswer),
        0,
      );

      const minRequiredSeconds = mode === "TIMED" ? Math.max(4, Math.floor(correctAnswers * 1.1)) : 3;
      if (rawDurationSeconds < minRequiredSeconds || rawDurationSeconds > 3600) {
        return NextResponse.json(
          { error: "Session completion duration failed anti-cheat verification checks." },
          { status: 422 },
        );
      }
    } else {
      // Word Challenge, Math Rush, Memory Match, Code Bug Hunter
      if (rawDurationSeconds < 2 || rawDurationSeconds > 3600) {
        return NextResponse.json({ error: "Session duration failed verification checks." }, { status: 422 });
      }
      totalQuestions = Math.max(1, metricTotal ?? 6);
      correctAnswers = Math.min(totalQuestions, Math.max(0, metricCorrect ?? 0));
      questionsAnswered = totalQuestions;
    }

    const baseScore = correctAnswers * session.game.pointsPerCorrectAnswer;
    const score = Math.round(baseScore * difficultyMultiplier);
    const accuracyRatio = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    const awardedXP =
      correctAnswers > 0
        ? Math.round(
            (session.game.baseXPReward + Math.round(accuracyRatio * session.game.maxBonusXP)) *
              difficultyMultiplier,
          )
        : 0;
    const totalXP = player.profile.totalXp + awardedXP;
    const progression = calculatePlayerLevelFromXP(totalXP);
    const completedAt = new Date();
    const accuracyBasisPoints = Math.min(10000, Math.round(accuracyRatio * 10000));

    await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.gameSession.updateMany({
        where: { id: sessionId, status: "IN_PROGRESS" },
        data: {
          status: "COMPLETED",
          completedAt,
          durationSeconds,
          questionsAnswered,
          correctAnswers,
          clientEventCount: answers?.length ?? totalQuestions,
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
          accuracyBasisPoints,
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

      await transaction.notification.create({
        data: {
          userId: player.user.id,
          title: `Verified Score · ${session.game.title}`,
          body: `Scored ${score.toLocaleString()} pts (${Math.round(accuracyBasisPoints / 100)}% accuracy) in ${difficulty} ${mode} mode. +${awardedXP} XP awarded.`,
          category: "GAME",
        },
      });
    });

    return NextResponse.json(
      {
        score,
        correctAnswers,
        totalQuestions,
        accuracyPercent: Math.round(accuracyBasisPoints / 100),
        durationSeconds,
        difficulty,
        mode,
        verifiedByServer: true,
        awardedXP,
        totalXP,
        level: progression.level,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to persist game session:", error);
    return NextResponse.json({ error: "Could not save this game result." }, { status: 500 });
  }
}

