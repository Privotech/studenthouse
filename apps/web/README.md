# `@naijaplay/web` — Next.js Progressive Web App

In the monorepo topology, `apps/web` represents the Next.js PWA application consuming `@naijaplay/shared`, `@naijaplay/validation`, `@naijaplay/permissions`, `@naijaplay/game-engine`, `@naijaplay/database`, and `@naijaplay/ui`.

To maintain compatibility with container runtimes that execute `next dev` and `next build` from the repository root (`/`), the active Next.js App Router entry points (`app/`, `components/`, `public/`) are mounted at the root level and configured with workspace path aliases (`@naijaplay/*`) in `tsconfig.json`.
