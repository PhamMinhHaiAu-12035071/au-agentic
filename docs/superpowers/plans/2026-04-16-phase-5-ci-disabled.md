# Phase 5 — CI Workflow Files (Disabled by Default) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write a new `verify.yml` workflow that exercises the full toolchain (Bun cache, Turbo cache, lint, typecheck, test, coverage upload, gitleaks). Downgrade all five workflows (`ci.yml`, `docs-check.yml`, `release.yml`, `security.yml`, and the new `verify.yml`) to `workflow_dispatch` only so commits, pushes, and PRs never auto-trigger Actions.

**Architecture:** Every workflow keeps its existing job logic (or, for `verify.yml`, gets new logic) but the `on:` block is restricted to `workflow_dispatch`. Manual activation is documented in `docs/deployment/runbooks.md`. No external dependencies.

**Tech Stack:** GitHub Actions, `oven-sh/setup-bun@v2`, `actions/cache@v4`, `actions/upload-artifact@v4`.

**Spec reference:** `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.12; Phase 5 in Section 9.

**Depends on:** Phase 4 merged (Turbo + Biome + gitleaks all in place).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `.github/workflows/verify.yml` | Create | Full pipeline (lint, typecheck, test, coverage, gitleaks) — manual trigger only |
| `.github/workflows/ci.yml` | Modify | Change `on:` to `workflow_dispatch:` only; preserve job content |
| `.github/workflows/docs-check.yml` | Modify | Same downgrade |
| `.github/workflows/release.yml` | Modify | Same downgrade |
| `.github/workflows/security.yml` | Modify | Same downgrade |
| `packages/cli/src/__tests__/workflows-disabled.test.ts` | Create | TDD: assert every workflow file has only `workflow_dispatch` triggers |
| `docs/ai/deployment-policy.md` | Modify | Document workflow_dispatch-only state |
| `docs/development/branching-and-prs.md` | Modify | Note CI is manual; describe how to trigger |
| `docs/deployment/deployment.md` | Modify | Update CI section |
| `docs/deployment/runbooks.md` | Modify | Add "Activate CI workflows" runbook |
| `docs/adr/0006-workflows-disabled-by-default.md` | Create | ADR for trigger policy |

---

### Task 1: TDD — failing test asserting every workflow uses only `workflow_dispatch`

**Files:**
- Create: `packages/cli/src/__tests__/workflows-disabled.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

