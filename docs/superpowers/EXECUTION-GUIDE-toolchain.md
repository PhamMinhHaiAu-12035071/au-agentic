# Toolchain Production-Readiness — Execution Handoff Guide

> **Audience:** Any AI coding agent (Claude Code, Cursor, Copilot, Codex, Gemini CLI) tasked with executing the toolchain spec end-to-end. Single-source instructions; designed to prevent ordering mistakes, race conditions, and merge conflicts.

> **Prerequisite knowledge:** none. Read this guide top-to-bottom before touching any file.

---

## 1. What you are building

Implement the design in `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md`. The work is divided into six independently-mergeable phases (`docs/superpowers/plans/2026-04-16-phase-1-foundations.md` through `phase-6-docs-finalize.md`).

End state: au-agentic ships with Biome v2, Turborepo, Lefthook, gitleaks, Knip, markdownlint-cli2, project-scope shared cache, per-file 70% coverage, 5 disabled-by-default GitHub workflows, performance benchmark gate.

---

## 2. Hard rules — read first

### 2.1 Sequencing

**Run phases 1 → 2 → 3 → 4 → 5 → 6 strictly in order.** Each phase depends on the previous one. Do NOT parallelize phases. Do NOT skip a phase even if it "looks easy".

| Phase | Depends on | Rationale |
|---|---|---|
| 1 | nothing | Foundations: editorconfig, tsconfig, imports field, bunfig coverage |
| 2 | Phase 1 merged | Biome swap needs Phase 1 base tsconfig and aliases stable |
| 3 | Phase 2 merged | Lefthook glob calls `biome check`; needs Biome installed |
| 4 | Phase 3 merged | Cache-env.sh wraps scripts; assumes Lefthook hooks are wired |
| 5 | Phase 4 merged | verify.yml in CI uses `bun run verify` and `bun run perf` from Phase 4 |
| 6 | Phase 5 merged | Final docs sweep + performance-policy.md needs all phases done |

### 2.2 Working-tree hygiene (avoids merge conflicts)

Before starting any phase:

```bash
git status            # must be clean (no uncommitted changes, no untracked code)
git pull --ff-only    # main branch up to date
```

If status shows other in-progress work, finish or stash it first. Never start a phase on top of a dirty tree.

### 2.3 Branch strategy (one phase = one PR)

For each phase, create a dedicated branch:

```bash
git checkout main
git pull --ff-only
git checkout -b feat/toolchain-phase-N
```

Where `N` is the phase number. Implement the entire phase on this branch. At end of phase, merge to main, tag, then cut the next branch.

### 2.4 Phase tags (rollback safety)

Each phase ends with:

```bash
git tag -a phase-N-<name> -m "Phase N of toolchain production-readiness complete"
```

If a later phase reveals that Phase N broke something, you can `git checkout phase-N-<name>` to inspect or revert.

---

## 3. One-time prerequisites (before Phase 1)

### 3.1 System binaries

These are NOT installed by the plans; install them once on your machine before starting:

| Tool | macOS | Debian/Ubuntu | Windows | Verify |
|---|---|---|---|---|
| **Bun 1.3.10+** | `curl -fsSL https://bun.sh/install \| bash` | same | https://bun.sh/install for PowerShell | `bun --version` ≥ 1.3.10 |
| **gitleaks v8** | `brew install gitleaks` | download release tar.gz to `/usr/local/bin` | `scoop install gitleaks` | `gitleaks version` starts `8.` |
| **git 2.40+** | `brew install git` | apt | from git-scm.com | `git --version` |

### 3.2 Repository state

```bash
cd /Users/phamau/Desktop/projects/me/au-agentic   # or your local clone path
git status               # confirm clean tree
git log --oneline -5     # confirm latest commit is the spec/plans commit
ls docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md  # must exist
ls docs/superpowers/plans/2026-04-16-phase-{1..6}-*.md  # must list 6 files
```

If any of these checks fails, STOP and ask the human to resolve before proceeding.

### 3.3 Platform note

`scripts/cache-env.sh` (created in Phase 4) is bash-based. macOS and Linux work out of the box. Windows users must export `BUN_INSTALL_CACHE_DIR` and `TURBO_CACHE_DIR` manually — see `docs/getting-started/local-setup.md` after Phase 3 documents it.

---

## 4. How to execute a single phase

### 4.1 Pick the right skill (depends on your AI tool)

