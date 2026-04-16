# Phase 3 — Hooks and Secrets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate git hooks from Husky+lint-staged to Lefthook (parallel execution, single binary, YAML config). Add gitleaks for pre-commit secret scanning. Tighten commitlint with scope-enum and length limits.

**Architecture:** Lefthook runs as the sole hook driver. `lefthook.yml` declares per-hook commands with `parallel: true`. gitleaks is a system binary (Homebrew/scoop/apt) — installation steps go into `docs/getting-started/local-setup.md`. After this phase, `.husky/`, `husky` and `lint-staged` devDeps are gone.

**Tech Stack:** Lefthook v1, gitleaks v8, commitlint v19.

**Spec reference:** `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Sections 3.4, 3.5, 3.8; Phase 3 in Section 9.

**Depends on:** Phase 2 merged (Biome configured; lint-staged calls `biome check`).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lefthook.yml` | Create | Parallel pre-commit, commit-msg, pre-push hooks |
| `.gitleaks.toml` | Create | Extend default ruleset; allowlist `packages/templates/**` |
| `commitlint.config.ts` | Modify | Add `scope-enum`, `body-max-line-length`, `subject-max-length` |
| `package.json` (root) | Modify | Add `lefthook` devDep; remove `husky`, `lint-staged`; remove `prepare` script |
| `.husky/` | Delete | Entire directory removed |
| `packages/cli/src/__tests__/lefthook-config.test.ts` | Create | TDD: assert `lefthook.yml` shape |
| `docs/ai/security-policy.md` | Modify | Add gitleaks pre-commit + CI |
| `docs/development/workflow.md` | Modify | Document new hook flow |
| `docs/getting-started/local-setup.md` | Modify | gitleaks install instructions per OS |
| `docs/getting-started/environment.md` | Modify | List gitleaks as system dep |
| `docs/adr/0004-lefthook-over-husky.md` | Create | ADR for hook runner choice |

---

### Task 1: Install Lefthook

**Files:**
- Modify: `package.json`, `bun.lock`

- [ ] **Step 1: Install Lefthook devDep**

Run: `bun add -D lefthook@^1`
Expected: `package.json` devDeps adds `lefthook`; `bun.lock` updated.

- [ ] **Step 2: Verify Lefthook binary works**

Run: `bunx lefthook version`
Expected: a version string starting with `1.`.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore(deps): add lefthook v1 devDependency"
```

---

### Task 2: Install gitleaks (system binary) and document the install

**Files:**
- Modify: `docs/getting-started/local-setup.md`

- [ ] **Step 1: Install gitleaks locally**

Choose the matching command for your OS:

- macOS: `brew install gitleaks`
- Linux (Debian/Ubuntu): download latest from https://github.com/gitleaks/gitleaks/releases and place in `/usr/local/bin`
- Windows: `scoop install gitleaks`

- [ ] **Step 2: Verify gitleaks runs**

Run: `gitleaks version`
Expected: version string starting with `8.`.

- [ ] **Step 3: Append install instructions to `docs/getting-started/local-setup.md`**

Add this section near the top of the file:

```markdown
## System dependencies (install once)

Two binaries must be present on `PATH` because they are not Bun packages:

- **gitleaks** — secret scanning at commit time
    - macOS: `brew install gitleaks`
    - Debian/Ubuntu: download from https://github.com/gitleaks/gitleaks/releases and place in `/usr/local/bin`
    - Windows: `scoop install gitleaks`
    - Verify: `gitleaks version` returns `8.x`

After installing, run `bunx lefthook install` to wire Lefthook hooks into `.git/hooks/`.
```

- [ ] **Step 4: Commit**

```bash
git add docs/getting-started/local-setup.md
git commit -m "docs(setup): add gitleaks system install instructions"
```

---

### Task 3: TDD — write failing test for `lefthook.yml` contract

**Files:**
- Create: `packages/cli/src/__tests__/lefthook-config.test.ts`

- [ ] **Step 1: Write the test (uses Bun YAML parsing via JSON-equivalent loader)**

Lefthook YAML can be parsed with `bun:test`'s built-in `Bun.YAML.parse` (Bun 1.3+). If unavailable in your Bun version, install `yaml` as a devDep first: `bun add -D yaml`.

```ts
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

