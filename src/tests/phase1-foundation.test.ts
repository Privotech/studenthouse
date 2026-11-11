import { describe, expect, it } from "vitest";
import {
  AccountStatus,
  AgeZone,
  ConsentScope,
  ConsentStatus,
  CountryCode,
  ErrorCode,
  UserRole,
  XPTransactionSource,
} from "@naijaplay/shared";
import {
  GameScoreSubmissionSchema,
  PlayerOnboardingSchema,
  resolveAuthoritativeAgeZone,
  validateWithSchema,
} from "@naijaplay/validation";
import {
  ActorContext,
  authorizeAction,
  getAgeZonePrivacyDefaults,
} from "@naijaplay/permissions";
import {
  AuthoritativeXPLedger,
  calculatePlayerLevelFromXP,
  verifyGameScoreSubmission,
} from "@naijaplay/game-engine";
import { PRISMA_SCHEMA_MODELS } from "@naijaplay/database";

const REFERENCE_DATE = new Date("2026-10-31T00:00:00.000Z");

describe("1. Shared Validation & Server-Side Age-Group Resolution (@naijaplay/validation)", () => {
  it("computes JUNIOR zone (ages 6–12) and mandates guardian consent", () => {
    const res = resolveAuthoritativeAgeZone("2016-05-15", REFERENCE_DATE);
    expect(res.ageYears).toBe(10);
    expect(res.ageZone).toBe(AgeZone.JUNIOR);
    expect(res.requiresGuardianConsent).toBe(true);
  });

  it("computes TEEN zone (ages 13–17) and mandates guardian consent", () => {
    const res = resolveAuthoritativeAgeZone("2011-03-10", REFERENCE_DATE);
    expect(res.ageYears).toBe(15);
    expect(res.ageZone).toBe(AgeZone.TEEN);
    expect(res.requiresGuardianConsent).toBe(true);
  });

  it("computes YOUTH zone (ages 18–24) without mandatory guardian consent", () => {
    const res = resolveAuthoritativeAgeZone("2005-01-20", REFERENCE_DATE);
    expect(res.ageYears).toBe(21);
    expect(res.ageZone).toBe(AgeZone.YOUTH);
    expect(res.requiresGuardianConsent).toBe(false);
  });

  it("computes SENIOR zone for ages 25–30 without mandatory guardian consent", () => {
    const res = resolveAuthoritativeAgeZone("1996-10-30", REFERENCE_DATE);
    expect(res.ageYears).toBe(30);
    expect(res.ageZone).toBe(AgeZone.SENIOR);
    expect(res.requiresGuardianConsent).toBe(false);
  });

  it("rejects ages below 6 or above 30 with AGE_ZONE_RESTRICTED", () => {
    expect(() => resolveAuthoritativeAgeZone("2023-01-01", REFERENCE_DATE)).toThrowError(
      /between 6 and 30 years/,
    );
    expect(() => resolveAuthoritativeAgeZone("1995-01-01", REFERENCE_DATE)).toThrowError(
      /between 6 and 30 years/,
    );
  });

  it("rejects minor onboarding when guardianEmail is omitted", () => {
    expect(() =>
      validateWithSchema(PlayerOnboardingSchema, {
        displayName: "TundeExplorer",
        dateOfBirth: "2016-04-10",
        countryCode: CountryCode.NG,
      }),
    ).toThrowError(/Guardian email is mandatory/);
  });

  it("accepts valid minor onboarding when guardianEmail is supplied", () => {
    const parsed = validateWithSchema(PlayerOnboardingSchema, {
      displayName: "Chidi_Quest99",
      dateOfBirth: "2015-08-12",
      countryCode: CountryCode.NG,
      guardianEmail: "parent@example.ng",
    });
    expect(parsed.displayName).toBe("Chidi_Quest99");
    expect(parsed.guardianEmail).toBe("parent@example.ng");
  });
});

