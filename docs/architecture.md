# Architecture

## Current Status

This repository is an **empty application shell**. No product features are implemented.

The architecture is in place to support future development of a Dutch family meal planning application.

---

## Overview

```
Browser
  └── apps/web (Vite + Web Components + Shoelace)
        ├── StoragePort (interface)
        └── BrowserStorageAdapter (localStorage)

Server
  └── apps/server (Node.js + Express)
        └── /health endpoint

Shared Logic
  ├── packages/domain  (future: domain types + pure logic)
  └── packages/shared  (cross-app utilities)
```

---

## Frontend

- **Vite** for development server and production build.
- **Native Web Components** — no frontend framework.
- **Shoelace** for UI components (buttons, inputs, dialogs, etc.).
- All custom elements use the `meal-*` naming prefix.
- Component styles live in Shadow DOM, not global CSS.

---

## Backend

- **Node.js** + **Express** for the server.
- Express was chosen over Fastify for simplicity: fewer abstractions, more community resources, sufficient for a small family app.
- Currently only exposes `/health`.
- Future API routes will be added to `apps/server/src/http/`.

---

## Storage

Storage is behind a port/adapter boundary.

### Current: BrowserStorageAdapter (localStorage)

```
UI Component → StoragePort → BrowserStorageAdapter → localStorage
```

### Future migration path

1. **Phase 1 (current):** `BrowserStorageAdapter` → `localStorage`
2. **Phase 2:** `BackendApiAdapter` → REST API → Server → (in-memory / file)
3. **Phase 3:** `BackendApiAdapter` → REST API → Server → NeonDB/Postgres repository

To migrate: implement a new adapter satisfying `StoragePort` and swap it at the injection point. No other code needs to change.

---

## Domain Package

`packages/domain` will hold:

- Domain types (e.g., `Meal`, `PantryItem`, `ShoppingList`)
- Pure business logic (no I/O, no UI)
- Commands and query types

Currently empty. **Do not add domain models until the feature is being implemented.**

---

## Why No Product Features Are Implemented

This initialization task establishes the technical foundation only.

Benefits of this approach:

- Future agents can implement features without changing build/tooling setup.
- Clean architecture boundaries are established before any code accumulates.
- Tests and CI are in place so regressions are caught immediately.
- Documentation gives agents clear operating rules from day one.

---

## Future Persistence: NeonDB

When the app needs server-side persistence:

1. Add a NeonDB/Postgres connection in `apps/server/src/config/`.
2. Create repository interfaces in `packages/domain/`.
3. Implement repositories in `apps/server/src/repositories/`.
4. Replace the `BrowserStorageAdapter` with an API-backed adapter.

The frontend `StoragePort` interface isolates the frontend from these changes.