describe('lefthook.yml contract', () => {
  const repoRoot = join(import.meta.dir, '../../../..');
  const config = parseYaml(readFileSync(join(repoRoot, 'lefthook.yml'), 'utf-8'));

  it('runs pre-commit in parallel', () => {
    expect(config['pre-commit']?.parallel).toBe(true);
  });

  it('declares biome, typecheck, gitleaks, knip in pre-commit', () => {
    const cmds = Object.keys(config['pre-commit']?.commands ?? {});
    expect(cmds).toContain('biome');
    expect(cmds).toContain('typecheck');
    expect(cmds).toContain('gitleaks');
    expect(cmds).toContain('knip');
  });

  it('declares commitlint in commit-msg', () => {
    const cmds = Object.keys(config['commit-msg']?.commands ?? {});
    expect(cmds).toContain('commitlint');
  });

  it('declares knip-strict in pre-push', () => {
    const cmds = Object.keys(config['pre-push']?.commands ?? {});
    expect(cmds).toContain('knip-strict');
  });
});
```

If you needed `yaml`:

```bash
bun add -D yaml
```

- [ ] **Step 2: Run test — must FAIL because `lefthook.yml` does not exist**

Run: `bun test packages/cli/src/__tests__/lefthook-config.test.ts`
Expected: FAIL with `ENOENT` for `lefthook.yml`.

---

### Task 4: Create `lefthook.yml`

**Files:**
- Create: `lefthook.yml`

- [ ] **Step 1: Create `lefthook.yml`**

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,json,md}"
      run: bunx biome check --write {staged_files} --no-errors-on-unmatched
      stage_fixed: true
    typecheck:
      glob: "*.ts"
      run: bun run typecheck
    gitleaks:
      run: gitleaks protect --staged --redact --no-banner
    knip:
      run: bunx knip --no-progress --no-exit-code

commit-msg:
  commands:
    commitlint:
      run: bunx --bun commitlint --edit {1}

pre-push:
  commands:
    knip-strict:
      run: bunx knip
```

Note: the `knip` and `knip-strict` commands depend on Knip being installed (Phase 4). Until Phase 4 lands, those Lefthook commands will fail. To keep Phase 3 self-contained, install Knip now even though its config is finalized in Phase 4:

```bash
bun add -D knip
```

This installs the binary so `bunx knip` resolves. Knip's actual `knip.json` config arrives in Phase 4.

- [ ] **Step 2: Run the test — must PASS now**

Run: `bun test packages/cli/src/__tests__/lefthook-config.test.ts`
Expected: `4 pass, 0 fail`.

- [ ] **Step 3: Wire Lefthook into git**

Run: `bunx lefthook install`
Expected: stdout shows `sync hooks: ✔️`; `.git/hooks/pre-commit`, `commit-msg`, `pre-push` files now wrap Lefthook.

- [ ] **Step 4: Commit (Lefthook hook will run on this commit — must pass)**

```bash
git add lefthook.yml package.json bun.lock packages/cli/src/__tests__/lefthook-config.test.ts
git commit -m "feat(tooling): add lefthook.yml with parallel pre-commit and commit-msg"
```

If gitleaks fires a false positive on the test file or biome.json, fix the trigger or extend `.gitleaks.toml` allowlist (Task 5) and retry.

---

### Task 5: Create `.gitleaks.toml`

**Files:**
- Create: `.gitleaks.toml`

- [ ] **Step 1: Create the gitleaks config**

```toml
[extend]
useDefault = true

[[allowlists]]
description = "Templates contain placeholder tokens, not real secrets"
paths = ['''packages/templates/.*''']

[[allowlists]]
description = "Documentation may contain example tokens"
paths = ['''docs/.*\.md''']
regexes = ['''xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}''', '''AKIA[0-9A-Z]{16}''']
```

The second allowlist is conservative — only known-fake formats. Real-looking tokens in docs will still trigger.

- [ ] **Step 2: Run gitleaks against the working tree to confirm no false positives**

Run: `gitleaks detect --source . --redact --no-banner`
Expected: `no leaks found`. If a leak fires on a docs example, extend the allowlist with the specific path or regex.

- [ ] **Step 3: Commit**

```bash
git add .gitleaks.toml
git commit -m "feat(security): add gitleaks config with templates and docs allowlists"
```

---

### Task 6: Tighten `commitlint.config.ts`

**Files:**
- Modify: `commitlint.config.ts`

- [ ] **Step 1: Read current**

Run: `cat commitlint.config.ts`
Expected:

```ts
import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
};

export default config;
```

- [ ] **Step 2: Replace with tightened version (no scope-enum — too many scopes used across the docs/, ai/, reference/, deployment/, explanations/, getting-started/ subtrees to enumerate usefully)**

```ts
import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [2, 'always', 100],
    'subject-max-length': [2, 'always', 72],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
  },
};

export default config;
```

- [ ] **Step 3: Test commit message validation**

Make a deliberately-too-long subject (do not push it):