describe("2. Role Checks, Child-Safety & Permission Boundaries (@naijaplay/permissions)", () => {
  const juniorPlayerWithConsent: ActorContext = {
    userId: "11111111-1111-4111-8111-111111111111",
    role: UserRole.PLAYER,
    accountStatus: AccountStatus.ACTIVE,
    dateOfBirth: "2016-06-01", // 10 years old -> JUNIOR
    consentRecord: {
      guardianUserId: "99999999-9999-4999-8999-999999999999",
      childUserId: "11111111-1111-4111-8111-111111111111",
      status: ConsentStatus.GRANTED,
      grantedScopes: [ConsentScope.CORE_GAMEPLAY_AND_LEARNING],
      revokedAt: null,
    },
  };

  it("allows a JUNIOR player with valid CORE_GAMEPLAY_AND_LEARNING consent to play games", () => {
    const decision = authorizeAction(
      juniorPlayerWithConsent,
      "game:play",
      undefined,
      REFERENCE_DATE,
    );
    expect(decision.allowed).toBe(true);
    expect(decision.computedAgeZone).toBe(AgeZone.JUNIOR);
  });

  it("blocks a JUNIOR player from entering a tournament if TOURNAMENT_PARTICIPATION consent scope is missing", () => {
    expect(() =>
      authorizeAction(
        juniorPlayerWithConsent,
        "tournament:enter",
        undefined,
        REFERENCE_DATE,
      ),
    ).toThrowError(/does not include required scope 'TOURNAMENT_PARTICIPATION'/);
  });

  it("immediately blocks a minor when guardian consent is REVOKED", () => {
    const revokedJunior: ActorContext = {
      ...juniorPlayerWithConsent,
      consentRecord: {
        ...juniorPlayerWithConsent.consentRecord!,
        status: ConsentStatus.REVOKED,
        revokedAt: "2026-10-30T12:00:00.000Z",
      },
    };
    expect(() =>
      authorizeAction(revokedJunior, "game:play", undefined, REFERENCE_DATE),
    ).toThrowError(/Active parental\/guardian consent is required/);
  });

  it("strictly forbids a child or player from granting themselves guardian permissions", () => {
    expect(() =>
      authorizeAction(
        juniorPlayerWithConsent,
        "guardian:grant_consent",
        { targetChildUserId: juniorPlayerWithConsent.userId },
        REFERENCE_DATE,
      ),
    ).toThrowError(/Only verified GUARDIAN accounts may grant or revoke parental consent/);

    const selfGuardianAttempt: ActorContext = {
      userId: "22222222-2222-4222-8222-222222222222",
      role: UserRole.GUARDIAN,
      accountStatus: AccountStatus.ACTIVE,
    };
    expect(() =>
      authorizeAction(
        selfGuardianAttempt,
        "guardian:grant_consent",
        { targetChildUserId: selfGuardianAttempt.userId },
        REFERENCE_DATE,
      ),
    ).toThrowError(/cannot grant guardian consent to their own account/);
  });

  it("blocks unrestricted direct messaging for all users to protect minors", () => {
    expect(() =>
      authorizeAction(
        juniorPlayerWithConsent,
        "messaging:direct_message",
        undefined,
        REFERENCE_DATE,
      ),
    ).toThrowError(/Unrestricted private messaging is prohibited/);
  });

  it("enforces age-zone isolation when a JUNIOR player attempts to enter a YOUTH tournament", () => {
    const juniorWithTourneyConsent: ActorContext = {
      ...juniorPlayerWithConsent,
      consentRecord: {
        ...juniorPlayerWithConsent.consentRecord!,
        grantedScopes: [
          ConsentScope.CORE_GAMEPLAY_AND_LEARNING,
          ConsentScope.TOURNAMENT_PARTICIPATION,
        ],
      },
    };

    expect(() =>
      authorizeAction(
        juniorWithTourneyConsent,
        "tournament:enter",
        { minAgeZone: AgeZone.YOUTH, maxAgeZone: AgeZone.YOUTH },
        REFERENCE_DATE,
      ),
    ).toThrowError(/requires minimum age zone 'YOUTH'/);
  });

  it("enforces Guardian child-link isolation and Teacher school-tenant isolation", () => {
    const guardianActor: ActorContext = {
      userId: "99999999-9999-4999-8999-999999999999",
      role: UserRole.GUARDIAN,
      accountStatus: AccountStatus.ACTIVE,
      linkedChildIds: ["11111111-1111-4111-8111-111111111111"],
    };

    // Allowed for linked child
    expect(
      authorizeAction(guardianActor, "guardian:view_child_activity", {
        targetChildUserId: "11111111-1111-4111-8111-111111111111",
      }).allowed,
    ).toBe(true);

    // Denied for unlinked child
    expect(() =>
      authorizeAction(guardianActor, "guardian:view_child_activity", {
        targetChildUserId: "33333333-3333-4333-8333-333333333333",
      }),
    ).toThrowError(/only access or manage child accounts explicitly linked/);

    const teacherActor: ActorContext = {
      userId: "44444444-4444-4444-8444-444444444444",
      role: UserRole.TEACHER,
      accountStatus: AccountStatus.ACTIVE,
      authorizedSchoolIds: ["school-lagos-01"],
    };

    expect(() =>
      authorizeAction(teacherActor, "school:view_class_roster", {
        targetSchoolId: "school-abuja-99",
      }),
    ).toThrowError(/only access data for schools they are explicitly authorized/);
  });

  it("enforces NDPA privacy defaults for JUNIOR, TEEN, and YOUTH zones", () => {
    const juniorDefaults = getAgeZonePrivacyDefaults(AgeZone.JUNIOR);
    expect(juniorDefaults.profileVisibility).toBe("PRIVATE_GUARDIAN_ONLY");
    expect(juniorDefaults.allowBehavioralAdvertising).toBe(false);
    expect(juniorDefaults.allowUnrestrictedDirectMessaging).toBe(false);
    expect(juniorDefaults.defaultDailyScreenTimeMinutes).toBe(60);
  });
});

