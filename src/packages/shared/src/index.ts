/**
 * @naijaplay/shared
 * Core domain enums, API response envelopes, and centralized error handling primitives.
 * Shared across web PWA, backend API services, and future Android client adapters.
 */

export enum AgeZone {
  JUNIOR = "JUNIOR", // Ages 6–12
  TEEN = "TEEN", // Ages 13–17
  YOUTH = "YOUTH", // Ages 18–24
  SENIOR = "SENIOR", // Ages 25–30
}

export enum UserRole {
  PLAYER = "PLAYER",
  GUARDIAN = "GUARDIAN",
  TEACHER = "TEACHER",
  SCHOOL_ADMIN = "SCHOOL_ADMIN",
  MODERATOR = "MODERATOR",
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
}

export enum AccountStatus {
  PENDING_GUARDIAN_CONSENT = "PENDING_GUARDIAN_CONSENT",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  ACTIVE = "ACTIVE",
  RESTRICTED = "RESTRICTED",
  SUSPENDED = "SUSPENDED",
  DEACTIVATED = "DEACTIVATED",
}

export enum ConsentStatus {
  PENDING = "PENDING",
  GRANTED = "GRANTED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}

export enum ConsentScope {
  CORE_GAMEPLAY_AND_LEARNING = "CORE_GAMEPLAY_AND_LEARNING",
  TOURNAMENT_PARTICIPATION = "TOURNAMENT_PARTICIPATION",
  CREATIVE_STUDIO_SUBMISSION = "CREATIVE_STUDIO_SUBMISSION",
  CLUB_PARTICIPATION = "CLUB_PARTICIPATION",
  SCHOOL_LINKING = "SCHOOL_LINKING",
}

export enum XPTransactionSource {
  GAME_COMPLETION = "GAME_COMPLETION",
  TOURNAMENT_REGISTRATION = "TOURNAMENT_REGISTRATION",
  DAILY_MISSION = "DAILY_MISSION",
  WEEKLY_MISSION = "WEEKLY_MISSION",
  LEARNING_LESSON = "LEARNING_LESSON",
  TOURNAMENT_PLACEMENT = "TOURNAMENT_PLACEMENT",
  ACHIEVEMENT_UNLOCK = "ACHIEVEMENT_UNLOCK",
  CREATIVE_CHALLENGE = "CREATIVE_CHALLENGE",
}

export enum ModerationStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  ESCALATED = "ESCALATED",
}

export enum CountryCode {
  NG = "NG", // Nigeria (Initial Launch Market)
  GH = "GH", // Ghana (Phase 12 Expansion)
  KE = "KE", // Kenya (Phase 12 Expansion)
  ZA = "ZA", // South Africa (Phase 12 Expansion)
}

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  FORBIDDEN_ROLE = "FORBIDDEN_ROLE",
  AGE_ZONE_RESTRICTED = "AGE_ZONE_RESTRICTED",
  GUARDIAN_CONSENT_REQUIRED = "GUARDIAN_CONSENT_REQUIRED",
  GUARDIAN_SELF_GRANT_FORBIDDEN = "GUARDIAN_SELF_GRANT_FORBIDDEN",
  MINOR_MESSAGING_PROHIBITED = "MINOR_MESSAGING_PROHIBITED",
  ACCOUNT_NOT_ACTIVE = "ACCOUNT_NOT_ACTIVE",
  DUPLICATE_REWARD_CLAIM = "DUPLICATE_REWARD_CLAIM",
  DUPLICATE_TOURNAMENT_ENTRY = "DUPLICATE_TOURNAMENT_ENTRY",
  IMMUTABLE_LEDGER_VIOLATION = "IMMUTABLE_LEDGER_VIOLATION",
  SCORE_PLAUSIBILITY_REJECTED = "SCORE_PLAUSIBILITY_REJECTED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version: "v1";
}

export interface ApiErrorDetail {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorDetail | null;
  meta: ApiMeta;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 400,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.FORBIDDEN_ROLE) {
    super(code, message, 403);
    this.name = "AuthorizationError";
  }
}

export class ConsentRequiredError extends AppError {
  constructor(message: string) {
    super(ErrorCode.GUARDIAN_CONSENT_REQUIRED, message, 403);
    this.name = "ConsentRequiredError";
  }
}

export class InvariantViolationError extends AppError {
  constructor(code: ErrorCode, message: string) {
    super(code, message, 409);
    this.name = "InvariantViolationError";
  }
}

export function createSuccessResponse<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      requestId: requestId ?? `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      version: "v1",
    },
  };
}

export function createErrorResponse(
  error: unknown,
  requestId?: string,
): { status: number; body: ApiResponse<null> } {
  const meta: ApiMeta = {
    requestId: requestId ?? `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    version: "v1",
  };

  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        success: false,
        data: null,
        error: {
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
        },
        meta,
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      data: null,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "An unexpected server error occurred. The incident has been logged.",
      },
      meta,
    },
  };
}
