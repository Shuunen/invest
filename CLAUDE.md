# CLAUDE

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:

- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke context-save / context-restore
- Code quality, health check → invoke health

## Project docs

- `CHANGELOG.md` — release history
- `TODOS.md` — open work items and deferred decisions
- Design doc : `~/.gstack/projects/Shuunen-invest/` — produced by `/office-hours`

## Linting rules

Never add a rule disable to `.oxlintrc.json` without asking.
Never add a `// oxlint-disable-next-line ruleName` without asking.

Fix the code first, then if the rule is truly not applicable, ask the user if they want to disable it locally or globally. If they want to disable it globally, add it to `.oxlintrc.json`. If they want to disable it locally, add a `// oxlint-disable-next-line ruleName` comment immediately above the offending line.

## After any codebase change

Run `pnpm check` to verify the full pipeline: types, formatting, lint, build, and tests. Fix all failures before considering a task done.

## Code practices

### Constants must be camelCase

Use camelCase for all constants, including module-level and exported constants.
Do not use UPPER_SNAKE_CASE for constants in this codebase.

### Prefer `undefined` over `null`

Never use `null` in application types. Use `undefined` for absent values.

For Zod schemas parsing JSON (which uses `null` for absent values), coerce at the boundary with `.nullish().transform(x => x ?? undefined)`. The type stays `T | undefined`; `null` never escapes into the app.

When checking for absence, use [`isNil`](https://es-toolkit.dev/reference/predicate/isNil.html) from es-toolkit instead of `=== null || === undefined`.

### Use `invariant` from es-toolkit instead of `!` or silent guards

`invariant` applies everywhere, not just tests. It narrows the TypeScript type AND throws at runtime if the assumption is wrong. The `!` non-null assertion silently lies to TypeScript; `if (!x) return` silently skips logic.

```ts
// bad — silently lies, crashes elsewhere
const score = computeScore(isin!);

// bad — silently skips, hides bugs
if (!isin) return;

// good — throws immediately with a clear message, no ! needed
invariant(isin, "Expected isin to be defined");
const score = computeScore(isin);
```

For discriminated unions, `invariant` flattens the control flow instead of nesting:

```ts
// bad — code is nested, TS still needs narrowing outside the block
if (!result.success) {
  expect(result.error.issues[0].message).toMatch(/unknown ISIN/);
}

// good — flat, TS is narrowed for everything that follows
invariant(result.error, "Expected validation to fail");
expect(result.error.issues[0].message).toMatch(/unknown ISIN/);
```

## Testing practices

### Fail loudly, never skip silently

In tests, combine `expect(x).toBeDefined()` (assertion) with `invariant(x, "msg")` (type narrowing). Never use `if (!x) return` — that makes a test silently pass when the data it depends on is missing.

```ts
// bad — silently passes if find() returns undefined
const isin = data.isins.find(...)
if (!isin) return
expect(computeScore(isin)).toBeUndefined()

// good — fails loudly, TS narrowed downstream
const isin = data.isins.find(...)
expect(isin).toBeDefined()
invariant(isin, "Expected to find an ISIN with undefined performance3y")
expect(computeScore(isin)).toBeUndefined()
```

### Use Vitest's native type assertion

Prefer `expect(x).toBeTypeOf("number")` over `expect(typeof x).toBe("number")` — clearer failure message.

### Vitest globals

`describe`, `it`, and `expect` are available globally (configured via `globals: true` in `vite.config.ts`). Do not import them explicitly.

### File naming

All test files use `.test.ts` / `.test.tsx` — both unit (Vitest in `src/`) and E2E (Playwright in `e2e/`). Never use `.spec.ts`.

### Encoding

Use `"utf8"` (not `"utf-8"`) as the canonical Node.js encoding string.

### Test element selection

**All unit-test element queries must use `screen.getByTestId` / `screen.queryByTestId` / `screen.getAllByTestId`.** Never use `getByRole`, `getByText`, `getByLabel`, `getByDisplayValue`, `querySelector`, `querySelectorAll`, or any other selector in unit tests.

**All interactive or identifiable elements in components must have a `data-testid` attribute.** This is the contract between the component and its tests.

**All `data-testid` values must be kebab-case.** Use descriptive lowercase-hyphenated IDs (e.g., `save-button`, `name-input`, `score-display`). For per-item elements include the item key (e.g., `` `price-input-${isin}` ``). CamelCase or PascalCase IDs are forbidden.

When a `data-testid` is derived from a dynamic string (label, name, etc.), use `kebabCase` from `es-toolkit` instead of hand-rolling a converter:

```ts
import { kebabCase } from "es-toolkit";

// bad — fragile, misses edge cases
const toKebab = (s: string) => s.toLowerCase().replaceAll(/\s+/g, "-");

// good
data-testid={`metric-${kebabCase(label)}-value`}
```

```tsx
// bad
<button data-testid="saveButton">Save</button>
<input data-testid="nameInput" />

// good
<button data-testid="save-button">Save</button>
<input data-testid="name-input" />
```

### Avoid redundant `toBeInTheDocument()` assertions

Never use `toBeInTheDocument()` alone after `getByTestId()`, `getByRole()`, or similar queries — these queries throw if the element doesn't exist, making the assertion redundant.

Instead:

- Use `toHaveTextContent()` to verify both presence AND content
- Use `toHaveClass()` to verify both presence AND styling
- Use `toHaveAttribute()` to verify both presence AND attribute values
- Use `.not.toBeInTheDocument()` with `queryByTestId()` / `queryByRole()` to verify absence (this is NOT redundant)

```ts
// bad — getByTestId throws if missing, toBeInTheDocument is redundant
expect(screen.getByTestId("save-button")).toBeInTheDocument();

// bad — checking same element twice, first is redundant
expect(screen.getByTestId("value-cell")).toBeInTheDocument();
expect(screen.getByTestId("value-cell")).toHaveTextContent("€100");

// good — presence verified by toHaveTextContent + content verified
expect(screen.getByTestId("value-cell")).toHaveTextContent("€100");

// good — verifies absence with queryByTestId (NOT redundant)
expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
```

### Use `cn` for dynamic classNames, never ternaries

Import `cn` from `../../utils/browser-styles.ts` (adjust relative path as needed). Pass conditional classes as bare strings with a boolean guard — never build class strings with ternary operators or template literals.

```tsx
import { cn } from "../../utils/browser-styles.ts";

// bad — ternary clutter
<div className={`base-class ${isActive ? "active" : ""}`} />

// good — object syntax, cn drops falsy values automatically
<div className={cn("base-class", { "active": isActive })} />
```
