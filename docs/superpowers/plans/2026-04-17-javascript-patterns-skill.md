# JavaScript Patterns Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port 30 patterns.dev JavaScript skills (MIT) into `au-agentic` as a single hub-and-spoke skill `javascript-patterns`, scaffold-able to Claude Code, Cursor, Codex CLI, GitHub Copilot.

**Architecture:** Hub-and-spoke per tool — 1 catalog `SKILL.md` (or `.prompt.md` for Copilot) + 30 progressive-disclosure reference files. **Manual-trigger-only** (DEC-011): catalogs declare `disable-model-invocation: true`; Copilot uses slash-popup `.github/prompts/javascript-patterns.prompt.md` instead of auto-attach `.github/instructions/`. Scope restricted to JS/TS + test/spec files (DEC-012); ambiguous tasks delegate to `/interview` (DEC-013). Paths mirror existing `interview/` convention (`.{tool}/skills/`) for Claude/Cursor/Codex. CLI gains a "Select skills" multi-select step. 125 template files loaded via codegen-generated static import manifest (no runtime I/O).

**Tech Stack:** Bun 1.3.10+, TypeScript, `@clack/prompts` (wizard UI), turbo pipeline, biome lint+format, markdownlint-cli2. No new runtime deps.

**Spec:** [docs/superpowers/specs/2026-04-17-javascript-patterns-skill-design.md](../specs/2026-04-17-javascript-patterns-skill-design.md)

**Verification before claiming done:** `bun run verify` (lint + typecheck + test) from repo root.

---

## File Structure (locked upfront)

