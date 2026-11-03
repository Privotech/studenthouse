/**
 * @naijaplay/permissions
 * Server-side Role-Based Access Control (RBAC) and Age-Aware Attribute-Based Access Control (ABAC).
 * Enforces Nigeria Data Protection Act (NDPA) child-protection safeguards, guardian consent scopes,
 * and zero-trust boundary checks. Never trusts client-supplied age or role flags.
 */

import {
  AccountStatus,
  AgeZone,
  AuthorizationError,
  ConsentRequiredError,
  ConsentScope,
  ConsentStatus,
  ErrorCode,
  UserRole,
} from "@naijaplay/shared";
import { resolveAuthoritativeAgeZone } from "@naijaplay/validation";

export type PlatformAction =
  | "game:play"
  | "game:publish"
  | "mission:claim_reward"
  | "learning:enroll"
  | "tournament:enter"
  | "tournament:manage"
  | "creative:submit"
  | "club:join"
  | "messaging:direct_message"
  | "guardian:grant_consent"
  | "guardian:revoke_consent"
  | "guardian:view_child_activity"
  | "school:view_class_roster"
  | "school:manage_institution"
  | "moderation:review_queue"
  | "admin:manage_platform"
  | "xp:mutate_balance_directly";

export interface ConsentRecordSnapshot {
  guardianUserId: string;
  childUserId: string;
  status: ConsentStatus;
  grantedScopes: ConsentScope[];
  revokedAt?: string | null;
}

export interface ActorContext {
  userId: string;
  role: UserRole;
  accountStatus: AccountStatus;
  dateOfBirth?: string; // Required for PLAYER role
  consentRecord?: ConsentRecordSnapshot | null;
  linkedChildIds?: string[]; // Populated from DB for GUARDIAN role
  authorizedSchoolIds?: string[]; // Populated from DB for TEACHER / SCHOOL_ADMIN
}

export interface PrivacyDefaults {
  ageZone: AgeZone;
  profileVisibility: "PRIVATE_GUARDIAN_ONLY" | "SCHOOL_AND_CLUB_ONLY" | "PUBLIC_OPT_IN";
  requiresGuardianConsent: boolean;
  requiresPreModerationForUploads: boolean;
  allowUnrestrictedDirectMessaging: boolean;
  allowBehavioralAdvertising: boolean;
  allowPreciseGeolocation: boolean;
  defaultDailyScreenTimeMinutes: number | null;
}

const ROLE_CAPABILITIES: Record<UserRole, ReadonlyArray<PlatformAction>> = {
  [UserRole.PLAYER]: [
    "game:play",
    "mission:claim_reward",
    "learning:enroll",
    "tournament:enter",
    "creative:submit",
    "club:join",
  ],
  [UserRole.GUARDIAN]: [
    "guardian:grant_consent",
    "guardian:revoke_consent",
    "guardian:view_child_activity",
  ],
  [UserRole.TEACHER]: ["school:view_class_roster", "learning:enroll"],
  [UserRole.SCHOOL_ADMIN]: [
    "school:view_class_roster",
    "school:manage_institution",
    "tournament:manage",
  ],
  [UserRole.MODERATOR]: ["moderation:review_queue"],
  [UserRole.PLATFORM_ADMIN]: [
    "game:publish",
    "tournament:manage",
    "moderation:review_queue",
    "admin:manage_platform",
  ],
};

const ACTION_REQUIRED_CONSENT_SCOPE: Partial<Record<PlatformAction, ConsentScope>> = {
  "game:play": ConsentScope.CORE_GAMEPLAY_AND_LEARNING,
  "mission:claim_reward": ConsentScope.CORE_GAMEPLAY_AND_LEARNING,
  "learning:enroll": ConsentScope.CORE_GAMEPLAY_AND_LEARNING,
  "tournament:enter": ConsentScope.TOURNAMENT_PARTICIPATION,
  "creative:submit": ConsentScope.CREATIVE_STUDIO_SUBMISSION,
  "club:join": ConsentScope.CLUB_PARTICIPATION,
};

/**
 * Returns strict NDPA-compliant privacy and safety defaults for each AgeZone.
 */
