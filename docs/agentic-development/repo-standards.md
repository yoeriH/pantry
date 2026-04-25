# Repository Standards

## Code Style

- TypeScript strict mode is enabled everywhere.
- No `any` types. Use `unknown` and narrow with type guards.
- `noUncheckedIndexedAccess` is enabled — always handle potentially undefined array/object access.
- `exactOptionalPropertyTypes` is enabled — do not set optional properties to `undefined` explicitly.
- All imports use `.js` extensions (even for `.ts` source files) per ESM convention.
- Single quotes, semicolons, trailing commas (configured in `.prettierrc.json`).

## Naming Conventions

- Custom elements: `meal-*` prefix (e.g., `meal-app-root`, `meal-week-view`)
- Files: `kebab-case` (e.g., `browser-storage.ts`, `health.ts`)
- Types/interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `camelCase` (not `SCREAMING_SNAKE_CASE`)

## File Organization

- One primary export per file.
- Test files live next to source files: `foo.ts` and `foo.test.ts`.
- Do not create barrel files (`index.ts`) unless the package already uses them.

## Import Style

- Always use explicit `.js` extensions in imports (TypeScript ESM).
- Import types using `import type` when only the type is needed.
- Do not use default exports in new code; prefer named exports.

## Error Handling

- Never expose raw stack traces to clients.
- Use explicit error types, not generic `Error` with string messages.
- Log errors server-side; return structured error responses to clients.

## Documentation

- Add JSDoc comments to public interfaces and non-obvious functions.
- Update `docs/architecture.md` when architectural decisions change.
- Add an ADR in `docs/decisions/` for significant architectural choices.
