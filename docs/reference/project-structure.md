**Purpose:** Directory layout and ownership of major paths.  
**Read this when:** Navigating the monorepo or adding a new package.  
**Do not use for:** AI routing tables (use [../ai/repo-map.md](../ai/repo-map.md)).  
**Related:** [techstack.md](techstack.md), [../../CLAUDE.md](../../CLAUDE.md), [../explanations/architecture.md](../explanations/architecture.md)  
**Update when:** Package boundaries or top-level folders change.

---

# Project structure

**Status:** Currently not applicable — [CLAUDE.md](../../CLAUDE.md) and [docs/ai/repo-map.md](../ai/repo-map.md) describe layout today.

**Trigger:** This file should be filled when:
- Human-oriented structure docs should diverge from AI repo map
- You add apps, services, or infra folders

## Toolchain directories (new in 2026-04)

- `.turbo/` — Turborepo local task cache (gitignored). Stores task outputs keyed by input hash.
- `coverage/` — Bun test coverage reports in LCOV format (gitignored). `lcov.info` is the merged artifact; `.lcov.info.*.tmp` worker fragments are auto-cleaned by `scripts/run-bun-test.sh`.
- `scripts/` — Bash wrappers for cache discipline and benchmark automation:
  - `cache-env.sh` — exports `BUN_INSTALL_CACHE_DIR` and `TURBO_CACHE_DIR` pointing at the main worktree so all worktrees share one cache.
  - `run-bun-test.sh` — runs `bun test` from the main worktree (so root `bunfig.toml` applies) with pre- and post-run cleanup of coverage `.tmp` fragments.
  - `wt-bench.sh` — creates/tears down `.worktrees/.bench/` for realistic subagent-iteration benchmarks.
  - `benchmark.ts` — Bun-based perf runner; writes `docs/development/performance-benchmarks.md`.
- `.worktrees/` — Git worktrees for isolated feature branches; see `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` "Worktree-shared cache" section.
- `.vscode/` — Workspace editor config (also honored by Cursor): Biome format-on-save plus recommended extensions list.
