# Phase 4 — Cache and Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Turborepo for task caching, Knip for dead-code detection, markdownlint-cli2 for docs hygiene, and a Bun-based benchmark script that produces `docs/development/performance-benchmarks.md`. Wire root `package.json` scripts to route through Turbo so `bun run verify` becomes cache-aware.

**Architecture:** Turborepo orchestrates per-package tasks defined in each package's `package.json`. The root scripts call `turbo run X` for cached tasks. Knip reads `knip.json` and ignores the templates workspace. markdownlint-cli2 reads `.markdownlint-cli2.jsonc`. The benchmark script uses Bun's built-in `performance.now()` and `Bun.spawn`; no Homebrew dependency.

**Tech Stack:** Turborepo v2, Knip v5, markdownlint-cli2 v0.13+.

**Spec reference:** `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Sections 3.2, 3.6, 3.7, 3.13; Phase 4 in Section 9.

**Depends on:** Phase 3 merged (Lefthook installed; `bunx knip` is already in pre-commit but no config yet — this phase finalizes that).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `turbo.json` | Create | Task graph with inputs, outputs, env, dependsOn |
| `knip.json` | Create | Workspace entry/project globs; ignore templates |
| `.markdownlint-cli2.jsonc` | Create | Markdown rules with sensible defaults |
| `scripts/cache-env.sh` | Create | Bash wrapper exporting `BUN_INSTALL_CACHE_DIR` and `TURBO_CACHE_DIR` to main worktree's `.cache/` |
| `scripts/wt-bench.sh` | Create | Worktree benchmark harness (setup/install/verify/loop/cold-cycle/teardown) |
| `scripts/benchmark.ts` | Create | Bun-based benchmark runner with worktree integration; writes to `docs/development/performance-benchmarks.md` |
| `package.json` (root) | Modify | Add `turbo`, `markdownlint-cli2`, `knip` (if not from Phase 3) devDeps; route scripts through Turbo; add `perf` script |
| `packages/cli/package.json` | Modify | Add `lint`, `format`, `typecheck`, `test` scripts so Turbo can fan out per-package |
| `packages/templates/package.json` | Modify | Add `lint`, `format` no-op scripts to keep Turbo schema happy |
| `.gitignore` | Modify | Add `.turbo/` |
| `packages/cli/src/__tests__/turbo-config.test.ts` | Create | TDD: assert `turbo.json` shape |
| `docs/ai/testing-policy.md` | Modify | Coverage section; Test Quality Anti-Patterns subsection |
| `docs/development/performance-benchmarks.md` | Create | Auto-generated initial baseline |
| `docs/development/debugging.md` | Modify | Turbo cache reset, Biome troubleshoot |
| `docs/explanations/design-principles.md` | Modify | Speed budgets T1–T4 |
| `docs/explanations/tradeoffs.md` | Modify | Per-file coverage trap; Turbo first-run cost |
| `docs/adr/0003-turborepo-task-cache.md` | Create | ADR for cache layer choice |

---

### Task 1: Install Turborepo, markdownlint-cli2, and confirm Knip is present

**Files:**
- Modify: `package.json`, `bun.lock`

- [ ] **Step 1: Install Turbo and markdownlint-cli2**

Run: `bun add -D turbo@^2 markdownlint-cli2@^0.13`
Expected: both added to `package.json` devDeps.

- [ ] **Step 2: Confirm Knip is present (added in Phase 3)**

Run: `bun pm ls | grep knip`
Expected: `knip@5.x` listed. If absent: `bun add -D knip@^5`.

- [ ] **Step 3: Verify binaries**

Run: `bunx turbo --version && bunx markdownlint-cli2 --help | head -3 && bunx knip --version`
Expected: each prints a version or help banner without error.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore(deps): add turbo v2 and markdownlint-cli2"
```

---

### Task 2: TDD — failing test for `turbo.json` contract