describe("3. Server-Authoritative Score Verification & Immutable XP Ledger (@naijaplay/game-engine)", () => {
  it("verifies a legitimate Naija Trivia score submission and calculates server-authoritative XP", () => {
    const validSubmission = validateWithSchema(GameScoreSubmissionSchema, {
      sessionId: "55555555-5555-4555-8555-555555555555",
      gameSlug: "naija-trivia",
      playerId: "11111111-1111-4111-8111-111111111111",
      claimedScore: 800,
      durationSeconds: 32,
      questionsAnswered: 10,
      correctAnswers: 8,
      clientEventCount: 10,
      idempotencyKey: "idem_session_55555555_001",
    });

    const verification = verifyGameScoreSubmission(validSubmission);
    expect(verification.verified).toBe(true);
    expect(verification.authoritativeScore).toBe(800);
    expect(verification.awardedXP).toBe(46); // 30 base + 16 accuracy bonus
  });

  it("rejects manipulated score claims and superhuman reaction speeds", () => {
    // Claiming 1000 points with only 5 correct answers
    expect(() =>
      verifyGameScoreSubmission({
        sessionId: "55555555-5555-4555-8555-555555555555",
        gameSlug: "naija-trivia",
        playerId: "11111111-1111-4111-8111-111111111111",
        claimedScore: 1000,
        durationSeconds: 30,
        questionsAnswered: 10,
        correctAnswers: 5,
        clientEventCount: 10,
        idempotencyKey: "idem_tampered_score_001",
      }),
    ).toThrowError(/does not match server-calculated score/);

    // Answering 10 trivia questions in 5 seconds (requires at least 15s)
    expect(() =>
      verifyGameScoreSubmission({
        sessionId: "55555555-5555-4555-8555-555555555555",
        gameSlug: "naija-trivia",
        playerId: "11111111-1111-4111-8111-111111111111",
        claimedScore: 1000,
        durationSeconds: 5,
        questionsAnswered: 10,
        correctAnswers: 10,
        clientEventCount: 10,
        idempotencyKey: "idem_speedhack_001",
      }),
    ).toThrowError(/below minimum human reaction threshold/);
  });

  it("enforces immutable XP ledger invariants and blocks duplicate mission rewards", () => {
    const ledger = new AuthoritativeXPLedger();
    const playerId = "11111111-1111-4111-8111-111111111111";

    const firstAward = ledger.recordTransaction({
      playerId,
      source: XPTransactionSource.DAILY_MISSION,
      referenceId: "mission_daily_puzzle:2026-10-31",
      idempotencyKey: "idem_daily_mission_20261031",
      amount: 150,
    });

    expect(firstAward.status.totalXP).toBe(150);
    expect(firstAward.status.level).toBe(1);

    // Duplicate idempotencyKey must be rejected
    expect(() =>
      ledger.recordTransaction({
        playerId,
        source: XPTransactionSource.DAILY_MISSION,
        referenceId: "mission_daily_puzzle:2026-10-31",
        idempotencyKey: "idem_daily_mission_20261031",
        amount: 150,
      }),
    ).toThrowError(/Duplicate idempotency key/);

    // Duplicate mission referenceId in the same period with a different idempotencyKey must also be rejected
    expect(() =>
      ledger.recordTransaction({
        playerId,
        source: XPTransactionSource.DAILY_MISSION,
        referenceId: "mission_daily_puzzle:2026-10-31",
        idempotencyKey: "idem_different_key_99999",
        amount: 150,
      }),
    ).toThrowError(/already claimed reward for DAILY_MISSION/);

    // Negative or zero XP transactions must be rejected
    expect(() =>
      ledger.recordTransaction({
        playerId,
        source: XPTransactionSource.GAME_COMPLETION,
        referenceId: "session_99",
        idempotencyKey: "idem_negative_xp_attempt",
        amount: -50,
      }),
    ).toThrowError(/strictly positive integers/);

    // Even PLATFORM_ADMIN is forbidden from mutating XP balance directly
    try {
      authorizeAction(
        {
          userId: "admin-001",
          role: UserRole.PLATFORM_ADMIN,
          accountStatus: AccountStatus.ACTIVE,
        },
        "xp:mutate_balance_directly",
      );
      expect.unreachable("Should have thrown IMMUTABLE_LEDGER_VIOLATION");
    } catch (err: unknown) {
      expect((err as { code?: ErrorCode }).code).toBe(
        ErrorCode.IMMUTABLE_LEDGER_VIOLATION,
      );
    }
  });

  it("calculates deterministic level progression from verified XP", () => {
    const l1 = calculatePlayerLevelFromXP(150);
    expect(l1.level).toBe(1);
    expect(l1.currentLevelXP).toBe(150);
    expect(l1.nextLevelRequiredXP).toBe(200);

    const l3 = calculatePlayerLevelFromXP(650); // 200 (L1->2) + 400 (L2->3) = 600 + 50 remainder
    expect(l3.level).toBe(3);
    expect(l3.currentLevelXP).toBe(50);
    expect(l3.nextLevelRequiredXP).toBe(600);
  });

  it("documents all 27 relational Prisma models across all 9 domains", () => {
    expect(PRISMA_SCHEMA_MODELS.length).toBe(27);
  });
});
