# AGENTS.md — Agentic Development Guide

> Read this file before making any changes to this repository.

## 1. Project Purpose

Pantry is a Dutch web-based family meal planning application.  
It helps a single Dutch family track weekly meals, manage pantry inventory (voorraad),
generate shopping lists, and eventually support recipe planning.

**Current state: empty shell.** No product functionality is implemented yet.

---

## 2. Current Scope

This repository contains only the technical foundation:

- Monorepo setup with pnpm workspaces
- Frontend Vite/Web Components shell
- Backend Express shell with a health endpoint
- Storage abstraction (localStorage, ready for future migration)
- Empty domain and shared packages
- Testing setup (Vitest + Playwright)
- CI (GitHub Actions)
- Developer documentation

**Do not add product features until the shell is complete and stable.**

---

## 3. Stack Overview

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Frontend   | Vite, TypeScript, Native Web Components |
| UI Library | Shoelace                                |
| Backend    | Node.js, Express, TypeScript            |
| Storage    | localStorage (via StoragePort adapter)  |
| Tests      | Vitest (unit), Playwright (smoke)       |
| Tooling    | pnpm, ESLint, Prettier, GitHub Actions  |
| Future DB  | NeonDB / Postgres                       |

---

## 4. Folder Responsibilities

```
apps/web          → Frontend Vite app (Web Components, Shoelace)
apps/server       → Node.js Express backend
packages/domain   → Domain types, commands, pure business logic (no UI, no I/O)
packages/shared   → Cross-app generic utilities and types
packages/test-utils → Shared test helpers, fixtures, mocks
tests/smoke       → Playwright end-to-end smoke tests
docs/             → Architecture and agentic development documentation
```

---

## 5. Rules for Future Feature Work

- Add one feature at a time in a focused, reviewable change.
- Define domain types in `packages/domain` before implementing UI or API.
- Keep business logic out of UI components and route handlers.
- Write unit tests alongside implementation code.
- Update `docs/architecture.md` if the architecture changes.
- Do not introduce new top-level frameworks.

---

## 6. Rules for Frontend Work

- Use native Web Components. No React, Vue, Angular, Svelte, Next.js, Nuxt, Remix.
- Use Shoelace for UI components where available.
- Custom element names must follow the `meal-*` convention (e.g., `meal-app-root`, `meal-nav`).
- Keep logic out of `connectedCallback` — delegate to small, testable functions.
- Import Shoelace components individually, not the full bundle.
- Do not use global CSS for component-scoped styles; use Shadow DOM styles.

---

## 7. Rules for Backend Work

- Add new routes in `apps/server/src/http/`.
- Keep route handlers thin: parse input, call domain logic, return response.
- Use structured error handling — never expose raw stack traces to clients.
- Document new endpoints in `docs/architecture.md`.
- No database yet. Return mock/empty data or 501 Not Implemented for future endpoints.

---

## 8. Rules for Storage and Future Persistence

- All persistence must go through the `StoragePort` interface.
- The `BrowserStorageAdapter` is the current implementation.
- To migrate to backend persistence: create a new adapter implementing `StoragePort`
  that calls the backend API; swap it in at the injection point without changing call sites.
- Never call `localStorage` directly outside of `BrowserStorageAdapter`.
- Never add meal-specific or domain-specific methods to `StoragePort`.

---

## 9. Rules for Testing

- Unit tests live next to source files: `foo.ts` → `foo.test.ts`.
- Unit tests use Vitest.
- Smoke tests live in `tests/smoke/` and use Playwright.
- Test names describe behavior, not implementation: `'stores and retrieves a value'` not `'test set'`.
- Write tests with every behavior change.
- Do not delete or weaken existing tests.

---

## 10. Definition of Done

A change is done when:

- [ ] Requirements are satisfied
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm test:unit` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm test:smoke` passes
- [ ] No unrelated files are changed
- [ ] Architecture boundaries are respected
- [ ] README or docs are updated if commands or structure changed

---

## 11. Commands to Run Before Claiming Completion

```bash
pnpm install          # Install dependencies
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint
pnpm format:check     # Prettier check
pnpm test:unit        # Vitest unit tests
pnpm build            # Production build
pnpm test:smoke       # Playwright smoke tests
```

---

## 12. How to Add New Functionality

1. Read `docs/architecture.md` and relevant `packages/domain/` types.
2. Define the domain model in `packages/domain/src/` if needed.
3. Implement storage in `apps/web/src/storage/` via `StoragePort`.
4. Implement the Web Component in `apps/web/src/components/`.
5. Implement the backend route in `apps/server/src/http/` if an API is needed.
6. Write unit tests alongside each new file.
7. Update the Playwright smoke test if the page structure changes significantly.
8. Run all validation commands before submitting.

---

## 13. ⚠️ Frameworks Not Allowed

**Never add these to this repository:**

- React
- Vue
- Angular
- Svelte
- Next.js
- Nuxt
- Remix
- NestJS

This is a Web Components application. Adding a frontend framework would break the architecture.

---

## 14. ⚠️ No Product Functionality in This Initialization Task

This task is repository initialization only.

**Do not implement:**

- Meal planning features
- Pantry/inventory management
- Shopping list generation
- Recipe planning
- Authentication
- Database schemas
- User management

---

## 15. Guidance for OpenAI Codex and GitHub Copilot Agents

- **Read this file and `docs/architecture.md` before generating any code.**
- Prefer small, focused changes over large sweeping rewrites.
- Ask for clarification if the scope of a prompt is ambiguous.
- Do not invent requirements not mentioned in the prompt.
- When adding a feature, follow the layered architecture: domain → storage → UI/API.
- Always run validation commands before reporting completion.
- Reference existing files as patterns before creating new ones.
- Do not use `any` types in TypeScript.
- Always add tests for new behavior.
