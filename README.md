# NaijaPlay — Engineering & System Architecture Repository

**Tagline:** *Play. Learn. Compete. Become.*  
**Phase Status:** Phase 01 Complete — Foundation, System Architecture, Relational Schema & Security Boundaries  
**Initial Market:** Nigeria (`NG`) · **Expansion Architecture:** Multi-country African ecosystem (`GH`, `KE`, `ZA`)  
**Target Audience:** Junior Zone (Ages 6–12) · Teen Zone (Ages 13–17) · Youth Zone (Ages 18–25)

---

## 1. Overview & Architectural Philosophy

NaijaPlay is an activity-first African youth entertainment and learning ecosystem. It is engineered as a **Modular Monolith** built on Next.js (App Router), TypeScript (strict mode), PostgreSQL, Prisma ORM, and Zod, organized in a `pnpm` + Turborepo workspace so domain logic, validation contracts, permission policies, and the server-authoritative game/XP engine are cleanly separated from presentation and reusable by the future Android client.

### Core Engineering Principles
1. **Server-Authoritative Progression & Anti-Cheat:** Clients never dictate XP awards, level progression, or leaderboard rankings. Game sessions are verified against server-side plausibility bounds (`@naijaplay/game-engine`), and XP is recorded in an immutable, append-only `XPTransaction` ledger with idempotency keys.
2. **NDPA Child-Safety by Default:** Built in compliance with the Nigeria Data Protection Act (NDPA) and NCC Child Online Protection standards. Age zones (`JUNIOR` 6–12, `TEEN` 13–17, `YOUTH` 18–25) are computed server-side from `dateOfBirth`. Minors require verified `GuardianConsent` scopes, default to private profiles, and are strictly blocked from unrestricted private messaging.
3. **Zero-Trust RBAC + ABAC Authorization:** Every state-changing or sensitive operation passes through `@naijaplay/permissions` (`authorizeAction`), verifying account status, role capabilities, guardian-child links, school tenant isolation, and age-zone boundaries.
4. **Prisma Migrations as Single Source of Truth:** Database schema changes occur strictly through versioned Prisma migrations (`prisma migrate deploy` in production), never via `db push` or ad-hoc schema synchronization.

---

## 2. Repository Structure

```text
naijaplay/
├── app/                          # Next.js App Router (Web PWA & Phase 1 Architecture Workbench)
│   ├── api/v1/                   # Versioned REST API routes with Zod validation & error envelopes
│   ├── layout.tsx                # Root layout with PWA metadata & typography
│   ├── manifest.ts               # Native Next.js Web App Manifest
│   └── page.tsx                  # Phase 1 Architecture & Verification Console
├── apps/
│   └── web/                      # Monorepo web workspace descriptor
├── packages/
│   ├── database/                 # Prisma schema (26 models across 9 domains) & entity metadata
│   │   └── prisma/schema.prisma
│   ├── game-engine/              # Server-authoritative score verifier & immutable XP ledger
│   ├── permissions/              # RBAC & Age-Aware ABAC policy engine + NDPA privacy defaults
│   ├── shared/                   # Domain enums, API response envelopes & typed AppError classes
│   ├── ui/                       # Age-zone design tokens & shared UI specifications
│   └── validation/               # Zod schemas & authoritative age-zone resolution
├── docs/
│   ├── product/
│   │   └── PRODUCT_REQUIREMENTS.md
│   ├── architecture/
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   ├── PWA_STRATEGY.md
│   │   └── DEVELOPMENT_WORKFLOW.md
│   ├── database/
│   │   └── DATABASE_DESIGN.md
│   ├── security/
│   │   ├── SECURITY_REQUIREMENTS.md
│   │   └── THREAT_MODEL.md
│   ├── api/
│   │   └── API_CONVENTIONS.md
│   └── decisions/
│       └── ARCHITECTURE_DECISIONS.md
├── tests/                        # Automated Vitest suite (validation, RBAC/ABAC, XP ledger)
├── tooling/                      # Shared TypeScript & build configurations
├── .github/workflows/ci.yml      # Automated CI pipeline
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── vitest.config.ts
```

---

## 3. Reproducible Local Setup

### Prerequisites
- **Node.js:** v20.x LTS or newer
- **Package Manager:** `pnpm` (v9+) or `npm`
- **Database:** PostgreSQL 15+ (for full relational persistence; Phase 1 verification and unit tests run hermetically without requiring a live external PostgreSQL daemon)

### Step-by-Step Installation
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and supply local credentials:
   ```bash
   cp .env.example .env.local
   ```
3. **Validate the Prisma relational schema:**
   ```bash
   npm run db:validate
   ```
4. **Run strict TypeScript verification:**
   ```bash
   npm run typecheck
   ```
5. **Run ESLint verification:**
   ```bash
   npm run lint
   ```
6. **Execute the automated test suite (Vitest):**
   ```bash
   npm run test
   ```
7. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to access the **NaijaPlay Phase 1 Architecture & Verification Workbench**.

---

## 4. Environment Variables Reference

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Server-only | Pooled PostgreSQL connection string for Prisma Client queries |
| `DIRECT_URL` | Server-only | Direct PostgreSQL connection string for `prisma migrate` |
| `AUTH_SECRET` | Server-only | 32-byte cryptographic secret for Auth.js session signing |
| `AUTH_URL` | Server-only | Canonical origin URL for authentication callbacks |
| `REDIS_URL` | Server-only | Redis connection string for rate limiting and leaderboard caching |
| `CLOUDINARY_CLOUD_NAME` | Server-only | Cloudinary cloud name for Creative Studio image uploads |
| `CLOUDINARY_API_KEY` | Server-only | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Server-only | Cloudinary API secret; never expose it to the browser |
| `RESEND_API_KEY` | Server-only | Transactional email API key for Guardian Consent verification |
| `NEXT_PUBLIC_DEFAULT_COUNTRY` | Public | Initial market ISO country code (`NG`) |

> **Security Rule:** Server secrets (`DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `CLOUDINARY_API_SECRET`) must **never** be prefixed with `NEXT_PUBLIC_`.
