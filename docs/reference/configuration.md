**Purpose:** Configuration files, flags, and environment variables.
**Read this when:** Changing how the CLI or build is configured.
**Do not use for:** Secret management in deployment (use deployment docs when applicable).
**Related:** [../../package.json](../../package.json), [techstack.md](techstack.md), [../getting-started/environment.md](../getting-started/environment.md)
**Update when:** New config files, CLI flags, or env vars are introduced.

---

# Configuration

**Status:** Currently not applicable — configuration is minimal (Bun, `package.json` scripts, build externals in CLAUDE). If env vars or secret-backed config are introduced, document the config surface here and keep secret values out of git.

**Trigger:** This file should be filled when:
- The CLI reads a config file or env-based settings
- You document publishConfig, binary name changes, or workspace settings

## bunfig.toml (root)

Bun runtime and test configuration.

| Field | Value | Purpose |
|---|---|---|
| `[test].coverage` | `true` | Enable coverage collection on every `bun test` |
| `[test].coverageReporter` | `["text", "lcov"]` | Console table plus `coverage/lcov.info` artifact |
| `[test].coverageDir` | `"coverage"` | Output directory; gitignored |
| `[test].coverageThreshold` | `{ lines = 0.40, functions = 0.25, statements = 0.40 }` | Per-file floor; build fails if any file drops below |

## .editorconfig (root)

Cross-editor consistency. Loaded automatically by VSCode (with the EditorConfig extension), JetBrains, Vim/Neovim plugins.

Key rules: UTF-8 charset, LF line endings, 2-space indent for all files; trailing whitespace stripped except in Markdown.

## Path aliases

Intra-package aliases declared in each package's `package.json` `imports` field. The runtime source of truth is always the `imports` field; `tsconfig.json` `paths` mirrors it for editor support only. See `docs/adr/0005-imports-field-alias-pattern.md`.

Currently declared in `packages/cli/package.json`:

- `#utils/*` → `./src/utils/*.ts`
- `#steps/*` → `./src/steps/*.ts`