**Files:**
- Create: `packages/cli/src/__tests__/turbo-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('turbo.json contract', () => {
  const repoRoot = join(import.meta.dir, '../../../..');
  const config = JSON.parse(readFileSync(join(repoRoot, 'turbo.json'), 'utf-8'));

  it('declares build, typecheck, test, lint, format, dev tasks', () => {
    const tasks = Object.keys(config.tasks ?? {});
    for (const t of ['build', 'typecheck', 'test', 'lint', 'format', 'dev']) {
      expect(tasks).toContain(t);
    }
  });

  it('build outputs to dist/', () => {
    expect(config.tasks.build.outputs).toContain('dist/**');
  });

  it('test outputs coverage', () => {
    expect(config.tasks.test.outputs).toContain('coverage/**');
  });

  it('format and dev are not cached', () => {
    expect(config.tasks.format.cache).toBe(false);
    expect(config.tasks.dev.cache).toBe(false);
  });

  it('dev is persistent', () => {
    expect(config.tasks.dev.persistent).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL because `turbo.json` does not exist**

Run: `bun test packages/cli/src/__tests__/turbo-config.test.ts`
Expected: FAIL `ENOENT`.

---

### Task 3: Create `turbo.json` and per-package scripts

**Files:**
- Create: `turbo.json`
- Modify: `packages/cli/package.json`
- Modify: `packages/templates/package.json`

- [ ] **Step 1: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["$TURBO_DEFAULT$", "tsconfig.json", "../../tsconfig.json"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": [".tsbuildinfo"],
      "inputs": ["$TURBO_DEFAULT$", "tsconfig.json", "../../tsconfig.json"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["$TURBO_DEFAULT$", "../../bunfig.toml"],
      "env": ["CI"]
    },
    "lint": {
      "outputs": [],
      "inputs": ["$TURBO_DEFAULT$", "../../biome.json"]
    },
    "format": {
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 2: Add per-package scripts to `packages/cli/package.json`**

```json
{
  "name": "au-agentic",
  "version": "1.0.0",
  "type": "module",
  "imports": {
    "#utils/*": "./src/utils/*.ts",
    "#steps/*": "./src/steps/*.ts"
  },
  "bin": { "au-agentic": "dist/index.js" },
  "files": ["dist"],
  "scripts": {
    "build": "bun build src/index.ts --target=node --outdir=dist --format=esm --banner='#!/usr/bin/env node' --external=@clack/prompts --external=@clack/core --external=picocolors",
    "test": "bun test src/__tests__/",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "format": "biome format --write ."
  },
  "dependencies": {
    "@au-agentic/templates": "workspace:*",
    "@clack/prompts": "^0.9.1",
    "@clack/core": "^0.4.1",
    "picocolors": "^1.1.1"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 3: Add no-op scripts to `packages/templates/package.json`**

```json
{
  "name": "@au-agentic/templates",
  "version": "1.0.0",
  "private": true,
  "exports": { "./*": "./*" },
  "scripts": {
    "lint": "echo 'no TS to lint in templates' && exit 0",
    "format": "echo 'no TS to format in templates' && exit 0",
    "typecheck": "echo 'no TS to typecheck in templates' && exit 0",
    "test": "echo 'no tests in templates' && exit 0",
    "build": "echo 'no build in templates' && exit 0"
  }
}
```

- [ ] **Step 4: Run the contract test — must PASS**

Run: `bun test packages/cli/src/__tests__/turbo-config.test.ts`
Expected: `5 pass, 0 fail`.

- [ ] **Step 5: Run Turbo for the first time and confirm cache miss then hit**

Run: `bunx turbo run lint typecheck test`
Expected: each task runs; final summary `Tasks: 6 successful, 6 total`.

Run: `bunx turbo run lint typecheck test`
Expected: stdout shows `cache hit, replaying logs` for every task; total time is sub-second.

- [ ] **Step 6: Commit**

```bash
git add turbo.json packages/cli/package.json packages/templates/package.json packages/cli/src/__tests__/turbo-config.test.ts
git commit -m "feat(tooling): add turbo.json and per-package scripts; fan out lint/typecheck/test"
```

---

### Task 4: Create `scripts/cache-env.sh` and route root scripts through it

**Files:**
- Create: `scripts/cache-env.sh`
- Modify: `package.json` (root)
- Modify: `.gitignore`

- [ ] **Step 1: Create `scripts/cache-env.sh`**

```bash
#!/usr/bin/env bash
# Wraps every bun/turbo invocation with project-scope cache env vars.
# Resolves the main worktree (works from any linked worktree via
# git rev-parse --git-common-dir) so .cache/ always lives in the main
# worktree's tree. This makes cache shared across all subagent worktrees
# under .worktrees/.
set -euo pipefail
COMMON_GIT="$(git rev-parse --git-common-dir)"
MAIN_WORKTREE="$(cd "$(dirname "$COMMON_GIT")" && pwd)"
export BUN_INSTALL_CACHE_DIR="$MAIN_WORKTREE/.cache/bun-install"
export TURBO_CACHE_DIR="$MAIN_WORKTREE/.cache/turbo"
exec "$@"
```

- [ ] **Step 2: Make the script executable**

Run: `chmod +x scripts/cache-env.sh`
Expected: file mode shows `-rwxr-xr-x` (`ls -la scripts/cache-env.sh`).

- [ ] **Step 3: Sanity-check the resolution from main worktree**

Run: `./scripts/cache-env.sh env | grep -E 'BUN_INSTALL_CACHE_DIR|TURBO_CACHE_DIR'`
Expected: both env vars print with absolute paths under the project root, ending in `.cache/bun-install` and `.cache/turbo` respectively.

- [ ] **Step 4: Sanity-check the resolution from a temp worktree (proves cross-worktree sharing)**

```bash
mkdir -p .worktrees
git worktree add --detach .worktrees/.cache-probe HEAD
( cd .worktrees/.cache-probe && ./scripts/cache-env.sh env | grep -E 'BUN_INSTALL_CACHE_DIR|TURBO_CACHE_DIR' )
git worktree remove --force .worktrees/.cache-probe
```

Expected: env vars from inside the worktree print the SAME absolute path as Step 3 — pointing to the main worktree's `.cache/`. If they differ, `git rev-parse --git-common-dir` is not resolving correctly; investigate.

- [ ] **Step 5: Update root `package.json` scripts to wrap through `cache-env.sh`**

```json
{
  "scripts": {
    "dev": "bun run packages/cli/src/index.ts",
    "install": "./scripts/cache-env.sh bun install",
    "build": "./scripts/cache-env.sh bunx turbo run build",
    "test": "./scripts/cache-env.sh bunx turbo run test",
    "typecheck": "./scripts/cache-env.sh bunx turbo run typecheck",
    "lint": "./scripts/cache-env.sh bunx turbo run lint",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "verify": "./scripts/cache-env.sh bunx turbo run lint typecheck test",
    "perf": "./scripts/cache-env.sh bun scripts/benchmark.ts",
    "prepublish": "bun run verify && ./scripts/cache-env.sh bunx turbo run build"
  }
}
```

Note `format` and `check` deliberately do NOT wrap through `cache-env.sh` — Biome has no persistent cache, and direct invocation avoids one fork.

- [ ] **Step 6: Add `.turbo/` and `.cache/` to `.gitignore` (if Phase 1 added `.cache/` already, this just confirms; if not, add now)**

```
.turbo/
.cache/
.worktrees/.bench/
.worktrees/.cold-*/
```

- [ ] **Step 7: Run `bun run verify`**

Run: `bun run verify`
Expected: cache-env.sh exports env vars, Turbo orchestrates lint, typecheck, test, exit code 0; `.cache/turbo/` is now populated.

- [ ] **Step 8: Confirm cache directory structure**

Run: `ls -la .cache/`
Expected: shows `bun-install/` and `turbo/` subdirectories with content.

- [ ] **Step 9: Commit**

```bash
git add scripts/cache-env.sh package.json .gitignore
git commit -m "feat(tooling): add cache-env.sh wrapper for project-scope worktree-shared cache"
```

---

### Task 5: Create `knip.json` and confirm pre-push strict mode works

**Files:**
- Create: `knip.json`

- [ ] **Step 1: Create `knip.json`**

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    "packages/cli": {
      "entry": ["src/index.ts", "src/__tests__/**/*.test.ts"],
      "project": ["src/**/*.ts"]
    }
  },
  "ignoreWorkspaces": ["packages/templates"],
  "ignoreBinaries": ["bun", "lefthook", "gitleaks", "biome", "turbo", "markdownlint-cli2"]
}
```

- [ ] **Step 2: Run Knip and address any findings**

Run: `bunx knip`
Expected: zero unused exports/dependencies/files. If findings appear, either delete the dead code or document why it must remain (and add it to `knip.json` `ignoreExportsUsedInFile` or similar).

- [ ] **Step 3: Commit**

```bash
git add knip.json
git commit -m "feat(tooling): add knip.json with cli workspace entry; ignore templates"
```

---

### Task 6: Create `.markdownlint-cli2.jsonc`

**Files:**
- Create: `.markdownlint-cli2.jsonc`

- [ ] **Step 1: Create the config**

```jsonc
{
  "config": {
    "default": true,
    "MD013": false,
    "MD024": { "siblings_only": true },
    "MD033": false,
    "MD041": false
  },
  "globs": ["**/*.md"],
  "ignores": ["**/node_modules/**", "**/dist/**", "**/.turbo/**", "packages/templates/**"]
}
```

- [ ] **Step 2: Run markdownlint and address any findings**

Run: `bunx markdownlint-cli2`
Expected: zero violations. Common findings: MD040 (fenced code without language), MD007 (unordered list indent). Fix in the offending docs.

- [ ] **Step 3: Commit**

```bash
git add .markdownlint-cli2.jsonc
git commit -m "feat(tooling): add markdownlint-cli2 config; ignore templates and dist"
```

---

### Task 7a: Create `scripts/wt-bench.sh` (worktree benchmark harness)

**Files:**
- Create: `scripts/wt-bench.sh`

- [ ] **Step 1: Create the helper**

```bash
#!/usr/bin/env bash
# Helper for worktree-scoped benchmarking.
# Maintains a persistent .worktrees/.bench worktree so tests measure
# realistic AI subagent re-invocation cost (cache hit), not one-time
# worktree setup cost. cold-cycle measures the truly-cold path.
set -euo pipefail

