# NaijaPlay — Engineering & Development Workflow

**Document Version:** 1.0 (Phase 1 Foundation)

---

## 1. Branching & Phase Gate Discipline

NaijaPlay is developed in twelve explicit, review-gated phases. Code never advances to the next phase until all acceptance criteria for the current phase are verified:
- `main`: Protected branch containing verified phase milestones.
- `feat/phase-XX-<module>`: Feature branches scoped to the active phase.
- **Pre-Merge Quality Gate (`.github/workflows/ci.yml`):**
  1. `npm run db:validate` — Validates `packages/database/prisma/schema.prisma`.
  2. `npm run typecheck` — Runs `tsc --noEmit` in strict mode across all workspace packages and Next.js routes.
  3. `npm run lint` — Runs ESLint across the repository.
  4. `npm run test` — Executes the Vitest automated test suite.
  5. `npm run build` — Verifies clean production compilation.

---

## 2. Database Migration Workflow

1. **Local Schema Iteration:**
   Edit `packages/database/prisma/schema.prisma` and validate syntax:
   ```bash
   npm run db:validate
   ```
2. **Creating a Versioned Migration (with PostgreSQL running):**
   ```bash
   npx prisma migrate dev --schema=packages/database/prisma/schema.prisma --name <descriptive_migration_name>
   ```
3. **Production Deployment:**
   ```bash
   npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
   ```
   > **Warning:** Never run `prisma db push` or `prisma migrate reset` against staging or production databases.

---

## 3. Automated Testing Strategy

NaijaPlay organizes tests into three tiers:
1. **Unit & Domain Invariant Tests (`tests/*.test.ts` — Vitest):**
   - Fast, deterministic, zero-network tests covering `@naijaplay/validation`, `@naijaplay/permissions` (RBAC, age-zone boundaries, guardian self-grant prevention, minor messaging prohibition), and `@naijaplay/game-engine` (score plausibility, superhuman reaction detection, immutable XP ledger idempotency).
2. **API Contract & Integration Tests:**
   - Tests verifying standardized `ApiResponse<T>` envelopes and HTTP status codes (`400`, `403`, `409`, `422`) on `/api/v1/*` routes.
3. **End-to-End Journey Tests (Phase 3+):**
   - Browser-level verification of onboarding, guardian consent approval, and game session completion.
