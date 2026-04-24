# Pantry

A Dutch family meal planning web application.

## Stack

- **Frontend:** Vite, TypeScript, Native Web Components, Shoelace
- **Backend:** Node.js, Express, TypeScript
- **Monorepo:** pnpm workspaces
- **Tests:** Vitest (unit), Playwright (smoke)

## Getting Started

```bash
pnpm install
pnpm dev
```

## Commands

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `pnpm dev`          | Start frontend and backend in dev |
| `pnpm build`        | Build all packages                |
| `pnpm typecheck`    | TypeScript type check             |
| `pnpm lint`         | ESLint                            |
| `pnpm format`       | Prettier format (write)           |
| `pnpm format:check` | Prettier format (check)           |
| `pnpm test:unit`    | Vitest unit tests                 |
| `pnpm test:smoke`   | Playwright smoke tests            |

## Project Structure

```
apps/
  web/        → Vite frontend (Web Components + Shoelace)
  server/     → Express backend
packages/
  domain/     → Domain types and pure business logic
  shared/     → Cross-app utilities
  test-utils/ → Shared test helpers
tests/
  smoke/      → Playwright smoke tests
docs/         → Architecture and development docs
```

## Documentation

- [Architecture](docs/architecture.md)
- [AGENTS.md](AGENTS.md) — Guide for coding agents
