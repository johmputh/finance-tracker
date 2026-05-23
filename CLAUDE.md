# Finance Tracker

Personal Finance Tracker — log expenses via LINE, view them on a web dashboard, with AI auto-categorization.

## Stack & structure

pnpm monorepo (workspaces in `apps/*` and `packages/*`). Requires **Node 20+**.

| Workspace | Package name | Tech | Purpose |
|---|---|---|---|
| `apps/frontend` | `@finance-tracker/frontend` | Vite + React + Tailwind | Web dashboard |
| `apps/backend` | `@finance-tracker/backend` | NestJS | API server (served under `/api`) |
| `packages/database` | `@finance-tracker/database` | Prisma + PostgreSQL | Schema, migrations, Prisma client |
| `packages/shared` | `@finance-tracker/shared` | TypeScript | DTOs, response interfaces, enums shared across the wire |

External services: **LINE Messaging API**, **Claude API**.

## Commands

Run from the repo root:

```bash
pnpm install          # install all workspaces
pnpm bootstrap        # install -> db:generate -> build -> db:migrate -> db:seed

pnpm dev              # run all workspaces in watch mode (parallel)
pnpm frontend:dev     # frontend only -> http://localhost:5173
pnpm backend:dev      # backend only  -> http://localhost:3000/api

pnpm build            # build every workspace
pnpm typecheck        # tsc --noEmit across every workspace

pnpm db:generate              # prisma generate
pnpm db:migrate --name <name> # create + apply a migration (see gotchas)
pnpm db:seed                  # seed default categories (idempotent)
pnpm db:reset                 # drop + migrate + seed
pnpm db:studio                # Prisma Studio GUI
```

### Gotchas

- **Migrations: `pnpm db:migrate --name init`** — do NOT write `pnpm db:migrate -- --name init`. pnpm forwards the `--` literally into prisma's args, so prisma ignores `--name` and hangs at an interactive prompt.
- **Single `.env` at the repo root.** Both the backend and `packages/database` read it (via `dotenv-cli` and `prisma.config.ts`). Do not add per-package `.env` files.
- **Prisma 7**: the datasource URL lives in `packages/database/prisma.config.ts`, not in `schema.prisma`. The client needs a driver adapter (`@prisma/adapter-pg`) — construct it with `createPrismaClient()` from `@finance-tracker/database`.
- Workspace packages are ESM; the NestJS backend is CommonJS. Their `exports` maps include `require`/`default` conditions so the CJS backend can import them. Build a package (`pnpm --filter <pkg> build`) before the backend consumes new exports.

## Architecture

### Backend: Module > Controller > Service > Repository

- Controllers handle HTTP only. Services hold business logic. Repositories wrap the Prisma client.
- **Never call the Prisma client directly in a Service.** All DB access goes through a Repository that wraps Prisma.
- The API is served under the **`/api`** prefix.
- **Every feature module that uses `JwtAuthGuard` must import `AuthModule`.**
- **DTO classes used in `@Body()` must be value imports, not `import type`** — class-validator needs the class reference at runtime.

### Backend modules

| Module | Routes |
|---|---|
| AuthModule | POST /auth/login, /auth/register, GET /auth/me, PATCH /auth/me, PATCH /auth/me/password |
| CategoryModule | CRUD /categories |
| TransactionModule | CRUD /transactions, GET /transactions/summary |
| RecurringModule | CRUD /recurring, POST /recurring/trigger |
| BudgetModule | POST /budget, GET /budget?month=&year=, DELETE /budget/:id |

### Frontend

- Style with **Tailwind utility classes only**. No inline `style={{ ... }}` except dynamic width on progress bars.
- The `Modal` component has **no `isOpen` prop** — use conditional rendering: `{condition && <Modal>}`.

### packages/shared — the client/server wire contract

Put here ONLY things that cross the client/server boundary:

- **DTO classes** using `class-validator` (it runs in the browser too, so the frontend reuses the same DTOs to validate forms)
- **Response interfaces**
- **Enums** shared across the wire

Never put in `packages/shared`:

- Classes that import from `@nestjs/*` (server-only)
- Frontend-only view models / UI state

## Conventions

- **TypeScript strict. Never use `any`.**
- **No comments** unless explicitly requested — code must be self-explanatory through clear names.
- Naming: `camelCase` variables, `PascalCase` types, `kebab-case` file names.
- **Jest** tests live next to the source file they cover (`foo.ts` -> `foo.spec.ts`).
- **1 prompt = 1 commit.** Verify the build passes before every commit. Use **conventional commits** (`feat:`, `fix:`, `docs:`, `chore:`, ...).