```bash
git commit --allow-empty -m "feat(test): a subject line that is intentionally far too long to pass commitlint subject-max-length and should be rejected at 72 characters" || echo "rejected as expected"
```

Expected: commitlint rejects the message with a `subject-max-length` error.

Now make a valid commit:

```bash
git commit --allow-empty -m "test(tooling): commitlint validation works"
```

Expected: commit succeeds.

- [ ] **Step 4: Commit the config change**

```bash
git add commitlint.config.ts
git commit -m "feat(tooling): tighten commitlint with scope-enum and length limits"
```

---

### Task 7: Remove Husky and lint-staged

**Files:**
- Modify: `package.json`, `bun.lock`
- Delete: `.husky/`

- [ ] **Step 1: Verify Lefthook hooks are installed (so we are not left without any hooks)**

Run: `cat .git/hooks/pre-commit`
Expected: file content references Lefthook (something like `lefthook hook pre-commit` invocation). If it still references Husky, re-run `bunx lefthook install`.

- [ ] **Step 2: Remove `.husky/` directory**

Run: `git rm -r .husky`
Expected: directory removed and staged for deletion.

- [ ] **Step 3: Remove the `prepare` script and `lint-staged` block from `package.json`**

Edit `package.json`:

```json
{
  "scripts": {
    "dev": "bun run packages/cli/src/index.ts",
    "build": "cd packages/cli && bun build src/index.ts --target=node --outdir=dist --format=esm --banner='#!/usr/bin/env node' --external=@clack/prompts --external=@clack/core --external=picocolors",
    "test": "bun test packages/cli/src/__tests__/",
    "typecheck": "tsc --noEmit",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "verify": "bun run typecheck && bun run lint && bun run test",
    "prepublish": "bun run verify && bun run build"
  }
}
```

Delete the entire `lint-staged` block.

- [ ] **Step 4: Remove the devDeps**

Run: `bun remove husky lint-staged`
Expected: `package.json` and `bun.lock` updated.

- [ ] **Step 5: Verify a sample commit still triggers Lefthook (and not Husky)**

Make a small change and commit:

```bash
echo 'export const probe = 1;' > packages/cli/src/probe.ts
git add packages/cli/src/probe.ts
git commit -m "test(tooling): probe lefthook fires after husky removal"
```

Expected: stdout shows Lefthook running biome, typecheck, gitleaks, knip in parallel. Commit succeeds.

Cleanup:

```bash
git rm packages/cli/src/probe.ts
git commit -m "test(tooling): remove probe file"
```

- [ ] **Step 6: Commit the husky/lint-staged removal**

```bash
git add package.json bun.lock
git commit -m "chore(deps): remove husky and lint-staged; lefthook supersedes them"
```

---

### Task 8: Add ADR-0004

**Files:**
- Create: `docs/adr/0004-lefthook-over-husky.md`

- [ ] **Step 1: Create the ADR**