COMMON_GIT="$(git rev-parse --git-common-dir)"
MAIN_WORKTREE="$(cd "$(dirname "$COMMON_GIT")" && pwd)"
BENCH_WT="$MAIN_WORKTREE/.worktrees/.bench"

case "${1:-help}" in
  setup)
    [[ -d "$BENCH_WT" ]] || git worktree add --detach "$BENCH_WT" HEAD
    ;;
  install)
    cd "$BENCH_WT" && bun run install >/dev/null 2>&1
    ;;
  verify)
    cd "$BENCH_WT" && bun run verify >/dev/null 2>&1
    ;;
  loop)
    cd "$BENCH_WT" && bun run install >/dev/null 2>&1 && bun run verify >/dev/null 2>&1
    ;;
  cold-cycle)
    UNIQ="$MAIN_WORKTREE/.worktrees/.cold-$$"
    git worktree add --detach "$UNIQ" HEAD >/dev/null 2>&1
    trap 'git worktree remove --force "$UNIQ" 2>/dev/null || true' EXIT
    cd "$UNIQ"
    bun run install >/dev/null 2>&1
    bun run verify >/dev/null 2>&1
    ;;
  teardown)
    git worktree remove --force "$BENCH_WT" 2>/dev/null || true
    ;;
  help|*)
    echo "Usage: $0 {setup|install|verify|loop|cold-cycle|teardown}" >&2
    exit 1
    ;;
