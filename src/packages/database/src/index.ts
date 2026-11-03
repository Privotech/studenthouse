/**
 * @naijaplay/database
 * Schema metadata registry, relationship catalog, and retention policies for Phase 1 architecture verification.
 */

export interface SchemaEntityDescriptor {
  modelName: string;
  domain:
    | "IDENTITY"
    | "SCHOOLS"
    | "GAMING"
    | "PROGRESSION"
    | "LEARNING"
    | "COMPETITIONS"
    | "COMMUNITY"
    | "SAFETY"
    | "PLATFORM";
  primaryKey: string;
  uniqueConstraints: string[];
  indexes: string[];
  deletionPolicy: string;
  securityInvariant: string;
}

export const PRISMA_SCHEMA_MODELS: ReadonlyArray<SchemaEntityDescriptor> = [
  {
    modelName: "User",
    domain: "IDENTITY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["email"],
    indexes: ["[role, accountStatus]", "[countryCode]"],
    deletionPolicy: "Soft-delete via deletedAt; cascades to PlayerProfile on hard erase (NDPA Right to Erasure)",
    securityInvariant: "Separates authentication credentials from public PlayerProfile identity.",
  },
  {
    modelName: "PlayerProfile",
    domain: "IDENTITY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["userId", "displayName"],
    indexes: ["[ageZone]", "[displayName]"],
    deletionPolicy: "onDelete: Cascade from User",
    securityInvariant: "Defaults to PRIVATE_GUARDIAN_ONLY visibility; stores server-computed AgeZone.",
  },
  {
    modelName: "Guardian",
    domain: "IDENTITY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["userId"],
    indexes: ["[userId]"],
    deletionPolicy: "onDelete: Cascade from User",
    securityInvariant: "Stores hashed phone verification; required to grant GuardianConsent.",
  },
  {
    modelName: "GuardianConsent",
    domain: "IDENTITY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[guardianId, playerProfileId]"],
    indexes: ["[playerProfileId, status]"],
    deletionPolicy: "onDelete: Restrict from Guardian; Cascade from PlayerProfile",
    securityInvariant: "Tracks explicit ConsentScope[], grantedAt, revokedAt, and verificationTokenHash.",
  },
  {
    modelName: "School",
    domain: "SCHOOLS",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["registrationCode"],
    indexes: ["[countryCode, stateCode]"],
    deletionPolicy: "Institutional record retained; memberships cascade",
    securityInvariant: "Requires isVerified=true before hosting inter-school tournaments.",
  },
  {
    modelName: "SchoolMembership",
    domain: "SCHOOLS",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[schoolId, userId]"],
    indexes: ["[schoolId, schoolRole]"],
    deletionPolicy: "onDelete: Cascade from School and User",
    securityInvariant: "Scopes Teacher and School Admin access strictly to their assigned schoolId.",
  },
  {
    modelName: "Game",
    domain: "GAMING",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["slug"],
    indexes: ["[category, isPublished]", "[minAgeZone, maxAgeZone]"],
    deletionPolicy: "onDelete: Restrict while sessions/scores exist",
    securityInvariant: "Defines server-authoritative maxPossibleScore and minSecondsPerQuestion.",
  },
  {
    modelName: "GameSession",
    domain: "GAMING",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["id"],
    indexes: ["[playerProfileId, startedAt]", "[gameId, status]"],
    deletionPolicy: "onDelete: Cascade from PlayerProfile; Restrict from Game",
    securityInvariant: "Records seedHash, durationSeconds, clientEventCount, and anomalyFlags.",
  },
  {
    modelName: "GameScore",
    domain: "GAMING",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["sessionId"],
    indexes: ["[gameId, score DESC, durationSeconds ASC]", "[playerProfileId, recordedAt]"],
    deletionPolicy: "onDelete: Restrict from GameSession",
    securityInvariant: "1:1 with verified GameSession; prevents score injection without valid session.",
  },
  {
    modelName: "Mission",
    domain: "PROGRESSION",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["code"],
    indexes: ["[frequency, isActive]"],
    deletionPolicy: "onDelete: Restrict while completions exist",
    securityInvariant: "Defines deterministic xpReward and minAgeZone.",
  },
  {
    modelName: "MissionCompletion",
    domain: "PROGRESSION",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[missionId, playerProfileId, periodKey]", "xpTransactionId"],
    indexes: ["[playerProfileId, completedAt]"],
    deletionPolicy: "onDelete: Restrict from XPTransaction",
    securityInvariant: "Composite unique constraint [missionId, playerProfileId, periodKey] prevents duplicate mission rewards.",
  },
  {
    modelName: "XPTransaction",
    domain: "PROGRESSION",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["idempotencyKey", "[playerProfileId, source, referenceId]"],
    indexes: ["[playerProfileId, createdAt DESC]"],
    deletionPolicy: "onDelete: Restrict (Append-only immutable ledger)",
    securityInvariant: "Immutable ledger: no UPDATE or DELETE allowed via application permissions.",
  },
  {
    modelName: "Achievement",
    domain: "PROGRESSION",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["code"],
    indexes: ["[code]"],
    deletionPolicy: "onDelete: Restrict",
    securityInvariant: "Static badge and trophy definition.",
  },
  {
    modelName: "PlayerAchievement",
    domain: "PROGRESSION",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[playerProfileId, achievementId]"],
    indexes: ["[playerProfileId, achievementId]"],
    deletionPolicy: "onDelete: Cascade from PlayerProfile",
    securityInvariant: "Unique constraint prevents unlocking the same achievement badge twice.",
  },
  {
    modelName: "LearningCourse",
    domain: "LEARNING",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["slug"],
    indexes: ["[subjectCategory, isPublished]"],
    deletionPolicy: "onDelete: Restrict while progress exists",
    securityInvariant: "Filtered by minAgeZone and maxAgeZone.",
  },
  {
    modelName: "LearningLesson",
    domain: "LEARNING",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[courseId, sequenceOrder]"],
    indexes: ["[courseId, sequenceOrder]"],
    deletionPolicy: "onDelete: Cascade from LearningCourse",
    securityInvariant: "Enforces deterministic lesson sequence ordering.",
  },
  {
    modelName: "LearningProgress",
    domain: "LEARNING",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[playerProfileId, lessonId]"],
    indexes: ["[playerProfileId, courseId]"],
    deletionPolicy: "onDelete: Cascade from PlayerProfile",
    securityInvariant: "Prevents duplicate XP claims for already completed lessons.",
  },
  {
    modelName: "Tournament",
    domain: "COMPETITIONS",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["slug"],
    indexes: ["[status, targetAgeZone, countryCode]"],
    deletionPolicy: "onDelete: Restrict",
    securityInvariant: "Enforces server-side startsAt/endsAt deadlines and targetAgeZone isolation.",
  },
  {
    modelName: "TournamentEntry",
    domain: "COMPETITIONS",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[tournamentId, playerProfileId]"],
    indexes: ["[tournamentId, schoolId]"],
    deletionPolicy: "onDelete: Cascade from Tournament and PlayerProfile",
    securityInvariant: "Composite unique constraint [tournamentId, playerProfileId] prevents duplicate entries.",
  },
  {
    modelName: "TournamentResult",
    domain: "COMPETITIONS",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[tournamentId, playerProfileId]"],
    indexes: ["[tournamentId, rankPosition ASC]"],
    deletionPolicy: "onDelete: Restrict (historical competition record)",
    securityInvariant: "Derived strictly from verified GameScore records within tournament window.",
  },
  {
    modelName: "Club",
    domain: "COMMUNITY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["slug"],
    indexes: ["[targetAgeZone, topicCategory]"],
    deletionPolicy: "onDelete: SetNull on School",
    securityInvariant: "Activity-based moderated community; no open direct messaging.",
  },
  {
    modelName: "ClubMembership",
    domain: "COMMUNITY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["[clubId, playerProfileId]"],
    indexes: ["[clubId, playerProfileId]"],
    deletionPolicy: "onDelete: Cascade from Club and PlayerProfile",
    securityInvariant: "Requires ConsentScope.CLUB_PARTICIPATION for minors.",
  },
  {
    modelName: "CreativeSubmission",
    domain: "COMMUNITY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["id"],
    indexes: ["[moderationStatus, submittedAt]", "[playerProfileId]"],
    deletionPolicy: "onDelete: Cascade from PlayerProfile",
    securityInvariant: "Defaults to PENDING_REVIEW; never publicly visible prior to Moderator approval.",
  },
  {
    modelName: "ContentReport",
    domain: "SAFETY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["id"],
    indexes: ["[status, createdAt]", "[targetType, targetId]"],
    deletionPolicy: "onDelete: Restrict",
    securityInvariant: "Immutable report record feeding Moderator review queue.",
  },
  {
    modelName: "ModerationAction",
    domain: "SAFETY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["id"],
    indexes: ["[moderatorUserId, createdAt]", "[targetType, targetId]"],
    deletionPolicy: "onDelete: Restrict",
    securityInvariant: "Records moderatorUserId, decision, and mandatory rationale for every review.",
  },
  {
    modelName: "AuditLog",
    domain: "SAFETY",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["id"],
    indexes: ["[actorUserId, createdAt DESC]", "[entityType, entityId]"],
    deletionPolicy: "onDelete: Restrict (Immutable security audit trail)",
    securityInvariant: "Logs administrative, consent, and moderation mutations with actor role and timestamp.",
  },
  {
    modelName: "Notification",
    domain: "PLATFORM",
    primaryKey: "id (UUID)",
    uniqueConstraints: ["id"],
    indexes: ["[userId, readAt, createdAt DESC]"],
    deletionPolicy: "onDelete: Cascade from User",
    securityInvariant: "Age-filtered system notifications; never contains third-party ad tracking.",
  },
];
