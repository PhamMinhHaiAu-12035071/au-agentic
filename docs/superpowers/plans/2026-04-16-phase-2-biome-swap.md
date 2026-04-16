# Phase 2 — Biome Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ESLint v9 + typescript-eslint with Biome v2 as the single tool for lint, format, and organize-imports. Remove all superseded devDependencies.

**Architecture:** Biome runs as the sole lint/format binary. The `lint-staged` glob temporarily routes to Biome (until Phase 3 introduces Lefthook). Husky and lint-staged remain installed in this phase to keep the existing pre-commit working — they are removed in Phase 3.

**Tech Stack:** Biome v2.3, Bun 1.3.10.

**Spec reference:** `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.1; Phase 2 in Section 9.

**Depends on:** Phase 1 (foundations) merged.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `biome.json` | Create | Single config for lint, format, organize-imports, filename rule |
| `package.json` (root) | Modify | Add `@biomejs/biome` devDep; replace `lint`/`format` scripts; remove ESLint deps |
| `eslint.config.ts` | Delete | No longer used |
| `packages/cli/package.json` | Modify | Wire `lint`/`format`/`check` scripts |
| `packages/cli/src/__tests__/biome-config.test.ts` | Create | TDD: assert `biome.json` schema parses and key rules are enabled |
| `docs/ai/coding-rules.md` | Modify | Update lint stack section; remove ESLint mention |
| `docs/development/styleguide.md` | Modify | Replace ESLint section with Biome rules |
| `docs/development/dependency-policy.md` | Modify | New devDeps list |
| `docs/adr/0002-biome-over-eslint-prettier.md` | Create | ADR for tool choice |

---

### Task 1: Install Biome v2 as devDependency

**Files:**
- Modify: `package.json` (root)
- Modify: `bun.lock`

- [ ] **Step 1: Install Biome v2**

Run: `bun add -D @biomejs/biome@^2.3.0`
Expected: `bun.lock` updated; `package.json` devDependencies includes `@biomejs/biome`.

- [ ] **Step 2: Verify the binary works**

Run: `bunx biome --version`
Expected: a version string starting with `2.3` or higher.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore(deps): add @biomejs/biome v2 devDependency"
```

---

### Task 2: TDD — write a failing test that asserts `biome.json` has required rules enabled

**Files:**
- Create: `packages/cli/src/__tests__/biome-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('biome.json contract', () => {
  const repoRoot = join(import.meta.dir, '../../../..');
  const config = JSON.parse(readFileSync(join(repoRoot, 'biome.json'), 'utf-8'));

  it('enables formatter and linter', () => {
    expect(config.formatter?.enabled).toBe(true);
    expect(config.linter?.enabled).toBe(true);
  });

  it('enforces kebab-case filenames', () => {
    const rule = config.linter?.rules?.style?.useFilenamingConvention;
    expect(rule?.level).toBe('error');
    expect(rule?.options?.filenameCases).toContain('kebab-case');
  });

  it('blocks focused tests and empty blocks', () => {
    expect(config.linter?.rules?.suspicious?.noFocusedTests).toBe('error');
    expect(config.linter?.rules?.suspicious?.noEmptyBlockStatements).toBe('error');
  });

  it('blocks unused imports', () => {
    expect(config.linter?.rules?.correctness?.noUnusedImports).toBe('error');
  });

  it('enables organizeImports', () => {
    expect(config.organizeImports?.enabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test — must FAIL because `biome.json` does not exist yet**

Run: `bun test packages/cli/src/__tests__/biome-config.test.ts`
Expected: FAIL with `ENOENT: no such file or directory` for `biome.json`.

---

### Task 3: Create `biome.json` to make the test pass

**Files:**
- Create: `biome.json` (repo root)

- [ ] **Step 1: Create `biome.json` with the full config**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignoreUnknown": true,
    "ignore": ["**/dist/**", "**/.turbo/**", "**/coverage/**", "**/node_modules/**"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useFilenamingConvention": {
          "level": "error",
          "options": { "filenameCases": ["kebab-case"] }
        }
      },
      "suspicious": {
        "noFocusedTests": "error",
        "noEmptyBlockStatements": "error"
      },
      "correctness": {
        "noUnusedImports": "error"
      }
    },
    "ignore": ["packages/templates/**"]
  },
  "organizeImports": { "enabled": true }
}
```

