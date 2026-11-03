/**
 * @naijaplay/game-engine
 * Server-authoritative game score verification, anti-cheat telemetry bounds,
 * and immutable XP ledger invariant engine.
 */

import {
  AppError,
  ErrorCode,
  InvariantViolationError,
  XPTransactionSource,
} from "@naijaplay/shared";

export interface GameRuleSpec {
  gameSlug: string;
  title: string;
  category: "TRIVIA" | "LOGIC" | "WORD" | "MATH" | "MEMORY" | "CODING";
  maxPossibleScore: number;
  pointsPerCorrectAnswer: number;
  maxQuestionsPerSession: number;
  minSecondsPerQuestion: number;
  baseXPReward: number;
  maxBonusXP: number;
}

export const INITIAL_MVP_GAME_CATALOG: Readonly<Record<string, GameRuleSpec>> = {
  "naija-trivia": {
    gameSlug: "naija-trivia",
    title: "Naija Trivia",
    category: "TRIVIA",
    maxPossibleScore: 1000,
    pointsPerCorrectAnswer: 100,
    maxQuestionsPerSession: 10,
    minSecondsPerQuestion: 1.5,
    baseXPReward: 30,
    maxBonusXP: 20,
  },
  "brain-rush": {
    gameSlug: "brain-rush",
    title: "Brain Rush",
    category: "LOGIC",
    maxPossibleScore: 1500,
    pointsPerCorrectAnswer: 100,
    maxQuestionsPerSession: 15,
    minSecondsPerQuestion: 2.0,
    baseXPReward: 40,
    maxBonusXP: 30,
  },
  "word-challenge": {
    gameSlug: "word-challenge",
    title: "Word Challenge",
    category: "WORD",
    maxPossibleScore: 1200,
    pointsPerCorrectAnswer: 100,
    maxQuestionsPerSession: 12,
    minSecondsPerQuestion: 2.0,
    baseXPReward: 35,
    maxBonusXP: 25,
  },
  "math-rush": {
    gameSlug: "math-rush",
    title: "Math Rush",
    category: "MATH",
    maxPossibleScore: 2000,
    pointsPerCorrectAnswer: 100,
    maxQuestionsPerSession: 20,
    minSecondsPerQuestion: 1.2,
    baseXPReward: 40,
    maxBonusXP: 35,
  },
  "memory-match": {
    gameSlug: "memory-match",
    title: "Memory Match",
    category: "MEMORY",
    maxPossibleScore: 1000,
    pointsPerCorrectAnswer: 100,
    maxQuestionsPerSession: 10,
    minSecondsPerQuestion: 1.5,
    baseXPReward: 30,
    maxBonusXP: 20,
  },
};

export interface ScoreVerificationInput {
  sessionId: string;
  gameSlug: string;
  playerId: string;
  claimedScore: number;
  durationSeconds: number;
  questionsAnswered: number;
  correctAnswers: number;
  clientEventCount: number;
  idempotencyKey: string;
}

export interface ScoreVerificationResult {
  verified: boolean;
  authoritativeScore: number;
  awardedXP: number;
  anomalyFlags: string[];
  gameRule: GameRuleSpec;
}

/**
 * Validates a game session score submission against server-side game rules and human plausibility bounds.
 * Never trusts client-claimed XP or unverified scores.
 */
export function verifyGameScoreSubmission(
  input: ScoreVerificationInput,
): ScoreVerificationResult {
  const rule = INITIAL_MVP_GAME_CATALOG[input.gameSlug];
  if (!rule) {
    throw new AppError(
      ErrorCode.RESOURCE_NOT_FOUND,
      `Unknown game catalogue slug '${input.gameSlug}'.`,
      404,
    );
  }

  const anomalyFlags: string[] = [];

  if (input.correctAnswers > input.questionsAnswered) {
    anomalyFlags.push("CORRECT_EXCEEDS_TOTAL_ANSWERED");
    throw new AppError(
      ErrorCode.SCORE_PLAUSIBILITY_REJECTED,
      "Correct answers cannot exceed total questions answered.",
      422,
    );
  }

  if (input.questionsAnswered > rule.maxQuestionsPerSession) {
    anomalyFlags.push("QUESTIONS_EXCEED_SESSION_LIMIT");
    throw new AppError(
      ErrorCode.SCORE_PLAUSIBILITY_REJECTED,
      `Questions answered (${input.questionsAnswered}) exceeds game limit (${rule.maxQuestionsPerSession}).`,
      422,
    );
  }

  const minimumPlausibleDuration = Math.ceil(
    input.correctAnswers * rule.minSecondsPerQuestion,
  );
  if (input.correctAnswers > 0 && input.durationSeconds < minimumPlausibleDuration) {
    anomalyFlags.push("SUPERHUMAN_COMPLETION_SPEED");
    throw new AppError(
      ErrorCode.SCORE_PLAUSIBILITY_REJECTED,
      `Session completed in ${input.durationSeconds}s, below minimum human reaction threshold (${minimumPlausibleDuration}s) for ${input.correctAnswers} correct answers.`,
      422,
    );
  }

  if (input.clientEventCount < input.questionsAnswered) {
    anomalyFlags.push("INSUFFICIENT_TELEMETRY_EVENTS");
    throw new AppError(
      ErrorCode.SCORE_PLAUSIBILITY_REJECTED,
      "Client telemetry event count does not match answered question count.",
      422,
    );
  }

  const expectedScore = input.correctAnswers * rule.pointsPerCorrectAnswer;
  if (input.claimedScore !== expectedScore || input.claimedScore > rule.maxPossibleScore) {
    anomalyFlags.push("CLAIMED_SCORE_MISMATCH");
    throw new AppError(
      ErrorCode.SCORE_PLAUSIBILITY_REJECTED,
      `Claimed score (${input.claimedScore}) does not match server-calculated score (${expectedScore}) for ${input.correctAnswers} correct answers.`,
      422,
    );
  }

  const accuracyRatio =
    rule.maxQuestionsPerSession > 0
      ? input.correctAnswers / rule.maxQuestionsPerSession
      : 0;
  const bonusXP = Math.round(accuracyRatio * rule.maxBonusXP);
  const awardedXP = input.correctAnswers > 0 ? rule.baseXPReward + bonusXP : 0;

  return {
    verified: true,
    authoritativeScore: expectedScore,
    awardedXP,
    anomalyFlags,
    gameRule: rule,
  };
}