| AI tool | Recommended skill | Fallback |
|---|---|---|
| Claude Code with superpowers plugin | `/superpowers:executing-plans` (inline) or `/superpowers:subagent-driven-development` (parallel-friendly) | Read plan file manually, follow steps |
| Cursor | Read plan file via `@docs/superpowers/plans/2026-04-16-phase-N-*.md`, ask agent to execute checkboxes one at a time | — |
| Copilot CLI | `skill executing-plans` | Read plan file manually |
| Gemini CLI | `activate_skill superpowers:executing-plans` | Read plan file manually |
| Codex / other | Read plan file manually, follow checkboxes top-to-bottom | — |

If your tool has no formal skill system: open the plan file, treat each checkbox as a TODO, do them in listed order, commit after each TASK boundary (not each checkbox — multiple checkboxes per task share one commit per the plan's commit instructions).

### 4.2 Per-phase invocation template

```
I need you to execute the implementation plan at:
docs/superpowers/plans/2026-04-16-phase-N-<name>.md

Rules:
1. Execute tasks IN ORDER, top to bottom. Do not skip.
2. Each task contains numbered Steps. Execute each step. Do not batch implementation
   ahead of tests; the plan is TDD-structured (Red → Green → Refactor).
3. After each task, run the verification command shown in the task.
4. Commit at the end of each task using the commit message in the plan.
5. If a step fails (test does not fail in Red phase, or test does not pass in Green
   phase), STOP and report the actual output. Do not improvise around failure.
6. After all tasks, run the Phase Definition of Done checklist.
7. Tag the phase with: git tag -a phase-N-<name> -m "..."

Do not proceed to the next phase. After this phase merges, the human will start
the next branch.
```

### 4.3 What to verify after each phase

Regardless of phase, after the last task and tag:

```bash
git status                                              # working tree clean
git log --oneline phase-N-<name>~..HEAD                 # all expected commits present
bun run verify 2>&1 | tail -20                          # exit code 0
ls docs/superpowers/plans/2026-04-16-phase-N-*.md       # plan still exists, not edited
```

After Phase 4 onward, ALSO:

```bash
bun run perf 2>&1 | tail -30                            # zero FAIL rows
```

---

## 5. Per-phase quick reference

### Phase 1 — Foundations (~30 min, 13 tasks)

**Branch:** `feat/toolchain-phase-1`
**Plan:** `docs/superpowers/plans/2026-04-16-phase-1-foundations.md`
**Adds:** `.editorconfig`, expanded `tsconfig.json`, per-package tsconfigs, `imports` field aliases (`#utils/*`, `#steps/*`), `bunfig.toml` coverage, ADR-0005, doc updates
**Risk:** Lowest. Zero tool swaps. Existing ESLint/Husky untouched.
**Watch out for:** New `noUncheckedIndexedAccess` may flag existing array access in `packages/cli/src/`. Fix with explicit length check or `as` assertion.
**End state check:** `bun run verify` exits 0; `coverage/lcov.info` produced; `import { writeFile } from '#utils/files'` resolves at runtime in test.
**Tag:** `phase-1-foundations`

### Phase 2 — Biome swap (~45 min, 11 tasks)

**Branch:** `feat/toolchain-phase-2`
**Depends on:** `phase-1-foundations` tag
**Plan:** `docs/superpowers/plans/2026-04-16-phase-2-biome-swap.md`
**Adds:** `biome.json`, `bun add -D @biomejs/biome`, scripts swap, ADR-0002
**Removes:** `eslint.config.ts`, `eslint`/`@eslint/js`/`@typescript-eslint/*`/`globals` devDeps
**Watch out for:** Step "biome check --write across repo" will modify many files (formatting). Review the diff before committing — should be whitespace and import-ordering only.
**End state check:** `bun run lint` (now Biome) exits 0; `grep -c '"eslint"' bun.lock` returns 0.
**Tag:** `phase-2-biome-swap`

### Phase 3 — Hooks & secrets (~45 min, 11 tasks)

**Branch:** `feat/toolchain-phase-3`
**Depends on:** `phase-2-biome-swap` tag, **gitleaks system install verified** (`gitleaks version` → 8.x)
**Plan:** `docs/superpowers/plans/2026-04-16-phase-3-hooks-secrets.md`
**Adds:** `lefthook.yml`, `.gitleaks.toml`, `bun add -D lefthook knip yaml`, tightened `commitlint.config.ts`, ADR-0004
**Removes:** `.husky/` directory, `husky`/`lint-staged` devDeps, `prepare` script
**Watch out for:**
- After installing Lefthook, must run `bunx lefthook install` (one-time wire to `.git/hooks/`).
- Lefthook commands include `knip --no-exit-code` — Knip is installed here (config arrives Phase 4); `--no-exit-code` keeps it from blocking.
- Test commits during Phase 3 will trigger the new hooks — let them run, do not `--no-verify`.
**End state check:** Sample commit triggers all four pre-commit commands in parallel under 2s; `.husky/` gone; `bun pm ls | grep husky` empty.
**Tag:** `phase-3-hooks-secrets`

### Phase 4 — Cache & quality (~60 min, 13 tasks)

**Branch:** `feat/toolchain-phase-4`
**Depends on:** `phase-3-hooks-secrets` tag
**Plan:** `docs/superpowers/plans/2026-04-16-phase-4-cache-quality.md`
**Adds:** `turbo.json`, `knip.json`, `.markdownlint-cli2.jsonc`, `scripts/cache-env.sh`, `scripts/wt-bench.sh`, `scripts/benchmark.ts`, `bun add -D turbo markdownlint-cli2`, ADR-0003
**Critical task:** Task 4 — `cache-env.sh` MUST resolve correctly from a probe worktree. The plan includes a Step 4 that creates `.worktrees/.cache-probe`, runs `./scripts/cache-env.sh env` from inside, and asserts the env vars point to the MAIN worktree's `.cache/`. Do not skip this verification.
**Watch out for:**
- `chmod +x` both scripts (`cache-env.sh`, `wt-bench.sh`).
- Do NOT add `cacheDir` to `turbo.json` — Turbo v2 auto-share with main worktree depends on it being unset.
- First `bun run perf` will create `.worktrees/.bench/` (a temporary worktree). It is auto-cleaned at end. If interrupted mid-run, manually clean with `git worktree remove --force .worktrees/.bench`.
**End state check:** `bun run verify` exits 0 via Turbo (second run shows `cache hit`). `bun run perf` zero FAIL rows. W1 row < 500ms, W2 < 2s, W3 < 3s.
**Tag:** `phase-4-cache-quality`

### Phase 5 — CI workflows disabled (~30 min, 11 tasks)

**Branch:** `feat/toolchain-phase-5`
**Depends on:** `phase-4-cache-quality` tag
**Plan:** `docs/superpowers/plans/2026-04-16-phase-5-ci-disabled.md`
**Adds:** `.github/workflows/verify.yml`, ADR-0006
**Modifies:** all 4 existing workflows (`ci.yml`, `docs-check.yml`, `release.yml`, `security.yml`) → `on: workflow_dispatch` only
**Watch out for:** TDD test in Task 1 reads existing workflows and asserts they all have only `workflow_dispatch`. Test will FAIL until Tasks 2–6 downgrade them all. This is intentional; do not "fix" the test before downgrading the workflows.
**End state check:** `bun test packages/cli/src/__tests__/workflows-disabled.test.ts` shows 5 PASS rows.
**Tag:** `phase-5-ci-disabled`

### Phase 6 — Docs sweep & finalize (~60 min, 13 tasks)

**Branch:** `feat/toolchain-phase-6`
**Depends on:** `phase-5-ci-disabled` tag
**Plan:** `docs/superpowers/plans/2026-04-16-phase-6-docs-finalize.md`
**Adds:** `docs/ai/performance-policy.md` (the "time is GOLD" canonical ruleset), updates `AGENTS.md` Non-Negotiables, sweeps every doc for legacy tool mentions
**Watch out for:**
- Task 1 grep produces a large list — triage carefully (replace vs delete vs keep).
- Task 12 writes `performance-policy.md` — long file; do NOT abbreviate; copy verbatim from plan.
- Task 13 final acceptance gate runs every spec-level check; if any check fails, do not tag.
**End state check:** `grep -rni 'eslint\|prettier\|husky\|lint-staged' docs/ README.md CONTRIBUTING.md AGENTS.md CLAUDE.md --exclude-dir=superpowers --exclude=legacy-context.md` returns nothing.
**Tag:** `toolchain-v1` (final)

---

## 6. What to do when a phase fails mid-execution

### 6.1 A test does not fail in Red phase (TDD broke)

The test you wrote is asserting something that is already true (the implementation already exists or the assertion is tautological). Re-read the test:

- Did you assert against the CURRENT state instead of the TARGET state?
- Is the file/function the test imports already defined elsewhere?

Fix the test, then re-run. Do NOT proceed to Green until the test fails for the right reason.

### 6.2 A test does not pass in Green phase

The implementation is wrong, or the test is asserting more than the implementation provides.

- Read the test and implementation side by side.
- Make the smallest change to the IMPLEMENTATION (not the test) until the test passes.
- If the test specification itself is wrong, STOP and report. Plans assume tests are correct as written.

### 6.3 `bun run verify` fails

- Check which sub-step failed (typecheck / lint / test).
- For typecheck: read the error, fix the source, re-run.
- For lint: try `bun run check` (auto-fix), re-run.
- For test: see 6.2 above.
- If the failure is in unrelated code (not your task), STOP. Phase plans assume verify passes at the start of each task; if it does not, the previous task or phase landed broken — investigate before continuing.

### 6.4 `bun run perf` shows FAIL row

The toolchain dropped below a performance ceiling. Investigate:

- Did you accidentally add `cacheDir` to `turbo.json`? (Removes auto-share.)
- Is `.cache/turbo/` populated and the right size? (`du -sh .cache/turbo`)
- Is `cache-env.sh` resolving correctly? (`./scripts/cache-env.sh env | grep CACHE`)
- Is a glob in `turbo.json` `inputs` accidentally including generated files (timestamps)?

Do not commit a regression. Investigate root cause; if you cannot resolve, STOP and report.

### 6.5 Rollback

If a phase landed and broke verify on `main`:

```bash
git revert <phase-merge-commit>   # creates a new commit reverting the phase
git push                           # restores main
```

Then re-cut the phase branch from the reverted main and try again with the failure addressed.

---

## 7. What "done" looks like (after Phase 6)

Run the spec acceptance gate from `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 12:

```bash
# All 12 expected new files exist
for f in biome.json turbo.json bunfig.toml lefthook.yml .gitleaks.toml \
         knip.json .markdownlint-cli2.jsonc .editorconfig \
         scripts/cache-env.sh scripts/wt-bench.sh scripts/benchmark.ts \
         .github/workflows/verify.yml; do
  [ -e "$f" ] && echo "OK $f" || echo "MISSING $f"
done

# Legacy devDeps gone
grep -E '"(eslint|@eslint/js|@typescript-eslint/.*|globals|husky|lint-staged)"' bun.lock | wc -l   # expect 0

# Verify and perf both green
bun run verify
bun run perf

# All workflows manual-only
bun test packages/cli/src/__tests__/workflows-disabled.test.ts

# Coverage artifact
find packages -name lcov.info

# All 5 ADRs
ls docs/adr/000{2,3,4,5,6}-*.md

# Worktree probe (cache shared)
git worktree add --detach .worktrees/.final-probe HEAD
( cd .worktrees/.final-probe && bun run install && bun run verify )
git worktree remove --force .worktrees/.final-probe
```

Every command must succeed. Then:

```bash
git tag -a toolchain-v1 -m "Toolchain production-readiness spec implemented"
git push --tags
```

---

## 8. Common pitfalls — read before starting

| Pitfall | Prevention |
|---|---|
| Skipping verify between phases → finding out broken state 3 phases later | Run `bun run verify` at start AND end of every phase |
| Editing the plan file while executing | Plans are immutable during execution. If a plan is wrong, STOP and ask human to update plan, then restart from the broken task |
| Merging phase branch without verifying | Every phase has a Definition of Done section. Tick every box before merging |
| Running plans on dirty working tree → mixing with other in-progress work | `git status` must be clean before `git checkout -b feat/toolchain-phase-N` |
| Adding `cacheDir` to `turbo.json` | Turbo auto-share with main worktree REQUIRES `cacheDir` to be unset. Phase 4 plan reminds you; do not "improve" it |
| Forgetting `bunx lefthook install` after Phase 3 | Hooks won't fire. Plans include the install step; do not skip |
| Hand-formatting code that Biome would reformat | Run `bun run check` to auto-fix; do not argue with Biome |
| Bypassing pre-commit with `--no-verify` | The hooks are the safety net (CI is disabled). Never bypass; if a hook is wrong, fix the hook |
| Running raw `bun install` instead of `bun run install` after Phase 4 | Bypasses cache-env.sh; cache won't be project-scope. Always `bun run install` |

---

## 9. Estimated total time

- Phase 1: 30 min
- Phase 2: 45 min
- Phase 3: 45 min (+10 min for gitleaks install if not done)
- Phase 4: 60 min
- Phase 5: 30 min
- Phase 6: 60 min
- **Total: ~4.5 hours of focused execution**

Realistic with one AI assistant doing the work, one human reviewing each phase before merge.

---

## 10. Handoff verification — read this last

Before declaring "I have read and understood this guide," confirm to your operator that you can answer:

1. What order do the 6 phases run in, and why does order matter?
2. What command verifies each phase end state? (Hint: 2 commands after Phase 4)
3. What system binary must be installed before Phase 3 starts?
4. What MUST NOT be added to `turbo.json` and why?
5. What tag is created at the very end?

If you cannot answer any of these, re-read the relevant section before starting.