- [ ] **Step 2: Re-run the test — must PASS**

Run: `bun test packages/cli/src/__tests__/biome-config.test.ts`
Expected: `5 pass, 0 fail`.

- [ ] **Step 3: Commit**

```bash
git add biome.json packages/cli/src/__tests__/biome-config.test.ts
git commit -m "feat(tooling): add biome.json with lint, format, filename, anti-rác rules"
```

---

### Task 4: Apply Biome formatting and lint fixes across the repo

**Files:**
- Auto-formats: every TS/JSON/MD file matching `biome.json` globs

- [ ] **Step 1: Run Biome check with auto-fix**

Run: `bunx biome check --write .`
Expected: stdout reports formatted/fixed file count; exit code 0 if no unfixable errors.

- [ ] **Step 2: Inspect the diff**

Run: `git diff --stat`
Expected: a number of `.ts` files modified with whitespace and import-ordering changes. No semantic code changes.

- [ ] **Step 3: Run `bun run verify` to ensure tests still pass**

Run: `bun run verify`
Expected: Exit code 0.

- [ ] **Step 4: Commit the formatted tree**

```bash
git add -A
git commit -m "style: apply biome check --write across repo"
```

If Biome reports unfixable lint errors (for example a real `noUnusedImports` violation), fix them by hand in a separate commit before re-running verify.

---

### Task 5: Wire root `package.json` scripts to Biome

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Read current scripts block**

Run: `grep -A20 '"scripts"' package.json | head -25`

Expected current scripts (relevant subset):

```json
{
  "scripts": {
    "test": "bun test packages/cli/src/__tests__/",
    "typecheck": "tsc --noEmit",
    "lint": "eslint packages/",
    "verify": "bun run typecheck && bun run lint && bun run test",
    ...
  }
}
```

- [ ] **Step 2: Update scripts to use Biome (Turborepo wiring is Phase 4; for now keep the chain)**

Replace the `lint` script and add `format` and `check`:

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
    "prepublish": "bun run verify && bun run build",
    "prepare": "husky"
  }
}
```

- [ ] **Step 3: Update `lint-staged` block to call Biome instead of ESLint**

In `package.json`, replace the `lint-staged` section:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,json,md}": [
      "biome check --write --no-errors-on-unmatched"
    ],
    "*.ts": [
      "tsc --noEmit"
    ]
  }
}
```

- [ ] **Step 4: Run lint and format via the new scripts**

Run: `bun run lint`
Expected: Exit code 0.
Run: `bun run format`
Expected: Exit code 0; if any file changed, stage and commit it before continuing.
Run: `bun run verify`
Expected: Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore(scripts): route lint/format/check through Biome; lint-staged uses biome"
```

---

### Task 6: Delete `eslint.config.ts`

**Files:**
- Delete: `eslint.config.ts`

- [ ] **Step 1: Confirm no other file references `eslint.config.ts`**

Run: `grep -rn 'eslint.config' --exclude-dir=node_modules --exclude-dir=.git .`
Expected: only matches inside `package.json` `lint-staged` (already removed in Task 5) and any docs you will update in Tasks 8–10.

- [ ] **Step 2: Delete the file**

```bash
git rm eslint.config.ts
```

- [ ] **Step 3: Run verify**

Run: `bun run verify`
Expected: Exit code 0.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(deps): remove eslint.config.ts; Biome supersedes ESLint"
```

---

### Task 7: Remove ESLint and related devDependencies

**Files:**
- Modify: `package.json` (root)
- Modify: `bun.lock`

- [ ] **Step 1: Remove the packages**

Run:

```bash
bun remove eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser globals
```

Expected: `package.json` devDependencies no longer lists those five entries; `bun.lock` updated.

