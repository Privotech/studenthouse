# NaijaPlay — Security Threat Model (STRIDE & Child-Safety Analysis)

**Document Version:** 1.0 (Phase 1 Foundation)  
**Scope:** Identity, Child Data Protection, Game Score & XP Integrity, Content Moderation, and Administrative Operations

---

## 1. Threat Matrix & Architectural Countermeasures

| Threat ID | Threat Scenario | STRIDE Category | Risk Level | Architectural Mitigation Implemented in Phase 1 |
| :--- | :--- | :--- | :--- | :--- |
| **TM-01** | **Account Takeover (ATO)** via credential stuffing or session hijacking | Spoofing | Critical | Argon2id/bcrypt password hashing; `HttpOnly` + `Secure` + `SameSite=Lax` Auth.js session cookies; strict IP/account rate limiting (5 req/min) on auth routes; immediate session revocation on status change. |
| **TM-02** | **Unauthorized Access to Children's Personal Data** by unrelated adults or unverified teachers | Information Disclosure | Critical | Separation of `User` (PII) from `PlayerProfile` (display handle); UUIDv4 keys prevent enumeration; `authorizeAction` enforces `linkedChildIds` for Guardians and `authorizedSchoolIds` for Teachers; `PRIVATE_GUARDIAN_ONLY` default for Junior Zone. |
| **TM-03** | **Privilege Escalation / Guardian Self-Grant** (Minor modifies request payload to grant themselves parental consent or admin role) | Elevation of Privilege | Critical | Server-side `ActorContext` resolved from session; `authorizeAction` throws `GUARDIAN_SELF_GRANT_FORBIDDEN` if `actor.role !== GUARDIAN` or `guardianUserId === childUserId`. Client role/age fields are never trusted. |
| **TM-04** | **Game Score Manipulation** (Client submits fabricated high score or impossible 0.2s completion time via DevTools/replay) | Tampering | High | `verifyGameScoreSubmission` in `@naijaplay/game-engine` verifies `GameSession` existence, checks `durationSeconds >= correctAnswers * minSecondsPerQuestion`, validates `clientEventCount`, and recalculates `authoritativeScore` server-side. |
| **TM-05** | **XP Ledger Manipulation / Duplicate Mission Rewards** (Race condition or replay attack to claim Daily Mission XP multiple times) | Tampering / Repudiation | High | `AuthoritativeXPLedger` and `XPTransaction` table are append-only (`onDelete: Restrict`, no balance `UPDATE` endpoint). Composite unique constraints `@@unique([idempotencyKey])` and `@@unique([missionId, playerProfileId, periodKey])` reject duplicate claims with `409 DUPLICATE_REWARD_CLAIM`. |
| **TM-06** | **Fake Account Farming & Referral Abuse** (Automated bot registration to farm leaderboards or school rankings) | Spoofing / Denial of Service | High | Verified school registration codes (`SchoolMembership.isApproved`), email/guardian verification prior to `AccountStatus.ACTIVE`, and Redis rate limiting per IP and device fingerprint. |
| **TM-07** | **Spam & Inappropriate Creative Submissions** (Unmoderated text/images exposed to Junior/Teen zones) | Tampering | Critical | All `CreativeSubmission` records default to `ModerationStatus.PENDING_REVIEW` and remain invisible to public/club queries until a `MODERATOR` records an `APPROVED` `ModerationAction`. |
| **TM-08** | **Malicious Media Uploads** (Polyglot files, SVG script injection, or EXIF GPS leakage in Creative Studio) | Elevation of Privilege / Info Disclosure | High | Server-side PNG magic-byte verification, 2 MB limit, canvas-generated PNG uploads with no source EXIF metadata, and authenticated Cloudinary delivery. |
| **TM-09** | **Abuse of Moderation or Admin Tools** (Insider threat or compromised moderator account altering scores or unbanning accounts silently) | Repudiation / Elevation of Privilege | High | Every moderator and admin action writes an immutable `AuditLog` entry (`onDelete: Restrict`) with `actorUserId`, `actorRole`, `entityId`, and mandatory `rationale`. Even `PLATFORM_ADMIN` is blocked from `xp:mutate_balance_directly`. |

---

## 2. Anti-Cheat Verification Pipeline

```text
[Client Game Finish]
       |  POST /api/v1/architecture/verify-xp (sessionId, claimedScore, durationSeconds, idempotencyKey)
       v
[1. Zod Schema Validation (@naijaplay/validation)]
       |-- Rejects negative scores, malformed UUIDs, or missing idempotencyKey (400 VALIDATION_ERROR)
       v
[2. Permission & Consent Guard (@naijaplay/permissions)]
       |-- Verifies ACTIVE status + CORE_GAMEPLAY_AND_LEARNING consent for minors (403 FORBIDDEN)
       v
[3. Plausibility & Rule Engine (@naijaplay/game-engine)]
       |-- Checks correctAnswers <= maxQuestionsPerSession
       |-- Checks durationSeconds >= correctAnswers * minSecondsPerQuestion
       |-- Checks claimedScore == correctAnswers * pointsPerCorrectAnswer
       |-- Rejects anomalies with 422 SCORE_PLAUSIBILITY_REJECTED
       v
[4. Immutable XP Ledger Transaction]
       |-- Checks idempotencyKey & [playerProfileId, source, referenceId] uniqueness
       |-- Appends immutable XPTransaction + GameScore atomically
```