esac
```

- [ ] **Step 2: Make executable and smoke-test setup/teardown**

```bash
chmod +x scripts/wt-bench.sh
./scripts/wt-bench.sh setup
ls .worktrees/.bench  # should show project files
./scripts/wt-bench.sh install
./scripts/wt-bench.sh verify
./scripts/wt-bench.sh teardown
ls .worktrees/.bench 2>&1  # should say "No such file or directory"
```

Expected: setup creates worktree, install + verify run successfully inside it (cache hit if main is warm), teardown removes cleanly.

- [ ] **Step 3: Commit**

```bash
git add scripts/wt-bench.sh
git commit -m "feat(tooling): add wt-bench.sh worktree benchmark harness"
```

---

### Task 7b: Create the main benchmark script with worktree integration

**Files:**
- Create: `scripts/benchmark.ts`

- [ ] **Step 1: Create the script**

```ts
#!/usr/bin/env bun
interface Bench {
  name: string;
  cmd: string[];
  targetMs: number;
  ceilingMs: number;
  warmupRuns?: number;
  measureRuns?: number;
}

const benches: Bench[] = [
  { name: 'biome format',                cmd: ['bunx','biome','format','--write','.'],                  targetMs: 200,   ceilingMs: 500 },
  { name: 'biome lint',                  cmd: ['bunx','biome','lint','.'],                              targetMs: 200,   ceilingMs: 500 },
  { name: 'biome check (full)',          cmd: ['bunx','biome','check','.'],                             targetMs: 300,   ceilingMs: 800 },
  { name: 'gitleaks staged',             cmd: ['gitleaks','protect','--staged','--redact','--no-banner'], targetMs: 500, ceilingMs: 1500 },
  { name: 'bun test (single file)',      cmd: ['bun','test','packages/cli/src/__tests__/copy.test.ts'], targetMs: 300,   ceilingMs: 1000 },
  { name: 'bun test (full)',             cmd: ['bun','test'],                                           targetMs: 1000,  ceilingMs: 3000 },
  { name: 'bun typecheck (warm)',        cmd: ['bun','run','typecheck'],                                targetMs: 1000,  ceilingMs: 3000 },
  { name: 'turbo test (cache hit)',      cmd: ['bunx','turbo','run','test'],                            targetMs: 300,   ceilingMs: 1000 },
  { name: 'turbo verify (cache hit)',    cmd: ['bunx','turbo','run','lint','typecheck','test'],         targetMs: 1000,  ceilingMs: 3000 },
  { name: 'turbo verify (cold)',         cmd: ['bunx','turbo','run','lint','typecheck','test','--force'], targetMs: 10000, ceilingMs: 30000 },
  { name: 'knip',                        cmd: ['bunx','knip'],                                          targetMs: 3000,  ceilingMs: 8000 },
  { name: 'markdownlint',                cmd: ['bunx','markdownlint-cli2'],                             targetMs: 2000,  ceilingMs: 5000 },

  // Worktree (subagent simulation) benchmarks — see scripts/wt-bench.sh
  { name: 'worktree W1: bun install (cache hit from main)',   cmd: ['bash','scripts/wt-bench.sh','install'],    targetMs: 500,   ceilingMs: 2000 },
  { name: 'worktree W2: turbo verify (cache hit from main)',  cmd: ['bash','scripts/wt-bench.sh','verify'],     targetMs: 2000,  ceilingMs: 5000 },
  { name: 'worktree W3: full subagent loop (install+verify)', cmd: ['bash','scripts/wt-bench.sh','loop'],       targetMs: 3000,  ceilingMs: 8000 },
  { name: 'worktree cold: create+install+verify+remove',      cmd: ['bash','scripts/wt-bench.sh','cold-cycle'], targetMs: 5000,  ceilingMs: 15000, measureRuns: 3 }
];

