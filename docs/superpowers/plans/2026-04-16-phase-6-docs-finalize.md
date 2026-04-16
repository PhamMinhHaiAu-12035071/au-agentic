# Phase 6 — Docs Sweep and Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate every remaining mention of legacy tools (ESLint, Prettier, Husky, lint-staged) across `docs/`, `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`. Update `getting-started/` so a fresh clone can complete onboarding with the new toolchain. Add the test-quality checkbox to `.github/PULL_REQUEST_TEMPLATE.md`. Run final acceptance checks: `bun run verify` and `bun run perf` both green.

**Architecture:** Pure documentation work. No source code or tool config changes. The phase ends with the spec-level acceptance gate (Section 12 of the spec) being satisfiable.

**Tech Stack:** Markdown, Bun runtime for verification.

**Spec reference:** `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 8 (Docs Sync Mapping); Phase 6 in Section 9; Section 12 (Acceptance Checklist).

**Depends on:** Phases 1–5 merged.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `README.md` | Modify | Quick Start commands using Biome, Lefthook, Turbo, perf |
| `CONTRIBUTING.md` | Modify | Setup section: install gitleaks, run `bunx lefthook install` |
| `AGENTS.md` | Modify | Add cache-discipline Non-Negotiable + sweep legacy mentions |
| `CLAUDE.md` | Verify | Sweep legacy mentions (likely no edit) |
| `docs/ai/performance-policy.md` | Create | Canonical "time is GOLD" rules, W-tier definitions, worktree creation pattern |
| `docs/ai/core.md` | Modify | Sweep ESLint/Husky mentions |
| `docs/ai/glossary.md` | Modify | Add LCOV, cache hit, T1–T4 tier definitions |
| `docs/ai/legacy-context.md` | Modify | Add a "Toolchain refactor 2026-04" entry |
| `docs/ai/gold-rules.md` | Modify | Sweep |
| `docs/ai/routing.md` | Modify | Add tooling row |
| `docs/ai/execution-policy.md` | Modify | Reference `bun run perf` benchmark gate |
| `docs/ai/docs-policy.md` | Modify | Add tool-config mapping |
| `docs/development/testing.md` | Modify | Coverage commands, watch mode, anti-patterns reference |
| `docs/development/docs-contributing.md` | Modify | markdownlint rules link |
| `docs/reference/glossary.md` | Modify | LCOV, cache hit, tier definitions |
| `docs/reference/project-structure.md` | Modify | New files in tree |
| `docs/explanations/architecture.md` | Modify | Toolchain layer paragraph |
| `docs/getting-started/quickstart.md` | Modify | New install + run sequence |
| `docs/getting-started/onboarding.md` | Modify | Pointer to performance-benchmarks.md |
| `docs/getting-started/local-setup.md` | Verify | Already updated in Phase 3; sanity-check |
| `docs/getting-started/environment.md` | Verify | Already updated in Phase 3; sanity-check |
| `docs/governance/`, `docs/support/`, `docs/examples/` | Sweep | Find/replace any legacy tool mention |
| `.github/PULL_REQUEST_TEMPLATE.md` | Modify | Add test-quality checkbox |

---

### Task 1: Sweep `docs/` for legacy tool mentions

**Files:**
- Read-only sweep first; edits in subsequent tasks

- [ ] **Step 1: Find every remaining mention**

Run:

```bash
grep -rni 'eslint\|prettier\|husky\|lint-staged\|tsc --noEmit' docs/ README.md CONTRIBUTING.md AGENTS.md CLAUDE.md --exclude-dir=superpowers
```

Expected: a list of file:line:context entries. The `superpowers/` directory is excluded because spec/plan files reference legacy tools deliberately for context.

- [ ] **Step 2: Save the output for reference**

Pipe to a temp file you can refer to as you edit:

```bash
grep -rni 'eslint\|prettier\|husky\|lint-staged\|tsc --noEmit' docs/ README.md CONTRIBUTING.md AGENTS.md CLAUDE.md --exclude-dir=superpowers > /tmp/legacy-mentions.txt
wc -l /tmp/legacy-mentions.txt
```

- [ ] **Step 3: Triage each mention into one of three buckets**

For each line in `/tmp/legacy-mentions.txt`:

- **Replace**: rewrite to use the new tool name (most common)
- **Delete**: remove the line/section if it described an out-of-scope detail
- **Keep**: only if the file is `docs/ai/legacy-context.md` (intentional historical record) or part of an ADR/spec describing the migration

Most edits land in subsequent tasks; this triage informs which files need attention.

---

### Task 2: Update `README.md` Quick Start

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README**

Run: `cat README.md`

- [ ] **Step 2: Replace the Quick Start / Getting Started section**

Find any block describing setup or commands. Replace with:

```markdown
## Quick start

