# NaijaPlay — Relational Database Design & Prisma Architecture

**Document Version:** 1.0 (Phase 1 Foundation)  
**Database Engine:** PostgreSQL 15+  
**ORM & Migration Tool:** Prisma (`packages/database/prisma/schema.prisma`)  
**Total Models:** 26 Core Entities across 9 Domains

---

## 1. Core Database Engineering Rules

1. **UUID Primary Keys:** Every table uses `@id @default(uuid()) @db.Uuid` to prevent sequential ID enumeration attacks against child profiles, game sessions, and consent records.
2. **Separation of Identity and Public Profile:** `User` holds private authentication data (`email`, `passwordHash`, `role`, `accountStatus`). `PlayerProfile` holds gameplay identity (`displayName`, `ageZone`, `avatarId`, `profileVisibility`). Public leaderboards join only `PlayerProfile.displayName` and `PlayerProfile.avatarId`—never `User.email`.
3. **Append-Only Immutable XP Ledger (`XPTransaction`):** Player XP is never updated via an arbitrary `UPDATE player SET xp = ...` query. Every XP award inserts an immutable row into `XPTransaction` guarded by `@unique([idempotencyKey])` and `@unique([playerProfileId, source, referenceId])`. Application database roles revoke `UPDATE` and `DELETE` privileges on `XPTransaction` and `AuditLog`.
4. **Versioned Migrations Only:** Schema changes in staging and production must execute via `prisma migrate deploy`. `prisma db push` is strictly prohibited outside ephemeral local sandboxes.

---

## 2. Entity Relationship Summary (26 Models across 9 Domains)

### Domain 1: Identity & Guardianship (`User`, `PlayerProfile`, `Guardian`, `GuardianConsent`, `UserRole`)
- `User` (1) $\leftrightarrow$ (0..1) `PlayerProfile`: Cascade delete when `User` is permanently erased under NDPA data-rights requests.
- `User` (1) $\leftrightarrow$ (0..1) `Guardian`: Separate profile for parents/guardians with hashed phone verification.
- `Guardian` (1) $\leftrightarrow$ (N) `GuardianConsent` (N) $\leftrightarrow$ (1) `PlayerProfile`: Composite unique constraint `@@unique([guardianId, playerProfileId])`. Tracks `status` (`PENDING`, `GRANTED`, `REVOKED`, `EXPIRED`), `grantedScopes`, `grantedAt`, and `revokedAt`.

### Domain 2: Schools (`School`, `SchoolMembership`)
- `School` (1) $\leftrightarrow$ (N) `SchoolMembership` (N) $\leftrightarrow$ (1) `User`: Enforces `@@unique([schoolId, userId])`. Scopes `TEACHER` and `SCHOOL_ADMIN` queries strictly to their verified institution.

### Domain 3: Gaming Arena (`Game`, `GameSession`, `GameScore`)
- `Game` (1) $\leftrightarrow$ (N) `GameSession`: Tracks `seedHash`, `startedAt`, `completedAt`, `durationSeconds`, `clientEventCount`, and `anomalyFlags`.
- `GameSession` (1) $\leftrightarrow$ (0..1) `GameScore`: Enforced via `@unique` on `GameScore.sessionId`. A verified score cannot exist without a corresponding server-initiated `GameSession`. Indexed on `[gameId, score DESC, durationSeconds ASC]` for fast leaderboard queries.

### Domain 4: Progression & Rewards (`Mission`, `MissionCompletion`, `XPTransaction`, `Achievement`, `PlayerAchievement`)
- `MissionCompletion` enforces `@@unique([missionId, playerProfileId, periodKey])` (e.g., `periodKey = "2026-10-31"` for daily missions or `"2026-W44"` for weekly missions) and links 1:1 with `xpTransactionId` (`@unique`), guaranteeing a mission cannot award XP twice in the same period.
- `PlayerAchievement` enforces `@@unique([playerProfileId, achievementId])`.

### Domain 5: Learn & Grow (`LearningCourse`, `LearningLesson`, `LearningProgress`)
- `LearningLesson` enforces `@@unique([courseId, sequenceOrder])`.
- `LearningProgress` enforces `@@unique([playerProfileId, lessonId])` and indexes `[playerProfileId, courseId]`.

### Domain 6: Competitions (`Tournament`, `TournamentEntry`, `TournamentResult`)
- `TournamentEntry` enforces `@@unique([tournamentId, playerProfileId])` to prevent duplicate tournament registrations.
- `TournamentResult` enforces `@@unique([tournamentId, playerProfileId])` and indexes `[tournamentId, rankPosition ASC]`.

### Domain 7: Community & Creativity (`Club`, `ClubMembership`, `CreativeSubmission`)
- `ClubMembership` enforces `@@unique([clubId, playerProfileId])`.
- `CreativeSubmission` defaults to `moderationStatus = PENDING_REVIEW` and indexes `[moderationStatus, submittedAt]`.

### Domain 8: Safety & Moderation (`ContentReport`, `ModerationAction`, `AuditLog`)
- `ContentReport` (1) $\leftrightarrow$ (N) `ModerationAction`: Every moderator decision (`APPROVED`, `REJECTED`, `ESCALATED`) requires a mandatory `rationale` and `moderatorUserId`.
- `AuditLog`: Append-only record of sensitive actions indexed by `[actorUserId, createdAt DESC]` and `[entityType, entityId]`.

### Domain 9: Platform (`Notification`)
- `Notification` indexes `[userId, readAt, createdAt DESC]` for low-latency unread notification queries.

---

## 3. Deletion, Retention & Transactional Policies

| Entity Group | Deletion Policy (`onDelete`) | Retention & Compliance Rationale |
| :--- | :--- | :--- |
| `PlayerProfile`, `GuardianConsent`, `ClubMembership` | `Cascade` from `User` / `PlayerProfile` | Supports NDPA Right to Erasure / Account Deletion requests by parents or users. |
| `XPTransaction`, `GameScore`, `TournamentResult` | `Restrict` | Protects ledger and competition integrity against accidental deletion; anonymized on hard account erasure. |
| `AuditLog`, `ModerationAction`, `ContentReport` | `Restrict` | Mandatory child-safety and regulatory audit trail retention. |
| Mission Completion + XP Award | `prisma.$transaction([...])` | Executed atomically in a single serializable database transaction so `MissionCompletion` and `XPTransaction` either both succeed or both roll back. |
