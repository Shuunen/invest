# invest

Portfolio Tracker PWA — offline-first, local-persistence investment portfolio manager.

## Stack

- **React 19 + TypeScript** via Vite
- **TanStack Router** — type-safe routing
- **Zustand** — runtime state
- **Dexie.js** — IndexedDB persistence
- **Recharts** — allocation charts
- **Zod** — schema validation + import safety
- **TailwindCSS + DaisyUI** — styling
- **Vitest** — unit/integration tests
- **Playwright** — E2E tests (including offline/PWA)
- **vite-plugin-pwa** — PWA support

## Dev

```bash
pnpm install
pnpm dev
```

## Test

```bash
pnpm test          # Vitest unit tests
pnpm test:e2e      # Playwright E2E
pnpm check         # Full pipeline: types, format, lint, build, tests, E2E
```

## Build

```bash
pnpm build
pnpm preview
```

## Data

Sample data lives in `data/sample.json`. Import it via the app's import function.