describe('GitHub Actions workflows are manual-trigger only', () => {
  const workflowsDir = join(import.meta.dir, '../../../../.github/workflows');
  const workflowFiles = readdirSync(workflowsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

  it('finds at least four workflow files', () => {
    expect(workflowFiles.length).toBeGreaterThanOrEqual(4);
  });

  for (const file of workflowFiles) {
    it(`${file} declares only workflow_dispatch`, () => {
      const yaml = parseYaml(readFileSync(join(workflowsDir, file), 'utf-8')) as { on?: unknown };
      const on = yaml.on;
      const triggerKeys =
        typeof on === 'string' ? [on]
        : Array.isArray(on) ? on
        : on && typeof on === 'object' ? Object.keys(on as Record<string, unknown>)
        : [];

      expect(triggerKeys).toEqual(['workflow_dispatch']);
    });
  }
});
```

- [ ] **Step 2: Run test — must FAIL because existing workflows have `push`/`pull_request` triggers**

Run: `bun test packages/cli/src/__tests__/workflows-disabled.test.ts`
Expected: FAIL — at least one workflow has triggers other than `workflow_dispatch`.

---

### Task 2: Downgrade `.github/workflows/ci.yml`

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Read current `on:` block**

Run: `head -20 .github/workflows/ci.yml`

- [ ] **Step 2: Replace the `on:` block with `workflow_dispatch` only**

Find the existing top of the file (something like):

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

Replace with:

```yaml
on:
  workflow_dispatch:
    inputs:
      reason:
        description: "Why are you triggering this manually?"
        required: false
        default: "ad-hoc"
```

The `inputs.reason` field is cosmetic — it shows up in the Actions UI so the trigger is auditable. Do not change job definitions in this task.

- [ ] **Step 3: Verify YAML still parses**

Run: `bun -e 'import { parse } from "yaml"; parse(await Bun.file(".github/workflows/ci.yml").text());' && echo OK`
Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci(ci): downgrade trigger to workflow_dispatch only"
```

---

### Task 3: Downgrade `.github/workflows/docs-check.yml`

**Files:**
- Modify: `.github/workflows/docs-check.yml`

- [ ] **Step 1: Read current `on:` block**

Run: `head -20 .github/workflows/docs-check.yml`

- [ ] **Step 2: Replace the `on:` block with `workflow_dispatch` only**

Replace whatever existing `on:` block is present with:

```yaml
on:
  workflow_dispatch:
    inputs:
      reason:
        description: "Why are you triggering this manually?"
        required: false
        default: "ad-hoc"
```

Preserve every `jobs:` block as-is.

- [ ] **Step 3: Verify YAML parses**

Run: `bun -e 'import { parse } from "yaml"; parse(await Bun.file(".github/workflows/docs-check.yml").text());' && echo OK`
Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/docs-check.yml
git commit -m "ci(docs-check): downgrade trigger to workflow_dispatch only"
```

---

### Task 4: Downgrade `.github/workflows/release.yml`

**Files:**
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Read current `on:` block**

Run: `head -20 .github/workflows/release.yml`

- [ ] **Step 2: Replace the `on:` block with `workflow_dispatch` only**

Replace whatever existing `on:` block is present (likely a `release:` or tag-push trigger) with:

```yaml
on:
  workflow_dispatch:
    inputs:
      reason:
        description: "Why are you triggering this manually?"
        required: false
        default: "ad-hoc"
      version:
        description: "Version tag to publish (e.g., v2.0.1)"
        required: false
```

Preserve every `jobs:` block. The optional `version` input gives the release operator a way to declare intent without changing job logic.

- [ ] **Step 3: Verify YAML parses**

Run: `bun -e 'import { parse } from "yaml"; parse(await Bun.file(".github/workflows/release.yml").text());' && echo OK`
Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci(release): downgrade trigger to workflow_dispatch with version input"
```

---

### Task 5: Downgrade `.github/workflows/security.yml`

**Files:**
- Modify: `.github/workflows/security.yml`

- [ ] **Step 1: Read current `on:` block**

Run: `head -20 .github/workflows/security.yml`

- [ ] **Step 2: Replace the `on:` block with `workflow_dispatch` only**

Replace whatever existing `on:` block is present (likely a `schedule:` cron + `push:` trigger) with:

```yaml
on:
  workflow_dispatch:
    inputs:
      reason:
        description: "Why are you triggering this manually?"
        required: false
        default: "ad-hoc"
```

Preserve every `jobs:` block.

- [ ] **Step 3: Verify YAML parses**

Run: `bun -e 'import { parse } from "yaml"; parse(await Bun.file(".github/workflows/security.yml").text());' && echo OK`
Expected: prints `OK`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/security.yml
git commit -m "ci(security): downgrade trigger to workflow_dispatch only"
```

---

### Task 6: Create the new `verify.yml`

**Files:**
- Create: `.github/workflows/verify.yml`

- [ ] **Step 1: Create the file**

```yaml
name: Verify
on:
  workflow_dispatch:
    inputs:
      reason:
        description: "Why are you triggering this manually?"
        required: false
        default: "ad-hoc"

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.10

      - name: Cache Bun install dir
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: bun-install-${{ hashFiles('bun.lock') }}
          restore-keys: |
            bun-install-

      - name: Cache Turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ github.sha }}
          restore-keys: |
            turbo-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lefthook install (no-op in CI but ensures hooks present locally if cache hits)
        run: bunx lefthook install

      - name: Run lint, typecheck, test (Turbo)
        run: bun run verify

      - name: Run knip strict
        run: bunx knip

      - name: Run markdownlint
        run: bunx markdownlint-cli2

      - name: Run benchmark
        run: bun run perf

      - name: Run gitleaks (full scan)
        run: |
          curl -sSL https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz | tar -xz -C /tmp gitleaks
          /tmp/gitleaks detect --source . --redact --no-banner

      - name: Upload coverage LCOV
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-lcov
          path: '**/coverage/lcov.info'
          if-no-files-found: warn
          retention-days: 30

      - name: Upload performance benchmark
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: performance-benchmarks
          path: docs/development/performance-benchmarks.md
          if-no-files-found: warn
          retention-days: 30
