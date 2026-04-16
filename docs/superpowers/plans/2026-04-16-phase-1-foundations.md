# Phase 1 — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the lowest-risk toolchain foundations: `.editorconfig`, expanded root `tsconfig.json`, per-package `tsconfig.json` extends, `imports` field path aliases (`#utils/*`, `#steps/*`), and `bunfig.toml` test coverage configuration.

**Architecture:** No tool swap in this phase — only additive changes. ESLint, Husky, lint-staged remain untouched. Verify command must still pass at the end of every task. New code uses the new alias style; existing relative imports stay until Phase 2 sweep.

**Tech Stack:** Bun 1.3.10, TypeScript 5.7, EditorConfig v0.16, Bun test (built-in), package.json `imports` field (Node 14+ standard).

**Spec reference:** `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Sections 3.3, 3.9, 3.10, 3.11; Phase 1 in Section 9.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `.editorconfig` | Create | UTF-8, LF, indent 2 space across editors |
| `tsconfig.json` (root) | Modify | Expand strict options; remains base file extended by packages |
| `packages/cli/tsconfig.json` | Modify | Extend root, add `paths` mirror for `#utils/*` and `#steps/*` |
| `packages/templates/tsconfig.json` | Create | Thin extends file for IDE consistency |
| `packages/cli/package.json` | Modify | Add `imports` field with `#utils/*` and `#steps/*` |
| `bunfig.toml` (root) | Create | Bun test coverage with LCOV reporter, per-file 70% threshold |
| `.gitignore` | Modify | Add `coverage/`, `*.tsbuildinfo`, `lcov.info` |
| `packages/cli/src/__tests__/aliases.test.ts` | Create | Verify `#utils/*` and `#steps/*` resolve via Bun runtime |
| `docs/ai/coding-rules.md` | Modify | Update import patterns section |
| `docs/ai/repo-map.md` | Modify | Add new config files; note tsconfig expanded |
| `docs/reference/configuration.md` | Modify | Document `.editorconfig`, `bunfig.toml`, `imports` field |
| `docs/reference/techstack.md` | Modify | Add EditorConfig and Bun test coverage entries |
| `docs/adr/0005-imports-field-alias-pattern.md` | Create | ADR for alias choice |

---

### Task 1: Add `.editorconfig`

**Files:**
- Create: `.editorconfig`

- [ ] **Step 1: Create `.editorconfig` at repo root**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 2: Verify file is detected by editors (manual check, no command)**

Open any `.ts` file in VSCode with the EditorConfig extension installed. The status bar should show "EditorConfig". If you do not have the extension, install `EditorConfig.EditorConfig`.

Expected: indent reads as 2 spaces; saving a file strips trailing whitespace (except in `.md`).

- [ ] **Step 3: Commit**

```bash
git add .editorconfig
git commit -m "chore(tooling): add .editorconfig for editor consistency"
```

---

### Task 2: Expand root `tsconfig.json` with stricter options

**Files:**
- Modify: `tsconfig.json` (root)

- [ ] **Step 1: Read current `tsconfig.json` to confirm starting state**

Run: `cat tsconfig.json`
Expected current content:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["bun"]
  }
}
```

- [ ] **Step 2: Replace `tsconfig.json` content with expanded version**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "incremental": true,
    "types": ["bun"]
  }
}
```

- [ ] **Step 3: Run typecheck to catch any regression from new strict flags**

Run: `bun run typecheck`
Expected: Exit code 0. If `noUncheckedIndexedAccess` flags any existing array access in `packages/cli/src/`, fix the access by adding an explicit length check or non-null assertion with a comment explaining why it is safe.

- [ ] **Step 4: Run full verify**

