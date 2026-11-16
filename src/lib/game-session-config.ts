import { AgeZone, GameCategory } from "@prisma/client";

export const ALL_AGE_ZONES = [
  AgeZone.JUNIOR,
  AgeZone.TEEN,
  AgeZone.YOUTH,
  AgeZone.SENIOR,
] as const;

export const AGE_ZONE_RANK: Record<AgeZone, number> = {
  [AgeZone.JUNIOR]: 1,
  [AgeZone.TEEN]: 2,
  [AgeZone.YOUTH]: 3,
  [AgeZone.SENIOR]: 4,
};

export function resolvePlayerAgeZone(zone: unknown): AgeZone | null {
  return ALL_AGE_ZONES.includes(zone as AgeZone) ? (zone as AgeZone) : null;
}

export function isAgeZoneWithinRange(
  playerZone: AgeZone,
  minAgeZone: AgeZone,
  maxAgeZone: AgeZone,
): boolean {
  return (
    AGE_ZONE_RANK[playerZone] >= AGE_ZONE_RANK[minAgeZone] &&
    AGE_ZONE_RANK[playerZone] <= AGE_ZONE_RANK[maxAgeZone]
  );
}

export function hasUniqueQuestionIds(questionIds: string[] | undefined): boolean {
  if (!questionIds) return true;
  return new Set(questionIds).size === questionIds.length;
}

export const GAME_IDS = [
  "j-math",
  "j-science",
  "j-geo",
  "j-vocab",
  "j-spatial",
  "j-civics",
  "t-algebra",
  "t-physics",
  "t-code",
  "t-chem",
  "t-lit",
  "t-econ",
  "y-quant",
  "y-algo",
  "y-macro",
  "y-ai",
  "y-bio",
  "y-trade",
  "s-system",
  "s-finance",
  "s-law",
  "s-quant",
  "s-crypto",
  "s-juris",
  "naija-trivia",
  "brain-rush",
  "word-challenge",
  "math-rush",
  "memory-match",
  "code-bug-hunter",
] as const;

export interface ResolvedGameMeta {
  title: string;
  category: GameCategory;
  baseXp: number;
  minAgeZone: AgeZone;
  maxAgeZone: AgeZone;
}

export function resolveGameMeta(gameId: string): ResolvedGameMeta {
  switch (gameId) {
    case "naija-trivia":
      return {
        title: "Naija Trivia",
        category: "TRIVIA",
        baseXp: 70,
        minAgeZone: AgeZone.JUNIOR,
        maxAgeZone: AgeZone.SENIOR,
      };
    case "brain-rush":
      return {
        title: "Brain Rush",
        category: "LOGIC",
        baseXp: 65,
        minAgeZone: AgeZone.JUNIOR,
        maxAgeZone: AgeZone.SENIOR,
      };
    case "word-challenge":
      return {
        title: "Word Challenge",
        category: "WORD",
        baseXp: 60,
        minAgeZone: AgeZone.JUNIOR,
        maxAgeZone: AgeZone.SENIOR,
      };
    case "math-rush":
      return {
        title: "Math Rush",
        category: "MATH",
        baseXp: 60,
        minAgeZone: AgeZone.JUNIOR,
        maxAgeZone: AgeZone.SENIOR,
      };
    case "memory-match":
      return {
        title: "Memory Match",
        category: "MEMORY",
        baseXp: 75,
        minAgeZone: AgeZone.JUNIOR,
        maxAgeZone: AgeZone.SENIOR,
      };
    case "code-bug-hunter":
      return {
        title: "Bug Hunter Code Lab",
        category: "CODING",
        baseXp: 85,
        minAgeZone: AgeZone.JUNIOR,
        maxAgeZone: AgeZone.SENIOR,
      };
    default: {
      const title = gameId
        .slice(2)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const tierZone: AgeZone = gameId.startsWith("j-")
        ? AgeZone.JUNIOR
        : gameId.startsWith("t-")
          ? AgeZone.TEEN
          : gameId.startsWith("y-")
            ? AgeZone.YOUTH
            : AgeZone.SENIOR;
      const category: GameCategory =
        gameId.includes("math") ||
        gameId.includes("quant") ||
        gameId.includes("algebra") ||
        gameId.includes("finance") ||
        gameId.includes("econ") ||
        gameId.includes("macro") ||
        gameId.includes("trade")
          ? "MATH"
          : gameId.includes("code") ||
              gameId.includes("algo") ||
              gameId.includes("system") ||
              gameId.includes("crypto") ||
              gameId.includes("ai")
            ? "CODING"
            : gameId.includes("vocab") || gameId.includes("lit")
              ? "WORD"
              : gameId.includes("law") ||
                  gameId.includes("juris") ||
                  gameId.includes("spatial")
                ? "LOGIC"
                : "TRIVIA";
      return {
        title: `Brain Rush · ${title}`,
        category,
        baseXp: tierZone === AgeZone.SENIOR ? 75 : tierZone === AgeZone.YOUTH ? 70 : 60,
        minAgeZone: tierZone,
        maxAgeZone: tierZone,
      };
    }
  }
}