```

- [ ] **Step 2: Verify YAML parses**

Run: `bun -e 'import { parse } from "yaml"; parse(await Bun.file(".github/workflows/verify.yml").text());' && echo OK`
Expected: `OK`.

- [ ] **Step 3: Run the contract test from Task 1 — must PASS now**

Run: `bun test packages/cli/src/__tests__/workflows-disabled.test.ts`
Expected: every workflow row passes; total 5 PASS.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/verify.yml packages/cli/src/__tests__/workflows-disabled.test.ts
git commit -m "ci(verify): add full pipeline workflow with manual trigger only"
```

---

### Task 7: Add ADR-0006

**Files:**
- Create: `docs/adr/0006-workflows-disabled-by-default.md`

- [ ] **Step 1: Create the ADR**

```markdown
# ADR-0006: GitHub Actions workflows disabled by default

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

au-agentic is currently a personal project in active toolchain refactoring. The owner does not want commits, pushes, or PRs to consume GitHub Actions minutes during this period. Local pre-commit hooks (Lefthook) and `bun run verify` already cover the same checks, and the spec's performance budgets keep them fast.

## Decision

Every workflow file in `.github/workflows/` declares `on: workflow_dispatch` only — no `push`, `pull_request`, `schedule`, or release event triggers. Workflows still exist, are version-controlled, and can be triggered manually from the Actions UI or `gh workflow run <name>`.

The new `verify.yml` is the canonical full pipeline: Bun setup, Bun install cache, Turbo cache, `bun run verify`, `bunx knip`, `bunx markdownlint-cli2`, `bun run perf`, gitleaks full scan, and artifact uploads for coverage and benchmark.

## Consequences

**Positive**
- Zero unintended Actions minutes
- Workflows are still tracked and reviewable
- Manual trigger remains available for ad-hoc verification or release runs
- Forces local verification discipline (which the spec already enforces)

**Negative**
- No automatic safety net for unrelated repository hygiene (e.g., dependency vulnerability alerts)
- Contributors who skip pre-commit hooks (`--no-verify`) can land broken code without immediate CI catching it
- To re-enable any workflow, both the `on:` block and any related branch protection must be updated together

## Alternatives considered

- **Auto-trigger on PR only**: rejected because PR ergonomics still cost minutes on every push to a PR branch
- **Schedule-only daily verify**: rejected because feedback latency does not match TDD workflow
- **Delete the workflow files entirely**: rejected because losing the configuration loses institutional knowledge; manual trigger preserves them

## Reactivation procedure

See `docs/deployment/runbooks.md` for the "Activate CI workflows" runbook.

## References

- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.12
```

- [ ] **Step 2: Commit**

```bash
git add docs/adr/0006-workflows-disabled-by-default.md
git commit -m "docs(adr): record workflows-disabled-by-default policy"
```

---

### Task 8: Update `docs/ai/deployment-policy.md`

**Files:**
- Modify: `docs/ai/deployment-policy.md`

- [ ] **Step 1: Add a section near the top**

```markdown

## CI policy: manual trigger only

All five workflow files (`ci.yml`, `docs-check.yml`, `release.yml`, `security.yml`, `verify.yml`) declare `on: workflow_dispatch` only. No push, pull-request, merge, or schedule event will start an Actions run.

To run a workflow:

- Web UI: GitHub → Actions tab → select workflow → "Run workflow" button → choose branch and reason
- CLI: `gh workflow run verify.yml --ref <branch> -f reason="<why>"`

Never re-enable auto-triggers without updating ADR-0006 and the runbook.
```

- [ ] **Step 2: Commit**

```bash
git add docs/ai/deployment-policy.md
git commit -m "docs(ai): document workflow_dispatch-only CI policy"
```

---

### Task 9: Update `docs/development/branching-and-prs.md`

