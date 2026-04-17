**Purpose:** Time budgets, cache discipline, and performance gates for agent workflows  
**Read this when:** Tooling tasks, cache operations, worktree management, or performance investigations  
**Do not use for:** Runtime application performance (CLI wizard is sub-second; not in scope)  
**Related:** execution-policy.md, routing.md, [design-principles.md](../explanations/design-principles.md)  
**Update when:** Speed budgets change, new cache tools added, or benchmark thresholds shift

---

# Performance Policy

## Time is GOLD

**Rule:** Every second spent in toolchain friction is a second stolen from feature work. Treat tooling speed as a first-class design constraint.

**Why this matters:**
- 2-second linter → run on every save → 200 saves/day → 6.6 min/day
- 8-second test suite → run 30 times/day → 4 min/day
- Cold rebuild in worktree → 15 seconds → blocks mental flow

Sum: 10+ minutes per developer per day. Across a team, this is person-hours per week. Across a year, this is weeks lost.

## Speed tiers (T1-T4)

Defined in `docs/explanations/design-principles.md` "Speed budgets" section:

| Tier | Max time | Examples | Discipline |
|------|----------|----------|-----------|
| T1 | ≤ 200 ms | Single-file lint, organize imports | Sub-perceptual; never block save |
| T2 | ≤ 1 s | Full lint (Biome check), single test file | Interactive feedback; no hesitation |
| T3 | ≤ 3 s | Full typecheck (tsc --noEmit), full test suite, Knip | Pre-commit tolerable; user waits but doesn't context-switch |
| T4 | ≤ 10 s | Full `verify` (lint + typecheck + test), cold cache | Pre-push acceptable; user expects delay |

**Enforcement:** `scripts/benchmark.ts` measures each tier and prints `PASS` / `FAIL`. Any `FAIL` blocks merge.

## Cache discipline

**Problem:** Running `bunx turbo run test` from a detached worktree or raw `bun install` after the first clone bypasses the shared cache and forces cold rebuilds. (The re-install script is named `setup` — not `install` — because npm/bun lifecycle semantics would recurse if an `install` script ran `bun install`.)

**Solution:** Every Bun and Turbo invocation must route through `scripts/cache-env.sh`, which sets:

```bash
export BUN_INSTALL_CACHE_DIR="$MAIN_WORKTREE/.cache/bun-install"
export TURBO_CACHE_DIR="$MAIN_WORKTREE/.cache/turbo"
```

Where `MAIN_WORKTREE` is resolved from `git rev-parse --git-common-dir`.

**Agent rule:** Always invoke `bun run <script>` (e.g. `bun run setup`, `bun run verify`), which uses `cache-env.sh` internally. Raw `bun install` is allowed only on first clone; for every subsequent re-install use `bun run setup`. Never run raw `bunx turbo` or `bun test` — they bypass cache and trigger cold rebuilds.

**Exception:** One-off debug commands (`bun test --watch` in local shell). For anything in CI, commit scripts, or agent commands, route through `bun run <script>` or wrap with `./scripts/cache-env.sh`.

## Worktree-aware cache sharing

Detailed in spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.4 "Worktree-shared cache."

**Summary:**
- Main worktree at `/path/to/repo`
- Linked worktrees at `/path/to/repo/.worktrees/<branch>`
- Both share `.cache/` in main worktree
- `scripts/cache-env.sh` resolves main worktree from `.git/commondir` (for linked worktrees) or `.git` (for main)

**Impact:** Task in worktree A → task in worktree B sees cache hit if inputs match. No duplicated builds.

## Performance gate enforcement

**Before claiming a tooling/config task complete:**

```bash
bun run perf
```

Writes results to `docs/development/performance-benchmarks.md`. If any row shows `FAIL`, fix the root cause (config bloat, unnecessary glob, slow plugin, etc.) and re-run.

**Common failure causes:**
- Turborepo task missing `inputs` → hashes everything → slow
- Biome config with overly broad `includes` → lints too many files
- Knip without `ignoreWorkspaces` → scans templates folder (not TS)
- Raw `bunx` commands → bypass cache → cold rebuild

**Fix pattern:** Narrow the scope, add cache config, or route through wrapper.

## Manual CI as a performance strategy

All GitHub Actions workflows are disabled by default (ADR-0006). This is not only cost-control; it's also a latency optimization:

- Pre-commit hooks give sub-5s feedback
- Local `bun run verify` runs in T4 tier (≤ 10 s)
- CI runs in 45-90 s (network + cold container overhead)

By keeping verification local and fast, we avoid the 2-3 min round-trip of push → wait for CI → fix → push again.

**When CI is useful:** Pre-release full-matrix validation, scheduled security scans, or PR reviews from external contributors (who may skip hooks).

## Anti-patterns

### Don't: Assume "fast enough"

**Bad:**
```bash
# "It's only 2 seconds, doesn't matter"
bun test  # 2.1 s
```

**Why:** 2.1 s is T3, acceptable for pre-commit. But if you run this 30 times/day during TDD, it's 63 s/day = 5.5 hr/year.

**Good:** Profile, cache, and measure. If 2.1 s becomes 0.8 s (T2), you just saved 39 s/day = 3.4 hr/year.

### Don't: Bypass cache "just this once"

**Bad:**
```bash
cd .worktrees/feat-branch
bunx turbo run test  # WRONG: bypasses cache-env
```

**Why:** This forces a cold rebuild even if main worktree has cached outputs. Next agent or developer in this worktree pays the cost again.

**Good:**
```bash
cd .worktrees/feat-branch
bun run test  # Correct: routes through cache-env.sh
```

### Don't: Ignore benchmark failures

**Bad:** "Benchmark failed but tests pass, so I'll merge."

**Why:** Performance regressions compound. Today's 12 s verify becomes next month's 18 s verify. Soon you hit T5 (>30 s), and developers start skipping verification.

**Good:** Treat `FAIL` in `bun run perf` as a test failure. Fix before merge.

## Measuring your impact

Before and after any tooling change:

```bash
bun run perf
git add docs/development/performance-benchmarks.md
git commit -m "perf: <what you optimized>"
```

The diff shows your impact. A 3 s → 1.5 s improvement in T3 typecheck saves 45 s/day for every developer.

## Related

- **Design principles:** `docs/explanations/design-principles.md` "Speed budgets"
- **Toolchain spec:** `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md`
- **Cache wrapper:** `scripts/cache-env.sh`
- **Benchmark script:** `scripts/benchmark.ts`
