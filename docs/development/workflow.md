**Purpose:** Day-to-day development flow for this repository.  
**Read this when:** Planning how to implement a change locally.  
**Do not use for:** Release or versioning policy (use [../governance/release-policy.md](../governance/release-policy.md)).  
**Related:** [testing.md](testing.md), [branching-and-prs.md](branching-and-prs.md), [../../CLAUDE.md](../../CLAUDE.md)  
**Update when:** Branch strategy, required checks, or primary tooling changes.

---

# Development workflow

## Git hooks (Lefthook)

Hooks are declared in `lefthook.yml` and installed by `bunx lefthook install` (run once after cloning).

**Pre-commit (parallel):**

- `biome check --write` on staged TS/JSON/MD
- `bun run typecheck`
- `bunx secretlint` on staged files (project-scope; replaced gitleaks per ADR-0007)
- `bunx ls-lint` filesystem naming check (project-scope; full repo, Go binary)
- `bunx knip --no-exit-code` (warning only)

**Commit-msg:**

- `bunx --bun commitlint --edit "$1"` — enforces Conventional Commits with the scope-enum from `commitlint.config.ts`

**Pre-push:**

- `bunx knip` — strict; fails on unused exports or dependencies

To temporarily skip a hook (use sparingly): `git commit --no-verify`. CI will still catch issues if it has been activated.

## Standard Flow

**Status:** Currently not applicable — workflow is standard Bun monorepo + conventional commits; details live in CLAUDE/AGENTS until expanded.

**Trigger:** This file should be filled when:
- You add required PR templates, CODEOWNERS, or merge rules worth documenting
- Feature development spans multiple packages with a documented sequence

## Scripts

| Script | Purpose |
|---|---|
| `bun run sync:upstream-patterns` | Manually re-sync patterns.dev content into `packages/templates/javascript-patterns/`. Review diff before committing. |
| `bun run --cwd packages/cli gen:manifest` | Regenerate `src/generated/template-manifest.ts`. Auto-runs on prebuild. |