export function getAgeZonePrivacyDefaults(ageZone: AgeZone): PrivacyDefaults {
  switch (ageZone) {
    case AgeZone.JUNIOR:
      return {
        ageZone: AgeZone.JUNIOR,
        profileVisibility: "PRIVATE_GUARDIAN_ONLY",
        requiresGuardianConsent: true,
        requiresPreModerationForUploads: true,
        allowUnrestrictedDirectMessaging: false,
        allowBehavioralAdvertising: false,
        allowPreciseGeolocation: false,
        defaultDailyScreenTimeMinutes: 60,
      };
    case AgeZone.TEEN:
      return {
        ageZone: AgeZone.TEEN,
        profileVisibility: "SCHOOL_AND_CLUB_ONLY",
        requiresGuardianConsent: true,
        requiresPreModerationForUploads: true,
        allowUnrestrictedDirectMessaging: false,
        allowBehavioralAdvertising: false,
        allowPreciseGeolocation: false,
        defaultDailyScreenTimeMinutes: 120,
      };
    case AgeZone.YOUTH:
      return {
        ageZone: AgeZone.YOUTH,
        profileVisibility: "PUBLIC_OPT_IN",
        requiresGuardianConsent: false,
        requiresPreModerationForUploads: true,
        allowUnrestrictedDirectMessaging: false, // Activity-first platform; structured clubs only in MVP
        allowBehavioralAdvertising: false,
        allowPreciseGeolocation: false,
        defaultDailyScreenTimeMinutes: null,
      };
  }
}

export interface AuthorizationDecision {
  allowed: boolean;
  actorUserId: string;
  role: UserRole;
  computedAgeZone?: AgeZone;
  computedAgeYears?: number;
  action: PlatformAction;
  reason: string;
  enforcedInvariants: string[];
}

/**
 * Evaluates server-side authorization for an ActorContext attempting a PlatformAction.
 * Throws typed AppError / AuthorizationError / ConsentRequiredError when denied.
 */