Run: `bun run verify`
Expected: Exit code 0 (typecheck + lint + test all pass).

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json
git commit -m "chore(tsconfig): enable noUncheckedIndexedAccess, verbatimModuleSyntax, incremental"
```

---

### Task 3: Tighten `packages/cli/tsconfig.json`

**Files:**
- Modify: `packages/cli/tsconfig.json`

- [ ] **Step 1: Read current file**

Run: `cat packages/cli/tsconfig.json`
Expected:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Replace with expanded version including `paths` mirror placeholder (paths added in Task 5)**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "./.tsbuildinfo",
    "baseUrl": "."
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Verify typecheck still passes**

Run: `bun run typecheck`
Expected: Exit code 0.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/tsconfig.json
git commit -m "chore(cli): add baseUrl and tsBuildInfoFile to tsconfig"
```

---

### Task 4: Create `packages/templates/tsconfig.json`

**Files:**
- Create: `packages/templates/tsconfig.json`

- [ ] **Step 1: Verify file does not yet exist**

Run: `ls packages/templates/tsconfig.json 2>&1`
Expected: `ls: packages/templates/tsconfig.json: No such file or directory`

- [ ] **Step 2: Create thin extends file**

```json
{
  "extends": "../../tsconfig.json",
  "include": []
}
```

`include: []` is intentional — the templates package has no TypeScript source, only Markdown templates. The file exists so editors and Biome see consistent settings when navigating into the workspace.

- [ ] **Step 3: Verify root typecheck unaffected**

Run: `bun run typecheck`
Expected: Exit code 0.

- [ ] **Step 4: Commit**

```bash
git add packages/templates/tsconfig.json
git commit -m "chore(templates): add tsconfig stub for IDE consistency"
```

---

### Task 5: Add `imports` field to `packages/cli/package.json` and `paths` mirror to its `tsconfig.json`

