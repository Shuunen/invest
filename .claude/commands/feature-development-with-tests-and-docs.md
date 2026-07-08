---
name: feature-development-with-tests-and-docs
description: Workflow command scaffold for feature-development-with-tests-and-docs in invest.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-development-with-tests-and-docs

Use this workflow when working on **feature-development-with-tests-and-docs** in `invest`.

## Goal

Implements a new feature or enhancement, including code, tests, and documentation updates.

## Common Files

- `src/components/*.tsx`
- `src/pages/**/*.tsx`
- `src/utils/**/*.ts`
- `src/components/**/*.test.tsx`
- `src/pages/**/*.test.tsx`
- `src/utils/**/*.test.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Implement or update feature code (often in src/components, src/pages, or src/utils).
- Add or update corresponding test files (e.g., .test.tsx or .test.ts).
- Update documentation files (e.g., CLAUDE.md, TODOS.md, EXPORT_FORMAT.md, REVIEW.md).
- Update CHANGELOG.md and bump VERSION/package.json if release-worthy.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.