```bash
# Clone and install
git clone https://github.com/<owner>/au-agentic.git
cd au-agentic
bun install

# One-time hook setup
bunx lefthook install

# Verify everything works
bun run verify    # lint + typecheck + test (Turbo-cached)
bun run perf      # benchmark suite; refreshes docs/development/performance-benchmarks.md
```

System dependency: install **gitleaks** v8 (`brew install gitleaks` on macOS). See `docs/getting-started/local-setup.md` for non-macOS instructions.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): update Quick Start for Biome+Turbo+Lefthook+gitleaks"
```

---

### Task 3: Update `CONTRIBUTING.md`

**Files:**
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Read current**

Run: `cat CONTRIBUTING.md`

- [ ] **Step 2: Replace the Setup section**

```markdown
## Setup

1. Install [Bun 1.3.10+](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
2. Install gitleaks v8 (system binary):
    - macOS: `brew install gitleaks`
    - Debian/Ubuntu: download from https://github.com/gitleaks/gitleaks/releases
    - Windows: `scoop install gitleaks`
3. Clone and install:
    ```bash
    git clone <repo-url>
    cd au-agentic
    bun install
    bunx lefthook install
    ```
4. Verify everything works:
    ```bash
    bun run verify    # lint + typecheck + test
    bun run perf      # benchmark gate
    ```

## Development workflow

- Make changes (Biome auto-formats on save if VSCode extension is installed)
- Stage and commit (Lefthook runs Biome, typecheck, gitleaks, knip in parallel)
- Push (pre-push runs strict knip)
- CI is currently manual-trigger only; trigger via Actions tab if needed (see `docs/development/branching-and-prs.md`)

## Commit messages

Conventional Commits enforced by `commitlint`. Subject ≤ 72 chars (no upper-case or PascalCase first word); body lines ≤ 100 chars. Scope is free-form — pick the most specific subtree (`cli`, `templates`, `docs`, `ai`, `adr`, `reference`, `dev`, `setup`, `deployment`, `explanations`, `tooling`, `deps`, `tests`, `ci`, `security`, etc.).

## Tests

- Use `bun test` (or run via Turbo: `bun run test`)
- Coverage threshold: 70% per file (lines, functions, statements)
- Quality > quantity: see `docs/ai/testing-policy.md` "Test Quality Anti-Patterns"
```

- [ ] **Step 3: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs(contrib): rewrite setup and workflow for new toolchain"
```

---

### Task 4: Update `AGENTS.md` Non-Negotiables and sanity-check `CLAUDE.md`

**Files:**
- Modify: `AGENTS.md`
- Verify (likely no changes): `CLAUDE.md`

- [ ] **Step 1: Read current Non-Negotiables block in `AGENTS.md`**

Run: `grep -n -A10 '# Non-Negotiables' AGENTS.md`
Expected: a bulleted list of rules.

- [ ] **Step 2: Append the cache rule to Non-Negotiables**

Find the `# Non-Negotiables` section and add this bullet (before any `# ` next-section heading):

```markdown
- Always invoke commands as `bun run <script>` (which routes through `scripts/cache-env.sh`); never run raw `bun install`, `bunx turbo`, or similar — raw invocations bypass project-scope cache and force cold rebuilds across worktrees. Read `docs/ai/performance-policy.md` for the full "time is GOLD" ruleset.
```

- [ ] **Step 3: Confirm no ESLint/Husky/Prettier mentions remain**

Run: `grep -ni 'eslint\|husky\|lint-staged\|prettier' AGENTS.md CLAUDE.md`
Expected: zero matches. If any match, delete or rewrite.

- [ ] **Step 4: Confirm `bun run verify` is still referenced (its name did not change)**

Run: `grep -n 'bun run verify' AGENTS.md CLAUDE.md`
Expected: at least one match in `AGENTS.md`.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs(agents): add cache-discipline non-negotiable; sweep legacy tools"
```

---

### Task 5: Update `docs/ai/` files (sweep + structured edits)

**Files:**
- Modify: `docs/ai/core.md`, `glossary.md`, `legacy-context.md`, `gold-rules.md`, `routing.md`, `execution-policy.md`, `docs-policy.md`

- [ ] **Step 1: Sweep `core.md`, `glossary.md`, `gold-rules.md` for legacy mentions**

For each file, run `grep -ni 'eslint\|husky\|lint-staged' docs/ai/<file>` and replace with the new tool name (Biome, Lefthook). If a sentence describes a workflow that no longer exists, delete the sentence.

- [ ] **Step 2: Update `docs/ai/routing.md` with tooling and performance rows**

Find the routing table in the file and add two rows:

```markdown
| Tooling / config change? | coding-rules.md, docs/reference/configuration.md |
| Performance / cache / worktree task? | performance-policy.md, docs/development/performance-benchmarks.md |
```

- [ ] **Step 3: Update `docs/ai/execution-policy.md`**

Add a paragraph about the perf gate:

```markdown

## Performance gate

Before claiming a toolchain-related task complete, run `bun run perf`. If any benchmark row reports `FAIL`, the work is not done — fix the root cause (config drift, accidentally-broad glob, slow plugin) and re-run.
```

- [ ] **Step 4: Update `docs/ai/docs-policy.md` with a tool-config mapping**

Add a row to the existing mapping table (or create the table if absent):

```markdown
| Tool config change (biome.json, turbo.json, lefthook.yml, etc.) | docs/ai/coding-rules.md, docs/reference/techstack.md, docs/reference/configuration.md, docs/adr/ |
```

- [ ] **Step 5: Update `docs/ai/legacy-context.md`**

Append:

```markdown

## Toolchain refactor (2026-04)

The 2026-04-16 toolchain hardening replaced ESLint v9 + Husky + lint-staged with Biome v2 + Lefthook, added Turborepo for task caching, gitleaks for secret scanning, and Knip for dead-code detection. All GitHub Actions workflows were downgraded to manual-trigger only. See:

- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md`
- ADRs: 0002 (Biome), 0003 (Turborepo), 0004 (Lefthook), 0005 (imports field aliases), 0006 (workflows disabled)

If you are reading this and wondering why the repo no longer uses ESLint or Husky — those are the answers.
```

- [ ] **Step 6: Commit**

```bash
git add docs/ai/core.md docs/ai/glossary.md docs/ai/legacy-context.md docs/ai/gold-rules.md docs/ai/routing.md docs/ai/execution-policy.md docs/ai/docs-policy.md
git commit -m "docs(ai): sweep legacy tool mentions; add routing, perf gate, legacy entry"
```

---

### Task 6: Update `docs/development/testing.md` and `docs-contributing.md`

**Files:**
- Modify: `docs/development/testing.md`
- Modify: `docs/development/docs-contributing.md`

- [ ] **Step 1: Update `testing.md` with new commands**

Replace any "Running tests" section with:

```markdown
## Running tests

```bash
bun run test                    # all tests via Turbo (cached)
bun test packages/cli/src/__tests__/copy.test.ts   # one file
bun test --watch                # watch mode for TDD
bun test --coverage             # explicit coverage (default in bunfig.toml)
```

Coverage report:

- Console: text reporter
- File: `coverage/lcov.info` (gitignored)
- Threshold: 70% per file (lines, functions, statements)

Threshold failures name the offending file. Fix by writing meaningful tests (not by padding with assertions on trivial paths). See `docs/ai/testing-policy.md` "Test Quality Anti-Patterns" for what to avoid.
```

- [ ] **Step 2: Update `docs-contributing.md` with markdownlint reference**

Add:

```markdown

## Markdown linting

Markdown files are linted by `markdownlint-cli2` (`.markdownlint-cli2.jsonc` config). Run locally:

```bash
bunx markdownlint-cli2
```

Common rules enforced: heading hierarchy (MD001), no duplicate headings within a section (MD024 siblings_only), fenced code with language (MD040). Long lines and inline HTML are allowed.

`packages/templates/**` is excluded — those are content payloads, not documentation.
```

- [ ] **Step 3: Commit**

```bash
git add docs/development/testing.md docs/development/docs-contributing.md
git commit -m "docs(dev): update testing commands and add markdownlint section"
```

---

### Task 7: Update `docs/reference/glossary.md` and `project-structure.md`

**Files:**
- Modify: `docs/reference/glossary.md`
- Modify: `docs/reference/project-structure.md`

- [ ] **Step 1: Append to `docs/reference/glossary.md`**

```markdown

## Toolchain terms

- **LCOV** — Line Coverage line-by-line text format produced by Bun's coverage reporter; consumed by editors (Coverage Gutters extension), CI (Codecov, etc.), and code review tools.
- **Cache hit / cache miss** — In Turborepo, a *cache hit* means the task input hash matches a previous run, so outputs are restored from `.turbo/` without re-running the task. A *cache miss* runs the task and stores the result.
- **T1 / T2 / T3 / T4 tier** — Performance tiers defined in `docs/explanations/design-principles.md` and enforced by `scripts/benchmark.ts`. T1 = sub-200 ms; T4 = full pipeline cold ≤ 10 s.
- **Per-file coverage threshold** — Bun applies the threshold to each individual file rather than the aggregate. A single file under threshold fails the whole run.
```

- [ ] **Step 2: Update `project-structure.md` tree to include new files**

Find the tree diagram. Add the new top-level files in their alphabetical positions:

```
au-agentic/
├── .editorconfig
├── .gitleaks.toml
├── .markdownlint-cli2.jsonc
├── biome.json
├── bunfig.toml
├── knip.json
├── lefthook.yml
├── turbo.json
├── scripts/
│   └── benchmark.ts
├── packages/
...
```

(Adjust to fit the existing diagram style.)

- [ ] **Step 3: Commit**

```bash
git add docs/reference/glossary.md docs/reference/project-structure.md
git commit -m "docs(reference): add toolchain glossary terms; reflect new files in tree"
```

---

### Task 8: Update `docs/explanations/architecture.md`

**Files:**
- Modify: `docs/explanations/architecture.md`

- [ ] **Step 1: Append a "Toolchain layer" section**

```markdown

## Toolchain layer

The toolchain is a horizontal cross-cut, not part of the runtime architecture. Components and their roles:

- **Biome v2** — single binary for lint, format, organize-imports, and filename rule
- **Turborepo v2** — task graph and input/output cache; orchestrates lint, typecheck, test, build per package
- **Lefthook** — parallel git hooks (pre-commit, commit-msg, pre-push)
- **gitleaks** — pre-commit and CI secret scanner (system binary)
- **Knip** — dead-code, unused-export, and unused-dependency detector
- **markdownlint-cli2** — Markdown documentation linter
- **commitlint** — Conventional Commits enforcement on commit-msg
- **Bun test** — built-in test runner with LCOV coverage and per-file 70% threshold
- **scripts/benchmark.ts** — Bun-based benchmark runner; produces `docs/development/performance-benchmarks.md`

The toolchain is governed by performance budgets (T1–T4 tiers) and synchronized with `docs/ai/coding-rules.md` and `docs/development/styleguide.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/explanations/architecture.md
git commit -m "docs(explanations): add toolchain layer description"
```

---

### Task 9: Update `docs/getting-started/quickstart.md` and `onboarding.md`

**Files:**
- Modify: `docs/getting-started/quickstart.md`
- Modify: `docs/getting-started/onboarding.md`

- [ ] **Step 1: Replace `quickstart.md` content**

```markdown
# Quickstart

## Prerequisites

- Bun 1.3.10+ — `curl -fsSL https://bun.sh/install | bash`
- gitleaks v8 — `brew install gitleaks` (macOS) or download from https://github.com/gitleaks/gitleaks/releases (Linux/Windows)
- Git 2.40+

## Five-minute path

```bash
git clone https://github.com/<owner>/au-agentic.git
cd au-agentic
bun install
bunx lefthook install
bun run verify
bun run perf
```

If both `verify` and `perf` exit 0, your environment is ready.

## Common follow-ups

- Run a single test: `bun test packages/cli/src/__tests__/copy.test.ts`
- Watch mode: `bun test --watch`
- Re-format: `bun run format`
- Check (lint + format + organize-imports in one pass): `bun run check`

## Trouble?

See `docs/development/debugging.md` for common toolchain issues, or `docs/getting-started/local-setup.md` for OS-specific install notes.
```

- [ ] **Step 2: Append to `onboarding.md`**

```markdown

## Reference: performance baseline

The current performance baseline lives in `docs/development/performance-benchmarks.md`. Re-run with `bun run perf` after any toolchain change. Tier definitions (T1 instant through T4 full pipeline) are documented in `docs/explanations/design-principles.md`.
```

- [ ] **Step 3: Sanity-check `local-setup.md` and `environment.md` from Phase 3**

Run: `grep -n 'gitleaks\|lefthook' docs/getting-started/local-setup.md docs/getting-started/environment.md`
Expected: each file mentions both tools. If a Phase 3 edit was missed, fix here.

- [ ] **Step 4: Commit**

```bash
git add docs/getting-started/quickstart.md docs/getting-started/onboarding.md docs/getting-started/local-setup.md docs/getting-started/environment.md
git commit -m "docs(setup): refresh quickstart, onboarding pointer to perf baseline"
```

---

### Task 10: Sweep `docs/governance/`, `docs/support/`, `docs/examples/`

**Files:**
- Modify: any file in those directories that mentions legacy tools

- [ ] **Step 1: Find mentions**

Run: `grep -rni 'eslint\|prettier\|husky\|lint-staged' docs/governance/ docs/support/ docs/examples/`

- [ ] **Step 2: Edit each match**

For each match, replace the legacy tool name with the new one, or delete if the surrounding context is obsolete.

- [ ] **Step 3: Commit (only if any file changed)**

```bash
git add docs/governance docs/support docs/examples
git diff --cached --quiet || git commit -m "docs(misc): sweep legacy tool mentions"
```

---

### Task 11: Update `.github/PULL_REQUEST_TEMPLATE.md` with test-quality checkbox

**Files:**
- Modify: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Read current template**

Run: `cat .github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 2: Add a "Test quality" checkbox to the existing checklist**

Find the existing checklist (or create one if absent). Append:

```markdown
- [ ] Each new test asserts a behavior contract, not just smoke (see `docs/ai/testing-policy.md` "Test Quality Anti-Patterns")
- [ ] `bun run verify` exits 0 locally
- [ ] `bun run perf` exits 0 locally with no FAIL rows
- [ ] All affected `docs/` files updated in this PR (see `docs/ai/docs-policy.md`)
```

- [ ] **Step 3: Commit**

```bash
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "ci(pr-template): add test-quality, verify, perf, docs-sync checkboxes"
```

---

### Task 12: Write `docs/ai/performance-policy.md` (the canonical "time is GOLD" rules)

**Files:**
- Create: `docs/ai/performance-policy.md`

This file is the single source of truth for caching discipline. Every AI subagent session reads it via the routing table updated in Task 5; `AGENTS.md` Non-Negotiables (Task 4) link here for full rules.

- [ ] **Step 1: Create the file**

```markdown
**Purpose:** Universal performance discipline; "time is GOLD" rules for all AI subagent sessions and human contributors
**Read this when:** Starting any session, creating a worktree, running install/test/lint/typecheck/build, debugging slow commands
**Do not use for:** Test correctness (see testing-policy.md), tool selection rationale (see ADR-0003)
**Related:** AGENTS.md Non-Negotiables, docs/development/performance-benchmarks.md, docs/explanations/design-principles.md
**Update when:** New cached commands added; cache layout changes; performance tier definitions evolve

---

# Performance Policy

## Preamble

au-agentic is built for fast TDD inner loops and efficient AI subagent throughput. Time is GOLD. Every command must hit cache when possible; cache misses are bugs to investigate, not "the way things are."

## Iron rules

### Rule 1: Always use `bun run <script>`

The root `package.json` defines wrapped scripts (`install`, `verify`, `test`, `typecheck`, `lint`, `build`, `perf`). Each routes through `scripts/cache-env.sh` which exports `BUN_INSTALL_CACHE_DIR` and `TURBO_CACHE_DIR` pointing to the main worktree's project-scope `.cache/` directory.

**Do this:**

```bash
bun run install
bun run verify
bun run test
```

**Not this:**

```bash
bun install              # bypasses cache-env.sh; uses Bun's user-global cache
bunx turbo run test      # bypasses cache-env.sh; Turbo cache may be in wrong place
bun test                 # ok inside a single package, but skips Turbo cache hit
```

The exception: `format` and `check` (Biome) do not need cache wrapping because Biome has no persistent cache. They run directly.

### Rule 2: Worktree creation pattern

When creating a subagent worktree, ALWAYS use the project tree (`.worktrees/<name>`) and ALWAYS install via the wrapped script:

```bash
git worktree add --detach .worktrees/feature-x HEAD
cd .worktrees/feature-x
bun run install   # cache hit from main → < 500ms (W1 tier)
bun run verify    # turbo cache hit from main → < 2s (W2 tier)
```

Worktrees outside `.worktrees/` (for example `/tmp/foo`) still work because `cache-env.sh` resolves the main worktree via `git rev-parse --git-common-dir`, but the convention exists for tidiness and easy cleanup.

### Rule 3: Verify before claiming done

Before claiming any task complete, run `bun run verify`. If it takes longer than 5 seconds on a no-op rerun (cache hit case), the cache is misconfigured. Investigate:

- Is `.cache/turbo/` populated? (`ls -la .cache/turbo/`)
- Did `cache-env.sh` set `TURBO_CACHE_DIR` correctly? (`./scripts/cache-env.sh env | grep TURBO`)
- Did `turbo.json` accidentally gain a `cacheDir` field? (it must NOT — auto-share requires it unset)
- Are inputs in `turbo.json` listing files that change every run (timestamps, generated artifacts)?

### Rule 4: Same command twice = cache bug

If you find yourself running the same command twice in one session and the second invocation took non-trivial time (more than 500ms for cached tasks), STOP. There is a cache config bug. Diagnose root cause; do not "just rerun until it works."

### Rule 5: Never delete `.cache/` to "clean up"

`.cache/` is gitignored and self-managing. Deleting it forces every subsequent command to cold-rebuild — a large unnecessary cost. Only delete if:

- You confirmed cache corruption (rare; usually presents as Turbo restoring stale outputs)
- You documented the deletion in your commit message with a reason

For corruption, the targeted fix is `bunx turbo run <task> --force` to skip cache for one run, not nuking the whole directory.

### Rule 6: Run `bun run perf` before merging toolchain changes

If the change touches any tooling config (`biome.json`, `turbo.json`, `lefthook.yml`, `bunfig.toml`, `tsconfig.json`, `package.json` scripts, `scripts/`), run `bun run perf` and confirm zero FAIL rows. The benchmark writes `docs/development/performance-benchmarks.md` — commit if any row drifted by more than 50%.

## Performance tier acceptance

Spec acceptance requires every row in `bun run perf` to be PASS or WARN; zero FAIL.

| Tier | Time band | Why this matters |
|---|---|---|
| T1 instant | < 200 ms | Human "instant" perception threshold |
| T1 sub-second | < 500 ms | Tolerable for staged-file scans |
| T2 snappy | < 1 s | Inner TDD loop must stay below attention break |
| T3 workflow | < 2–3 s | Pre-commit total — above this, contributors start `--no-verify` |
| T4 full pipeline | < 10 s cold, < 1 s cached | Fresh-clone vs daily working baseline |
| **W1 worktree install** | < 500 ms | Subagent re-install must be near-instant |
| **W2 worktree verify** | < 2 s | Subagent re-verify must hit cache |
| **W3 worktree subagent loop** | < 3 s | Realistic per-task AI iteration cost |
| **W cold** | < 5 s | Truly cold worktree (network-touching install path) |

Full table and current measurements: `docs/development/performance-benchmarks.md`.

## Why this matters

AI subagent-driven development creates many short-lived worktrees. If each pays the full cold-cache cost, AI throughput collapses and human review queues stretch. The cache layout and these rules together ensure subagent N+1 inherits all the cache wins from subagent N.

## When the rules conflict with user instruction

User instructions ALWAYS take precedence. If you are explicitly told to run a raw command for diagnosis, do so and report. The rules here exist as the default discipline, not as a constraint on direct requests.
```

- [ ] **Step 2: Verify the routing table in `docs/ai/routing.md` already references this file (added in Task 5)**

Run: `grep -n 'performance-policy' docs/ai/routing.md`
Expected: at least one match.

- [ ] **Step 3: Verify markdownlint passes on the new file**

Run: `bunx markdownlint-cli2 docs/ai/performance-policy.md`
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add docs/ai/performance-policy.md
git commit -m "docs(ai): add performance-policy.md canonical time-is-gold ruleset"
```

---

### Task 13: Final acceptance gate (Spec Section 12)

- [ ] **Step 1: Confirm all ten new config files exist**

Run:

```bash
for f in biome.json turbo.json bunfig.toml lefthook.yml .gitleaks.toml knip.json .markdownlint-cli2.jsonc .editorconfig scripts/benchmark.ts .github/workflows/verify.yml; do
  [ -e "$f" ] && echo "OK $f" || echo "MISSING $f"
done
```

Expected: every line begins with `OK`. Any `MISSING` indicates a Phase 1–5 task that did not land; investigate before continuing.

- [ ] **Step 2: Confirm legacy devDeps are gone**

Run: `grep -E '"(eslint|@eslint/js|@typescript-eslint/.*|globals|husky|lint-staged)"' bun.lock`
Expected: zero matches.

- [ ] **Step 3: Confirm `bun run verify` exits 0**

Run: `bun run verify`
Expected: Exit code 0.

- [ ] **Step 4: Confirm `bun run perf` exits 0 with zero FAIL and at most two WARN rows**

Run: `bun run perf`
Expected: Final stdout report; no row labeled `FAIL`; at most two `WARN`.

- [ ] **Step 5: Confirm all five workflows are workflow_dispatch only**

Run: `bun test packages/cli/src/__tests__/workflows-disabled.test.ts`
Expected: every workflow row PASS.

- [ ] **Step 6: Confirm coverage artifact exists per package**

Run: `find packages -name lcov.info -type f`
Expected: at least `packages/cli/coverage/lcov.info` (templates package has no tests, so no lcov.info there is fine).

- [ ] **Step 7: Confirm all five new ADRs are committed**

Run:

```bash
ls docs/adr/000{2,3,4,5,6}-*.md
```

Expected: five files listed.

- [ ] **Step 8: Confirm pre-commit on a sample edit runs all hook commands in parallel under 2 seconds**

```bash
echo 'export const finalProbe = 1;' > packages/cli/src/final-probe.ts
git add packages/cli/src/final-probe.ts
time git commit -m "test(tooling): final lefthook timing probe"
```

Expected: real time under 2 seconds. Cleanup:

```bash
git rm packages/cli/src/final-probe.ts
git commit -m "test(tooling): remove final timing probe"
```

- [ ] **Step 9: Confirm README Quick Start works on a fresh clone (manual check)**

In a separate scratch directory:

```bash
cd /tmp && rm -rf au-agentic-fresh
git clone <repo-url> au-agentic-fresh
cd au-agentic-fresh
bun install
bunx lefthook install
bun run verify
bun run perf
```

Expected: every command exits 0. If anything fails, the README is incomplete — fix and re-run.

- [ ] **Step 10: Tag the spec completion**

```bash
git tag -a toolchain-v1 -m "Toolchain production-readiness spec implemented"
```

---

## Phase 6 Definition of Done

- [ ] All 13 tasks completed and committed (Tasks 1–11 base plus 12 perf-policy plus 13 acceptance gate)
- [ ] Zero remaining mentions of `eslint`, `prettier`, `husky`, `lint-staged` outside `docs/superpowers/` and `docs/ai/legacy-context.md`
- [ ] `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md` align with new toolchain
- [ ] `AGENTS.md` Non-Negotiables include the cache-discipline rule
- [ ] `docs/ai/performance-policy.md` exists with the full "time is GOLD" ruleset
- [ ] `docs/ai/routing.md` includes the performance routing row
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` includes test-quality, verify, perf, docs-sync checkboxes
- [ ] Spec acceptance checklist (Section 12) all green
- [ ] Tag `toolchain-v1` created
