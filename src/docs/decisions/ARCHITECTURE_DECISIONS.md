# NaijaPlay — Architecture Decision Records (ADRs)

**Document Version:** 1.0 (Phase 1 Foundation)

---

## ADR-001: Modular Monolith in a `pnpm` + Turborepo Workspace over Microservices

- **Status:** Accepted
- **Context:** NaijaPlay comprises eight functional modules (Game Arena, Competition Arena, Learn & Grow, Creative Studio, Clubs, Player Profiles, Parent & School Portal, Admin & Moderation) and plans a future Android client and real-time multiplayer server.
- **Decision:** Build Phase 1–11 as a **Modular Monolith** inside a single Next.js application backed by isolated workspace packages (`@naijaplay/shared`, `@naijaplay/validation`, `@naijaplay/permissions`, `@naijaplay/game-engine`, `@naijaplay/database`, `@naijaplay/ui`).
- **Rationale:** Microservices introduce distributed transaction complexity, network serialization overhead, and DevOps burden that slow down solo and small-team velocity. Isolating domain logic into workspace packages gives us strict compile-time boundaries and code reuse for the future Android and Socket.IO apps while maintaining ACID PostgreSQL transactions across modules.
- **Implementation note:** This workspace packaging was not completed in the current repository. The app is managed from the root `package.json`; code under `src/packages/` is imported source organized by responsibility and is not an installed npm workspace.

---

## ADR-002: Append-Only Immutable XP Ledger (`XPTransaction`)

- **Status:** Accepted
- **Context:** Players earn XP from games, daily/weekly missions, learning lessons, achievements, and tournaments. Storing a mutable `xpBalance` integer on `PlayerProfile` makes it vulnerable to race conditions, double-crediting bugs, and silent administrative tampering.
- **Decision:** Model all XP awards as an immutable, append-only `XPTransaction` ledger guarded by `@unique([idempotencyKey])` and `@unique([playerProfileId, source, referenceId])`. Prohibit `xp:mutate_balance_directly` for all roles, including `PLATFORM_ADMIN`.
- **Rationale:** Provides a complete, auditable history of how every point of XP was earned, prevents duplicate mission rewards via database constraints, and guarantees deterministic level calculation (`calculatePlayerLevelFromXP`).

---

## ADR-003: Server-Side Age-Zone Resolution & Mandatory Guardian Consent Scopes

- **Status:** Accepted
- **Context:** Under the Nigeria Data Protection Act (NDPA) 2023 and NCC Child Online Protection guidelines, processing children's data requires verifiable parental consent and age-appropriate safeguards.
- **Decision:** Segment the platform into three strict `AgeZone` tiers (`JUNIOR` 6–12, `TEEN` 13–17, `YOUTH` 18–25) computed exclusively on the server from `PlayerProfile.dateOfBirth`. Require explicit, revocable `GuardianConsent` scopes (`CORE_GAMEPLAY_AND_LEARNING`, `TOURNAMENT_PARTICIPATION`, `CREATIVE_STUDIO_SUBMISSION`, `CLUB_PARTICIPATION`) for all minors under 18.
- **Rationale:** Prevents client-side spoofing of age or consent flags, ensures immediate enforcement when a parent revokes consent, and enforces safe privacy defaults (`PRIVATE_GUARDIAN_ONLY` for Junior Zone).

---

## ADR-004: Decoupled Real-Time Service (`apps/realtime`) Deferred to Post-MVP

- **Status:** Accepted
- **Context:** Next.js route handlers deployed on serverless platforms are stateless and unsuitable for hosting persistent WebSocket connections.
- **Decision:** Implement MVP games and tournaments using stateless, server-verified asynchronous sessions (`GameSession` + `GameScore`), and reserve live head-to-head Socket.IO multiplayer for a separate `apps/realtime` Node.js service in Version 3.
- **Rationale:** Keeps initial infrastructure cost minimal, works reliably on high-latency / intermittent Nigerian mobile networks, and avoids coupling core progression logic to WebSocket state.

---

## ADR-005: Prisma Migrate over Schema Synchronization (`db push`)

- **Status:** Accepted
- **Context:** Rapid prototyping often relies on `prisma db push`, which can silently drop columns or fail to record repeatable migration history.
- **Decision:** Require versioned SQL migration files via `prisma migrate dev` (local) and `prisma migrate deploy` (CI/production) for all schema changes.
- **Rationale:** Protects production player profiles, consent records, and immutable XP ledger transactions from accidental data loss.