async function runOnce(cmd: string[]): Promise<number> {
  const t0 = performance.now();
  const proc = Bun.spawn(cmd, { stdout: 'ignore', stderr: 'ignore' });
  await proc.exited;
  return performance.now() - t0;
}

const median = (xs: number[]): number => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

// Setup: persistent benchmark worktree (one-time per run; teardown at end)
console.log('Setting up .worktrees/.bench (one-time)...');
await Bun.spawn(['bash','scripts/wt-bench.sh','setup'], { stdio: ['ignore','inherit','inherit'] }).exited;

const rows: string[] = [];
rows.push('| Status | Command | Median (ms) | Target (ms) | Ceiling (ms) |');
rows.push('|---|---|---:|---:|---:|');

let anyFail = false;
for (const b of benches) {
  process.stdout.write(`Running ${b.name} ...`);
  for (let i = 0; i < (b.warmupRuns ?? 2); i++) await runOnce(b.cmd);
  const samples: number[] = [];
  for (let i = 0; i < (b.measureRuns ?? 5); i++) samples.push(await runOnce(b.cmd));
  const m = median(samples);
  const status = m <= b.targetMs ? 'PASS' : m <= b.ceilingMs ? 'WARN' : 'FAIL';
  if (status === 'FAIL') anyFail = true;
  rows.push(`| ${status} | \`${b.name}\` | ${m.toFixed(0)} | ${b.targetMs} | ${b.ceilingMs} |`);
  console.log(` ${status} (${m.toFixed(0)}ms median over ${(b.measureRuns ?? 5)} runs)`);
}

// Teardown
console.log('Tearing down .worktrees/.bench...');
await Bun.spawn(['bash','scripts/wt-bench.sh','teardown'], { stdio: ['ignore','inherit','inherit'] }).exited;

const report = `# Performance Benchmarks

> Auto-generated by \`bun run perf\` on ${new Date().toISOString()}.

Re-run after any toolchain change. Status meanings:

- **PASS** — at or below target time
- **WARN** — above target but within ceiling; investigate if pattern persists
- **FAIL** — above ceiling; CI gate fails

${rows.join('\n')}

## Tier definitions

- **T1 instant** (< 200 ms): biome format, biome lint, biome check on staged subset
- **T1 sub-second** (< 500 ms): gitleaks staged scan
- **T2 snappy** (< 1 s): bun test full, bun typecheck warm, turbo run cache hit
- **T3 workflow** (< 2–3 s): lefthook pre-commit total, knip, markdownlint, typecheck cold
- **T4 full pipeline** (< 10 s cold, < 1 s cached): turbo run lint typecheck test
- **W1 worktree install** (< 500 ms target, 2 s ceiling): \`bun run install\` in subagent worktree, cache hit from main
- **W2 worktree verify** (< 2 s target, 5 s ceiling): \`bun run verify\` in subagent worktree, turbo cache hit
- **W3 worktree subagent loop** (< 3 s target, 8 s ceiling): install + verify combined (one full AI iteration)
- **W cold** (< 5 s target, 15 s ceiling): create+install+verify+remove of a fresh worktree (truly cold path)

## Re-running

\`\`\`bash
bun run perf
\`\`\`

The script writes this file in place. Commit changes if benchmarks shift meaningfully (more than 50% drift on any row).
`;
await Bun.write('docs/development/performance-benchmarks.md', report);
console.log('\n' + report);
if (anyFail) process.exit(1);
```

- [ ] **Step 2: Make sure `scripts/benchmark.ts` is executable from `bun`**

Run: `bun scripts/benchmark.ts`
Expected: each bench row prints with a status; finishes with the markdown report; `docs/development/performance-benchmarks.md` is created.

If a row reports FAIL, investigate before continuing — the toolchain is missing the speed budget.

- [ ] **Step 3: Commit the script and the generated baseline**

```bash
git add scripts/benchmark.ts docs/development/performance-benchmarks.md
git commit -m "feat(tooling): add bun-based perf benchmark; record baseline"
```

---

### Task 8: Update `docs/ai/testing-policy.md` with coverage and anti-pattern guidance

**Files:**
- Modify: `docs/ai/testing-policy.md`

- [ ] **Step 1: Append a new section about coverage**

```markdown