- [ ] **Step 2: Run verify to confirm nothing broke**

Run: `bun run verify`
Expected: Exit code 0.

- [ ] **Step 3: Verify the packages are gone from `bun.lock`**

Run: `grep -c '"eslint"' bun.lock`
Expected: `0`.

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -m "chore(deps): drop eslint, typescript-eslint, globals (replaced by Biome)"
```

---

### Task 8: Add ADR-0002

**Files:**
- Create: `docs/adr/0002-biome-over-eslint-prettier.md`

- [ ] **Step 1: Create the ADR**

```markdown
# ADR-0002: Adopt Biome v2 in place of ESLint and Prettier

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

au-agentic is a small TypeScript-only Bun monorepo (two packages, no React/framework plugins). The previous setup used ESLint v9 with `typescript-eslint`, but had no formatter at all. Adding Prettier would have introduced two more devDependencies (`prettier`, `eslint-config-prettier`) and a coordination dance between the two tools. The user prioritizes fast TDD feedback and minimal config.

## Decision

Use Biome v2 as the single tool for lint, format, organize-imports, and filename enforcement. Drop ESLint, `typescript-eslint`, `globals`, and `@eslint/js` devDependencies. Do not introduce Prettier.

## Consequences

**Positive**
- One CLI, one config file (`biome.json`)
- Roughly 10–25× faster than ESLint on TypeScript files
- Built-in `useFilenamingConvention` covers what `eslint-plugin-check-file` would have provided
- `noFocusedTests`, `noEmptyBlockStatements`, `noUnusedImports` directly support the user's anti-"rác"-test stance
- Reduced devDependency count (5 packages removed, 1 added)

**Negative**
- Smaller plugin ecosystem than ESLint (no `eslint-plugin-import`, `eslint-plugin-testing-library`, `eslint-plugin-security`)
- Some deeply type-aware rules from `typescript-eslint` (e.g., `no-floating-promises`) are still maturing in Biome v2; revisit in 6 months if a critical rule is missing
- No custom-rule plugin API yet; teams that want to author repository-specific lint rules cannot do so today

## Alternatives considered

- **Keep ESLint, add Prettier**: rejected because of dual-tool coordination cost and slower feedback for TDD
- **Hybrid (Biome format + ESLint lint)**: rejected because it perpetuates the dual-config problem and adds Oxlint as a third tool
- **Oxlint only**: rejected because formatter is missing; pairing with another tool defeats the simplicity goal

## References

- Biome v2 release notes: https://biomejs.dev/blog/biome-v2/
- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.1
```

- [ ] **Step 2: Commit**

```bash
git add docs/adr/0002-biome-over-eslint-prettier.md
git commit -m "docs(adr): record Biome over ESLint+Prettier decision"
```

---

### Task 9: Update `docs/ai/coding-rules.md` lint section

**Files:**
- Modify: `docs/ai/coding-rules.md`

- [ ] **Step 1: Find the section that mentions ESLint**

Run: `grep -n -i eslint docs/ai/coding-rules.md`
Expected: a few line numbers.

- [ ] **Step 2: Replace any ESLint mention with Biome**

For each match, edit the line. The most likely location is the `Coding Conventions` or `TypeScript Conventions` section. Add a new `Linting and Formatting` subsection if absent:

```markdown
## Linting and Formatting

au-agentic uses **Biome v2** as the single tool for lint, format, and organize-imports. Configuration lives in `biome.json`.

- `bun run lint` — lint only
- `bun run format` — format only
- `bun run check` — lint + format + organize-imports in one pass

Key rules enforced (see `biome.json` for the full list):

- `useFilenamingConvention` — kebab-case filenames
- `noFocusedTests` — no `.only` left in committed code
- `noEmptyBlockStatements` — no empty test bodies (anti-"rác" guardrail)
- `noUnusedImports` — keep imports tidy