export function authorizeAction(
  actor: ActorContext,
  action: PlatformAction,
  targetResource?: {
    targetChildUserId?: string;
    targetSchoolId?: string;
    minAgeZone?: AgeZone;
    maxAgeZone?: AgeZone;
  },
  referenceDate: Date = new Date(),
): AuthorizationDecision {
  const enforcedInvariants: string[] = [];

  // Invariant 1: Direct XP balance mutation is forbidden for ALL roles (including PLATFORM_ADMIN).
  if (action === "xp:mutate_balance_directly") {
    throw new AuthorizationError(
      "Direct XP balance mutation is strictly prohibited. XP can only be awarded via verified append-only XPTransaction ledger entries.",
      ErrorCode.IMMUTABLE_LEDGER_VIOLATION,
    );
  }

  // Invariant 2: Unrestricted direct messaging is prohibited across the platform (especially for minors).
  if (action === "messaging:direct_message") {
    throw new AuthorizationError(
      "Unrestricted private messaging is prohibited on NaijaPlay to protect minors. Interactions occur solely within moderated clubs and structured competitions.",
      ErrorCode.MINOR_MESSAGING_PROHIBITED,
    );
  }

  // Invariant 3: A minor or player can NEVER grant themselves guardian consent.
  if (action === "guardian:grant_consent" || action === "guardian:revoke_consent") {
    if (actor.role !== UserRole.GUARDIAN) {
      throw new AuthorizationError(
        "Only verified GUARDIAN accounts may grant or revoke parental consent.",
        ErrorCode.GUARDIAN_SELF_GRANT_FORBIDDEN,
      );
    }
    if (targetResource?.targetChildUserId === actor.userId) {
      throw new AuthorizationError(
        "A user cannot grant guardian consent to their own account.",
        ErrorCode.GUARDIAN_SELF_GRANT_FORBIDDEN,
      );
    }
    enforcedInvariants.push("GUARDIAN_SELF_GRANT_PREVENTION");
  }

  // Invariant 4: Account must be ACTIVE.
  if (actor.accountStatus !== AccountStatus.ACTIVE) {
    if (actor.accountStatus === AccountStatus.PENDING_GUARDIAN_CONSENT) {
      throw new ConsentRequiredError(
        "Account is pending verified parental/guardian consent and cannot perform active platform actions.",
      );
    }
    throw new AuthorizationError(
      `Account status '${actor.accountStatus}' is not permitted to perform '${action}'.`,
      ErrorCode.ACCOUNT_NOT_ACTIVE,
    );
  }
  enforcedInvariants.push("ACTIVE_ACCOUNT_STATUS_VERIFIED");

  // Invariant 5: Role capability check.
  const allowedActionsForRole = ROLE_CAPABILITIES[actor.role] ?? [];
  if (!allowedActionsForRole.includes(action)) {
    throw new AuthorizationError(
      `Role '${actor.role}' is not authorized to perform '${action}'.`,
      ErrorCode.FORBIDDEN_ROLE,
    );
  }
  enforcedInvariants.push(`RBAC_ROLE_CHECK_PASSED:${actor.role}`);

  // Invariant 6: Guardian relational boundary check.
  if (action === "guardian:view_child_activity" || action === "guardian:revoke_consent") {
    const childId = targetResource?.targetChildUserId;
    if (!childId || !actor.linkedChildIds?.includes(childId)) {
      throw new AuthorizationError(
        "Guardians may only access or manage child accounts explicitly linked and verified under their guardianship.",
        ErrorCode.FORBIDDEN_ROLE,
      );
    }
    enforcedInvariants.push("GUARDIAN_CHILD_LINK_VERIFIED");
  }

  // Invariant 7: School relational boundary check for Teachers and School Admins.
  if (action === "school:view_class_roster" || action === "school:manage_institution") {
    const schoolId = targetResource?.targetSchoolId;
    if (!schoolId || !actor.authorizedSchoolIds?.includes(schoolId)) {
      throw new AuthorizationError(
        "Teachers and School Administrators may only access data for schools they are explicitly authorized to manage.",
        ErrorCode.FORBIDDEN_ROLE,
      );
    }
    enforcedInvariants.push("SCHOOL_TENANT_ISOLATION_VERIFIED");
  }

  // Invariant 8: Player AgeZone & Guardian Consent enforcement.
  let computedAgeZone: AgeZone | undefined;
  let computedAgeYears: number | undefined;

  if (actor.role === UserRole.PLAYER) {
    if (!actor.dateOfBirth) {
      throw new AuthorizationError(
        "Player account is missing an authoritative dateOfBirth record.",
        ErrorCode.AGE_ZONE_RESTRICTED,
      );
    }

    const ageResolution = resolveAuthoritativeAgeZone(actor.dateOfBirth, referenceDate);
    computedAgeZone = ageResolution.ageZone;
    computedAgeYears = ageResolution.ageYears;
    enforcedInvariants.push(`SERVER_SIDE_AGE_ZONE:${computedAgeZone}(${computedAgeYears}y)`);

    // Check content/tournament AgeZone boundaries if specified
    const zoneOrder: Record<AgeZone, number> = {
      [AgeZone.JUNIOR]: 1,
      [AgeZone.TEEN]: 2,
      [AgeZone.YOUTH]: 3,
    };

    if (
      targetResource?.minAgeZone &&
      zoneOrder[computedAgeZone] < zoneOrder[targetResource.minAgeZone]
    ) {
      throw new AuthorizationError(
        `Content or competition requires minimum age zone '${targetResource.minAgeZone}', but player belongs to '${computedAgeZone}'.`,
        ErrorCode.AGE_ZONE_RESTRICTED,
      );
    }

    if (
      targetResource?.maxAgeZone &&
      zoneOrder[computedAgeZone] > zoneOrder[targetResource.maxAgeZone]
    ) {
      throw new AuthorizationError(
        `Content or competition is restricted to maximum age zone '${targetResource.maxAgeZone}', but player belongs to '${computedAgeZone}'.`,
        ErrorCode.AGE_ZONE_RESTRICTED,
      );
    }

    // Enforce Guardian Consent for minors (JUNIOR 6–12 and TEEN 13–17)
    if (ageResolution.requiresGuardianConsent) {
      const requiredScope = ACTION_REQUIRED_CONSENT_SCOPE[action];
      if (requiredScope) {
        const consent = actor.consentRecord;
        if (!consent || consent.status !== ConsentStatus.GRANTED || consent.revokedAt) {
          throw new ConsentRequiredError(
            `Active parental/guardian consent is required for ${computedAgeZone} Zone players before performing '${action}'.`,
          );
        }
        if (consent.guardianUserId === actor.userId) {
          throw new AuthorizationError(
            "Invalid consent record: guardianUserId cannot match childUserId.",
            ErrorCode.GUARDIAN_SELF_GRANT_FORBIDDEN,
          );
        }
        if (!consent.grantedScopes.includes(requiredScope)) {
          throw new ConsentRequiredError(
            `Guardian consent record does not include required scope '${requiredScope}' for action '${action}'.`,
          );
        }
        enforcedInvariants.push(`GUARDIAN_CONSENT_SCOPE_VERIFIED:${requiredScope}`);
      }
    }
  }

  return {
    allowed: true,
    actorUserId: actor.userId,
    role: actor.role,
    computedAgeZone,
    computedAgeYears,
    action,
    reason: `Action '${action}' authorized for role '${actor.role}'${computedAgeZone ? ` in ${computedAgeZone} Zone` : ""}.`,
    enforcedInvariants,
  };
}