## Coverage

`bun test` runs with coverage by default (configured in `bunfig.toml`). Reporters: text (console) and LCOV (`coverage/lcov.info`).

**Threshold:** 70% per file for lines, functions, statements. Bun enforces this per file (not aggregate); a single file under threshold fails the build.

If a tiny utility (under 5 lines) cannot be tested in isolation, add it to the per-file exclude list in `bunfig.toml` rather than padding tests.

## Test Quality Anti-Patterns

The user prefers high-quality tests over high coverage numbers. Avoid these patterns; reviewers will reject them:

- **Tautological assertions** — `expect(true).toBe(true)` or `expect(x).toBe(x)`. The test asserts nothing.
- **Pass-through tests** — `it('calls the function', () => { fn() })` with no assertion on behavior.
- **No-IO no-mock tests** — exercises a function that has no observable effect because the test stubbed nothing and read nothing.
- **Snapshot for non-snapshot data** — snapshotting a JSON object that should have explicit field-by-field assertions.
- **Mixed setup and assertion bodies** — a single `it` block with 50+ lines doing arrange, act, and 10 separate asserts. Split into focused tests.
- **Empty test bodies** — `it('handles X', () => {})`. Biome `noEmptyBlockStatements` blocks this at lint time; reviewers should reject any `// @biome-disable-next-line` exemption without a written reason in the PR.

When LLM-assisted code generates tests, the human reviewer is responsible for verifying each test asserts a real behavior contract. Coverage percentage is not a substitute for this judgment.

## Performance gate

`bun run perf` runs `scripts/benchmark.ts` and writes `docs/development/performance-benchmarks.md`. Spec acceptance requires zero FAIL rows and at most two WARN rows.
```

- [ ] **Step 2: Commit**

```bash
git add docs/ai/testing-policy.md
git commit -m "docs(ai): add coverage policy and Test Quality Anti-Patterns section"
```

---

### Task 9: Update `docs/development/debugging.md` with Turbo and Biome troubleshooting

**Files:**
- Modify: `docs/development/debugging.md`

- [ ] **Step 1: Append section**

```markdown

## Toolchain troubleshooting

### Turbo cache giving stale results

Symptoms: code changed but Turbo reports `cache hit` and skips the task.

Fix:

```bash
rm -rf .turbo node_modules/.cache
bunx turbo run <task> --force
```

If the issue recurs, the task's `inputs` glob in `turbo.json` is missing a relevant file. Add it.

### Biome reports thousands of "errors" on first run

Likely cause: `biome.json` ignore globs do not yet exclude generated files (e.g., `.turbo/`, `coverage/`, `dist/`).

Fix: confirm `files.ignore` in `biome.json` lists the generated directories.

### gitleaks blocking a legitimate change

If you are confident a flagged token is not a real secret, extend `.gitleaks.toml` allowlist with the most specific path/regex possible. Never add `--no-verify` to bypass.

### `bun run perf` shows FAIL on `gitleaks staged`

gitleaks must be on `PATH`. If `gitleaks version` does not print `8.x`, re-install per `docs/getting-started/local-setup.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/development/debugging.md
git commit -m "docs(dev): add toolchain troubleshooting (turbo, biome, gitleaks, perf)"
```

---

### Task 10: Update explanation docs

**Files:**
- Modify: `docs/explanations/design-principles.md`
- Modify: `docs/explanations/tradeoffs.md`

- [ ] **Step 1: Append "Speed budgets" to `design-principles.md`**

