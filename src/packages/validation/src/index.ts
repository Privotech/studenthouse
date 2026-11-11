/**
 * @naijaplay/validation
 * Strict Zod schemas for request validation, age-aware onboarding, guardian consent,
 * server-authoritative game score verification, and XP ledger transactions.
 */

import { z } from "zod";
import {
  AgeZone,
  ConsentScope,
  CountryCode,
  ErrorCode,
  AppError,
  XPTransactionSource,
} from "@naijaplay/shared";

/**
 * Calculates exact age in years as of a reference date (defaults to current server UTC date).
 * Never trusts a client-supplied age or ageZone string.
 */
export function calculateAgeYears(dateOfBirthIso: string, referenceDate: Date = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirthIso)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid date of birth format.");
  }
  const dob = new Date(`${dateOfBirthIso}T00:00:00.000Z`);
  if (Number.isNaN(dob.getTime()) || dob.toISOString().slice(0, 10) !== dateOfBirthIso) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid date of birth format.");
  }
  let age = referenceDate.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getUTCDate() < dob.getUTCDate())) {
    age--;
  }
  return age;
}

/**
 * Resolves the authoritative AgeZone from date of birth.
 * Throws a ValidationError if the user is outside NaijaPlay's supported player age range (6–30).
 */
export function resolveAuthoritativeAgeZone(
  dateOfBirthIso: string,
  referenceDate: Date = new Date(),
): { ageYears: number; ageZone: AgeZone; requiresGuardianConsent: boolean } {
  const ageYears = calculateAgeYears(dateOfBirthIso, referenceDate);

  if (ageYears < 6 || ageYears > 30) {
    throw new AppError(
      ErrorCode.AGE_ZONE_RESTRICTED,
      `Player accounts require an age between 6 and 30 years (computed age: ${ageYears}).`,
      422,
    );
  }

  if (ageYears <= 12) {
    return {
      ageYears,
      ageZone: AgeZone.JUNIOR,
      requiresGuardianConsent: true,
    };
  }

  if (ageYears <= 17) {
    return {
      ageYears,
      ageZone: AgeZone.TEEN,
      requiresGuardianConsent: true,
    };
  }

  if (ageYears <= 24) {
    return {
      ageYears,
      ageZone: AgeZone.YOUTH,
      requiresGuardianConsent: false,
    };
  }

  return {
    ageYears,
    ageZone: AgeZone.SENIOR,
    requiresGuardianConsent: false,
  };
}

export const PlayerOnboardingSchema = z
  .object({
    displayName: z
      .string()
      .min(3, "Display name must be at least 3 characters.")
      .max(20, "Display name cannot exceed 20 characters.")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Display name may only contain letters, numbers, and underscores (no personal phone numbers or spaces).",
      ),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format."),
    countryCode: z.nativeEnum(CountryCode).default(CountryCode.NG),
    guardianEmail: z.string().email("Valid guardian email is required for minors.").optional(),
    schoolCode: z
      .string()
      .regex(/^[A-Z0-9-]{6,16}$/, "Invalid school registration code format.")
      .optional(),
  })
  .superRefine((data, ctx) => {
    try {
      const { ageZone, requiresGuardianConsent } = resolveAuthoritativeAgeZone(data.dateOfBirth);
      if (requiresGuardianConsent && !data.guardianEmail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianEmail"],
          message: `Guardian email is mandatory for ${ageZone} Zone players (ages 6–17) under Nigeria Data Protection Act (NDPA) child-safety rules.`,
        });
      }
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: err instanceof Error ? err.message : "Invalid player age range.",
      });
    }
  });

export const GuardianConsentGrantSchema = z.object({
  guardianUserId: z.string().uuid("Guardian user ID must be a valid UUID."),
  childUserId: z.string().uuid("Child user ID must be a valid UUID."),
  scopes: z
    .array(z.nativeEnum(ConsentScope))
    .min(1, "At least one explicit consent scope must be specified."),
  dailyScreenTimeLimitMinutes: z
    .number()
    .int()
    .min(15, "Minimum daily screen time limit is 15 minutes.")
    .max(240, "Maximum configurable daily limit for minors is 240 minutes.")
    .default(90),
  verificationTokenHash: z
    .string()
    .min(32, "Cryptographic consent verification token hash is required."),
});

export const GameScoreSubmissionSchema = z.object({
  sessionId: z.string().uuid("Game session ID must be a valid UUID."),
  gameSlug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Game slug must be lowercase alphanumeric with hyphens."),
  playerId: z.string().uuid("Player profile ID must be a valid UUID."),
  claimedScore: z.number().int().min(0, "Score cannot be negative.").max(100000),
  durationSeconds: z
    .number()
    .int()
    .min(5, "Game session duration is below minimum human plausibility threshold (5s).")
    .max(3600, "Game session exceeded maximum 60-minute window."),
  questionsAnswered: z.number().int().min(0).max(500),
  correctAnswers: z.number().int().min(0).max(500),
  clientEventCount: z.number().int().min(1),
  idempotencyKey: z
    .string()
    .min(16, "Idempotency key must be at least 16 characters.")
    .max(128),
});

export const XPLedgerEntrySchema = z.object({
  playerId: z.string().uuid(),
  source: z.nativeEnum(XPTransactionSource),
  referenceId: z.string().min(4).max(128),
  idempotencyKey: z.string().min(16).max(128),
  amount: z
    .number()
    .int()
    .positive("XP ledger awards must be strictly positive integers.")
    .max(5000, "Single XP transaction cannot exceed 5,000 XP safety ceiling."),
});

export const TournamentEntryRequestSchema = z.object({
  tournamentId: z.string().uuid(),
  playerId: z.string().uuid(),
  schoolId: z.string().uuid().optional(),
});

export const ContentReportSchema = z.object({
  reporterUserId: z.string().uuid(),
  targetType: z.enum(["CREATIVE_SUBMISSION", "CLUB_ANNOUNCEMENT", "PLAYER_PROFILE"]),
  targetId: z.string().uuid(),
  reasonCategory: z.enum([
    "INAPPROPRIATE_FOR_AGE",
    "PERSONAL_INFORMATION_EXPOSURE",
    "UNFAIR_PLAY_OR_CHEATING",
    "HARASSMENT_OR_BULLYING",
    "SPAM_OR_SCAM",
  ]),
  details: z.string().min(10).max(500),
});

export function validateWithSchema<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "root";
      if (!fieldErrors[key]) {
        fieldErrors[key] = [];
      }
      fieldErrors[key].push(issue.message);
    }
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      result.error.issues[0]?.message ?? "Request payload failed schema validation.",
      400,
      fieldErrors,
    );
  }
  return result.data;
}
