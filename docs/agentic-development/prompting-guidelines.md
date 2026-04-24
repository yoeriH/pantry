# Prompting Guidelines

Guidelines for writing effective prompts for coding agents in this repository.

## General Principles

1. **Be specific about scope** — Describe exactly what needs to change and why.
2. **Reference existing patterns** — Point agents to existing files as examples.
3. **State constraints explicitly** — List what should NOT be changed.
4. **Include acceptance criteria** — Describe what "done" looks like.

## Structure for Feature Prompts

```
## Context
[Brief description of current state]

## Task
[What needs to be implemented]

## Constraints
- [List what must NOT be changed or introduced]

## Acceptance Criteria
- [ ] [Specific, verifiable outcome]
```

## Examples of Good Prompts

**Good:**

> Add a `Meal` domain type to `packages/domain/src/meal.ts`. A Meal has an `id` (string), `name` (string), and `date` (ISO date string). Export it from `packages/domain/src/index.ts`. Add a unit test in `meal.test.ts`. Do not add UI or API code.

**Bad:**

> Add meal support.

## What to Avoid

- Vague instructions ("improve the code")
- Implicit assumptions about frameworks or patterns
- Missing context about which layer to work in
- No acceptance criteria