export interface ImmutableXPLedgerEntry {
  readonly id: string;
  readonly playerId: string;
  readonly source: XPTransactionSource;
  readonly referenceId: string;
  readonly idempotencyKey: string;
  readonly amount: number;
  readonly createdAt: string;
}

export interface PlayerLevelStatus {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelRequiredXP: number;
  progressPercent: number;
}

/**
 * Deterministic level progression formula:
 * Each level L requires 200 * L XP to advance to L+1 (e.g. L1->L2: 200 XP, L2->L3: 400 XP).
 */
export function calculatePlayerLevelFromXP(totalXP: number): PlayerLevelStatus {
  const safeXP = Math.max(0, Math.floor(totalXP));
  let level = 1;
  let remainingXP = safeXP;
  let requiredForNext = 200 * level;

  while (remainingXP >= requiredForNext) {
    remainingXP -= requiredForNext;
    level += 1;
    requiredForNext = 200 * level;
  }

  const progressPercent = Math.min(
    100,
    Math.round((remainingXP / requiredForNext) * 100),
  );

  return {
    totalXP: safeXP,
    level,
    currentLevelXP: remainingXP,
    nextLevelRequiredXP: requiredForNext,
    progressPercent,
  };
}

/**
 * Append-only XP Ledger engine enforcing immutability, non-negative awards,
 * and idempotent deduplication of mission/game rewards.
 */
export class AuthoritativeXPLedger {
  private readonly entries: ImmutableXPLedgerEntry[] = [];
  private readonly idempotencyKeys = new Set<string>();
  private readonly missionRewardKeys = new Set<string>();

  constructor(initialEntries: ReadonlyArray<ImmutableXPLedgerEntry> = []) {
    for (const entry of initialEntries) {
      this.appendEntryInternal(entry);
    }
  }

  private appendEntryInternal(entry: ImmutableXPLedgerEntry): void {
    if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
      throw new InvariantViolationError(
        ErrorCode.IMMUTABLE_LEDGER_VIOLATION,
        "XP ledger transactions must be strictly positive integers.",
      );
    }

    if (this.idempotencyKeys.has(entry.idempotencyKey)) {
      throw new InvariantViolationError(
        ErrorCode.DUPLICATE_REWARD_CLAIM,
        `Duplicate idempotency key '${entry.idempotencyKey}' rejected. Reward has already been credited.`,
      );
    }

    const sourceRefKey = `${entry.playerId}:${entry.source}:${entry.referenceId}`;
    if (
      (entry.source === XPTransactionSource.DAILY_MISSION ||
        entry.source === XPTransactionSource.WEEKLY_MISSION ||
        entry.source === XPTransactionSource.ACHIEVEMENT_UNLOCK) &&
      this.missionRewardKeys.has(sourceRefKey)
    ) {
      throw new InvariantViolationError(
        ErrorCode.DUPLICATE_REWARD_CLAIM,
        `Player '${entry.playerId}' has already claimed reward for ${entry.source} '${entry.referenceId}'.`,
      );
    }

    const frozenEntry: ImmutableXPLedgerEntry = Object.freeze({ ...entry });
    this.entries.push(frozenEntry);
    this.idempotencyKeys.add(frozenEntry.idempotencyKey);
    this.missionRewardKeys.add(sourceRefKey);
  }

  public recordTransaction(input: {
    playerId: string;
    source: XPTransactionSource;
    referenceId: string;
    idempotencyKey: string;
    amount: number;
  }): { entry: ImmutableXPLedgerEntry; status: PlayerLevelStatus } {
    const newEntry: ImmutableXPLedgerEntry = {
      id: `xp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      playerId: input.playerId,
      source: input.source,
      referenceId: input.referenceId,
      idempotencyKey: input.idempotencyKey,
      amount: input.amount,
      createdAt: new Date().toISOString(),
    };

    this.appendEntryInternal(newEntry);

    return {
      entry: newEntry,
      status: this.getPlayerStatus(input.playerId),
    };
  }

  public getPlayerEntries(playerId: string): ReadonlyArray<ImmutableXPLedgerEntry> {
    return this.entries.filter((e) => e.playerId === playerId);
  }

  public getPlayerStatus(playerId: string): PlayerLevelStatus {
    const totalXP = this.entries
      .filter((e) => e.playerId === playerId)
      .reduce((sum, e) => sum + e.amount, 0);
    return calculatePlayerLevelFromXP(totalXP);
  }

  public getAllEntries(): ReadonlyArray<ImmutableXPLedgerEntry> {
    return [...this.entries];
  }
}