**New files — scripts:**
- `scripts/sync-upstream-patterns.ts` — manual upstream sync (DEC-007)
- `packages/cli/scripts/generate-template-manifest.ts` — codegen (DEC-006')

**New files — templates (125 total in `packages/templates/javascript-patterns/`):**
- `LICENSE` (1) — full MIT, patterns.dev copyright
- `claude/SKILL.md` (1) — catalog + paths: frontmatter
- `claude/references/*.md` (30) — verbatim upstream + attribution header
- `cursor/SKILL.md` + `cursor/references/*.md` (1 + 30)
- `codex/SKILL.md` + `codex/references/*.md` (1 + 30)
- `copilot/javascript-patterns.prompt.md` (1) — catalog, slash `/javascript-patterns` manual-only (DEC-011)
- `copilot/javascript-patterns/*.md` (30) — plain refs, reachable via `#file:`

**New files — CLI:**
- `packages/cli/src/steps/skills.ts` — step "Select skills"
- `packages/cli/src/generated/template-manifest.ts` — codegen output (gitignored)
- `packages/cli/src/__tests__/template-manifest.test.ts` — Tier 1 manifest snapshot
- `packages/cli/src/__tests__/scaffold-golden.test.ts` — Tier 2 golden file
- `packages/cli/src/__tests__/skill-contract.test.ts` — Tier 4 success-criteria contract (DEC-011/012/013)

**New files — docs:**
- `docs/adr/0009-javascript-patterns-skill.md`

**Modified files — CLI:**
- `packages/cli/src/index.ts` — wire new step
- `packages/cli/src/utils/templates.ts` — use manifest, multi-skill API
- `packages/cli/src/steps/copy.ts` — per-skill targets, LICENSE fan-out
- `packages/cli/src/__tests__/copy.test.ts` — extend for multi-skill
- `packages/cli/package.json` — `prebuild`, `gen:manifest` scripts

**Modified files — config:**
- `.gitignore` — add `packages/cli/src/generated/`
- `turbo.json` — `gen:manifest` task, prebuild dep
- `package.json` (root) — `sync:upstream-patterns` script

**Modified files — docs (Tier 1 + 2):**
- `README.md`, `CHANGELOG.md`
- `docs/ai/repo-map.md`, `docs/ai/testing-policy.md`, `docs/ai/routing.md`
- `docs/reference/project-structure.md`
- `docs/development/workflow.md`, `docs/development/testing.md`
- `docs/getting-started/quickstart.md`
- `docs/examples/feature-walkthroughs.md`

---

## Phase 1 — Upstream Sync Script

### Task 1: Write sync script TDD fixture + transform test

**Files:**
- Create: `scripts/__tests__/sync-upstream-patterns.test.ts`
- Create: `scripts/__tests__/fixtures/sample-upstream-SKILL.md`

- [ ] **Step 1.1: Create fixture mimicking upstream SKILL.md shape**

Write `scripts/__tests__/fixtures/sample-upstream-SKILL.md`:

```markdown
---
name: singleton-pattern
description: Teaches the singleton pattern for managing a single shared instance.
paths:
  - "**/*.js"
  - "**/*.ts"
license: MIT
metadata:
  author: patterns.dev
  version: "1.1"
related_skills:
  - "module-pattern"
---

# Singleton Pattern

Singletons are classes which can be instantiated once...

## When to Use

- Use this when you need exactly one instance
```

- [ ] **Step 1.2: Write failing test for `transformUpstreamRef`**

Create `scripts/__tests__/sync-upstream-patterns.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { transformUpstreamRef, slugifyPattern } from "../sync-upstream-patterns";

const FIXTURE = readFileSync(
  join(import.meta.dir, "fixtures/sample-upstream-SKILL.md"),
  "utf8",
);

describe("transformUpstreamRef", () => {
  test("strips upstream YAML frontmatter", () => {
    const out = transformUpstreamRef(FIXTURE, "singleton-pattern");
    expect(out).not.toContain("name: singleton-pattern");
    expect(out).not.toContain("related_skills:");
  });

  test("prepends attribution header comment", () => {
    const out = transformUpstreamRef(FIXTURE, "singleton-pattern");
    expect(out.startsWith("<!-- Source:")).toBe(true);
    expect(out).toContain("https://github.com/PatternsDev/skills/tree/main/javascript/singleton-pattern");
    expect(out).toContain("MIT — see ../LICENSE");
  });

  test("preserves body content intact", () => {
    const out = transformUpstreamRef(FIXTURE, "singleton-pattern");
    expect(out).toContain("# Singleton Pattern");
    expect(out).toContain("Singletons are classes which can be instantiated once");
    expect(out).toContain("## When to Use");
  });
});

describe("slugifyPattern", () => {
  test("strips -pattern suffix", () => {
    expect(slugifyPattern("singleton-pattern")).toBe("singleton");
    expect(slugifyPattern("observer-pattern")).toBe("observer");
  });

  test("keeps non-pattern slugs as-is", () => {
    expect(slugifyPattern("bundle-splitting")).toBe("bundle-splitting");
    expect(slugifyPattern("tree-shaking")).toBe("tree-shaking");
    expect(slugifyPattern("prpl")).toBe("prpl");
  });
});
```

- [ ] **Step 1.3: Run test to verify both FAIL**

Run:
```bash
cd /Users/phamau/Desktop/projects/me/au-agentic
bun test scripts/__tests__/sync-upstream-patterns.test.ts
```
Expected: FAIL with "Cannot find module '../sync-upstream-patterns'"

### Task 2: Implement transform functions

**Files:**
- Create: `scripts/sync-upstream-patterns.ts`

- [ ] **Step 2.1: Write minimal implementation**

```ts
#!/usr/bin/env bun
/**
 * Manual sync of upstream PatternsDev/skills/javascript into
 * packages/templates/javascript-patterns. Run on demand:
 *   bun run sync:upstream-patterns
 * Does NOT commit; dev reviews diff manually.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const UPSTREAM_REPO = "https://github.com/PatternsDev/skills";
const UPSTREAM_BRANCH = "main";

export function slugifyPattern(upstreamFolder: string): string {
  return upstreamFolder.replace(/-pattern$/, "");
}

export function transformUpstreamRef(upstreamContent: string, upstreamFolder: string): string {
  const frontmatterMatch = upstreamContent.match(/^---\n[\s\S]*?\n---\n/);
  const body = frontmatterMatch ? upstreamContent.slice(frontmatterMatch[0].length) : upstreamContent;
  const header = `<!-- Source: ${UPSTREAM_REPO}/tree/${UPSTREAM_BRANCH}/javascript/${upstreamFolder} | MIT — see ../LICENSE -->\n\n`;
  return header + body.replace(/^\s+/, "");
}

// Remaining orchestration logic added in Task 3
```

- [ ] **Step 2.2: Run test — transform + slugify pass**

Run:
```bash
bun test scripts/__tests__/sync-upstream-patterns.test.ts
```
Expected: PASS (6 tests pass)

- [ ] **Step 2.3: Commit**

```bash
git add scripts/sync-upstream-patterns.ts scripts/__tests__/
git commit -m "feat(sync): transform + slugify helpers for upstream patterns"
```

### Task 3: Add orchestration + clone logic

**Files:**
- Modify: `scripts/sync-upstream-patterns.ts`
- Modify: `package.json` (root)

- [ ] **Step 3.1: Append orchestration code**

Append to `scripts/sync-upstream-patterns.ts`:

```ts
const REPO_ROOT = join(import.meta.dir, "..");
const TMP_DIR = join(REPO_ROOT, ".tmp/upstream-patterns");
const TARGET_ROOT = join(REPO_ROOT, "packages/templates/javascript-patterns");

function sh(cmd: string): string {
  const result = Bun.spawnSync({ cmd: ["sh", "-c", cmd], stderr: "inherit" });
  if (result.exitCode !== 0) throw new Error(`Command failed: ${cmd}`);
  return new TextDecoder().decode(result.stdout);
}

function cloneUpstream(): void {
  if (existsSync(TMP_DIR)) sh(`rm -rf "${TMP_DIR}"`);
  mkdirSync(TMP_DIR, { recursive: true });
  sh(`git clone --depth=1 --branch=${UPSTREAM_BRANCH} ${UPSTREAM_REPO} "${TMP_DIR}"`);
}

function writeRef(tool: "claude" | "cursor" | "codex" | "copilot", slug: string, body: string): void {
  const path =
    tool === "copilot"
      ? join(TARGET_ROOT, "copilot/javascript-patterns", `${slug}.md`)
      : join(TARGET_ROOT, tool, "references", `${slug}.md`);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, body);
}

function syncLicense(): void {
  const upstreamLicense = join(TMP_DIR, "LICENSE");
  if (!existsSync(upstreamLicense)) throw new Error("Upstream LICENSE missing");
  writeFileSync(join(TARGET_ROOT, "LICENSE"), readFileSync(upstreamLicense, "utf8"));
}

async function main(): Promise<void> {
  console.log("→ Cloning upstream…");
  cloneUpstream();

  console.log("→ Copying LICENSE…");
  syncLicense();

  const jsDir = join(TMP_DIR, "javascript");
  const folders = readdirSync(jsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (folders.length === 0) throw new Error("No pattern folders found in upstream");

  console.log(`→ Transforming ${folders.length} patterns…`);
  for (const folder of folders) {
    const slug = slugifyPattern(folder);
    const skillPath = join(jsDir, folder, "SKILL.md");
    if (!existsSync(skillPath)) {
      console.warn(`  ⚠ skipping ${folder} — no SKILL.md`);
      continue;
    }
    const body = transformUpstreamRef(readFileSync(skillPath, "utf8"), folder);
    for (const tool of ["claude", "cursor", "codex", "copilot"] as const) {
      writeRef(tool, slug, body);
    }
  }

  console.log(`\n✓ Synced ${folders.length} patterns × 4 tools.`);
  console.log(`  Review diff: git diff packages/templates/javascript-patterns/`);
  console.log(`  Clean up: rm -rf "${TMP_DIR}"`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 3.2: Register script in root `package.json`**

Edit `/Users/phamau/Desktop/projects/me/au-agentic/package.json`. Under `"scripts"`, add:

```json
"sync:upstream-patterns": "bun scripts/sync-upstream-patterns.ts"
```

- [ ] **Step 3.3: Add `.tmp/` to `.gitignore`**

Edit `/Users/phamau/Desktop/projects/me/au-agentic/.gitignore`. If `.tmp/` not already listed, add:

```
.tmp/
```

- [ ] **Step 3.4: Type check passes**

Run:
```bash
cd packages/cli && bun run typecheck
cd ../.. && bun run typecheck
```
Expected: No errors (scripts dir may not be tsc-checked — OK if excluded).

- [ ] **Step 3.5: Commit**

```bash
git add scripts/sync-upstream-patterns.ts package.json .gitignore
git commit -m "feat(sync): orchestration + CLI entry for upstream pattern sync"
```

---

## Phase 2 — Run Sync + Add LICENSE & Content

### Task 4: Execute sync script against upstream

**Files:**
- Create: `packages/templates/javascript-patterns/LICENSE` (via script)
- Create: `packages/templates/javascript-patterns/{claude,cursor,codex,copilot}/...` × 120 refs (via script)

- [ ] **Step 4.1: Run sync**

```bash
cd /Users/phamau/Desktop/projects/me/au-agentic
bun run sync:upstream-patterns
```
Expected output: `✓ Synced 30 patterns × 4 tools.`

- [ ] **Step 4.2: Verify file tree**

```bash
find packages/templates/javascript-patterns -type f -name "*.md" | wc -l
```
Expected: `120` (30 × 4)

```bash
ls packages/templates/javascript-patterns/LICENSE
```
Expected: file exists, contains "MIT License" and a "Copyright" line referencing patterns.dev contributors.

- [ ] **Step 4.3: Spot-check one ref**

```bash
head -5 packages/templates/javascript-patterns/claude/references/singleton.md
```
Expected: First line is `<!-- Source: https://github.com/PatternsDev/skills/tree/main/javascript/singleton-pattern | MIT — see ../LICENSE -->`, second line empty, third `# Singleton Pattern`.

- [ ] **Step 4.4: Commit (content only — catalogs + CLI come later)**

```bash
git add packages/templates/javascript-patterns/LICENSE \
        packages/templates/javascript-patterns/claude/references/ \
        packages/templates/javascript-patterns/cursor/references/ \
        packages/templates/javascript-patterns/codex/references/ \
        packages/templates/javascript-patterns/copilot/javascript-patterns/
git commit -m "feat(templates): import 30 patterns.dev JS skills (MIT upstream)"
```

---

## Phase 3 — Catalog SKILL.md Per Tool

### Task 5: Inventory upstream pattern metadata for catalog table

**Files:**
- None (research-only)

- [ ] **Step 5.1: Extract description + slug from each synced ref**

```bash
for f in packages/templates/javascript-patterns/claude/references/*.md; do
  slug=$(basename "$f" .md)
  title=$(grep -m 1 '^# ' "$f" | sed 's/^# //')
  echo "$slug | $title"
done
```

Copy output into a scratch file for Step 6.1. Categorize into 3 groups manually:
- **Design patterns** (11): singleton, observer, factory, proxy, mediator, mixin, module, provider, prototype, command, flyweight
- **Performance patterns** (6+): bundle-splitting, tree-shaking, compression, js-performance-patterns, third-party, vite-bundle-optimization
- **Loading patterns** (13): dynamic-import, static-import, import-on-interaction, import-on-visibility, prefetch, preload, prpl, route-based, islands-architecture, loading-sequence, view-transitions, virtual-lists

Note: exact categorization depends on what upstream actually ships; adjust when writing catalog.

### Task 6: Write Claude catalog `SKILL.md`

**Files:**
- Create: `packages/templates/javascript-patterns/claude/SKILL.md`

- [ ] **Step 6.1: Write full catalog**

Use this template, fill rows from Task 5 inventory:

```markdown
---
name: javascript-patterns
description: 30 JavaScript design, performance, and loading patterns from patterns.dev. Use when user invokes `/javascript-patterns`, says "active skill javascript-patterns", or explicitly asks to apply a named pattern (singleton, observer, factory, proxy, etc.). Only applies to JS/TS source + test/spec files.
disable-model-invocation: true
license: MIT
metadata:
  author: au-agentic
  upstream: https://github.com/PatternsDev/skills
  upstream_license: MIT (patterns.dev authors)
---

# JavaScript Patterns Catalog

## Trigger Model

**Manual-only.** Skill này KHÔNG tự active. Chỉ kích hoạt khi:

- User gõ slash `/javascript-patterns` (Cursor/Claude/Copilot/Codex popup)
- User explicit prompt: "active skill javascript-patterns", "dùng javascript-patterns", v.v.
- User yêu cầu áp dụng 1 pattern có trong catalog bằng tên

Nếu không có trigger ở trên, **KHÔNG** apply pattern — tiếp tục theo convention repo hiện tại.

## Scope

Chỉ áp dụng trên file:

- `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`
- File test & spec tương ứng: `*.test.{js,ts,jsx,tsx}`, `*.spec.{js,ts,jsx,tsx}`

File ngoài scope (`.py`, `.rb`, `.go`, `.md`, config, …) → skill KHÔNG áp dụng kể cả khi được trigger.

## How to Use

1. Bảng bên dưới liệt kê 30 pattern + 1 dòng "when to use"
2. Khi task khớp cột "when to use" rõ ràng, `Read` file tương ứng trong `references/` **TRƯỚC** khi viết code
3. Copy code ví dụ từ reference, không phải tự nhớ
4. KHÔNG load tất cả references cùng lúc (tốn context)

## Ambiguity Protocol

Nếu task **không khớp rõ ràng** 1 pattern trong bảng (mơ hồ, multi-pattern, pattern không có trong catalog):

- **KHÔNG đoán** — đoán sai dẫn đến refactor sai hướng.
- **Delegate sang `/interview` skill** để phỏng vấn user về ý định, constraints, file scope.
- Sau khi interview ra spec rõ ràng, quay lại catalog này và chọn pattern khớp (nếu có).
- Nếu interview cho thấy task nằm ngoài scope của catalog, thông báo user và không áp dụng skill.

## Catalog

### Design Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Singleton | Exactly one shared instance across app | `references/singleton.md` |
| Observer | Pub-sub; broadcast state changes to subscribers | `references/observer.md` |
| Factory | Centralize object creation logic | `references/factory.md` |
| Proxy | Intercept/control access to another object | `references/proxy.md` |
| Mediator | Route communication between objects through a hub | `references/mediator.md` |
| Mixin | Compose reusable behavior into a class | `references/mixin.md` |
| Module | Encapsulate private state behind an export surface | `references/module.md` |
| Provider | Share data via React-like context to avoid prop drilling | `references/provider.md` |
| Prototype | Share methods across instances via prototype chain | `references/prototype.md` |
| Command | Encapsulate an action as a queueable/undoable object | `references/command.md` |
| Flyweight | Share expensive state across many similar instances | `references/flyweight.md` |

### Performance Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Bundle Splitting | Reduce initial JS payload; split by route/feature | `references/bundle-splitting.md` |
| Tree Shaking | Strip unused exports at bundle time | `references/tree-shaking.md` |
| Compression | Gzip/Brotli assets for transport | `references/compression.md` |
| JS Performance Patterns | General perf recipes (debounce/throttle/memo) | `references/js-performance-patterns.md` |
| Third Party | Load 3rd-party scripts without blocking | `references/third-party.md` |
| Vite Bundle Optimization | Vite-specific chunking and splitting | `references/vite-bundle-optimization.md` |

### Loading Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Dynamic Import | Import chunks lazily at runtime | `references/dynamic-import.md` |
| Static Import | Default eager import at top of file | `references/static-import.md` |
| Import on Interaction | Load chunk on user gesture (click/hover) | `references/import-on-interaction.md` |
| Import on Visibility | Load chunk when element scrolled into view | `references/import-on-visibility.md` |
| Prefetch | Hint browser to fetch low-priority resource | `references/prefetch.md` |
| Preload | Critical-resource priority hint | `references/preload.md` |
| PRPL | Push, render, pre-cache, lazy-load | `references/prpl.md` |
| Route-based Splitting | Split chunks per route | `references/route-based.md` |
| Islands Architecture | Selective hydration of interactive islands | `references/islands-architecture.md` |
| Loading Sequence | Prioritize critical assets first | `references/loading-sequence.md` |
| View Transitions | CSS View Transitions API for smooth route changes | `references/view-transitions.md` |
| Virtual Lists | Render only visible rows in long lists | `references/virtual-lists.md` |

## Notes

- Catalog là lớp routing duy nhất load khi skill được trigger; reference chi tiết chỉ nạp khi pattern khớp rõ.
- Nếu task không khớp rõ pattern nào, đừng đoán — hỏi user hoặc implement theo convention repo hiện tại.

## Attribution

Refs phái sinh từ [patterns.dev](https://patterns.dev) (MIT) — xem `LICENSE`.
```

- [ ] **Step 6.2: Verify catalog refs match synced files**

```bash
grep -oE 'references/[a-z0-9-]+\.md' packages/templates/javascript-patterns/claude/SKILL.md | sort -u > /tmp/catalog-refs.txt
ls packages/templates/javascript-patterns/claude/references/ | sed 's/^/references\//' | sort -u > /tmp/actual-refs.txt
diff /tmp/catalog-refs.txt /tmp/actual-refs.txt
```
Expected: no diff (empty output). If any upstream folder slug doesn't appear in catalog, add a row. If catalog references a slug that doesn't exist, fix the slug.

- [ ] **Step 6.3: Commit**

```bash
git add packages/templates/javascript-patterns/claude/SKILL.md
git commit -m "feat(templates): add Claude catalog SKILL.md for javascript-patterns"
```

### Task 7: Duplicate catalog for Cursor + Codex (identical content)

**Files:**
- Create: `packages/templates/javascript-patterns/cursor/SKILL.md`
- Create: `packages/templates/javascript-patterns/codex/SKILL.md`

- [ ] **Step 7.1: Copy Claude catalog to Cursor (identical — same frontmatter works)**

```bash
cp packages/templates/javascript-patterns/claude/SKILL.md \
   packages/templates/javascript-patterns/cursor/SKILL.md
```

- [ ] **Step 7.2: Copy to Codex**

```bash
cp packages/templates/javascript-patterns/claude/SKILL.md \
   packages/templates/javascript-patterns/codex/SKILL.md
```

- [ ] **Step 7.3: Verify catalogs scaffold-parity with refs**

```bash
for tool in cursor codex; do
  diff <(grep -oE 'references/[a-z0-9-]+\.md' packages/templates/javascript-patterns/$tool/SKILL.md | sort -u) \
       <(ls packages/templates/javascript-patterns/$tool/references/ | sed 's/^/references\//' | sort -u)
done
```
Expected: no output for either tool.

- [ ] **Step 7.4: Commit**

```bash
git add packages/templates/javascript-patterns/cursor/SKILL.md \
        packages/templates/javascript-patterns/codex/SKILL.md
git commit -m "feat(templates): add Cursor + Codex catalog SKILL.md"
```

### Task 8: Write Copilot catalog `.prompt.md` (slash-triggered manual-only)

**Files:**
- Create: `packages/templates/javascript-patterns/copilot/javascript-patterns.prompt.md`

Per DEC-011/DEC-002'': Copilot catalog is at `.github/prompts/` (slash popup manual) not `.github/instructions/` (auto-attach). Uses `.prompt.md` convention.

- [ ] **Step 8.1: Write Copilot catalog**

Create file `packages/templates/javascript-patterns/copilot/javascript-patterns.prompt.md`:

```markdown
---
description: "Use 30 JavaScript design/performance/loading patterns from patterns.dev. Slash-triggered — manual only."
mode: "agent"
---

# JavaScript Patterns Catalog

## Trigger Model

**Manual-only.** Skill này KHÔNG tự active. Chỉ kích hoạt khi:

- User gõ slash `/javascript-patterns` trong Copilot Chat
- User explicit prompt: "active skill javascript-patterns", "dùng javascript-patterns"
- User yêu cầu áp dụng 1 pattern có trong catalog bằng tên

Nếu không có trigger ở trên, **KHÔNG** apply pattern — tiếp tục theo convention repo hiện tại.

## Scope

Chỉ áp dụng trên file:

- `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`
- File test & spec tương ứng: `*.test.{js,ts,jsx,tsx}`, `*.spec.{js,ts,jsx,tsx}`

File ngoài scope (`.py`, `.rb`, `.go`, `.md`, config, …) → skill KHÔNG áp dụng kể cả khi được trigger.

## How to Use

1. Bảng bên dưới liệt kê 30 pattern + 1 dòng "when to use"
2. Khi task khớp cột "when to use" rõ ràng, dùng `#file:.github/prompts/javascript-patterns/<slug>.md` **TRƯỚC** khi viết code
3. Copy code ví dụ từ reference, không phải tự nhớ
4. KHÔNG pull tất cả references cùng lúc (tốn context)

## Ambiguity Protocol

Nếu task **không khớp rõ ràng** 1 pattern trong bảng (mơ hồ, multi-pattern, pattern không có trong catalog):

- **KHÔNG đoán** — đoán sai dẫn đến refactor sai hướng.
- **Delegate sang `/interview` skill** để phỏng vấn user về ý định, constraints, file scope.
- Sau khi interview ra spec rõ ràng, quay lại catalog này và chọn pattern khớp (nếu có).
- Nếu interview cho thấy task nằm ngoài scope của catalog, thông báo user và không áp dụng skill.

## Catalog

### Design Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Singleton | Exactly one shared instance across app | `javascript-patterns/singleton.md` |
| Observer | Pub-sub; broadcast state changes | `javascript-patterns/observer.md` |
...(giữ nguyên các row từ Claude catalog, đổi path prefix `references/` → `javascript-patterns/`)...

## Attribution

Refs phái sinh từ [patterns.dev](https://patterns.dev) (MIT) — xem `LICENSE`.
```

Generate catalog body by running this transform on the Claude catalog:

```bash
sed -E 's|`references/|`javascript-patterns/|g' \
    packages/templates/javascript-patterns/claude/SKILL.md \
  > /tmp/copilot-catalog-body.md
```

Then replace the YAML frontmatter (everything between first `---` and second `---`) with the `description + mode: agent` block shown above. Save to `packages/templates/javascript-patterns/copilot/javascript-patterns.prompt.md`.

- [ ] **Step 8.2: Verify Copilot catalog refs**

```bash
grep -oE 'javascript-patterns/[a-z0-9-]+\.md' packages/templates/javascript-patterns/copilot/javascript-patterns.prompt.md | sort -u > /tmp/copilot-catalog-refs.txt
ls packages/templates/javascript-patterns/copilot/javascript-patterns/ | sed 's/^/javascript-patterns\//' | sort -u > /tmp/copilot-actual-refs.txt
diff /tmp/copilot-catalog-refs.txt /tmp/copilot-actual-refs.txt
```
Expected: no diff.

- [ ] **Step 8.3: Verify NO `applyTo:` frontmatter (manual-only contract)**

```bash
grep -c "^applyTo:" packages/templates/javascript-patterns/copilot/javascript-patterns.prompt.md
```
Expected: `0` (zero). If >0, remove — Copilot must stay manual.

- [ ] **Step 8.4: Commit**

```bash
git add packages/templates/javascript-patterns/copilot/javascript-patterns.prompt.md
git commit -m "feat(templates): Copilot slash-triggered catalog prompt (manual-only, DEC-011)"
```

---

## Phase 4 — Codegen Manifest

### Task 9: Write failing manifest snapshot test

**Files:**
- Create: `packages/cli/src/__tests__/template-manifest.test.ts`

- [ ] **Step 9.1: Write test asserting expected manifest shape**

Create `packages/cli/src/__tests__/template-manifest.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { TEMPLATE_MANIFEST } from "#generated/template-manifest";

const EXPECTED_JS_PATTERNS_COUNT = 30;

describe("TEMPLATE_MANIFEST", () => {
  test("contains interview skill for all 4 tools", () => {
    expect(TEMPLATE_MANIFEST.interview).toBeDefined();
    expect(TEMPLATE_MANIFEST.interview.claude["SKILL.md"]).toMatch(/^---\n/);
    expect(TEMPLATE_MANIFEST.interview.cursor["SKILL.md"]).toMatch(/^---\n/);
    expect(TEMPLATE_MANIFEST.interview.codex["SKILL.md"]).toMatch(/^---\n/);
    expect(TEMPLATE_MANIFEST.interview.copilot["copilot.md"]).toBeDefined();
  });

  test("contains javascript-patterns skill with catalog + 30 refs per tool", () => {
    const js = TEMPLATE_MANIFEST["javascript-patterns"];
    expect(js).toBeDefined();

    for (const tool of ["claude", "cursor", "codex"] as const) {
      expect(js[tool]["SKILL.md"]).toContain("name: javascript-patterns");
      const refKeys = Object.keys(js[tool]).filter((k) => k.startsWith("references/"));
      expect(refKeys).toHaveLength(EXPECTED_JS_PATTERNS_COUNT);
    }

    // DEC-011: Copilot uses .prompt.md (slash-triggered manual), NOT .instructions.md (auto-attach)
    expect(js.copilot["javascript-patterns.prompt.md"]).toBeDefined();
    expect(js.copilot["javascript-patterns.instructions.md"]).toBeUndefined();
    expect(js.copilot["javascript-patterns.prompt.md"]).not.toContain("applyTo:");
    const copilotRefs = Object.keys(js.copilot).filter((k) => k.startsWith("javascript-patterns/"));
    expect(copilotRefs).toHaveLength(EXPECTED_JS_PATTERNS_COUNT);
  });

  test("includes shared LICENSE for javascript-patterns (fan-out rule)", () => {
    const js = TEMPLATE_MANIFEST["javascript-patterns"];
    expect(js._shared["LICENSE"]).toContain("MIT License");
  });
});
```

- [ ] **Step 9.2: Register `#generated/*` import alias**

Edit `packages/cli/package.json`, update `"imports"`:

```json
"imports": {
  "#utils/*": "./src/utils/*.ts",
  "#steps/*": "./src/steps/*.ts",
  "#generated/*": "./src/generated/*.ts"
}
```

- [ ] **Step 9.3: Run — test fails (no manifest)**

```bash
cd packages/cli && bun test src/__tests__/template-manifest.test.ts
```
Expected: FAIL — "Cannot find module '#generated/template-manifest'"

### Task 10: Implement codegen script

**Files:**
- Create: `packages/cli/scripts/generate-template-manifest.ts`
- Modify: `.gitignore`

- [ ] **Step 10.1: Write codegen script**

Create `packages/cli/scripts/generate-template-manifest.ts`:

```ts
#!/usr/bin/env bun
/**
 * Scans packages/templates/<skill>/ and emits
 * packages/cli/src/generated/template-manifest.ts
 * with explicit static imports. Run via `bun run gen:manifest`
 * (auto-fires on prebuild).
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const CLI_ROOT = join(import.meta.dir, "..");
const REPO_ROOT = join(CLI_ROOT, "../..");
const TEMPLATES_DIR = join(REPO_ROOT, "packages/templates");
const OUT_PATH = join(CLI_ROOT, "src/generated/template-manifest.ts");
const SHARED_FILES = new Set(["LICENSE"]);

interface ManifestEntry {
  importName: string;
  importPath: string;
  skill: string;
  tool: string;
  key: string;
}

function walkMd(dir: string, base: string, entries: string[] = []): string[] {
  for (const dirent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, dirent.name);
    if (dirent.isDirectory()) walkMd(full, base, entries);
    else if (/\.(md|mdx)$/.test(dirent.name)) entries.push(relative(base, full));
  }
  return entries;
}

function sanitizeIdent(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, "_");
}

function collect(): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  for (const skill of readdirSync(TEMPLATES_DIR, { withFileTypes: true })) {
    if (!skill.isDirectory()) continue;
    const skillDir = join(TEMPLATES_DIR, skill.name);

    // Shared files (LICENSE etc.)
    for (const f of readdirSync(skillDir, { withFileTypes: true })) {
      if (f.isFile() && SHARED_FILES.has(f.name)) {
        entries.push({
          importName: `${sanitizeIdent(skill.name)}__shared__${sanitizeIdent(f.name)}`,
          importPath: `@au-agentic/templates/${skill.name}/${f.name}`,
          skill: skill.name,
          tool: "_shared",
          key: f.name,
        });
      }
    }

    // Per-tool files
    for (const tool of readdirSync(skillDir, { withFileTypes: true })) {
      if (!tool.isDirectory()) continue;
      const toolDir = join(skillDir, tool.name);
      for (const rel of walkMd(toolDir, toolDir)) {
        entries.push({
          importName: `${sanitizeIdent(skill.name)}__${sanitizeIdent(tool.name)}__${sanitizeIdent(rel)}`,
          importPath: `@au-agentic/templates/${skill.name}/${tool.name}/${rel}`,
          skill: skill.name,
          tool: tool.name,
          key: rel,
        });
      }
    }

    // Top-level loose files (e.g. interview/copilot.md)
    for (const f of readdirSync(skillDir, { withFileTypes: true })) {
      if (f.isFile() && !SHARED_FILES.has(f.name) && /\.(md|mdx)$/.test(f.name)) {
        entries.push({
          importName: `${sanitizeIdent(skill.name)}__copilot__${sanitizeIdent(f.name)}`,
          importPath: `@au-agentic/templates/${skill.name}/${f.name}`,
          skill: skill.name,
          tool: "copilot",
          key: f.name,
        });
      }
    }
  }
  return entries;
}

function render(entries: ManifestEntry[]): string {
  const imports = entries
    .map((e) => `import ${e.importName} from "${e.importPath}" with { type: "text" };`)
    .join("\n");

  const byShape: Record<string, Record<string, Record<string, string>>> = {};
  for (const e of entries) {
    byShape[e.skill] ??= {};
    byShape[e.skill][e.tool] ??= {};
    byShape[e.skill][e.tool][e.key] = e.importName;
  }

  const manifestLines = Object.entries(byShape)
    .map(([skill, tools]) => {
      const toolLines = Object.entries(tools)
        .map(([tool, files]) => {
          const fileLines = Object.entries(files)
            .map(([k, name]) => `    ${JSON.stringify(k)}: ${name},`)
            .join("\n");
          return `  ${JSON.stringify(tool)}: {\n${fileLines}\n  },`;
        })
        .join("\n");
      return `  ${JSON.stringify(skill)}: {\n${toolLines}\n  },`;
    })
    .join("\n");

  return `// AUTO-GENERATED by packages/cli/scripts/generate-template-manifest.ts
// DO NOT EDIT. Run \`bun run gen:manifest\` (or \`bun run build\`) to regenerate.

${imports}

export const TEMPLATE_MANIFEST = {
${manifestLines}
} as const;

export type TemplateManifest = typeof TEMPLATE_MANIFEST;
`;
}

function main(): void {
  const entries = collect();
  if (entries.length === 0) throw new Error("No template entries found");
  mkdirSync(join(OUT_PATH, ".."), { recursive: true });
  writeFileSync(OUT_PATH, render(entries));
  console.log(`✓ Wrote ${entries.length} entries to ${relative(REPO_ROOT, OUT_PATH)}`);
}

if (import.meta.main) main();
```

- [ ] **Step 10.2: Add `generated/` to `.gitignore`**

Edit `/Users/phamau/Desktop/projects/me/au-agentic/.gitignore`, add:

```
# Codegen output
packages/cli/src/generated/
```

- [ ] **Step 10.3: Register `gen:manifest` + `prebuild` in `packages/cli/package.json`**

Edit `packages/cli/package.json`. Update `"scripts"` block:

```json
"scripts": {
  "gen:manifest": "bun scripts/generate-template-manifest.ts",
  "prebuild": "bun run gen:manifest",
  "build": "bun build src/index.ts --target=node --outdir=dist --format=esm --banner='#!/usr/bin/env node' --external=@clack/prompts --external=picocolors",
  "test": "bun run gen:manifest && ../../scripts/run-bun-test.sh --concurrent src/__tests__/",
  "typecheck": "bun run gen:manifest && tsc --noEmit",
  "lint": "biome lint .",
  "format": "biome format --write ."
}
```

Note: `test` and `typecheck` also run `gen:manifest` first because they depend on the generated file.

- [ ] **Step 10.4: Run codegen, inspect output**

```bash
cd packages/cli && bun run gen:manifest
head -30 src/generated/template-manifest.ts
```
Expected: header comment + ~150 `import` lines + `export const TEMPLATE_MANIFEST = { … }`.

- [ ] **Step 10.5: Run manifest test — should pass**

```bash
cd packages/cli && bun test src/__tests__/template-manifest.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 10.6: Commit**

```bash
git add packages/cli/scripts/generate-template-manifest.ts \
        packages/cli/src/__tests__/template-manifest.test.ts \
        packages/cli/package.json \
        .gitignore
git commit -m "feat(cli): codegen template manifest with prebuild trigger"
```

### Task 11: Wire turbo pipeline

**Files:**
- Modify: `turbo.json`

- [ ] **Step 11.1: Read current `turbo.json`**

```bash
cat turbo.json
```

- [ ] **Step 11.2: Add `gen:manifest` task and wire as `build` dependency**

Example merge — adjust to exact existing structure. Update `"tasks"` block:

```json
{
  "tasks": {
    "gen:manifest": {
      "inputs": ["scripts/generate-template-manifest.ts", "../templates/**/*.md", "../templates/**/LICENSE"],
      "outputs": ["src/generated/**"],
      "cache": true
    },
    "build": {
      "dependsOn": ["gen:manifest"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["gen:manifest"]
    },
    "typecheck": {
      "dependsOn": ["gen:manifest"]
    }
  }
}
```

If `turbo.json` already has these tasks, merge carefully — do NOT delete existing entries.

- [ ] **Step 11.3: Verify turbo picks up the task**

```bash
bun run verify
```
Expected: `gen:manifest` runs once, then build/test/typecheck. Cache-hit on 2nd run.

- [ ] **Step 11.4: Commit**

```bash
git add turbo.json
git commit -m "chore(turbo): wire gen:manifest into build pipeline"
```

---

## Phase 5 — Refactor `templates.ts` for multi-skill

### Task 12: Rewrite `utils/templates.ts` to consume manifest

**Files:**
- Modify: `packages/cli/src/utils/templates.ts`

- [ ] **Step 12.1: Rewrite to multi-skill API**

Replace entire content of `packages/cli/src/utils/templates.ts`:

```ts
import { TEMPLATE_MANIFEST } from "#generated/template-manifest";

export const TOOLS = ["cursor", "claude", "copilot", "codex"] as const;
export type Tool = (typeof TOOLS)[number];

export const SKILLS = ["interview", "javascript-patterns"] as const;
export type Skill = (typeof SKILLS)[number];

interface ToolMeta {
  label: string;
  nextStep: (skill: Skill) => string;
}

const TOOL_META: Record<Tool, ToolMeta> = {
  cursor: {
    label: "Cursor",
    nextStep: (s) =>
      s === "interview"
        ? "Mở Cursor → Chat panel → Gõ /interview"
        : "Cursor Chat → Gõ /javascript-patterns (manual-only, chỉ trên file .js/.ts + test/spec)",
  },
  claude: {
    label: "Claude Code",
    nextStep: (s) =>
      s === "interview"
        ? "Chạy `claude` → Gõ /interview"
        : "Chạy `claude` → Gõ /javascript-patterns (manual-only, chỉ trên file .js/.ts + test/spec)",
  },
  copilot: {
    label: "GitHub Copilot",
    nextStep: (s) =>
      s === "interview"
        ? "VS Code → Copilot Chat → Gõ /interview"
        : "VS Code → Copilot Chat → Gõ /javascript-patterns (slash popup, manual-only)",
  },
  codex: {
    label: "Codex CLI",
    nextStep: (s) =>
      s === "interview"
        ? "Chạy `codex` → Gõ $interview hoặc /interview"
        : "Chạy `codex` → Gõ $javascript-patterns hoặc /javascript-patterns (manual-only)",
  },
};

export const TOOL_LABELS: Record<Tool, string> = {
  cursor: TOOL_META.cursor.label,
  claude: TOOL_META.claude.label,
  copilot: TOOL_META.copilot.label,
  codex: TOOL_META.codex.label,
};

export const SKILL_LABELS: Record<Skill, string> = {
  interview: "interview — structured requirement Q&A",
  "javascript-patterns": "javascript-patterns — 30 JS patterns from patterns.dev (JS/TS projects only)",
};

export const DEFAULT_SKILL_SELECTION: Skill[] = ["interview"];

interface ScaffoldFile {
  targetPath: string;
  content: string;
}

/**
 * Map a skill + tool + source-key to the project-relative target path.
 * Example: (javascript-patterns, claude, references/singleton.md) → .claude/skills/javascript-patterns/references/singleton.md
 */
function targetFor(skill: Skill, tool: Tool, key: string): string {
  // interview has legacy one-file-per-tool layout
  if (skill === "interview") {
    switch (tool) {
      case "cursor":
        return `.cursor/skills/interview/SKILL.md`;
      case "claude":
        return `.claude/skills/interview/SKILL.md`;
      case "copilot":
        return `.github/prompts/interview.prompt.md`;
      case "codex":
        return key === "SKILL.md"
          ? `.agents/skills/interview/SKILL.md`
          : `.agents/skills/interview/${key}`;
    }
  }

  // javascript-patterns
  switch (tool) {
    case "claude":
      return `.claude/skills/javascript-patterns/${key}`;
    case "cursor":
      return `.cursor/skills/javascript-patterns/${key}`;
    case "codex":
      return `.agents/skills/javascript-patterns/${key}`;
    case "copilot":
      // copilot source keys are "javascript-patterns.prompt.md" (catalog,
      // slash-triggered manual per DEC-011) or "javascript-patterns/<slug>.md" (ref).
      return `.github/prompts/${key}`;
  }
}

function sharedTargetsFor(skill: Skill, tool: Tool, key: string): string {
  // LICENSE fan-out: 1 source → N target (one per selected tool folder).
  if (skill === "javascript-patterns" && key === "LICENSE") {
    switch (tool) {
      case "claude":
        return `.claude/skills/javascript-patterns/LICENSE`;
      case "cursor":
        return `.cursor/skills/javascript-patterns/LICENSE`;
      case "codex":
        return `.agents/skills/javascript-patterns/LICENSE`;
      case "copilot":
        return `.github/prompts/javascript-patterns/LICENSE`;
    }
  }
  throw new Error(`Unknown shared file for ${skill}: ${key}`);
}

/**
 * Enumerate every (targetPath, content) pair that should be written
 * for the given skill × tool combination.
 */
export function filesForSkillTool(skill: Skill, tool: Tool): ScaffoldFile[] {
  const files: ScaffoldFile[] = [];
  const entry = TEMPLATE_MANIFEST[skill];
  if (!entry) throw new Error(`Unknown skill: ${skill}`);

  // Per-tool files
  const toolBucket = (entry as Record<string, Record<string, string>>)[tool];
  if (toolBucket) {
    for (const [key, content] of Object.entries(toolBucket)) {
      files.push({ targetPath: targetFor(skill, tool, key), content });
    }
  }

  // Shared fan-out (e.g. LICENSE)
  const shared = (entry as Record<string, Record<string, string>>)._shared;
  if (shared) {
    for (const [key, content] of Object.entries(shared)) {
      files.push({ targetPath: sharedTargetsFor(skill, tool, key), content });
    }
  }

  return files;
}

export function getToolLabel(tool: Tool): string {
  return TOOL_META[tool].label;
}

export function getNextStep(tool: Tool, skill: Skill): string {
  return TOOL_META[tool].nextStep(skill);
}
```

- [ ] **Step 12.2: Typecheck — will fail since copy.ts, steps/tools.ts still use old API**

```bash
cd packages/cli && bun run typecheck
```
Expected: FAIL — `getTargetPath`, `getTemplateContent`, `getNextStep` signature changes. That's OK; Task 13–14 fixes callers.

### Task 13: Rewrite `steps/copy.ts` for multi-skill

**Files:**
- Modify: `packages/cli/src/steps/copy.ts`

- [ ] **Step 13.1: Rewrite to loop over skills × tools**

Replace entire content of `packages/cli/src/steps/copy.ts`:

```ts
import { join } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { fileExists, writeTemplate } from "#utils/files";
import {
  filesForSkillTool,
  getNextStep,
  getToolLabel,
  type Skill,
  type Tool,
} from "#utils/templates";

type CopyResult = "copied" | "skipped" | "failed";
type FileStatus = "new" | "overwrite";

interface FileResult {
  skill: Skill;
  tool: Tool;
  targetPath: string;
  status: FileStatus;
  result: CopyResult;
  error?: string;
}

interface CopyOptions {
  confirmOverwrite: (targetPath: string) => Promise<boolean>;
  onResult?: (result: FileResult) => void;
}

export async function copyFilesToProject(
  projectPath: string,
  tools: Tool[],
  skills: Skill[],
  options: CopyOptions,
): Promise<FileResult[]> {
  const results: FileResult[] = [];

  for (const skill of skills) {
    for (const tool of tools) {
      for (const { targetPath, content } of filesForSkillTool(skill, tool)) {
        const abs = join(projectPath, targetPath);
        const exists = await fileExists(abs);
        const status: FileStatus = exists ? "overwrite" : "new";

        if (exists) {
          const confirmed = await options.confirmOverwrite(abs);
          if (!confirmed) {
            const r: FileResult = { skill, tool, targetPath: abs, status, result: "skipped" };
            results.push(r);
            options.onResult?.(r);
            continue;
          }
        }

        try {
          await writeTemplate(content, abs);
          const r: FileResult = { skill, tool, targetPath: abs, status, result: "copied" };
          results.push(r);
          options.onResult?.(r);
        } catch (err) {
          const r: FileResult = {
            skill,
            tool,
            targetPath: abs,
            status,
            result: "failed",
            error: (err as Error).message,
          };
          results.push(r);
          options.onResult?.(r);
        }
      }
    }
  }

  return results;
}

function showResults(results: FileResult[]): void {
  const hasFailure = results.some((r) => r.result === "failed");
  if (hasFailure) p.log.warn("Scaffold completed with errors");

  for (const r of results) {
    const icon =
      r.result === "copied" ? pc.green("✓") : r.result === "skipped" ? pc.dim("–") : pc.red("✗");
    const label =
      r.result === "copied" && r.status === "new"
        ? pc.dim("(new)")
        : r.result === "copied" && r.status === "overwrite"
          ? pc.dim("(overwritten)")
          : r.result === "skipped"
            ? pc.dim("(skipped)")
            : pc.red(`(failed: ${r.error})`);
    p.log.message(`  ${icon} ${r.targetPath} ${label}`);
  }
}

function showNextSteps(tools: Tool[], skills: Skill[]): void {
  p.log.message(`\n${pc.dim("Next steps:")}`);
  for (const skill of skills) {
    p.log.message(`  ${pc.bold(skill)}:`);
    for (const tool of tools) {
      p.log.message(`    ${getToolLabel(tool)}: ${getNextStep(tool, skill)}`);
    }
  }
}

export async function stepCopy(
  projectPath: string,
  tools: Tool[],
  skills: Skill[],
): Promise<void> {
  const previews: Array<{ skill: Skill; tool: Tool; targetPath: string; exists: boolean }> = [];
  for (const skill of skills) {
    for (const tool of tools) {
      for (const { targetPath } of filesForSkillTool(skill, tool)) {
        const abs = join(projectPath, targetPath);
        previews.push({ skill, tool, targetPath: abs, exists: await fileExists(abs) });
      }
    }
  }

  p.log.info(
    `Will scaffold ${skills.length} skill(s) × ${tools.length} tool(s) = ${previews.length} file(s)`,
  );

  const action = await p.select({
    message: "What would you like to do?",
    options: [
      { value: "preview", label: "Preview files first" },
      { value: "copy", label: "Copy now" },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel("Cancelled — no files were modified");
    process.exit(1);
  }

  if (action === "preview") {
    p.log.message(pc.dim("\nFile preview:"));
    for (const f of previews) {
      const label = f.exists ? pc.yellow("(overwrite)") : pc.green("(new)");
      p.log.message(`  ${f.targetPath} ${label}`);
    }
    const proceed = await p.confirm({ message: "Proceed to copy?" });
    if (p.isCancel(proceed) || !proceed) {
      p.outro("No files were copied.");
      process.exit(0);
    }
  }

  const copiedPaths: string[] = [];

  const results = await copyFilesToProject(projectPath, tools, skills, {
    confirmOverwrite: async (targetPath) => {
      const answer = await p.confirm({ message: `${targetPath} already exists. Overwrite?` });
      if (p.isCancel(answer)) {
        const copiedList =
          copiedPaths.length > 0
            ? `\nFiles already copied:\n${copiedPaths.map((x) => `  ${x}`).join("\n")}`
            : "";
        p.cancel(`Cancelled.${copiedList}\nRemaining files were not copied.`);
        process.exit(1);
      }
      return answer as boolean;
    },
    onResult: (r) => {
      if (r.result === "copied") copiedPaths.push(r.targetPath);
    },
  });

  showResults(results);
  showNextSteps(tools, skills);

  const hasFailure = results.some((r) => r.result === "failed");
  if (hasFailure) {
    const failCount = results.filter((r) => r.result === "failed").length;
    const okCount = results.filter((r) => r.result === "copied").length;
    p.outro(`${okCount} file(s) created, ${failCount} failed. Fix permissions and run again.`);
    process.exit(1);
  }

  p.outro(pc.green("✓ Scaffold complete!"));
}
```

- [ ] **Step 13.2: Typecheck — copy.ts now compiles, index.ts may still fail**

```bash
cd packages/cli && bun run typecheck
```
Expected: index.ts error about `stepCopy` signature or missing skills step. Fix in Task 14.

---

## Phase 6 — Wizard Skill-Select Step

### Task 14: Create `steps/skills.ts`

**Files:**
- Create: `packages/cli/src/steps/skills.ts`

- [ ] **Step 14.1: Write step**

Create `packages/cli/src/steps/skills.ts`:

```ts
import * as p from "@clack/prompts";
import {
  DEFAULT_SKILL_SELECTION,
  SKILLS,
  SKILL_LABELS,
  type Skill,
} from "#utils/templates";

export async function stepSelectSkills(): Promise<Skill[]> {
  const selected = await p.multiselect<Skill>({
    message: "Which skills do you want to scaffold? (Space to toggle, Enter to confirm)",
    options: SKILLS.map((s) => ({
      value: s,
      label: SKILL_LABELS[s],
    })),
    initialValues: DEFAULT_SKILL_SELECTION,
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelled — no files were modified");
    process.exit(1);
  }

  return selected as Skill[];
}
```

### Task 15: Wire step into `src/index.ts`

**Files:**
- Modify: `packages/cli/src/index.ts`

- [ ] **Step 15.1: Update `main()` to call skills step**

Replace body of `main()` in `packages/cli/src/index.ts`:

```ts
async function main(): Promise<void> {
  p.intro(
    `${pc.blue("◆ au-agentic")} ${pc.dim(`v${pkg.version}`)}\n` +
      `${pc.gray("Scaffold enterprise slash commands for AI coding tools")}`,
  );

  const projectPath = await stepInputPath();
  const tools = await stepSelectTools();
  const skills = await stepSelectSkills();
  await stepCopy(projectPath, tools, skills);
}
```

Add import at top alongside existing step imports:

```ts
import { stepSelectSkills } from "#steps/skills";
```

- [ ] **Step 15.2: Typecheck passes**

```bash
cd packages/cli && bun run typecheck
```
Expected: no errors.

- [ ] **Step 15.3: Manual smoke test (optional, not blocking)**

```bash
cd packages/cli && bun run build
cd /tmp && rm -rf smoke && mkdir smoke && cd smoke && bun /Users/phamau/Desktop/projects/me/au-agentic/packages/cli/dist/index.js
# Walk through: path=`.`, tools=all 4, skills=javascript-patterns only, confirm
# Then verify: ls .claude/skills/javascript-patterns/references/ shows 30 files
```

- [ ] **Step 15.4: Commit**

```bash
git add packages/cli/src/utils/templates.ts \
        packages/cli/src/steps/copy.ts \
        packages/cli/src/steps/skills.ts \
        packages/cli/src/index.ts
git commit -m "feat(cli): add skill-select step + multi-skill scaffold"
```

---

## Phase 7 — Update + Extend Existing Tests

### Task 16: Update `copy.test.ts` for new signature + multi-skill

**Files:**
- Modify: `packages/cli/src/__tests__/copy.test.ts`

- [ ] **Step 16.1: Read current test file**

```bash
cat packages/cli/src/__tests__/copy.test.ts
```

- [ ] **Step 16.2: Update to pass `skills` argument + add multi-skill test**

Update existing tests to add `skills: ["interview"]` argument to `copyFilesToProject` calls. Then append new test:

```ts
test("multi-skill scaffold writes javascript-patterns refs under each tool", async () => {
  const projectPath = await Bun.file(Bun.FileSystemRouter).write; // adapt to existing tmp-dir helper
  // (Use same tmp-dir pattern as existing tests in this file.)

  const results = await copyFilesToProject(
    projectPath,
    ["claude"],
    ["javascript-patterns"],
    { confirmOverwrite: async () => true },
  );

  const copied = results.filter((r) => r.result === "copied").map((r) => r.targetPath);
  expect(copied.some((p) => p.endsWith(".claude/skills/javascript-patterns/SKILL.md"))).toBe(true);
  expect(copied.some((p) => p.endsWith(".claude/skills/javascript-patterns/LICENSE"))).toBe(true);
  expect(copied.filter((p) => p.includes("/references/")).length).toBe(30);
});
```

Adapt to whatever tmp-dir helper the existing file uses (e.g. `mkdtemp`, `Bun.file`).

- [ ] **Step 16.3: Run tests — should pass**

```bash
cd packages/cli && bun run test
```
Expected: all existing tests + new multi-skill test pass.

- [ ] **Step 16.4: Commit**

```bash
git add packages/cli/src/__tests__/copy.test.ts
git commit -m "test(cli): extend copy tests for multi-skill scaffolding"
```

---

## Phase 8 — Golden File Test (Tier 2)

### Task 17: Add golden file test for singleton + observer per tool

**Files:**
- Create: `packages/cli/src/__tests__/scaffold-golden.test.ts`
- Create: `packages/cli/src/__tests__/__golden__/*.md` (4–8 files)

- [ ] **Step 17.1: Generate goldens by scaffolding once**

Temporarily scaffold to a scratch dir and capture expected content:

```bash
mkdir -p /tmp/au-golden && cd /tmp/au-golden
# Scaffold javascript-patterns for claude only via CLI or programmatic call
# Then copy the expected files into repo goldens:
mkdir -p packages/cli/src/__tests__/__golden__
cp /tmp/au-golden/.claude/skills/javascript-patterns/references/singleton.md \
   packages/cli/src/__tests__/__golden__/claude-singleton.md
cp /tmp/au-golden/.claude/skills/javascript-patterns/references/observer.md \
   packages/cli/src/__tests__/__golden__/claude-observer.md
# Repeat for copilot:
cp /tmp/au-golden/.github/prompts/javascript-patterns/singleton.md \
   packages/cli/src/__tests__/__golden__/copilot-singleton.md
```

- [ ] **Step 17.2: Write golden test**

Create `packages/cli/src/__tests__/scaffold-golden.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { filesForSkillTool } from "#utils/templates";

const GOLDEN_DIR = join(import.meta.dir, "__golden__");

function loadGolden(name: string): string {
  return readFileSync(join(GOLDEN_DIR, name), "utf8");
}

function findFile(files: ReturnType<typeof filesForSkillTool>, suffix: string): string {
  const hit = files.find((f) => f.targetPath.endsWith(suffix));
  if (!hit) throw new Error(`No scaffolded file ending in ${suffix}`);
  return hit.content;
}

describe("scaffold-golden: javascript-patterns", () => {
  test("claude singleton.md matches golden", () => {
    const files = filesForSkillTool("javascript-patterns", "claude");
    expect(findFile(files, "/references/singleton.md")).toBe(loadGolden("claude-singleton.md"));
  });

  test("claude observer.md matches golden", () => {
    const files = filesForSkillTool("javascript-patterns", "claude");
    expect(findFile(files, "/references/observer.md")).toBe(loadGolden("claude-observer.md"));
  });

  test("copilot singleton.md matches golden (no attribution header change)", () => {
    const files = filesForSkillTool("javascript-patterns", "copilot");
    expect(findFile(files, "/javascript-patterns/singleton.md")).toBe(
      loadGolden("copilot-singleton.md"),
    );
  });

  test("all scaffolded refs start with attribution header", () => {
    for (const tool of ["claude", "cursor", "codex"] as const) {
      const files = filesForSkillTool("javascript-patterns", tool);
      const refs = files.filter((f) => f.targetPath.includes("/references/"));
      for (const ref of refs) {
        expect(ref.content.startsWith("<!-- Source:")).toBe(true);
        expect(ref.content).toContain("MIT — see ../LICENSE");
      }
    }
  });
});
```

- [ ] **Step 17.3: Run — pass**

```bash
cd packages/cli && bun test src/__tests__/scaffold-golden.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 17.4: Commit**

```bash
git add packages/cli/src/__tests__/scaffold-golden.test.ts \
        packages/cli/src/__tests__/__golden__/
git commit -m "test(cli): golden file coverage for javascript-patterns scaffold"
```

### Task 17b: Skill contract test (Tier 4 — 3 success criteria per DEC-011/012/013)

**Files:**
- Create: `packages/cli/src/__tests__/skill-contract.test.ts`

This tier is dedicated to the 3 manual-only success criteria. Fails if any future edit silently regresses trigger-manual-only, scope, or ambiguity-delegation behavior.

- [ ] **Step 17b.1: Write contract test**

Create `packages/cli/src/__tests__/skill-contract.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import { TEMPLATE_MANIFEST } from "#generated/template-manifest";

const JS = TEMPLATE_MANIFEST["javascript-patterns"];
const AGENT_TOOLS = ["claude", "cursor", "codex"] as const;

describe("javascript-patterns skill contract", () => {
  describe("DEC-011: manual-trigger-only", () => {
    for (const tool of AGENT_TOOLS) {
      test(`${tool} SKILL.md declares disable-model-invocation: true`, () => {
        const skillMd = JS[tool]["SKILL.md"];
        expect(skillMd).toContain("disable-model-invocation: true");
      });

      test(`${tool} SKILL.md does NOT declare paths: frontmatter`, () => {
        const skillMd = JS[tool]["SKILL.md"];
        // paths: at start-of-line within frontmatter would auto-activate
        expect(skillMd).not.toMatch(/^paths:\s*$/m);
        expect(skillMd).not.toMatch(/^paths:\s*\n\s*-/m);
      });

      test(`${tool} SKILL.md body contains Trigger Model block`, () => {
        const skillMd = JS[tool]["SKILL.md"];
        expect(skillMd).toContain("## Trigger Model");
        expect(skillMd).toContain("Manual-only");
        expect(skillMd).toContain("/javascript-patterns");
      });
    }

    test("Copilot catalog is at .prompt.md (slash-triggered), NOT .instructions.md", () => {
      expect(JS.copilot["javascript-patterns.prompt.md"]).toBeDefined();
      expect(JS.copilot["javascript-patterns.instructions.md"]).toBeUndefined();
    });

    test("Copilot catalog does NOT declare applyTo: (manual-only)", () => {
      const catalog = JS.copilot["javascript-patterns.prompt.md"];
      expect(catalog).not.toMatch(/^applyTo:/m);
    });
  });

  describe("DEC-012: scope = JS/TS source + test/spec files only", () => {
    const catalogs = [
      ...AGENT_TOOLS.map((t) => ({ tool: t, content: JS[t]["SKILL.md"] })),
      { tool: "copilot", content: JS.copilot["javascript-patterns.prompt.md"] },
    ];

    for (const { tool, content } of catalogs) {
      test(`${tool} catalog declares Scope block listing JS + TS + test + spec`, () => {
        expect(content).toContain("## Scope");
        expect(content).toContain(".js");
        expect(content).toContain(".ts");
        expect(content).toMatch(/\.test\./);
        expect(content).toMatch(/\.spec\./);
      });

      test(`${tool} catalog Scope block precedes Catalog table`, () => {
        const scopeIdx = content.indexOf("## Scope");
        const catalogIdx = content.indexOf("## Catalog");
        expect(scopeIdx).toBeGreaterThan(-1);
        expect(catalogIdx).toBeGreaterThan(-1);
        expect(scopeIdx).toBeLessThan(catalogIdx);
      });
    }
  });

  describe("DEC-013: ambiguity → delegate /interview", () => {
    const catalogs = [
      ...AGENT_TOOLS.map((t) => ({ tool: t, content: JS[t]["SKILL.md"] })),
      { tool: "copilot", content: JS.copilot["javascript-patterns.prompt.md"] },
    ];

    for (const { tool, content } of catalogs) {
      test(`${tool} catalog contains Ambiguity Protocol referencing /interview`, () => {
        expect(content).toContain("## Ambiguity Protocol");
        expect(content).toContain("/interview");
        expect(content).toMatch(/KHÔNG đoán|do not guess|don't guess/i);
      });

      test(`${tool} catalog delegation block appears before Catalog table`, () => {
        const ambIdx = content.indexOf("## Ambiguity Protocol");
        const catalogIdx = content.indexOf("## Catalog");
        expect(ambIdx).toBeGreaterThan(-1);
        expect(ambIdx).toBeLessThan(catalogIdx);
      });
    }
  });
});
```

- [ ] **Step 17b.2: Run — should PASS if Task 6 + 8 catalogs were written correctly**

```bash
cd packages/cli && bun test src/__tests__/skill-contract.test.ts
```
Expected: PASS. If any test fails, fix the corresponding catalog section (Task 6 for Claude/Cursor/Codex, Task 8 for Copilot) and re-run.

- [ ] **Step 17b.3: Commit**

```bash
git add packages/cli/src/__tests__/skill-contract.test.ts
git commit -m "test(cli): skill contract — trigger/scope/ambiguity (DEC-011/012/013)"
```

---

## Phase 9 — Docs Tier 1 (mandatory)

### Task 18: Update `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 18.1: Update "What gets scaffolded" table**

Replace existing table with:

```markdown
| Skill | Tool | File(s) created |
|---|---|---|
| interview | Cursor | `.cursor/skills/interview/SKILL.md` |
| interview | Claude Code | `.claude/skills/interview/SKILL.md` |
| interview | GitHub Copilot | `.github/prompts/interview.prompt.md` |
| interview | Codex CLI | `.agents/skills/interview/SKILL.md` (+ `references/`) |
| javascript-patterns | Cursor | `.cursor/skills/javascript-patterns/{SKILL.md, LICENSE, references/*.md}` |
| javascript-patterns | Claude Code | `.claude/skills/javascript-patterns/{SKILL.md, LICENSE, references/*.md}` |
| javascript-patterns | GitHub Copilot | `.github/prompts/{javascript-patterns.prompt.md, javascript-patterns/*.md, javascript-patterns/LICENSE}` |
| javascript-patterns | Codex CLI | `.agents/skills/javascript-patterns/{SKILL.md, LICENSE, references/*.md}` |
```

- [ ] **Step 18.2: Update wizard step count**

Change the "The wizard will:" list to:

```markdown
1. Ask for your project path
2. Ask which AI tools you use (Cursor, Claude Code, GitHub Copilot, Codex CLI)
3. Ask which skills to scaffold (interview, javascript-patterns)
4. Copy the selected skill files to the right locations
```

- [ ] **Step 18.3: Add "Attribution" + "Activation model" sections**

Add before "Requirements" section:

```markdown
## Attribution

The `javascript-patterns` skill bundles 30 JavaScript pattern skills derived from [patterns.dev](https://patterns.dev) (MIT licensed). Upstream: [PatternsDev/skills](https://github.com/PatternsDev/skills). Full MIT text is copied into each scaffolded skill folder.

## Activation model

Both shipped skills (`interview` and `javascript-patterns`) are **manual-trigger-only** — they never self-activate. Invoke them via:

- Slash popup: `/interview`, `/javascript-patterns`
- Explicit prompt: "active skill interview", "dùng javascript-patterns"

`javascript-patterns` additionally constrains itself to `.js`, `.ts` (+ `.test.*`, `.spec.*`) files; it delegates to `/interview` if the task doesn't map cleanly to a catalog pattern.
```

- [ ] **Step 18.4: Commit**

```bash
git add README.md
git commit -m "docs(readme): document javascript-patterns skill + MIT attribution"
```

### Task 19: Update `docs/ai/repo-map.md`

**Files:**
- Modify: `docs/ai/repo-map.md`

- [ ] **Step 19.1: Extend `packages/templates/` section**

Under "packages/templates/ — Raw Markdown Templates", replace Structure block:

```
templates/
├── interview/
│   ├── cursor/SKILL.md   → .cursor/skills/interview/SKILL.md
│   ├── claude/SKILL.md   → .claude/skills/interview/SKILL.md
│   ├── copilot.md        → .github/prompts/interview.prompt.md
│   └── codex/SKILL.md    → .agents/skills/interview/SKILL.md (+ references/)
└── javascript-patterns/
    ├── LICENSE                               → fans out per tool (DEC-009)
    ├── {claude,cursor,codex}/
    │   ├── SKILL.md                          → .<tool>/skills/javascript-patterns/SKILL.md
    │   └── references/*.md (30)              → .<tool>/skills/javascript-patterns/references/
    └── copilot/
        ├── javascript-patterns.prompt.md     → .github/prompts/ (slash-triggered, DEC-011)
        └── javascript-patterns/*.md (30)     → .github/prompts/javascript-patterns/
```

- [ ] **Step 19.2: Add codegen manifest mention**

Under "packages/cli/" section, add bullet to Key modules:

```
- `scripts/generate-template-manifest.ts` — codegen: scan templates/, emit src/generated/template-manifest.ts (run by prebuild)
- `src/generated/template-manifest.ts` — AUTO-GENERATED static import manifest (gitignored)
- `src/steps/skills.ts` — Step 3 (new): Multi-select skills (interview default-on)
```

- [ ] **Step 19.3: Add sync script + Sensitive Zones update**

Find "## Sensitive Zones" section and extend:

```markdown
**packages/cli/scripts/generate-template-manifest.ts:**
- Touches auto-generated output consumed by templates.ts
- Changes require running `bun run gen:manifest` and committing manifest contract tests
- Manifest shape is part of CLI test contract

**scripts/sync-upstream-patterns.ts:**
- Manual-run only (no auto/network at build time)
- Overwrites `packages/templates/javascript-patterns/{refs, LICENSE}`
- Warn-and-stop if local refs diverge from upstream
```

- [ ] **Step 19.4: Commit**

```bash
git add docs/ai/repo-map.md
git commit -m "docs(ai): map javascript-patterns + codegen + sync into repo-map"
```

### Task 20: Update remaining Tier 1 docs

**Files:**
- Modify: `docs/reference/project-structure.md`
- Modify: `docs/development/workflow.md`
- Modify: `docs/ai/testing-policy.md`
- Modify: `docs/development/testing.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 20.1: Update `docs/reference/project-structure.md`**

Add a new "Skills" subsection mirroring the structure tree from Task 19.

- [ ] **Step 20.2: Update `docs/development/workflow.md`**

Add to Scripts table / Development commands section:

```markdown
| `bun run sync:upstream-patterns` | Manually re-sync patterns.dev content into `packages/templates/javascript-patterns/`. Review diff before committing. |
| `bun run --cwd packages/cli gen:manifest` | Regenerate `src/generated/template-manifest.ts`. Auto-runs on prebuild. |
```

- [ ] **Step 20.3: Update `docs/ai/testing-policy.md`**

Add new section "Focused-test Tiers (3-tier pattern)":

```markdown
## Focused-Test Tiers

When a feature involves N-way multiplication (e.g. N skills × M tools = K files), do NOT write K separate assertion tests. Use 3 focused tiers:

1. **Manifest snapshot** — catches "new file added but not registered". One test asserts shape (counts, keys, minimum content markers).
2. **Golden file** — catches content drift through transforms. 1–2 representative samples per tool, not all K.
3. **Integration** — catches path-mapping / wiring bugs. End-to-end scaffold into a tmp dir, assert path tree.

Rationale: each test targets one specific bug class. No "coverage for coverage's sake".
```

- [ ] **Step 20.4: Update `docs/development/testing.md`**

Add concrete example referencing Tier 1–3 test files for javascript-patterns:
- Tier 1: `packages/cli/src/__tests__/template-manifest.test.ts`
- Tier 2: `packages/cli/src/__tests__/scaffold-golden.test.ts` + `__golden__/`
- Tier 3: `packages/cli/src/__tests__/copy.test.ts` (multi-skill section)

- [ ] **Step 20.5: Update `CHANGELOG.md`**

Add under an `## [Unreleased]` section (or create one):

```markdown
### Added
- `javascript-patterns` skill (hub-and-spoke, 30 patterns from patterns.dev under MIT). Scaffold-able to Claude Code, Cursor, Codex CLI, GitHub Copilot.
- Wizard now includes a skill-select step (multi-select; `interview` default-on).
- `scripts/sync-upstream-patterns.ts` for manual upstream re-sync.
- `packages/cli/scripts/generate-template-manifest.ts` codegen (auto-runs on prebuild).
```

- [ ] **Step 20.6: Commit Tier 1**

```bash
git add docs/reference/project-structure.md \
        docs/development/workflow.md \
        docs/ai/testing-policy.md \
        docs/development/testing.md \
        CHANGELOG.md
git commit -m "docs(tier1): project structure, workflow, testing policy, changelog for javascript-patterns"
```

---

## Phase 10 — Docs Tier 2 (recommended)

### Task 21: Update Tier 2 docs

**Files:**
- Modify: `docs/ai/routing.md`
- Modify: `docs/getting-started/quickstart.md`
- Modify: `docs/examples/feature-walkthroughs.md`

- [ ] **Step 21.1: Update `docs/ai/routing.md`**

Add new row to the task-routing table (or add to existing "Add feature" row — match the file's format):

```markdown
| Adding a new skill template | docs/ai/repo-map.md + docs/reference/project-structure.md + codegen + 3-tier tests | `packages/templates/<skill>/` new folder → sync + codegen + wizard step update |
```

- [ ] **Step 21.2: Update `docs/getting-started/quickstart.md`**

Update the walkthrough to show 4 wizard steps (include skill-select) with the new javascript-patterns option.

- [ ] **Step 21.3: Add `docs/examples/feature-walkthroughs.md` section**

Append:

```markdown
## Using javascript-patterns Skill (end-to-end)

1. Scaffold:
   ```bash
   bunx au-agentic
   # Select tools: claude
   # Select skills: javascript-patterns
   ```
2. Open a JS/TS file in Claude Code.
3. Trigger manually: type `/javascript-patterns` in the slash popup, or ask "active skill javascript-patterns, refactor this global state into a Singleton".
4. Claude reads the catalog, finds the "Singleton" row, then `Read`s `.claude/skills/javascript-patterns/references/singleton.md` before coding. If the task were ambiguous, Claude would delegate to `/interview` first.
5. Add more patterns: edit upstream OR run `bun run sync:upstream-patterns`, then commit the diff.
```

- [ ] **Step 21.4: Commit Tier 2**

```bash
git add docs/ai/routing.md \
        docs/getting-started/quickstart.md \
        docs/examples/feature-walkthroughs.md
git commit -m "docs(tier2): routing, quickstart, feature walkthrough for javascript-patterns"
```

---

## Phase 11 — ADR (Tier 3)

### Task 22: Write ADR `0009-javascript-patterns-skill.md`

**Files:**
- Create: `docs/adr/0009-javascript-patterns-skill.md`

- [ ] **Step 22.1: Write ADR**

Create `docs/adr/0009-javascript-patterns-skill.md`:

```markdown
# ADR 0009: javascript-patterns Skill — Hub-and-Spoke with Codegen Manifest

**Status:** Accepted
**Date:** 2026-04-17
**Supersedes:** none
**Related:** ADR 0005 (imports-field alias pattern), spec 2026-04-17-javascript-patterns-skill-design.md

## Context

We want to port 30 JavaScript patterns from patterns.dev (MIT) into au-agentic as a scaffoldable skill. Three shape options were considered: 30 standalone skills, 30 flat templates, or 1 hub-and-spoke skill with a catalog routing to 30 reference files.

## Decision

Adopt hub-and-spoke shape (1 catalog `SKILL.md` + 30 `references/*.md`) per tool, with **manual-trigger-only activation** (DEC-011). Catalog frontmatter declares `disable-model-invocation: true` on Claude/Cursor/Codex; Copilot uses `.github/prompts/javascript-patterns.prompt.md` (slash `/javascript-patterns`) instead of `.github/instructions/` (auto-attach). Refs live under `.github/prompts/javascript-patterns/` for Copilot, reachable via `#file:`.

Catalog body enforces 2 additional guardrails: **Scope restriction to JS/TS + test/spec files** (DEC-012) and **Ambiguity → delegate `/interview`** (DEC-013). A Tier 4 contract test (`skill-contract.test.ts`) asserts all 3 success criteria programmatically.

Target paths mirror existing `interview/` convention for Claude/Cursor/Codex (`.{tool}/skills/javascript-patterns/`). We introduce a codegen manifest script (`packages/cli/scripts/generate-template-manifest.ts`) to emit static imports for ~125 template files without bloating `templates.ts`. Manifest is gitignored and regenerated on `prebuild` via turbo pipeline.

We keep upstream sync manual via `scripts/sync-upstream-patterns.ts` to preserve git diff review and avoid network at build/runtime.

## Consequences

**Positive:**
- Predictable activation: skill fires only on explicit user trigger — no surprise auto-pattern-application
- Progressive disclosure: catalog ~4KB loads on trigger; refs lazy-loaded only when task matches a pattern
- Ambiguity has a defined escape hatch (`/interview` delegation) instead of agent guessing
- CLI wizard stays clean with a new "Select skills" step (multi-select, interview default-on)
- Adding a new skill (e.g. react-patterns) = drop folder, run codegen; no `templates.ts` churn
- MIT compliance via `LICENSE` + per-ref attribution header + README section
- 3 success criteria protected by dedicated contract test (Tier 4) against regression

**Negative:**
- 125 files in one PR is large — mitigated via phased commits within the PR
- Manual-only means user must know the skill exists and when to invoke — discoverability tradeoff; mitigated by README "Activation model" section + wizard skill-select labels
- Upstream drift if we don't rerun sync script — acceptable tradeoff for review-before-apply safety

## Alternatives Considered

- **30 standalone skills:** rejected — floods CLI wizard and user context on Copilot
- **Flat 30-template layout:** rejected — doesn't scale when adding react/vue later
- **Auto-activation via `paths:` / `applyTo:`:** rejected (DEC-011) — user wants predictable manual trigger matching `interview/` skill semantics
- **Auto-sync at build:** rejected — violates no-runtime-I/O policy (AGENTS.md)
- **Vite `import.meta.glob()`:** rejected — not Bun-native API
- **Bun macros:** considered — codegen is stabler and grep-friendly

## Decision Log (from spec brainstorm, Rounds 1–11)

| ID        | Decision |
| --------- | -------- |
| DEC-001   | Hub-and-spoke shape |
| DEC-002'' | Copilot `.prompt.md` (slash) instead of `.instructions.md` |
| DEC-003   | Wizard "Select skills" multi-select |
| DEC-004'' | Catalog + verbatim refs + MIT header + Trigger/Scope/Ambiguity blocks |
| DEC-005   | Path convention mirrors `interview/` for Claude/Cursor/Codex |
| DEC-006'  | Codegen template-manifest.ts |
| DEC-007   | One-time import + manual sync script |
| DEC-008'  | 4-tier test (manifest + golden + integration + contract) |
| DEC-009   | LICENSE + per-ref header + README attribution |
| DEC-010   | Docs Tier 1+2+3 + ADR same PR |
| DEC-011   | **Manual-trigger-only activation** (disable-model-invocation + Copilot `.prompt.md`) |
| DEC-012   | **Scope = JS/TS + test/spec files only**, declared in catalog body |
| DEC-013   | **Ambiguity → delegate `/interview`**, enforced in catalog body + Tier 4 test |

Full context in [docs/superpowers/specs/2026-04-17-javascript-patterns-skill-design.md](../superpowers/specs/2026-04-17-javascript-patterns-skill-design.md).
```

- [ ] **Step 22.2: Commit ADR**

```bash
git add docs/adr/0009-javascript-patterns-skill.md
git commit -m "docs(adr): 0009 javascript-patterns skill architecture"
```

---

## Phase 12 — Final Verification + Ship

### Task 23: Run full verify

**Files:**
- None (read-only)

- [ ] **Step 23.1: Run `bun run verify` from repo root**

```bash
cd /Users/phamau/Desktop/projects/me/au-agentic
bun run verify
```
Expected:
- `gen:manifest` runs (or cache-hit)
- biome lint: 0 errors
- tsc: 0 errors
- bun test: all tests pass, including new manifest + golden + copy tests

- [ ] **Step 23.2: If any failure, do NOT mark done. Diagnose → fix → re-run.**

Common issues:
- Biome complains about generated file → add to `biome.json` `files.ignore`
- Typecheck fails on `#generated/*` path → verify `package.json` `imports` field includes it
- Golden test fails → regenerate goldens (Task 17.1) after fixing transform

- [ ] **Step 23.3: Also confirm scaffold integration from dist build**

```bash
cd packages/cli && bun run build
cd /tmp && rm -rf final-smoke && mkdir final-smoke && cd final-smoke
bun /Users/phamau/Desktop/projects/me/au-agentic/packages/cli/dist/index.js
# Interactively: path=., tools=claude + copilot, skills=interview + javascript-patterns
find . -type f | sort | head -40
```
Expected: `.claude/skills/interview/SKILL.md`, `.claude/skills/javascript-patterns/{SKILL.md, LICENSE}`, `.claude/skills/javascript-patterns/references/*.md` (30), `.github/prompts/interview.prompt.md`, `.github/prompts/javascript-patterns.prompt.md`, `.github/prompts/javascript-patterns/*.md` (30 + LICENSE).

### Task 24: Create PR

**Files:**
- None (git)

- [ ] **Step 24.1: Push branch + open PR**

```bash
cd /Users/phamau/Desktop/projects/me/au-agentic
git log --oneline origin/main..HEAD
git push -u origin HEAD
gh pr create --title "feat: javascript-patterns skill (30 patterns.dev JS patterns, hub-and-spoke)" --body "$(cat <<'EOF'
## Summary
- Add `javascript-patterns` skill: 30 JS patterns from patterns.dev (MIT), hub-and-spoke shape
- **Manual-trigger-only** (DEC-011): `/javascript-patterns` slash or explicit prompt; never self-activates
- **Scope**: `.js`/`.ts` + `.test.*`/`.spec.*` files only (DEC-012)
- **Ambiguity → `/interview`** delegation (DEC-013)
- Scaffold-able to Claude Code, Cursor, Codex CLI, GitHub Copilot (Copilot uses `.github/prompts/` slash, not `.github/instructions/` auto-attach)
- Wizard gains Step 3 "Select skills" (multi-select, interview default-on)
- Codegen manifest avoids bloating templates.ts with 150+ static imports
- 4-tier focused tests (manifest snapshot + golden + integration + skill contract)

Spec: [docs/superpowers/specs/2026-04-17-javascript-patterns-skill-design.md](docs/superpowers/specs/2026-04-17-javascript-patterns-skill-design.md)
ADR: [docs/adr/0009-javascript-patterns-skill.md](docs/adr/0009-javascript-patterns-skill.md)

## Test plan
- [ ] `bun run verify` passes (lint + typecheck + test)
- [ ] Manual scaffold in `/tmp/smoke`: javascript-patterns for all 4 tools → 125 files + LICENSE fan-out
- [ ] Opens a JS file in Claude Code and types `/javascript-patterns` → catalog loads; without the trigger, skill stays dormant (manual-only contract)
- [ ] Copilot: `/javascript-patterns` slash popup loads the prompt; catalog does NOT auto-attach to JS files (confirmed by opening a JS file with no trigger — no javascript-patterns context)
- [ ] Ambiguous prompt like "make this code better" → agent does not pick a pattern; delegates to `/interview` or asks clarifying question
- [ ] `bun run sync:upstream-patterns` runs to completion against real upstream (opt-in, not in CI)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 24.2: Announce PR URL** — capture from `gh pr create` output and share with user.

---

## Self-Review Checklist (run before marking plan complete)

- [ ] Every task references exact file paths (no "the right file")
- [ ] Every code step shows complete code, not "as above"
- [ ] Every test step shows expected output (PASS / FAIL / specific error)
- [ ] Every commit step shows exact message and files
- [ ] Types consistent: `Skill`, `Tool`, `ScaffoldFile`, `FileResult` defined once and reused
- [ ] No TODO/TBD/FIXME/"similar to above"
- [ ] Spec coverage: every DEC-001..013 decision is implemented by at least one task
  - DEC-001 hub-and-spoke → Phase 2–3 (sync + catalogs)
  - DEC-002'' Copilot `.prompt.md` slash-triggered → Task 8 + Task 12 (path mapping)
  - DEC-003 skill-select step → Phase 6
  - DEC-004'' catalog + verbatim + MIT header + trigger/scope/ambiguity blocks → Tasks 2, 6–8
  - DEC-005 path convention → Task 12 (targetFor)
  - DEC-006' codegen manifest → Phase 4
  - DEC-007 sync script → Phase 1–2
  - DEC-008' 4-tier tests → Tasks 9 (Tier 1), 16 (Tier 3), 17 (Tier 2), 17b (Tier 4)
  - DEC-009 LICENSE + header + README → Tasks 4, 17.2 checks, 18.3
  - DEC-010 Tier 1+2+3 docs → Phase 9–11
  - **DEC-011 manual-trigger-only** → Task 6 frontmatter + Trigger Model block; Task 8 `.prompt.md` path; Task 17b contract test assertions
  - **DEC-012 scope JS/TS + test/spec** → Task 6 Scope block; Task 17b Scope contract assertions
  - **DEC-013 ambiguity → /interview** → Task 6 Ambiguity Protocol block; Task 17b delegation contract assertions

---

## Follow-ups (deferred, NOT in this PR)

- React / Vue patterns (new skills, same hub-and-spoke, after this ships cleanly)
- Cursor `.cursor/rules/*.mdc` dual-scaffold (only if user feedback shows auto-invoke is weak)
- Plugin-style split into per-skill packages (only if skill count >5)
