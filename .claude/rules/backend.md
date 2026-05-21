---
description: Conventions for the NestJS backend
globs: apps/backend/**
---

# Backend rules (apps/backend)

## Module structure

- **Every feature is its own NestJS module.** Keep features isolated; don't pile unrelated logic into one module.
- Layering, strictly one direction:
  **Controller (validation) → Service (business logic) → Repository (DB).**

## Validation & wire contract

- **Input validation:** import DTO classes from `@finance-tracker/shared` and use them directly. **Never redefine a DTO inside the backend** — the shared package is the single source of truth.
- **Responses:** every payload returned to the frontend must match its response type/interface declared in `@finance-tracker/shared`.

## Data access

- All DB access goes through a **Repository that wraps the Prisma client.**
- **Never call the Prisma client directly in a Service.** Services depend on repositories, not on Prisma.

## Auth & errors

- **Auth:** protect routes with a **JWT Guard**.
- **Error handling:** use NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, `UnauthorizedException`, etc.) — don't invent custom error shapes.

## Testing

- **Every service must have a unit test** (`*.service.spec.ts`) living next to its source file.

## Before committing changes in apps/backend

1. The **build must pass**.
2. Run **only the relevant** `*.service.spec.ts` tests for what changed — not the whole suite.
3. If anything fails, **fix it first**, then commit.

Use conventional commits (1 prompt = 1 commit).
