import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AGE_CALIBRATED_QUESTIONS, NAIJA_TRIVIA_QUESTIONS } from "@/data/mockData";
import { calculatePlayerLevelFromXP } from "@naijaplay/game-engine";
import { prisma } from "@/lib/prisma";
import { getPlayerProfileFromRequest } from "@/lib/player-session";
import { consumeRateQuota } from "@/lib/auth-security";
import { logAuditEvent } from "@/lib/db";
import { extractClientIp } from "@/lib/input-security";
import {
  GAME_IDS,
  hasUniqueQuestionIds,
  isAgeZoneWithinRange,
  resolveGameMeta,
  resolvePlayerAgeZone,
} from "@/lib/game-session-config";

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

    const ip = extractClientIp(request.headers);
    const quota = consumeRateQuota(`game_session_${player.user.id}`, 45);
    if (!quota.allowed) {
      await logAuditEvent({
        user_id: player.user.id,
        event_type: "RATE_LIMITED",
        ip_address: ip,
        details: { action: "game_session_quota" },
      });
      return NextResponse.json(
        { error: "Too many game sessions in a short window. Take a brief break before starting another." },
        { status: 429 },
      );
    }

    const playerZone = resolvePlayerAgeZone(player.profile.ageZone);
    if (!playerZone) {
      return NextResponse.json({ error: "Player age tier could not be verified." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON request payload." }, { status: 400 });
    }

    const parsedStart = StartSchema.safeParse(body);
    if (parsedStart.success) {
      const { gameId } = parsedStart.data;
      const meta = resolveGameMeta(gameId);
      if (!isAgeZoneWithinRange(playerZone, meta.minAgeZone, meta.maxAgeZone)) {
        return NextResponse.json(
          { error: "This academic game module is calibrated for a different age tier." },
          { status: 403 },
        );
      }

      const bankSize =
        gameId === "naija-trivia"
          ? (NAIJA_TRIVIA_QUESTIONS[playerZone]?.length ?? 6)
          : (AGE_CALIBRATED_QUESTIONS[playerZone]?.length ?? 8);

      const game = await prisma.game.upsert({
        where: { slug: gameId },
        update: {
          title: meta.title,
          category: meta.category,
          minAgeZone: meta.minAgeZone,
          maxAgeZone: meta.maxAgeZone,
        },
        create: {
          slug: gameId,
          title: meta.title,
          description: "Age-calibrated academic & trivia session.",
          category: meta.category,
          minAgeZone: meta.minAgeZone,
          maxAgeZone: meta.maxAgeZone,
          maxPossibleScore: bankSize * 150,
          pointsPerCorrectAnswer: 100,
          maxQuestionsPerSession: bankSize,
          minSecondsPerQuestion: 1.2,
          baseXPReward: meta.baseXp,
          maxBonusXP: bankSize * 20,
          isPublished: true,
        },
      });

      // Automatically close expired in-progress sessions (>2h) for hygiene
      const staleCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await prisma.gameSession.updateMany({
        where: {
          playerProfileId: player.profile.id,
          status: "IN_PROGRESS",
          startedAt: { lt: staleCutoff },
        },
        data: { status: "ABANDONED" },
      });

      const session = await prisma.gameSession.create({
        data: {
          gameId: game.id,
          playerProfileId: player.profile.id,
          seedHash: randomBytes(32).toString("hex"),
        },
        select: { id: true, startedAt: true },
      });

      return NextResponse.json({ session }, { status: 201, headers: { "Cache-Control": "no-store, private" } });
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
      return NextResponse.json(
        {
          score: existingScore.score,
          awardedXP: xp?.amount ?? 0,
          totalXP: player.profile.totalXp,
          level: player.profile.level,
          alreadyCompleted: true,
        },
        { headers: { "Cache-Control": "no-store, private" } },
      );
    }
    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "This game session can no longer be completed." }, { status: 409 });
    }

    const slug = session.game.slug;
    const gameMeta = resolveGameMeta(slug);
    if (!isAgeZoneWithinRange(playerZone, gameMeta.minAgeZone, gameMeta.maxAgeZone)) {
      return NextResponse.json(
        { error: "Player age tier is outside this game module boundaries." },
        { status: 403 },
      );
    }

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
          ? NAIJA_TRIVIA_QUESTIONS[playerZone]
          : AGE_CALIBRATED_QUESTIONS[playerZone];

      if (!bank?.length || !answers || answers.length === 0) {
        return NextResponse.json({ error: "Missing quiz answers for session verification." }, { status: 422 });
      }

      if (!hasUniqueQuestionIds(questionIds)) {
        await logAuditEvent({
          user_id: player.user.id,
          event_type: "GAME_ANOMALY",
          ip_address: ip,
          details: { sessionId, slug, reason: "duplicate_question_ids" },
        });
        return NextResponse.json({ error: "Duplicate question IDs are not permitted." }, { status: 422 });
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
        await prisma.gameSession.updateMany({
          where: { id: sessionId, status: "IN_PROGRESS" },
          data: { status: "INVALIDATED" },
        });
        await logAuditEvent({
          user_id: player.user.id,
          event_type: "GAME_ANOMALY",
          ip_address: ip,
          details: { sessionId, slug, rawDurationSeconds, minRequiredSeconds, correctAnswers },
        });
        return NextResponse.json(
          { error: "Session completion duration failed anti-cheat verification checks." },
          { status: 422 },
        );
      }
    } else {
      // Word Challenge, Math Rush, Memory Match, Code Bug Hunter
      const skillGameMaxItems: Record<string, number> = {
        "memory-match": 8,
        "word-challenge": 12,
        "code-bug-hunter": 10,
        "math-rush": 20,
      };
      const maxAllowed = skillGameMaxItems[slug] ?? 12;
      if (
        metricTotal !== undefined &&
        metricCorrect !== undefined &&
        metricCorrect > metricTotal
      ) {
        return NextResponse.json({ error: "Correct score metric cannot exceed total items." }, { status: 422 });
      }
      totalQuestions = Math.min(maxAllowed, Math.max(1, metricTotal ?? 6));
      correctAnswers = Math.min(totalQuestions, Math.max(0, metricCorrect ?? 0));
      questionsAnswered = totalQuestions;

      const minSkillSeconds = mode === "TIMED" ? Math.max(3, Math.floor(correctAnswers * 0.8)) : 3;
      if (rawDurationSeconds < minSkillSeconds || rawDurationSeconds > 3600) {
        await prisma.gameSession.updateMany({
          where: { id: sessionId, status: "IN_PROGRESS" },
          data: { status: "INVALIDATED" },
        });
        await logAuditEvent({
          user_id: player.user.id,
          event_type: "GAME_ANOMALY",
          ip_address: ip,
          details: { sessionId, slug, rawDurationSeconds, minSkillSeconds, correctAnswers },
        });
        return NextResponse.json({ error: "Session duration failed verification checks." }, { status: 422 });
      }
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
    const completedAt = new Date();
    const accuracyBasisPoints = Math.min(10000, Math.round(accuracyRatio * 10000));

    const updatedProgression = await prisma.$transaction(async (transaction) => {
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

      await transaction.$queryRaw`
        SELECT id FROM "PlayerProfile"
        WHERE id = ${player.profile.id}::uuid
        FOR UPDATE
      `;
      const freshProfile = await transaction.playerProfile.findUniqueOrThrow({
        where: { id: player.profile.id },
        select: { totalXp: true },
      });
      const totalXP = freshProfile.totalXp + awardedXP;
      const progression = calculatePlayerLevelFromXP(totalXP);

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

      return { totalXP, level: progression.level };
    });

    const totalXP = updatedProgression.totalXP;
    const progression = { level: updatedProgression.level };

    await logAuditEvent({
      user_id: player.user.id,
      event_type: "GAME_COMPLETED",
      ip_address: ip,
      details: {
        sessionId,
        gameSlug: slug,
        gameTitle: session.game.title,
        score,
        accuracyPercent: Math.round(accuracyBasisPoints / 100),
        difficulty,
        mode,
        awardedXP,
        level: progression.level,
      },
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

