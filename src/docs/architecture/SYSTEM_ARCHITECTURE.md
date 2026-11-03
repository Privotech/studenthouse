# NaijaPlay — System Architecture Document

**Document Version:** 1.0 (Phase 1 Foundation)  
**Architectural Style:** Modular Monolith in a `pnpm` + Turborepo Monorepo  
**Primary Runtime:** Next.js 15+ (App Router, TypeScript Strict Mode) + PostgreSQL (Prisma ORM)

---

## 1. High-Level Architectural Topology

NaijaPlay is structured as a **Modular Monolith** rather than premature microservices. All core business domains live in strongly typed, isolated workspace packages with explicit public interfaces, deployed initially within a single Next.js application while keeping stateful real-time multiplayer decoupled for future deployment.

```text
+-----------------------------------------------------------------------------------+
|                            CLIENT APPLICATIONS LAYER                              |
|  [Mobile-First PWA (Next.js)]   [Future Android App]   [Parent / School / Admin]  |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / JSON (Standardized ApiResponse<T>)
                                          v
+-----------------------------------------------------------------------------------+
|                        NEXT.JS API & APPLICATION LAYER                            |
|  - Route Handlers (/app/api/v1/*)                                                 |
|  - Request Validation Middleware (@naijaplay/validation - Zod)                    |
|  - Zero-Trust Authorization Guard (@naijaplay/permissions - RBAC + Age ABAC)      |
|  - Centralized Error Boundary & Audit Logger (@naijaplay/shared)                  |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
        v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
|  IDENTITY & SAFETY    |     |  GAME & XP ENGINE     |     | LEARNING & TOURNEY    |
|  - Auth & Sessions    |     |  - Score Plausibility |     | - Course Progression  |
|  - AgeZone Resolver   |     |  - Telemetry Verifier |     | - Async Tournaments   |
|  - Guardian Consent   |     |  - Immutable XP Ledger|     | - School Isolation    |
|  - Moderation & Audit |     |  - Mission Dedupe     |     | - Pre-Moderated Clubs |
+-----------+-----------+     +-----------+-----------+     +-----------+-----------+
            |                             |                             |
            +-----------------------------+-----------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                         DATA & INFRASTRUCTURE LAYER                               |
|  [PostgreSQL (Single Source of Truth via Prisma)]   [Redis (Rate Limits/Cache)]   |
|  [S3/Cloudinary (Moderated Media Storage)]          [Resend (Guardian Emails)]    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Workspace Package Boundaries

To ensure the future Android application and future `apps/realtime` Socket.IO server can reuse domain logic without coupling to Next.js internals, dependencies flow strictly downward:

1. **`@naijaplay/shared`**: Zero external runtime dependencies. Defines domain enums (`AgeZone`, `UserRole`, `AccountStatus`, `ConsentScope`, `XPTransactionSource`), standardized API envelopes (`ApiResponse<T>`), and typed error classes (`AppError`, `AuthorizationError`, `ConsentRequiredError`, `InvariantViolationError`).
2. **`@naijaplay/validation`**: Depends on `@naijaplay/shared` and `zod`. Contains all input schemas, `calculateAgeYears()`, and `resolveAuthoritativeAgeZone()`.
3. **`@naijaplay/permissions`**: Depends on `@naijaplay/shared` and `@naijaplay/validation`. Implements `authorizeAction()` (RBAC + Age-Aware ABAC), guardian consent scope enforcement, self-grant prevention, and `getAgeZonePrivacyDefaults()`.
4. **`@naijaplay/game-engine`**: Depends on `@naijaplay/shared` and `@naijaplay/validation`. Implements `verifyGameScoreSubmission()` (anti-cheat reaction time and score ceiling verification), `AuthoritativeXPLedger` (append-only immutable ledger with idempotency protection), and `calculatePlayerLevelFromXP()`.
5. **`@naijaplay/database`**: Encapsulates `prisma/schema.prisma` (26 relational models across 9 domains), database client initialization, and transactional repository patterns.
6. **`@naijaplay/ui`**: Shared design tokens and age-zone interface rules (`JUNIOR`, `TEEN`, `YOUTH`).

---

## 3. Separation of Concerns Across Application Layers

Every feature module adheres to a five-layer boundary:
1. **Presentation Layer (`app/`, `components/`)**: React Server and Client Components. Renders UI states and dispatches requests. Never performs direct database queries or trusts client-side role/age state for security.
2. **Transport & Validation Layer (`app/api/v1/*` + `@naijaplay/validation`)**: Parses HTTP requests, validates payloads via Zod, attaches `requestId`, and formats responses via `createSuccessResponse` / `createErrorResponse`.
3. **Authorization Layer (`@naijaplay/permissions`)**: Evaluates `ActorContext` (resolved from server session) against the target `PlatformAction` and resource ownership before domain execution.
4. **Domain Logic Layer (`@naijaplay/game-engine`, domain services)**: Pure business rules (score verification, XP calculation, consent state transitions).
5. **Data Access Layer (`@naijaplay/database`)**: Executes ACID PostgreSQL transactions via Prisma ORM.

---

## 4. Real-Time Decoupling Strategy

Serverless HTTP functions are unsuitable for persistent WebSocket connections. Therefore:
- **Phase 1–7 (MVP):** All games, missions, leaderboards, and competitions operate over stateless HTTPS endpoints with server-authoritative session seeds and score verification.
- **Future Phase (`apps/realtime`):** When synchronous head-to-head trivia or puzzle matches are introduced, a dedicated Node.js + Socket.IO service will be added in `apps/realtime`, importing `@naijaplay/shared`, `@naijaplay/validation`, and `@naijaplay/game-engine` directly from the workspace.