**Files:**
- Modify: `docs/development/branching-and-prs.md`

- [ ] **Step 1: Append a "CI status" section**

```markdown

## CI status on PRs

CI is currently manual-trigger only. Opening a PR or pushing a commit does **not** start any GitHub Action. To get CI verification on a PR:

1. From the PR page, click the Actions tab in the repo nav
2. Choose `Verify` workflow → Run workflow → select the PR branch
3. Wait for the run to complete; results show in the workflow page (not on the PR conversation)

Local verification remains mandatory before requesting review:

```bash
bun run verify
bun run perf
```

If a PR cannot pass `bun run verify` locally, do not request review.
```

- [ ] **Step 2: Commit**

```bash
git add docs/development/branching-and-prs.md
git commit -m "docs(dev): document manual CI trigger procedure for PRs"
```

---

### Task 10: Update `docs/deployment/deployment.md` and `runbooks.md`

**Files:**
- Modify: `docs/deployment/deployment.md`
- Modify: `docs/deployment/runbooks.md`

- [ ] **Step 1: Add a "CI" section to `deployment.md`**

```markdown

## CI workflows

All workflows are manual-trigger only (`on: workflow_dispatch`). See `docs/adr/0006-workflows-disabled-by-default.md` for rationale.

For release deployment, the operator runs `release.yml` manually after merging the release commit. Pre-deployment verification: run `verify.yml` first, confirm green, then trigger `release.yml`.
```

- [ ] **Step 2: Add a runbook entry to `runbooks.md`**

```markdown

## Runbook: Activate CI workflows (re-enable auto-triggers)

When au-agentic moves out of toolchain refactoring and is ready for collaborative development with auto-CI, follow these steps. **Do not** activate piecemeal; activate as a coordinated change.

1. Update `docs/adr/0006-workflows-disabled-by-default.md` to `Status: Superseded` and add a follow-up ADR explaining the new policy.
2. Edit each workflow's `on:` block. For `verify.yml`, the recommended replacement is:

   ```yaml
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
     workflow_dispatch:
   ```

3. Configure branch protection on `main`:
    - Require status check `verify` to pass before merge
    - Require linear history if applicable
    - Require pull-request review

4. (Optional) Enable Turbo Remote Cache via `TURBO_TOKEN` and `TURBO_TEAM` repo secrets to keep CI fast. Add the env vars to each cache-using job.

5. Update `docs/ai/deployment-policy.md` to remove the manual-trigger language.

6. Open a PR titled "Activate CI auto-triggers" so the change is reviewable as a single unit.

## Runbook: Re-run benchmark on demand

```bash
bun run perf
```

Commit the refreshed `docs/development/performance-benchmarks.md` if a row drifted by more than 50% from the previous baseline.
```

- [ ] **Step 3: Commit**

```bash
git add docs/deployment/deployment.md docs/deployment/runbooks.md
git commit -m "docs(deployment): add CI activation runbook and benchmark re-run runbook"
```

---

### Task 11: Final verification gate

- [ ] **Step 1: Run verify**

Run: `bun run verify`
Expected: Exit code 0; the new workflows-disabled test passes.

- [ ] **Step 2: Confirm trigger inspection across all workflows**

Run: `for f in .github/workflows/*.yml; do echo "=== $f ==="; head -10 "$f"; done`
Expected: every file's `on:` block lists only `workflow_dispatch`.

- [ ] **Step 3: Run perf**

Run: `bun run perf`
Expected: zero FAIL.

- [ ] **Step 4: Tag the phase**

```bash
git tag -a phase-5-ci-disabled -m "Phase 5 of toolchain production-readiness complete"
```

---

## Phase 5 Definition of Done

- [ ] All 11 tasks completed and committed
- [ ] `bun run verify` exits 0
- [ ] All five workflow files use `on: workflow_dispatch` only; the contract test asserts this
- [ ] `verify.yml` exists with the full Turbo + Bun + gitleaks + perf pipeline
- [ ] ADR-0006 committed
- [ ] `docs/ai/deployment-policy.md`, `docs/development/branching-and-prs.md`, `docs/deployment/deployment.md`, `docs/deployment/runbooks.md` reflect the new state