```markdown

## Speed budgets

The toolchain is held to four time tiers; `bun run perf` enforces them.

| Tier | Time band | Rationale |
|---|---|---|
| T1 instant | < 200 ms | Human "instant" perception threshold |
| T1 sub-second | < 500 ms | Tolerable for staged-file scans |
| T2 snappy | < 1 s | Inner TDD loop must stay below attention break |
| T3 workflow | < 2–3 s | Pre-commit hook total — above this, contributors start `--no-verify` |
| T4 full pipeline | < 10 s cold, < 1 s cached | Fresh-clone verify time vs daily working baseline |

Every command in `scripts/benchmark.ts` is annotated with its target and ceiling. Drift is visible in version-controlled `docs/development/performance-benchmarks.md`.
```

- [ ] **Step 2: Append "Toolchain trade-offs" to `tradeoffs.md`**

```markdown

## Toolchain trade-offs

### Biome vs ESLint+typescript-eslint+Prettier

Biome wins on speed (10–25× faster on TS files) and config simplicity (one file, one binary). It loses on plugin ecosystem depth — no `eslint-plugin-import`, `eslint-plugin-testing-library`, no custom-rule plugin API. For au-agentic's two-package TS-only repo, the trade-off favors Biome; revisit if a critical type-aware rule is missing for six months.

### Per-file coverage threshold

Bun enforces coverage per file, not aggregate. The 70% floor is conservative because the user values test quality over volume — high thresholds incentivize hollow tests. A single tiny utility falling below 70% will fail the run; the answer is either to write a real test or to exclude the file in `bunfig.toml` with a comment explaining why.

### Turbo first-run cost

The first `turbo run` after cloning misses the cache for every task. CI's first run will be slower than subsequent runs by exactly the sum of cold task times. This is acceptable today; remote cache (Vercel free tier or self-host) is deferred until CI auto-trigger is enabled.

### Disabled-by-default workflows

All five GitHub Actions workflows use `workflow_dispatch` only. The trade-off: zero unintended CI minutes vs. no automatic safety net for unrelated repository hygiene. Local pre-commit hooks and `bun run verify` carry that load. To activate any workflow, edit the `on:` block — see `docs/deployment/runbooks.md`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/explanations/design-principles.md docs/explanations/tradeoffs.md
git commit -m "docs(explanations): add speed budgets and toolchain trade-offs"
```

---

### Task 11: Add ADR-0003

**Files:**
- Create: `docs/adr/0003-turborepo-task-cache.md`

- [ ] **Step 1: Create the ADR**

```markdown
# ADR-0003: Adopt Turborepo for task graph and cache

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

au-agentic is a Bun monorepo with two packages today and a TDD workflow that runs many test, lint, and typecheck cycles per development session. Without a task-graph cache, each cycle re-runs everything regardless of what changed. The user explicitly asked for "super caching" so feedback stays sub-second on no-op runs.

## Decision

Adopt Turborepo v2 as the task orchestrator. Wire root scripts (`bun run verify`, `bun run test`, `bun run typecheck`, `bun run lint`, `bun run build`) through `turbo run <task>`. Local cache only for now; remote cache deferred until CI auto-trigger is enabled.

## Consequences

**Positive**
- `turbo run X` on no change returns in sub-second (cache replay)
- Per-package fan-out: edits to one package skip others
- Task inputs/outputs are explicit, making cache reasoning transparent
- Official Bun support (lockfile hashed, workspace filtering)

**Negative**
- One more config file to maintain (`turbo.json`)
- First run misses cache for every task
- Wrong `outputs` glob can result in cached tasks not restoring artifacts; debugging requires `--force`
- Adds the `.turbo/` directory to gitignore management

## Alternatives considered

- **Nx**: more powerful (`affected`, distributed execution), but overkill for two packages and steeper learning curve
- **Bun-native scripts only**: no task-graph cache; edit one file → still runs everything
- **TypeScript project references**: orthogonal, complementary; deferred until repo grows past five packages or typecheck exceeds five seconds

## References

- Turborepo docs: https://turborepo.dev
- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.2
```

- [ ] **Step 2: Commit**

```bash
git add docs/adr/0003-turborepo-task-cache.md
git commit -m "docs(adr): record Turborepo task cache decision"
```

---

### Task 12: Worktree cache-share verification (manual + automated)

This task proves the project-scope cache truly shares across worktrees, the central claim of the design.

**Files:** none modified; verification only

- [ ] **Step 1: Warm main worktree cache**

Run: `bun run verify`
Expected: Exit code 0; final summary shows tasks ran (cold cache, first time after Phase 4 lands).

