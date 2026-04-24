# ADR 0001: Initial Architecture

**Date:** 2025-01-01  
**Status:** Accepted

## Context

We are building a Dutch family meal planning web application. The application needs to be:

- Simple to maintain by a single developer (or small team of agents)
- Progressively enhanceable (start simple, add persistence later)
- Free from framework lock-in on the frontend

## Decision

We adopt the following stack:

| Layer      | Technology                   | Rationale                                                |
| ---------- | ---------------------------- | -------------------------------------------------------- |
| Frontend   | Vite + Native Web Components | No framework lock-in; standard web platform APIs         |
| UI Library | Shoelace                     | High-quality, accessible web components                  |
| Backend    | Node.js + Express            | Simple, well-known, low overhead                         |
| Storage    | localStorage (initially)     | No backend needed for MVP; easy to swap via port/adapter |
| Future DB  | NeonDB / Postgres            | Serverless Postgres, good DX, scales well                |
| Monorepo   | pnpm workspaces              | Simple, fast, no complex build orchestration needed yet  |

## Storage Port/Adapter Pattern

All storage goes through `StoragePort`. This isolates the application from the storage mechanism.

Migration path:

1. `BrowserStorageAdapter` (localStorage) — current
2. `BackendApiAdapter` (REST API) — when server-side persistence is needed
3. Server uses Postgres/NeonDB repository — behind its own interface

## Consequences

- No React, Vue, Angular, or other frontend frameworks. This is intentional.
- The app will work without a server initially (all data in localStorage).
- Adding server-side persistence requires only a new adapter, not a rewrite.
- Shoelace provides accessible components without building a design system from scratch.
