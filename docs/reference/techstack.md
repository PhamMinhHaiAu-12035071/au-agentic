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
| Lint + Format | Biome | 2.x | Unified linter and formatter (supersedes ESLint/Prettier) |
| Task Cache | Turborepo | 2.x | Per-task graph cache; shared across worktrees |
| Testing | Bun Test | 1.3.10 | Unit + integration tests with coverage |
| Git Hooks | Lefthook | latest | Parallel pre-commit orchestration |
| Secret Scan | secretlint | 11.x | Pre-commit secret detection (project-scope; replaced gitleaks per ADR-0007) |
| Dead Code | Knip | 5.x | Unused exports / dependencies detection |
| Markdown | markdownlint-cli2 | 0.13+ | Docs style + structure enforcement |
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

## Test coverage

- **Tool:** Bun built-in test runner with `--coverage` flag
- **Config:** `bunfig.toml` `[test]` block
- **Reporters:** text (console) and LCOV (`coverage/lcov.info`)
- **Threshold:** 40% per-file for lines/statements, 25% for functions (current baseline)
- **CI artifact:** `coverage/lcov.info` (uploaded by `verify.yml` once CI is activated)

## EditorConfig

- **Tool:** EditorConfig (https://editorconfig.org)
- **Config:** `.editorconfig` at repo root
- **Editors supported:** VSCode (via extension), JetBrains, Vim/Neovim, Sublime Text
