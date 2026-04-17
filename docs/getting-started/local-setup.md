**Purpose:** Clone, install, and day-one local development commands.  
**Read this when:** Setting up a working tree for feature work.  
**Do not use for:** CI/CD or hosted environments (see deployment docs when filled).  
**Related:** [quickstart.md](quickstart.md), [../development/workflow.md](../development/workflow.md), [../development/testing.md](../development/testing.md)  
**Update when:** Repo layout, scripts, or dev dependencies change.

---

# Local setup

## System prerequisites

The repo is deliberately **project-scope only** — every dev tool installs into `node_modules` via `bun add`. The only binaries you need on the system:

- **Bun 1.3.10+** (the runtime) — `curl -fsSL https://bun.sh/install | bash`
- **git 2.40+** — already installed on most dev boxes

That is the full list. Secret scanning (secretlint), filesystem naming (ls-lint), linting (Biome), task cache (Turborepo), hooks (Lefthook), dead-code detection (Knip), and markdown linting all install through `bun install`. No `brew install` or equivalent — see [../ai/dependency-scope-policy.md](../ai/dependency-scope-policy.md) for the canonical rule.

After dependencies are installed (step below), run `bunx lefthook install` once to wire Lefthook hooks into `.git/hooks/`.

## Setup flow

**Status:** Currently not applicable — overlaps with [CLAUDE.md](../../CLAUDE.md) commands and root README until consolidated here.

**Trigger:** This file should be filled when:
- You want all human setup steps out of shim files and under `docs/`
- Optional services (Docker, local registry) are added

Typical flow today:

```bash
git clone <repo-url>
cd au-agentic
bun install            # first-time dependency install only
bunx lefthook install  # wire git hooks into .git/hooks/
bun run verify         # lint + typecheck + test through Turbo + cache-env
```

For every subsequent re-install (lockfile changed, pulled new deps, etc.),
use `bun run setup` instead of raw `bun install` — it routes through
`scripts/cache-env.sh` so bun/turbo caches stay shared across worktrees.

## Editor integration

`.vscode/settings.json` and `.vscode/extensions.json` are checked in. On
first open in VSCode or Cursor, the editor will prompt to install the
recommended extensions (Biome, EditorConfig, markdownlint, TOML, YAML).
After install:

- Saving a `.ts` / `.tsx` / `.json` / `.jsonc` file auto-runs Biome's
  formatter and `organizeImports` — matches the pre-commit hook's output
  so hooks never fight local edits.
- Markdown files skip format-on-save to avoid clashing with
  `markdownlint-cli2` rules; run `bun run check` for bulk reformats.

Cursor reads the same `.vscode/` config. No separate setup needed.
