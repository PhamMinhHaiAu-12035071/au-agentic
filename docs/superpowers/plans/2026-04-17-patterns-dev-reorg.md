# PatternsDev Re-org Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-org folder structure so PatternsDev authorship is visible — move templates to `packages/templates/patterns-dev/javascript-patterns/` and sync script to `scripts/sync/patterns-dev/index.ts`.

**Architecture:** Add author-namespace tier under `packages/templates/`. Manifest codegen detects "all-subdirs" dirs as author namespaces and descends one level — manifest keys stay `"javascript-patterns"` so CLI consumers and tests don't break. Sync script moves but logic unchanged.

**Tech Stack:** Bun, TypeScript, Bun.spawnSync, Turbo, ls-lint.

---

## File Map

**Move (git mv):**
- `scripts/sync-upstream-patterns.ts` → `scripts/sync/patterns-dev/index.ts`
- `scripts/__tests__/sync-upstream-patterns.test.ts` → `scripts/__tests__/sync-patterns-dev.test.ts`
- `packages/templates/javascript-patterns/` → `packages/templates/patterns-dev/javascript-patterns/`

**Modify:**
- `scripts/sync/patterns-dev/index.ts` — `TARGET_ROOT` constant
- `scripts/__tests__/sync-patterns-dev.test.ts` — import path
- `package.json` — `sync:upstream-patterns` script path
- `packages/cli/scripts/generate-template-manifest.ts` — author-namespace detection
- `packages/cli/src/generated/template-manifest.ts` — auto-regenerated
- `docs/superpowers/specs/2026-04-17-javascript-patterns-skill-design.md` — path references
- `docs/superpowers/2026-04-17-javascript-patterns-skill.md` — path references

---

### Task 1: Update codegen to detect author namespace

**Files:**
- Modify: `packages/cli/scripts/generate-template-manifest.ts:44-83`

- [ ] **Step 1: Read existing collect() function**