Run: `bun run verify` (second time)
Expected: Exit code 0; summary shows `>>> FULL TURBO` or `cache hit, replaying logs` for every task.

- [ ] **Step 2: Create a probe worktree manually**

```bash
git worktree add --detach .worktrees/.cache-verify HEAD
cd .worktrees/.cache-verify
```

- [ ] **Step 3: Confirm cache-env.sh resolves to MAIN worktree's `.cache/`**

Run: `./scripts/cache-env.sh env | grep -E 'BUN_INSTALL_CACHE_DIR|TURBO_CACHE_DIR'`
Expected: paths point OUTSIDE the worktree, into the main worktree (e.g., `.../au-agentic/.cache/turbo`, NOT `.../au-agentic/.worktrees/.cache-verify/.cache/turbo`).

- [ ] **Step 4: Time install and verify in the worktree**

```bash
time bun run install
time bun run verify
```

Expected:
- `bun run install`: real time under 2 s (W1 ceiling). Bun reports "0 packages installed" or hardlinks from cache; no network.
- `bun run verify`: real time under 5 s (W2 ceiling). Stdout shows `cache hit, replaying logs` for every Turbo task — proves Turbo cache is shared from main worktree.

If `bun run verify` shows full task execution instead of cache hit, `TURBO_CACHE_DIR` is not pointing where expected; re-check `cache-env.sh`.

- [ ] **Step 5: Cleanup probe worktree**

```bash
cd ../..
git worktree remove --force .worktrees/.cache-verify
```

- [ ] **Step 6: Run `bun run perf` and confirm W-tier rows pass**

Run: `bun run perf`
Expected: stdout includes rows for `worktree W1`, `worktree W2`, `worktree W3`, `worktree cold`, all PASS or WARN; zero FAIL. The benchmark script auto-creates and tears down `.worktrees/.bench/`.

- [ ] **Step 7: Commit any benchmark refresh**

```bash
git add docs/development/performance-benchmarks.md
git diff --cached --quiet || git commit -m "docs(perf): record initial baseline including W-tier benchmarks"
```

---

### Task 13: Final phase verification gate

- [ ] **Step 1: Run verify (now via Turbo through cache-env.sh)**

Run: `bun run verify`
Expected: Exit code 0; cache hit on second invocation.

- [ ] **Step 2: Run perf and confirm zero FAIL**

Run: `bun run perf`
Expected: every row PASS or WARN; zero FAIL; W1 < 500ms, W2 < 2s, W3 < 3s targets met.

- [ ] **Step 3: Run knip strict and markdownlint**

Run: `bunx knip && bunx markdownlint-cli2`
Expected: both exit 0.

- [ ] **Step 4: Commit any benchmark refresh**

```bash
git add docs/development/performance-benchmarks.md
git diff --cached --quiet || git commit -m "docs(perf): refresh benchmark baseline"
```

- [ ] **Step 5: Tag the phase**

```bash
git tag -a phase-4-cache-quality -m "Phase 4 of toolchain production-readiness complete"
```

---

## Phase 4 Definition of Done

- [ ] All 13 tasks completed and committed (Tasks 1–11 base plus 7a/7b/12/13)
- [ ] `bun run verify` exits 0 and uses Turbo through `cache-env.sh`
- [ ] `bun run perf` exits 0 with zero FAIL rows; W1 < 500ms, W2 < 2s, W3 < 3s, W cold < 5s
- [ ] `bunx knip` exits 0 (no unused exports/deps/files)
- [ ] `bunx markdownlint-cli2` exits 0
- [ ] `turbo.json`, `knip.json`, `.markdownlint-cli2.jsonc`, `scripts/cache-env.sh`, `scripts/wt-bench.sh`, `scripts/benchmark.ts` all exist
- [ ] `scripts/cache-env.sh` and `scripts/wt-bench.sh` are executable (mode `+x`)
- [ ] In a fresh `.worktrees/.cache-verify` probe, `BUN_INSTALL_CACHE_DIR` and `TURBO_CACHE_DIR` resolve to MAIN worktree's `.cache/` (not the probe's own tree)
- [ ] In the probe worktree, `bun run verify` shows `cache hit, replaying logs` for every Turbo task
- [ ] `docs/development/performance-benchmarks.md` exists, includes W-tier rows, reflects the latest baseline
- [ ] ADR-0003 committed
- [ ] `docs/ai/testing-policy.md`, `docs/development/debugging.md`, `docs/explanations/design-principles.md`, `docs/explanations/tradeoffs.md` reflect new state
