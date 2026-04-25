# Definition of Done

A task is complete when all of the following are true:

- [ ] **Requirements satisfied** — all stated requirements are implemented
- [ ] **Typecheck passes** — `pnpm typecheck` returns no errors
- [ ] **Lint passes** — `pnpm lint` returns no errors
- [ ] **Format check passes** — `pnpm format:check` returns no errors
- [ ] **Unit tests pass** — `pnpm test:unit` returns no failures
- [ ] **Build succeeds** — `pnpm build` completes without errors
- [ ] **Smoke test passes** — `pnpm test:smoke` passes (where relevant)
- [ ] **No unrelated changes** — only files relevant to the task are modified
- [ ] **Architecture boundaries respected** — no layer violations, no forbidden frameworks
- [ ] **README/docs updated** — if commands, structure, or architecture changed
