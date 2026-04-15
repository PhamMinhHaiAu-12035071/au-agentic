**Purpose:** Languages, runtimes, and primary libraries.  
**Read this when:** Assessing compatibility or onboarding a developer.  
**Do not use for:** Version pinning policy (use [../development/dependency-policy.md](../development/dependency-policy.md) when filled).  
**Related:** [project-structure.md](project-structure.md), [configuration.md](configuration.md), [../../package.json](../../package.json)  
**Update when:** Major dependency or runtime changes.

---

# Tech Stack

## Core

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | Bun | 1.3.10 | JS runtime (replaces Node.js) |
| Language | TypeScript | 5.7.2 | Type-safe development |
| Module System | ESM | - | Native ES modules |
| Architecture | Bun Workspaces | - | Monorepo package management |

> Validated against Bun 1.3.10. If you upgrade Bun, re-check runtime-sensitive docs and tests.

## Packages

| Package | Purpose | Key Dependencies |
|---------|---------|-----------------|
| `packages/cli` | CLI wizard | @clack/prompts 0.9.1, @clack/core 0.4.1, picocolors 1.1.1 |
| `packages/templates` | Template markdown files | None (static assets) |

## Development Tooling

| Category | Tool | Version | Purpose |
|----------|------|---------|---------|
| Type Checking | TypeScript Compiler | 5.7.2 | `tsc --noEmit` |
| Linting | ESLint | 9.17.0 | @typescript-eslint plugins |
| Testing | Bun Test | 1.3.10 | Unit + integration tests |
| Git Hooks | Husky | 9.1.7 | Enforce quality gates |
| Pre-commit | lint-staged | 15.3.0 | Auto-fix + type check staged files |
| Commit Messages | commitlint | 19.6.1 | Conventional Commits enforcement |

## Build & Distribution

| Stage | Command | Output |
|-------|---------|--------|
| Development | `bun run dev` | Direct TS execution (no build) |
| Build | `bun run build` | ESM bundle → `packages/cli/dist/index.js` |
| Verification | `bun run verify` | typecheck + lint + test |
| Pre-publish | `bun run prepublish` | verify + build before npm publish |

## CLI UI Framework

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| Interactive Prompts | @clack/prompts | 0.9.1 | select, multiselect, text, confirm |
| Prompt Core | @clack/core | 0.4.1 | Low-level prompt primitives |
| Terminal Colors | picocolors | 1.1.1 | Lightweight ANSI colors |