Read [packages/cli/scripts/generate-template-manifest.ts:44-83](packages/cli/scripts/generate-template-manifest.ts#L44-L83) to understand the current 2-tier scan.

- [ ] **Step 2: Add isAuthorNamespace helper**

Insert above `collect()`:

```typescript
function isAuthorNamespace(dir: string): boolean {
  // Author namespace: contains ONLY subdirectories (no LICENSE, no loose .md).
  // E.g. packages/templates/patterns-dev/ contains only javascript-patterns/.
  const items = sortedReaddir(dir);
  return items.length > 0 && items.every((d) => d.isDirectory());
}
```

- [ ] **Step 3: Refactor collect() to descend into author namespaces**

Replace the body of `collect()`:

```typescript
function collect(): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  for (const top of sortedReaddir(TEMPLATES_DIR)) {
    if (!top.isDirectory()) continue;
    const topDir = join(TEMPLATES_DIR, top.name);

    if (isAuthorNamespace(topDir)) {
      // Author tier: walk children as skills, prefix import path with author/
      for (const skill of sortedReaddir(topDir)) {
        if (!skill.isDirectory()) continue;
        collectSkill(entries, join(topDir, skill.name), skill.name, `${top.name}/${skill.name}`);
      }
    } else {
      // Direct skill tier: existing 2-level layout
      collectSkill(entries, topDir, top.name, top.name);
    }
  }
  return entries;
}

function collectSkill(
  entries: ManifestEntry[],
  skillDir: string,
  skillKey: string,
  importPrefix: string,
): void {
  for (const item of sortedReaddir(skillDir)) {
    if (item.isFile() && SHARED_FILES.has(item.name)) {
      entries.push({
        importName: `${sanitizeIdent(skillKey)}__shared__${sanitizeIdent(item.name)}`,
        importPath: `@au-agentic/templates/${importPrefix}/${item.name}`,
        skill: skillKey,
        tool: "_shared",
        key: item.name,
      });
    } else if (item.isFile() && !SHARED_FILES.has(item.name) && /\.md$/.test(item.name)) {
      entries.push({
        importName: `${sanitizeIdent(skillKey)}__copilot__${sanitizeIdent(item.name)}`,
        importPath: `@au-agentic/templates/${importPrefix}/${item.name}`,
        skill: skillKey,
        tool: "copilot",
        key: item.name,
      });
    } else if (item.isDirectory()) {
      const toolDir = join(skillDir, item.name);
      for (const rel of walkMd(toolDir, toolDir)) {
        entries.push({
          importName: `${sanitizeIdent(skillKey)}__${sanitizeIdent(item.name)}__${sanitizeIdent(rel)}`,
          importPath: `@au-agentic/templates/${importPrefix}/${item.name}/${rel}`,
          skill: skillKey,
          tool: item.name,
          key: rel,
        });
      }
    }
  }
}
```

- [ ] **Step 4: Verify codegen still works on current layout**

Run: `bun run packages/cli/scripts/generate-template-manifest.ts`
Expected: `✓ Wrote N entries to packages/cli/src/generated/template-manifest.ts` (N matches current count)

- [ ] **Step 5: Verify generated file unchanged**

Run: `git diff packages/cli/src/generated/template-manifest.ts`
Expected: empty diff (refactor is structure-equivalent for current layout)

- [ ] **Step 6: Commit**

```bash
git add packages/cli/scripts/generate-template-manifest.ts
git commit -m "refactor(cli): codegen detects author-namespace dirs

Adds isAuthorNamespace + collectSkill to support
packages/templates/<author>/<skill>/ layout. No-op for
current layout — generated manifest is byte-identical."
```

---

### Task 2: Move javascript-patterns into patterns-dev namespace

**Files:**
- Move: `packages/templates/javascript-patterns/` → `packages/templates/patterns-dev/javascript-patterns/`

- [ ] **Step 1: Create namespace dir and move via git mv**

```bash
cd /Users/phamau/Desktop/projects/me/au-agentic
mkdir -p packages/templates/patterns-dev
git mv packages/templates/javascript-patterns packages/templates/patterns-dev/javascript-patterns
```

- [ ] **Step 2: Verify git tracked the rename**

Run: `git status`
Expected: shows `renamed:` lines for files under the moved tree (not delete + add).

- [ ] **Step 3: Regenerate manifest**

Run: `bun run packages/cli/scripts/generate-template-manifest.ts`
Expected: `✓ Wrote N entries` (same N as before).

- [ ] **Step 4: Verify manifest keys unchanged but import paths updated**

Run: `grep -c '"javascript-patterns"' packages/cli/src/generated/template-manifest.ts`
Expected: same count as before move (manifest key preserved).

Run: `grep -c '@au-agentic/templates/patterns-dev/javascript-patterns' packages/cli/src/generated/template-manifest.ts`
Expected: > 0 (import paths now include author prefix).

- [ ] **Step 5: Run full verify**

Run: `bun run verify`
Expected: lint + typecheck + tests all pass. The `TEMPLATE_MANIFEST["javascript-patterns"]` references in tests remain valid.

- [ ] **Step 6: Commit**

```bash
git add packages/templates/ packages/cli/src/generated/template-manifest.ts
git commit -m "refactor(templates): namespace js-patterns under patterns-dev/

Moves packages/templates/javascript-patterns/ into
packages/templates/patterns-dev/javascript-patterns/ to make
PatternsDev authorship visible in folder structure. Manifest
key remains 'javascript-patterns' so CLI consumers unchanged."
```

---

### Task 3: Move sync script into scripts/sync/patterns-dev/

**Files:**
- Move: `scripts/sync-upstream-patterns.ts` → `scripts/sync/patterns-dev/index.ts`
- Modify: `scripts/sync/patterns-dev/index.ts` — `TARGET_ROOT` constant

- [ ] **Step 1: Create dir and move with git mv**

```bash
mkdir -p scripts/sync/patterns-dev
git mv scripts/sync-upstream-patterns.ts scripts/sync/patterns-dev/index.ts
```

- [ ] **Step 2: Update TARGET_ROOT in moved file**

Edit `scripts/sync/patterns-dev/index.ts` line 29:

Before:
```typescript
const TARGET_ROOT = join(REPO_ROOT, "packages/templates/javascript-patterns");
```

After:
```typescript
const TARGET_ROOT = join(REPO_ROOT, "packages/templates/patterns-dev/javascript-patterns");
```

- [ ] **Step 3: Update REPO_ROOT depth in moved file**

The file moved 2 dirs deeper (`scripts/sync/patterns-dev/`). Update line 27:

Before:
```typescript
const REPO_ROOT = join(import.meta.dir, "..");
```

After:
```typescript
const REPO_ROOT = join(import.meta.dir, "../../..");
```

- [ ] **Step 4: Verify TMP_DIR still resolves correctly**

The `TMP_DIR = join(REPO_ROOT, ".tmp/upstream-patterns")` should now resolve to repo-root `.tmp/`. Confirm with:

Run: `bun -e 'import { join } from "node:path"; console.log(join("scripts/sync/patterns-dev", "../../..", ".tmp/upstream-patterns"))'`
Expected: `.tmp/upstream-patterns`

- [ ] **Step 5: Commit**

```bash
git add scripts/sync/patterns-dev/index.ts
git commit -m "refactor(scripts): move sync into scripts/sync/patterns-dev/

Mirrors packages/templates/patterns-dev/ namespace. Updates
TARGET_ROOT to new template path and REPO_ROOT depth (3 levels
up). Logic unchanged — single-file entry point preserved."
```

---

### Task 4: Rename test file and update import

**Files:**
- Move: `scripts/__tests__/sync-upstream-patterns.test.ts` → `scripts/__tests__/sync-patterns-dev.test.ts`
- Modify: `scripts/__tests__/sync-patterns-dev.test.ts` line 4

- [ ] **Step 1: Rename test file**

```bash
git mv scripts/__tests__/sync-upstream-patterns.test.ts scripts/__tests__/sync-patterns-dev.test.ts
```

- [ ] **Step 2: Update import path in test**

Edit `scripts/__tests__/sync-patterns-dev.test.ts` line 4:

Before:
```typescript
import { slugifyPattern, transformUpstreamRef } from "../sync-upstream-patterns";
```

After:
```typescript
import { slugifyPattern, transformUpstreamRef } from "../sync/patterns-dev";
```

(Note: `from "../sync/patterns-dev"` resolves to `scripts/sync/patterns-dev/index.ts` via Node/Bun directory-import convention.)

- [ ] **Step 3: Run the test in isolation**

Run: `cd scripts && bun test __tests__/sync-patterns-dev.test.ts`
Expected: 5 tests pass (3 transformUpstreamRef + 2 slugifyPattern).

- [ ] **Step 4: Commit**

```bash
git add scripts/__tests__/sync-patterns-dev.test.ts
git commit -m "test(scripts): rename test to match patterns-dev sync"
```

---

### Task 5: Update package.json sync script path

**Files:**
- Modify: `package.json` line containing `sync:upstream-patterns`

- [ ] **Step 1: Edit package.json**

In `package.json`, find:

```json
"sync:upstream-patterns": "./scripts/cache-env.sh bun scripts/sync-upstream-patterns.ts"
```

Replace with:

```json
"sync:upstream-patterns": "./scripts/cache-env.sh bun scripts/sync/patterns-dev/index.ts"
```

- [ ] **Step 2: Verify script path works**

Run: `bun run sync:upstream-patterns --help 2>&1 | head -5` (or equivalent dry-run)

If the script doesn't support `--help`, just confirm Bun resolves the file:
Run: `bun -e 'import("./scripts/sync/patterns-dev/index.ts").then(() => console.log("resolved"))'`
Expected: prints `resolved` (then the script's own console output may follow).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(scripts): update sync:upstream-patterns to new path"
```

---

### Task 6: Update doc references to old paths

**Files:**
- Modify: `docs/superpowers/specs/2026-04-17-javascript-patterns-skill-design.md`
- Modify: `docs/superpowers/2026-04-17-javascript-patterns-skill.md`

- [ ] **Step 1: Find all doc references to old paths**

Run: `grep -rln 'packages/templates/javascript-patterns\|scripts/sync-upstream-patterns' docs/`
Record the list — these all need updating.

- [ ] **Step 2: Update each doc file**

For each file from Step 1, replace:
- `packages/templates/javascript-patterns` → `packages/templates/patterns-dev/javascript-patterns`
- `scripts/sync-upstream-patterns.ts` → `scripts/sync/patterns-dev/index.ts`

Use Edit tool with `replace_all: true` per file.

- [ ] **Step 3: Verify no stale references remain**

Run: `grep -rn 'packages/templates/javascript-patterns\|scripts/sync-upstream-patterns' docs/ packages/ scripts/ package.json`
Expected: no matches (or only inside this plan doc itself, which is OK).

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: update path references for patterns-dev namespace"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full verify**

Run: `bun run verify`
Expected: lint + typecheck + tests all green.

- [ ] **Step 2: Run ls-lint specifically**

Run: `bun run lint:fs`
Expected: no violations. New paths (`scripts/sync/`, `patterns-dev/`, `index.ts`) all kebab-case.

- [ ] **Step 3: Sanity check sync script (dry-clone, optional)**

If safe to run: `bun run sync:upstream-patterns`
Expected: clones upstream, writes patterns to `packages/templates/patterns-dev/javascript-patterns/`, prints success.

If `git diff packages/templates/` is empty afterwards, the move + path update is correct.

- [ ] **Step 4: Final commit if anything changed**

Only if the verification surfaced regen needs:

```bash
git add -A
git commit -m "chore: regenerate manifest after re-org"
```

---

## Self-Review Notes

- **Spec coverage:** All 5 changes from spec D-001/D-002/D-003/D-004 + Dependent Updates table mapped to tasks 1–6.
- **Manifest preservation:** Task 1 verifies the codegen refactor produces a byte-identical manifest BEFORE the move; Task 2 then triggers the path-prefix change. This separates the two risks.
- **Out-of-scope confirmed:** No changes to pattern `.md` content, sync logic internals, tool-specific layouts, or scaffold output paths (CLI users still see `.claude/skills/javascript-patterns/`).
