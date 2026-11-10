# NaijaPlay — Engineering & System Architecture Repository

**Tagline:** *Play. Learn. Compete. Become.*  
**Phase Status:** Phase 01 Complete — Foundation, System Architecture, Relational Schema & Security Boundaries  
**Initial Market:** Nigeria (`NG`) · **Expansion Architecture:** Multi-country African ecosystem (`GH`, `KE`, `ZA`)  
**Target Audience:** Junior Zone (Ages 6–12) · Teen Zone (Ages 13–17) · Youth Zone (Ages 18–25)

---

## 1. Overview & Architectural Philosophy

NaijaPlay is an activity-first African youth entertainment and learning ecosystem built with Next.js (App Router), TypeScript, PostgreSQL, Prisma, and Zod. The web app and its supporting domain modules live under `src/`; external dependencies and scripts are managed from the repository root.

### Core Engineering Principles
1. **Server-Authoritative Progression & Anti-Cheat:** Clients never dictate XP awards, level progression, or leaderboard rankings. Game sessions are verified against server-side plausibility bounds (`@naijaplay/game-engine`), and XP is recorded in an immutable, append-only `XPTransaction` ledger with idempotency keys.
2. **NDPA Child-Safety by Default:** Built in compliance with the Nigeria Data Protection Act (NDPA) and NCC Child Online Protection standards. Age zones (`JUNIOR` 6–12, `TEEN` 13–17, `YOUTH` 18–25) are computed server-side from `dateOfBirth`. Minors require verified `GuardianConsent` scopes, default to private profiles, and are strictly blocked from unrestricted private messaging.
3. **Zero-Trust RBAC + ABAC Authorization:** Every state-changing or sensitive operation passes through `@naijaplay/permissions` (`authorizeAction`), verifying account status, role capabilities, guardian-child links, school tenant isolation, and age-zone boundaries.
4. **Prisma Migrations as Single Source of Truth:** Database schema changes occur strictly through versioned Prisma migrations (`prisma migrate deploy` in production), never via `db push` or ad-hoc schema synchronization.

---

## 2. Repository Structure

```text
naijaplay/
├── src/
│   ├── app/                      # Active Next.js App Router and API routes
│   │   ├── api/auth/             # Login, registration, logout, and session endpoints
│   │   ├── api/media/creative/   # Authenticated Cloudinary artwork upload
│   │   ├── api/v1/               # Health and architecture verification endpoints
│   │   ├── layout.tsx            # Root layout and metadata
│   │   └── page.tsx              # Main NaijaPlay application
│   ├── components/               # Navbar, games, learning, studio, profile, and other UI
│   ├── data/                     # Mock and seed presentation data
│   ├── docs/                     # Product, architecture, database, API, and security docs
│   ├── hooks/                    # React hooks, including PWA install behavior
│   ├── lib/                      # Database, authentication security, audio, and utilities
│   ├── packages/
│   │   ├── database/prisma/      # Prisma schema
│   │   ├── game-engine/          # Score verification and XP domain logic
│   │   ├── permissions/          # RBAC and age-aware authorization rules
│   │   ├── shared/               # Domain enums and shared errors
│   │   ├── ui/                   # Shared UI definitions
│   │   └── validation/           # Zod schemas and age-zone validation
│   ├── tests/                    # Vitest tests
│   ├── tooling/                  # Shared TypeScript configuration
│   └── types/                    # Application TypeScript types
├── public/                       # Static assets, icons, and PWA manifest
├── .github/workflows/            # CI workflow
├── package.json
├── tsconfig.json
├── next.config.ts
└── vitest.config.ts
```

`src/app/` is the active Next.js app directory. The old root-level layout shown in earlier documentation is not used. Directories under `src/packages/` contain imported application source code; they are not separately installed npm workspaces.

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
   Put local credentials and secrets only in the root `.env` file. Next.js and Prisma load it automatically. Do not copy real values into `.env.example`, source files, or chat messages. The `.env` file is ignored by Git.
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
   Open `http://localhost:3000` to use the NaijaPlay web app.

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

> **Local secrets:** Keep real credentials in the root `.env` only. `.env.example` is an optional, safe template and must contain placeholders only; it is not loaded as the application's secret file.