Do not add ESLint, Prettier, `typescript-eslint`, `eslint-config-prettier`, or any `eslint-plugin-*` package. Biome covers their roles.
```

- [ ] **Step 3: Commit**

```bash
git add docs/ai/coding-rules.md
git commit -m "docs(ai): replace ESLint section with Biome guidance"
```

---

### Task 10: Update `docs/development/styleguide.md` and `dependency-policy.md`

**Files:**
- Modify: `docs/development/styleguide.md`
- Modify: `docs/development/dependency-policy.md`

- [ ] **Step 1: Read styleguide and find ESLint section**

Run: `grep -n -i eslint docs/development/styleguide.md`

- [ ] **Step 2: Replace any ESLint section in styleguide.md with**

```markdown
## Lint and format

The repo uses **Biome v2**. Run `bun run check` before committing; the pre-commit hook enforces this on staged files.

Filename convention: kebab-case (enforced by `useFilenamingConvention`). Test files: `<source>.test.ts` colocated under `src/__tests__/`.

Indent: 2 spaces (enforced by `.editorconfig` and Biome).

Line width: 100 characters (Biome `formatter.lineWidth`).

Imports: organized by Biome; do not hand-sort. Use `imports` field aliases (`#utils/*`, `#steps/*`) instead of relative paths that cross more than one directory.
```

- [ ] **Step 3: Update `docs/development/dependency-policy.md`**

If the file does not yet have an explicit devDeps list, append:

```markdown
## Current devDependencies (root)

| Package | Purpose |
|---|---|
| `@biomejs/biome` | Lint, format, organize-imports |
| `@commitlint/cli` | Commit message validation |
| `@commitlint/config-conventional` | Conventional Commits ruleset |
| `@commitlint/types` | TypeScript types for commitlint config |
| `@types/bun` | Bun runtime types for editor and typecheck |
| `husky` | Git hooks (Phase 2 only — superseded in Phase 3) |
| `lint-staged` | Staged-file runner (Phase 2 only — superseded in Phase 3) |
| `typescript` | Typecheck, no emit |

Removed in Phase 2: `eslint`, `@eslint/js`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `globals`.

Add a devDependency only when an existing tool cannot cover the need. Always pin major versions.
```

- [ ] **Step 4: Commit**

```bash
git add docs/development/styleguide.md docs/development/dependency-policy.md
git commit -m "docs(dev): refresh styleguide and dependency policy for Biome"
```

---

### Task 11: Final verification gate

- [ ] **Step 1: Run verify**

Run: `bun run verify`
Expected: Exit code 0.

- [ ] **Step 2: Confirm no ESLint binary or config remains**

Run: `ls eslint.config.* 2>&1; bun pm ls | grep -i eslint`
Expected: no files; no eslint package listed.

- [ ] **Step 3: Confirm Biome integration in pre-commit (sanity check existing Husky hook)**

Stage a file with a deliberate format violation:

```bash
echo 'const x={a:1,b:2}' > /tmp/check.ts
cp /tmp/check.ts packages/cli/src/scratch.ts
git add packages/cli/src/scratch.ts
git commit -m "chore: scratch test"  # if husky still wired, lint-staged should run biome and reformat
```

Expected: commit succeeds; `packages/cli/src/scratch.ts` was reformatted by Biome before commit.

Cleanup:

```bash
git rm packages/cli/src/scratch.ts
git commit -m "chore: remove scratch file"
```

- [ ] **Step 4: Tag the phase**

```bash
git tag -a phase-2-biome-swap -m "Phase 2 of toolchain production-readiness complete"
```

---

## Phase 2 Definition of Done

- [ ] All 11 tasks completed and committed
- [ ] `bun run verify` exits 0
- [ ] `biome.json` exists and the contract test in `biome-config.test.ts` passes
- [ ] `eslint.config.ts` deleted; ESLint family devDeps removed from `package.json` and `bun.lock`
- [ ] `bun run lint`, `bun run format`, `bun run check` all work
- [ ] Pre-commit (Husky + lint-staged still in place this phase) auto-formats staged files via Biome
- [ ] ADR-0002 committed
- [ ] `docs/ai/coding-rules.md`, `docs/development/styleguide.md`, `docs/development/dependency-policy.md` reflect the new state
