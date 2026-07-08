```markdown
# invest Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches the core development patterns, conventions, and workflows used in the `invest` TypeScript codebase, which is built on the Vite framework. You'll learn how to contribute features, manage dependencies, handle internationalization, update CI/CD pipelines, and release new versions, all while following the project's established coding and testing standards.

---

## Coding Conventions

### File Naming

- **Kebab-case** is used for all file names.
  - Example: `portfolio-summary.tsx`, `user-profile.test.tsx`

### Import Style

- **Relative imports** are preferred.
  - Example:
    ```typescript
    import { calculateROI } from '../utils/roi-calculator';
    ```

### Export Style

- **Named exports** are used throughout the codebase.
  - Example:
    ```typescript
    // In src/utils/math.ts
    export function add(a: number, b: number): number {
      return a + b;
    }

    // Usage
    import { add } from '../utils/math';
    ```

### Commit Patterns

- Commit messages are freeform but often use `fix` and `chore` prefixes.
- Example: `fix: correct ROI calculation`, `chore: update dependencies`

---

## Workflows

### Feature Development with Tests and Docs

**Trigger:** When adding a new feature or major enhancement  
**Command:** `/feature`

1. Implement or update feature code in `src/components`, `src/pages`, or `src/utils`.
2. Add or update corresponding test files (e.g., `.test.tsx` or `.test.ts`).
3. Update documentation files such as `CLAUDE.md`, `TODOS.md`, `EXPORT_FORMAT.md`, and `REVIEW.md`.
4. Update `CHANGELOG.md` and bump `VERSION`/`package.json` if the change is release-worthy.

**Example:**
```typescript
// src/components/investment-summary.tsx
export function InvestmentSummary(props: Props) { /* ... */ }

// src/components/investment-summary.test.tsx
import { test, expect } from '@playwright/test';
import { InvestmentSummary } from './investment-summary';
// ...tests...
```

---

### Dependency Bump and Schema Augmentation

**Trigger:** When updating dependencies and/or refactoring/extending data schemas  
**Command:** `/bump-deps-schema`

1. Update `package.json` and `pnpm-lock.yaml` with new dependency versions.
2. Modify or refactor files in `src/schemas/` (e.g., add fields, change types).
3. Update related code in `src/components/`, `src/pages/`, `src/utils/` to use the new or changed schema.
4. Update or add tests for schema or affected features.
5. Optionally update `CHANGELOG.md` and bump `VERSION`.

**Example:**
```typescript
// src/schemas/portfolio.ts
export interface Portfolio {
  id: string;
  name: string;
  // new field
  riskLevel?: number;
}
```

---

### i18n or Translation Workflow

**Trigger:** When adding a new language, improving translation logic, or adding translation tooling  
**Command:** `/i18n`

1. Add or update locale files in `src/locales/` (e.g., `en.ts`, `fr.ts`).
2. Update or add translation utilities (`src/utils/translations.ts[x]`).
3. Update or add tests for translation logic.
4. Update UI components/pages to use new or improved i18n logic.
5. Update documentation for translation usage.
6. Optionally update `CHANGELOG.md` and bump `VERSION`.

**Example:**
```typescript
// src/locales/en.ts
export default {
  welcome: "Welcome",
  portfolio: "Portfolio",
};

// src/utils/translations.ts
export function t(key: string, locale = 'en') { /* ... */ }
```

---

### CI/CD Pipeline Update

**Trigger:** When optimizing CI/CD, updating test runners, or fixing CI-related issues  
**Command:** `/ci-update`

1. Modify `.github/workflows/ci.yml` or similar workflow files.
2. Update test runner configs (e.g., `playwright.config.ts`).
3. Optionally update `package.json` or dependencies related to CI.
4. Update `CHANGELOG.md` and/or `VERSION` if user-facing.

---

### Version Bump and Changelog Release

**Trigger:** When releasing a new version  
**Command:** `/release`

1. Update `CHANGELOG.md` with new release notes.
2. Update `VERSION` file.
3. Update `package.json` version field.

---

## Testing Patterns

- **Framework:** [Playwright](https://playwright.dev/)
- **Test file pattern:** `*.test.tsx`
- **Location:** Tests are placed alongside the components, pages, or utils they test.

**Example:**
```typescript
// src/components/portfolio-summary.test.tsx
import { test, expect } from '@playwright/test';
import { PortfolioSummary } from './portfolio-summary';

test('renders portfolio summary', async () => {
  // ...test logic...
});
```

---

## Commands

| Command           | Purpose                                                       |
|-------------------|---------------------------------------------------------------|
| /feature          | Start a new feature with code, tests, and docs                |
| /bump-deps-schema | Update dependencies and/or schemas with related code and tests |
| /i18n             | Add or improve internationalization and translations          |
| /ci-update        | Update CI/CD pipeline or test runner configuration            |
| /release          | Bump version and update changelog for a new release           |
```