**Files:**
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/tsconfig.json`

- [ ] **Step 1: Read current `packages/cli/package.json`**

Run: `cat packages/cli/package.json`
Expected current content (truncated for relevance):

```json
{
  "name": "au-agentic",
  "version": "1.0.0",
  "type": "module",
  "bin": { "au-agentic": "dist/index.js" },
  "files": ["dist"],
  "dependencies": { "@au-agentic/templates": "workspace:*", ... }
}
```

- [ ] **Step 2: Add `imports` field after the `type` field**

```json
{
  "name": "au-agentic",
  "version": "1.0.0",
  "description": "Scaffold enterprise slash commands for AI coding tools",
  "type": "module",
  "imports": {
    "#utils/*": "./src/utils/*.ts",
    "#steps/*": "./src/steps/*.ts"
  },
  "bin": { "au-agentic": "dist/index.js" },
  "files": ["dist"],
  "scripts": {
    "build": "bun build src/index.ts --target=node --outdir=dist --format=esm --banner='#!/usr/bin/env node' --external=@clack/prompts --external=@clack/core --external=picocolors",
    "test": "bun test src/__tests__/"
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

- [ ] **Step 3: Add `paths` mirror to `packages/cli/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "tsBuildInfoFile": "./.tsbuildinfo",
    "baseUrl": ".",
    "paths": {
      "#utils/*": ["./src/utils/*"],
      "#steps/*": ["./src/steps/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Verify typecheck still passes (no source changes yet, just config)**

Run: `bun run typecheck`
Expected: Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/package.json packages/cli/tsconfig.json
git commit -m "feat(cli): declare #utils and #steps imports field aliases"
```

---

### Task 6: Write a runtime resolution test for the new aliases (TDD)

**Files:**
- Create: `packages/cli/src/__tests__/aliases.test.ts`

- [ ] **Step 1: Write failing test that imports through aliases**

```ts
import { describe, it, expect } from 'bun:test';
import { writeFile } from '#utils/files';
import { copyFilesToProject } from '#steps/copy';

describe('package.json imports field aliases', () => {
  it('resolves #utils/* to packages/cli/src/utils/*', () => {
    expect(typeof writeFile).toBe('function');
  });

  it('resolves #steps/* to packages/cli/src/steps/*', () => {
    expect(typeof copyFilesToProject).toBe('function');
  });
});
```

- [ ] **Step 2: Run the new test alone — should PASS already because Bun honors `imports` field natively**

Run: `bun test packages/cli/src/__tests__/aliases.test.ts`
Expected: `2 pass, 0 fail`. If a test fails with `Cannot find module '#utils/files'` or similar, the `imports` field in `packages/cli/package.json` is malformed — re-check Task 5 Step 2.

- [ ] **Step 3: Run full verify to ensure no regression**

Run: `bun run verify`
Expected: Exit code 0.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/__tests__/aliases.test.ts
git commit -m "test(cli): verify imports field aliases resolve at runtime"
```

---

### Task 7: Create `bunfig.toml` with coverage configuration

**Files:**
- Create: `bunfig.toml` (repo root)

- [ ] **Step 1: Verify file does not exist**

Run: `ls bunfig.toml 2>&1`
Expected: `ls: bunfig.toml: No such file or directory`

- [ ] **Step 2: Create `bunfig.toml`**

```toml
[test]
coverage = true
coverageReporter = ["text", "lcov"]
coverageDir = "coverage"
coverageThreshold = { lines = 0.70, functions = 0.70, statements = 0.70 }
```

- [ ] **Step 3: Run `bun test` and verify LCOV file is produced**

Run: `bun test packages/cli/src/__tests__/`
Expected stdout: text coverage report at the end (function names, % covered).
Then: `ls coverage/lcov.info`
Expected: file exists with non-zero size.

- [ ] **Step 4: Inspect threshold behavior — temporarily set threshold to 99% to confirm it actually fails the run**

Edit `bunfig.toml` lines temporarily to:

```toml
coverageThreshold = { lines = 0.99, functions = 0.99, statements = 0.99 }
```

Run: `bun test packages/cli/src/__tests__/`
Expected: non-zero exit code with a coverage threshold violation message naming a file under 99%.

Then revert `bunfig.toml` back to `0.70`:

```toml
coverageThreshold = { lines = 0.70, functions = 0.70, statements = 0.70 }
```

Run: `bun test packages/cli/src/__tests__/`
Expected: Exit code 0.

- [ ] **Step 5: Commit**

```bash
git add bunfig.toml
git commit -m "feat(testing): enable Bun test coverage with LCOV and 70% per-file threshold"
```

---

### Task 8: Update `.gitignore` for new artifacts

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Read current `.gitignore`**

Run: `cat .gitignore`
Expected:

```
node_modules/
packages/cli/dist/
.DS_Store
/examples/
.superpowers/
```

- [ ] **Step 2: Append new ignore patterns**

```
node_modules/
packages/cli/dist/
.DS_Store
/examples/
.superpowers/

# Toolchain phase 1
coverage/
lcov.info
*.tsbuildinfo
```

- [ ] **Step 3: Verify previously-untracked artifacts are now ignored**

Run: `git status --short`
Expected: no `coverage/` or `*.tsbuildinfo` entries appear in output. If they still appear, run `git rm -r --cached coverage` to clear any prior tracking, then re-check.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore(git): ignore coverage, lcov, tsbuildinfo artifacts"
```

---

### Task 9: Add ADR-0005 documenting the alias choice

**Files:**
- Create: `docs/adr/0005-imports-field-alias-pattern.md`

- [ ] **Step 1: Create ADR following the existing 0001 file format**

```markdown
# ADR-0005: Use package.json `imports` field for intra-package aliases

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

au-agentic publishes the `cli` package to npm as `au-agentic`. Source code uses relative imports like `../../utils/files` which become hard to refactor as the source tree grows. We want a stable alias that survives publishing, works in Bun runtime and standard Node, and does not require a runtime loader on the consumer side.

## Decision

Use the package.json `imports` field for intra-package aliases: `#utils/*`, `#steps/*`. Cross-package references continue to use the workspace protocol: `"@au-agentic/templates": "workspace:*"`. The `tsconfig.json` `paths` block exists only as a mirror for the editor and TypeScript language server; it is never the runtime source of truth.

## Consequences

**Positive**
- Native to Node 14+ and Bun, no `tsconfig-paths` runtime dependency
- Survives `bun publish` to npm; consumers do not need any loader
- Works in the editor via `paths` mirror
- Refactor-safe: moving a file under `src/utils/` only changes the `imports` mapping, not every call site

**Negative**
- Two places to keep in sync (`imports` field and `tsconfig.paths`); a drift can silently break the editor without breaking runtime
- Less familiar than the `@/*` convention popular in framework-based frontends

## Alternatives considered

- **`tsconfig.paths` only**: rejected because TypeScript does not rewrite import specifiers at emit time; consumers using Node would fail to resolve `@/utils/files`
- **`tsconfig-paths` runtime loader**: rejected because it forces every consumer to install and configure the loader, defeating the purpose of a published CLI
- **Relative imports forever**: rejected because refactor cost and readability degrade quickly past ~30 source files

## References

- Node.js `imports` field: https://nodejs.org/api/packages.html#subpath-imports
- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.9
```

- [ ] **Step 2: Commit**

```bash
git add docs/adr/0005-imports-field-alias-pattern.md
git commit -m "docs(adr): record imports field alias pattern decision"
```

---

### Task 10: Update `docs/ai/coding-rules.md` to reflect new alias pattern

**Files:**
- Modify: `docs/ai/coding-rules.md`

- [ ] **Step 1: Read current `Import Patterns` section to locate it**

Run: `grep -n 'Import Patterns' docs/ai/coding-rules.md`
Expected: line number of the heading.

- [ ] **Step 2: Replace the `Standard imports` paragraph with new alias guidance**

Find this block:

```markdown
**Standard imports:** External packages (`@clack/prompts`, `picocolors`, etc.). Internal modules use relative paths; prefer `.js` suffix in import specifiers for ESM resolution (for example `./steps/copy.js`, `./utils/paths.js`).
```

Replace with:

```markdown
**Standard imports:**

- **External packages** (`@clack/prompts`, `picocolors`): use the bare specifier.
- **Cross-package** (between `cli` and `templates`): use the workspace alias `@au-agentic/templates/...`.
- **Intra-package** (inside `packages/cli/src/`): use the `imports` field aliases declared in `packages/cli/package.json`:
    - `#utils/*` resolves to `./src/utils/*.ts`
    - `#steps/*` resolves to `./src/steps/*.ts`
- **Relative imports** are still allowed for siblings within the same directory (e.g., `./helpers`), but prefer `#alias/*` for anything reaching across more than one directory.

The `tsconfig.json` `paths` block mirrors the `imports` field for editor support; the runtime source of truth is always the `imports` field. See `docs/adr/0005-imports-field-alias-pattern.md` for rationale.
```

- [ ] **Step 3: Verify the doc still renders correctly**

Run: `grep -n '#utils/\*' docs/ai/coding-rules.md`
Expected: at least 2 matches in the new content.

- [ ] **Step 4: Commit**

```bash
git add docs/ai/coding-rules.md
git commit -m "docs(ai): describe imports field alias pattern in coding rules"
```

---

### Task 11: Update `docs/ai/repo-map.md` Configuration block

**Files:**
- Modify: `docs/ai/repo-map.md`

- [ ] **Step 1: Locate the Configuration block**

Run: `grep -n '^\*\*Configuration:\*\*' docs/ai/repo-map.md`
Expected: line number.

- [ ] **Step 2: Replace the Configuration block code fence**

Find:

```markdown
**Configuration:**
```
package.json              # Monorepo root, workspaces, scripts, devDependencies
tsconfig.json             # TypeScript compiler config (ESNext, Bun types)
eslint.config.ts          # ESLint config (@typescript-eslint plugins)
commitlint.config.ts      # Conventional Commits enforcement config
bun.lock                  # Bun lockfile for dependency resolution
```
```

Replace with:

```markdown
**Configuration:**
```
package.json              # Monorepo root, workspaces, scripts, devDependencies
tsconfig.json             # TypeScript base config (extended by every package)
bunfig.toml               # Bun test coverage settings (LCOV, 70% per-file threshold)
.editorconfig             # Editor consistency (UTF-8, LF, indent 2 space)
eslint.config.ts          # ESLint config (Phase 1 only — superseded in Phase 2)
commitlint.config.ts      # Conventional Commits enforcement config
bun.lock                  # Bun lockfile for dependency resolution
```
```

- [ ] **Step 3: Commit**

```bash
git add docs/ai/repo-map.md
git commit -m "docs(repo-map): list bunfig.toml and .editorconfig in configuration block"
```

---

### Task 12: Update `docs/reference/configuration.md` and `techstack.md`

**Files:**
- Modify: `docs/reference/configuration.md`
- Modify: `docs/reference/techstack.md`

- [ ] **Step 1: Append a section to `docs/reference/configuration.md`**

Add at the bottom of the file:

```markdown

## bunfig.toml (root)

Bun runtime and test configuration.

| Field | Value | Purpose |
|---|---|---|
| `[test].coverage` | `true` | Enable coverage collection on every `bun test` |
| `[test].coverageReporter` | `["text", "lcov"]` | Console table plus `coverage/lcov.info` artifact |
| `[test].coverageDir` | `"coverage"` | Output directory; gitignored |
| `[test].coverageThreshold` | `{ lines = 0.70, functions = 0.70, statements = 0.70 }` | Per-file floor; build fails if any file drops below |

## .editorconfig (root)

Cross-editor consistency. Loaded automatically by VSCode (with the EditorConfig extension), JetBrains, Vim/Neovim plugins.

Key rules: UTF-8 charset, LF line endings, 2-space indent for all files; trailing whitespace stripped except in Markdown.

## Path aliases

Intra-package aliases declared in each package's `package.json` `imports` field. The runtime source of truth is always the `imports` field; `tsconfig.json` `paths` mirrors it for editor support only. See `docs/adr/0005-imports-field-alias-pattern.md`.

Currently declared in `packages/cli/package.json`:

- `#utils/*` → `./src/utils/*.ts`
- `#steps/*` → `./src/steps/*.ts`
```

- [ ] **Step 2: Append a section to `docs/reference/techstack.md`**

Add at the bottom of the file:

```markdown

## Test coverage

- **Tool:** Bun built-in test runner with `--coverage` flag
- **Config:** `bunfig.toml` `[test]` block
- **Reporters:** text (console) and LCOV (`coverage/lcov.info`)
- **Threshold:** 70% per-file for lines, functions, statements
- **CI artifact:** `coverage/lcov.info` (uploaded by `verify.yml` once CI is activated)

## EditorConfig

- **Tool:** EditorConfig (https://editorconfig.org)
- **Config:** `.editorconfig` at repo root
- **Editors supported:** VSCode (via extension), JetBrains, Vim/Neovim, Sublime Text
```

- [ ] **Step 3: Commit**

```bash
git add docs/reference/configuration.md docs/reference/techstack.md
git commit -m "docs(reference): document bunfig.toml, .editorconfig, imports field aliases"
```

---

### Task 13: Final verification gate

- [ ] **Step 1: Run full verify**

Run: `bun run verify`
Expected: Exit code 0; output shows typecheck pass, lint pass, test pass with coverage report.

- [ ] **Step 2: Confirm coverage artifact**

Run: `ls -la coverage/lcov.info`
Expected: file exists.

- [ ] **Step 3: Confirm git tree is clean**

Run: `git status`
Expected: `working tree clean` (or only the untracked `coverage/` directory which is now gitignored).

- [ ] **Step 4: Tag the phase completion (optional but recommended)**

```bash
git tag -a phase-1-foundations -m "Phase 1 of toolchain production-readiness complete"
```

---

## Phase 1 Definition of Done

- [ ] All 13 tasks above completed and committed
- [ ] `bun run verify` exits 0
- [ ] `coverage/lcov.info` is produced on every test run
- [ ] `import { x } from '#utils/something'` works at runtime in Bun
- [ ] `tsconfig.json` includes `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `incremental`
- [ ] `.editorconfig`, `bunfig.toml`, `packages/templates/tsconfig.json` exist
- [ ] ADR-0005 committed
- [ ] `docs/ai/coding-rules.md`, `docs/ai/repo-map.md`, `docs/reference/configuration.md`, `docs/reference/techstack.md` reflect the new state