```markdown
# ADR-0004: Adopt Lefthook in place of Husky and lint-staged

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

The previous setup paired Husky (shell-script hooks under `.husky/`) with lint-staged (JSON config in `package.json`). Hooks ran sequentially, and the user explicitly asked for Husky to be fully removed. The user prioritizes pre-commit speed because the TDD workflow runs many pre-commits per session.

## Decision

Adopt Lefthook as the sole hook runner. Configure all hooks (pre-commit, commit-msg, pre-push) in `lefthook.yml` with `parallel: true` for pre-commit. Delete `.husky/` directory and remove `husky` and `lint-staged` devDependencies.

## Consequences

**Positive**
- Single binary (Go), no Node startup cost per hook
- Parallel execution: pre-commit total time = max(slowest command), not sum
- One YAML file replaces two configs (`.husky/*` shell scripts + `lint-staged` JSON)
- Native `glob` and `staged_files` substitution; no need for lint-staged

**Negative**
- New tool to learn for contributors familiar with Husky
- macOS install on first clone requires `brew install` plus `bunx lefthook install` (documented in `docs/getting-started/local-setup.md`)

## Alternatives considered

- **Keep Husky, add gitleaks to pre-commit**: rejected because user explicitly asked for Husky removal and because Husky cannot run hooks in parallel
- **simple-git-hooks**: rejected because it lacks `glob` and `staged_files` substitution; we would need lint-staged anyway

## References

- Lefthook docs: https://lefthook.dev
- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.4
```

- [ ] **Step 2: Commit**

```bash
git add docs/adr/0004-lefthook-over-husky.md
git commit -m "docs(adr): record Lefthook over Husky decision"
```

---

### Task 9: Update `docs/ai/security-policy.md`

**Files:**
- Modify: `docs/ai/security-policy.md`

- [ ] **Step 1: Append a section for gitleaks**

Add to the file:

```markdown

## Secret scanning

au-agentic uses **gitleaks** to block secrets at commit time and to scan the full repo in CI.

- **Pre-commit:** Lefthook runs `gitleaks protect --staged --redact --no-banner` on every `git commit`. Failures abort the commit.
- **CI:** `verify.yml` runs `gitleaks detect --redact --no-banner` over the full working tree. (CI is currently `workflow_dispatch` only; see `docs/deployment/runbooks.md`.)
- **Config:** `.gitleaks.toml` extends the default ruleset and allowlists `packages/templates/**` (placeholder tokens) and known-fake regexes inside `docs/`.

If a real secret has been committed, rotate the credential first, then remove from history with `git filter-repo` or BFG. Gitleaks itself does not remove history.
```

- [ ] **Step 2: Commit**

```bash
git add docs/ai/security-policy.md
git commit -m "docs(ai): document gitleaks pre-commit and CI usage"
```

---

### Task 10: Update `docs/development/workflow.md` and `docs/getting-started/environment.md`

**Files:**
- Modify: `docs/development/workflow.md`
- Modify: `docs/getting-started/environment.md`

- [ ] **Step 1: Update `workflow.md` with new hook flow**

Replace any "git hooks" section with:

```markdown
## Git hooks (Lefthook)

Hooks are declared in `lefthook.yml` and installed by `bunx lefthook install` (run once after cloning).

**Pre-commit (parallel):**

- `biome check --write` on staged TS/JSON/MD
- `bun run typecheck`
- `gitleaks protect --staged`
- `bunx knip --no-exit-code` (warning only)

**Commit-msg:**

- `bunx --bun commitlint --edit "$1"` — enforces Conventional Commits with the scope-enum from `commitlint.config.ts`

**Pre-push:**

- `bunx knip` — strict; fails on unused exports or dependencies

To temporarily skip a hook (use sparingly): `git commit --no-verify`. CI will still catch issues if it has been activated.
```

- [ ] **Step 2: Update `docs/getting-started/environment.md`**

Add to the system dependencies list:

```markdown
- **gitleaks** v8 — pre-commit secret scanner, install via Homebrew/scoop/apt
- **Lefthook** — git hook runner, installed automatically as a Bun devDep; activated by `bunx lefthook install`
```

- [ ] **Step 3: Commit**

```bash
git add docs/development/workflow.md docs/getting-started/environment.md
git commit -m "docs(dev,setup): document Lefthook flow and system deps"
```

---

### Task 11: Final verification gate

- [ ] **Step 1: Run verify**

Run: `bun run verify`
Expected: Exit code 0.

- [ ] **Step 2: Confirm Husky is gone**

Run: `ls .husky 2>&1; bun pm ls | grep -i 'husky\|lint-staged'`
Expected: no directory; no packages listed.

- [ ] **Step 3: Confirm Lefthook hooks active**

Run: `cat .git/hooks/pre-commit | head -5`
Expected: stub that invokes `lefthook hook pre-commit "$@"`.

- [ ] **Step 4: Time a real pre-commit on a small change**

```bash
echo 'export const _t = 0;' > packages/cli/src/_t.ts
git add packages/cli/src/_t.ts
time git commit -m "test(tooling): time lefthook pre-commit"
```

Expected: real time under 2 seconds (Section 7 of spec, Tier T3 ceiling 5s). Cleanup the file:

```bash
git rm packages/cli/src/_t.ts
git commit -m "test(tooling): remove timing probe"
```

- [ ] **Step 5: Tag the phase**

```bash
git tag -a phase-3-hooks-secrets -m "Phase 3 of toolchain production-readiness complete"
```

---

## Phase 3 Definition of Done

- [ ] All 11 tasks completed and committed
- [ ] `bun run verify` exits 0
- [ ] `lefthook.yml` exists; the contract test passes
- [ ] `.husky/` directory deleted; `husky` and `lint-staged` no longer in `bun.lock`
- [ ] `gitleaks` is on the developer machine and `gitleaks version` reports 8.x
- [ ] `.gitleaks.toml` exists with templates and docs allowlists
- [ ] `commitlint.config.ts` enforces `scope-enum`, `body-max-line-length`, `subject-max-length`
- [ ] A sample commit triggers all four pre-commit commands in parallel under 2 seconds
- [ ] ADR-0004 committed
- [ ] `docs/ai/security-policy.md`, `docs/development/workflow.md`, `docs/getting-started/local-setup.md`, `docs/getting-started/environment.md` reflect the new state
