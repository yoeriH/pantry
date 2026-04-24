# Agent Operating Rules

These rules apply to all coding agents working in this repository.

1. **Read `AGENTS.md` first** before making any changes.
2. **Read relevant documentation** in `docs/` before editing architecture-adjacent code.
3. **Prefer small, coherent changes** over large rewrites.
4. **Do not bypass lint, typecheck, or tests.** All must pass before completion.
5. **Do not invent product requirements.** Implement only what is asked.
6. **Keep business logic out of UI components.** Delegate to domain functions.
7. **Keep persistence behind ports/adapters.** Never call `localStorage` directly outside the adapter.
8. **Add tests with every behavior change.** No behavior without a test.
9. **Avoid speculative abstractions.** Do not add patterns for hypothetical future features.
10. **Do not add forbidden frameworks.** React, Vue, Angular, Svelte, Next.js, Nuxt, Remix, NestJS are not allowed.
