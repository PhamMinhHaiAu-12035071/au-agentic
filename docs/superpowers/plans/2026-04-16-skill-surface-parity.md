# Skill Surface Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển output Cursor + Claude Code sang SKILL.md format để `/interview` xuất hiện trong `/` popup cả 4 tool bằng project-scope files.

**Architecture:** Restructure template folder → patch frontmatter → update CLI mapping → update docs. Không đổi build pipeline, không thêm tool/flag. Giữ version 1.0.0 (chưa có consumer ngoài).

**Tech Stack:** TypeScript, Bun, `bun:test`, text imports via `with { type: 'text' }`.

**Spec:** [docs/superpowers/specs/2026-04-16-skill-surface-parity-design.md](../specs/2026-04-16-skill-surface-parity-design.md)

---

## File Structure

**Templates (move + patch):**
- `packages/templates/interview/cursor.md` → `packages/templates/interview/cursor/SKILL.md`
- `packages/templates/interview/claude.md` → `packages/templates/interview/claude/SKILL.md`

**CLI (edit):**
- `packages/cli/src/utils/templates.ts` — imports + `TARGET_PATH_MAP`
- `packages/cli/src/steps/copy.ts` — `showNextSteps()`

**Tests (edit + add):**
- `packages/cli/src/__tests__/copy.test.ts` — thêm path assertion test
- `packages/cli/src/__tests__/templates.test.ts` — NEW file: assert frontmatter

**Docs (edit):**
- `README.md`
- `docs/ai/repo-map.md`
- `docs/ai/glossary.md`
- `docs/development/testing.md`

**Version:** giữ `1.0.0` — chưa có consumer ngoài, không cần bump.

---

## Task 1: Add Failing Path Assertion Test

**Files:**
- Modify: `packages/cli/src/__tests__/copy.test.ts`

- [ ] **Step 1: Thêm path assertion test**

Add to end of `describe('copyFilesToProject', ...)` block:

```typescript
  it('uses skill path for cursor and claude, prompt path for copilot, skill path for codex', () => {
    expect(getTargetPath('cursor')).toBe('.cursor/skills/interview/SKILL.md');
    expect(getTargetPath('claude')).toBe('.claude/skills/interview/SKILL.md');
    expect(getTargetPath('copilot')).toBe('.github/prompts/interview.prompt.md');
    expect(getTargetPath('codex')).toBe('.agents/skills/interview/SKILL.md');
  });
```

- [ ] **Step 2: Run test to verify fails**

Run: `bun test packages/cli/src/__tests__/copy.test.ts`

Expected: FAIL on cursor assertion (`.cursor/commands/interview.md` !== `.cursor/skills/interview/SKILL.md`).

- [ ] **Step 3: Commit failing test**

```bash
git add packages/cli/src/__tests__/copy.test.ts
git commit -m "test(cli): add failing target path assertion for skill migration"
```

---

## Task 2: Restructure Cursor Template

**Files:**
- Move: `packages/templates/interview/cursor.md` → `packages/templates/interview/cursor/SKILL.md`
- Modify: `packages/templates/interview/cursor/SKILL.md` (frontmatter)

- [ ] **Step 1: Move file**

```bash
mkdir -p packages/templates/interview/cursor
git mv packages/templates/interview/cursor.md packages/templates/interview/cursor/SKILL.md
```

- [ ] **Step 2: Patch frontmatter**

Replace the existing frontmatter block (lines 1-4) with:

```yaml
---
name: interview
description: Phỏng vấn requirement theo methodology có cấu trúc — biến yêu cầu mơ hồ thành spec rõ ràng bằng Tiếng Việt. Dùng khi user nói "interview me", "phỏng vấn requirement", "biến ý tưởng thành spec", hoặc trước khi plan/implement feature mới.
disable-model-invocation: true
---
<!-- au-agentic v1.0.0 | tool: cursor -->
```

Body (từ `Hãy dùng công cụ AskUserQuestion...` trở xuống) giữ nguyên.

- [ ] **Step 3: Commit**

```bash
git add packages/templates/interview/
git commit -m "refactor(templates): convert cursor template to SKILL.md format"
```

---

## Task 3: Restructure Claude Template

**Files:**
- Move: `packages/templates/interview/claude.md` → `packages/templates/interview/claude/SKILL.md`
- Modify: `packages/templates/interview/claude/SKILL.md` (frontmatter)

- [ ] **Step 1: Move file**

```bash
mkdir -p packages/templates/interview/claude
git mv packages/templates/interview/claude.md packages/templates/interview/claude/SKILL.md
```

- [ ] **Step 2: Patch frontmatter**

Replace the existing frontmatter block (lines 1-11) with:

```yaml
---
name: interview
description: Phỏng vấn requirement theo methodology có cấu trúc — biến yêu cầu mơ hồ thành spec rõ ràng bằng Tiếng Việt. Dùng khi user nói "interview me", "phỏng vấn requirement", "biến ý tưởng thành spec", hoặc trước khi plan/implement feature mới.
argument-hint: "[optional: context về project hoặc feature]"
disable-model-invocation: true
allowed-tools: AskUserQuestion Read Glob Grep
---
<!-- au-agentic v1.0.0 | tool: claude -->
```

Body (từ `Hãy dùng công cụ AskUserQuestion...` trở xuống) giữ nguyên.

- [ ] **Step 3: Commit**

```bash
git add packages/templates/interview/
git commit -m "refactor(templates): convert claude template to SKILL.md format"
```

---

## Task 4: Update CLI Template Mapping

**Files:**
- Modify: `packages/cli/src/utils/templates.ts`

- [ ] **Step 1: Update imports**

Replace lines 1-2:

```typescript
import cursorTemplate from '@au-agentic/templates/interview/cursor.md' with { type: 'text' };
import claudeTemplate from '@au-agentic/templates/interview/claude.md' with { type: 'text' };
```

with:

```typescript
import cursorTemplate from '@au-agentic/templates/interview/cursor/SKILL.md' with { type: 'text' };
import claudeTemplate from '@au-agentic/templates/interview/claude/SKILL.md' with { type: 'text' };
```

- [ ] **Step 2: Update TARGET_PATH_MAP**

Replace the `TARGET_PATH_MAP` block (lines 23-28):

```typescript
export const TARGET_PATH_MAP: Record<Tool, string> = {
  cursor: '.cursor/skills/interview/SKILL.md',
  claude: '.claude/skills/interview/SKILL.md',
  copilot: '.github/prompts/interview.prompt.md',
  codex: '.agents/skills/interview/SKILL.md',
};
```

- [ ] **Step 3: Run test to verify passes**

Run: `bun test packages/cli/src/__tests__/copy.test.ts`

Expected: PASS all tests including new path assertion.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/utils/templates.ts
git commit -m "feat(cli): map cursor and claude to skill paths"
```

---

## Task 5: Update Next-Steps Text

**Files:**
- Modify: `packages/cli/src/steps/copy.ts:90-96`

- [ ] **Step 1: Update `showNextSteps()` steps object**

Replace the `steps` constant:

```typescript
  const steps: Record<Tool, string> = {
    cursor: 'Mở Cursor → Chat panel → Gõ /interview',
    claude: 'Chạy `claude` → Gõ /interview',
    copilot: 'VS Code → Copilot Chat → Gõ /interview',
    codex: 'Chạy `codex` → Gõ $interview hoặc /interview',
  };
```

- [ ] **Step 2: Run full test suite**

Run: `bun test`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/steps/copy.ts
git commit -m "feat(cli): update next-steps to reflect /interview across all tools"
```

---

## Task 6: Add Template Frontmatter Assertion Test

**Files:**
- Create: `packages/cli/src/__tests__/templates.test.ts`

- [ ] **Step 1: Write frontmatter assertion test**

Create `packages/cli/src/__tests__/templates.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';
import { getTemplateContent } from '../utils/templates';

describe('template frontmatter', () => {
  it('cursor template declares name and description', () => {
    const content = getTemplateContent('cursor');
    expect(content).toMatch(/^---\s*\nname:\s*interview\s*\n/m);
    expect(content).toMatch(/description:\s*Phỏng vấn requirement/);
    expect(content).toMatch(/disable-model-invocation:\s*true/);
  });

  it('claude template declares name, description, argument-hint, allowed-tools', () => {
    const content = getTemplateContent('claude');
    expect(content).toMatch(/^---\s*\nname:\s*interview\s*\n/m);
    expect(content).toMatch(/description:\s*Phỏng vấn requirement/);
    expect(content).toMatch(/argument-hint:/);
    expect(content).toMatch(/disable-model-invocation:\s*true/);
    expect(content).toMatch(/allowed-tools:\s*AskUserQuestion Read Glob Grep/);
  });
});
```

- [ ] **Step 2: Run test to verify passes**

Run: `bun test packages/cli/src/__tests__/templates.test.ts`

Expected: PASS both tests.

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/__tests__/templates.test.ts
git commit -m "test(cli): assert skill frontmatter in cursor and claude templates"
```

---

## Task 7: Update README

**Files:**
- Modify: `README.md:22-25`

- [ ] **Step 1: Update scaffold path table**

Replace lines 22-25:

```markdown
| Cursor | `.cursor/skills/interview/SKILL.md` |
| Claude Code | `.claude/skills/interview/SKILL.md` |
| GitHub Copilot | `.github/prompts/interview.prompt.md` |
| Codex CLI | `.agents/skills/interview/SKILL.md` |
```

- [ ] **Step 2: Update "Using `/interview`" blurb**

Replace line 29:

```markdown
After scaffolding, open your AI tool and type `/interview` (Cursor, Claude Code, Copilot, Codex — tất cả đều dùng `/` popup; Codex cũng hỗ trợ `$interview`).
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): update scaffold table to skill paths"
```

---

## Task 8: Update Repo Map

**Files:**
- Modify: `docs/ai/repo-map.md:60-66`

- [ ] **Step 1: Update templates structure diagram**

Replace the `templates/` block:

````markdown
**Structure:**
```
templates/
└── interview/
    ├── cursor/SKILL.md   → .cursor/skills/interview/SKILL.md
    ├── claude/SKILL.md   → .claude/skills/interview/SKILL.md
    ├── copilot.md        → .github/prompts/interview.prompt.md
    └── codex/SKILL.md    → .agents/skills/interview/SKILL.md
```
````

- [ ] **Step 2: Commit**

```bash
git add docs/ai/repo-map.md
git commit -m "docs(repo-map): reflect skill paths for cursor and claude"
```

---

## Task 9: Update Glossary

**Files:**
- Modify: `docs/ai/glossary.md:51-52`

- [ ] **Step 1: Update "Target path" example**

Replace line 52:

```markdown
Destination where template gets copied. Example: `templates/interview/cursor/SKILL.md` → `.cursor/skills/interview/SKILL.md` in user's project.
```

- [ ] **Step 2: Commit**

```bash
git add docs/ai/glossary.md
git commit -m "docs(glossary): update target path example to skill format"
```

---

## Task 10: Update Testing Doc

**Files:**
- Modify: `docs/development/testing.md`

- [ ] **Step 1: Update Cursor verification (line 27)**

Replace:

```markdown
4. Verify: `/tmp/test-project/.cursor/skills/interview/SKILL.md` exists
```

- [ ] **Step 2: Update Claude Code verification (line 34)**

Replace:

```markdown
2. Verify: `/tmp/test-project/.claude/skills/interview/SKILL.md` exists
```

- [ ] **Step 3: Update Copilot verification (line 42-43)**

Replace the "attach prompt file" step with:

```markdown
3. Open VS Code, Copilot Chat, type `/interview`
4. Verify: Interview questions appear in agent mode
```

- [ ] **Step 4: Update Codex verification (line 49-50)**

Replace:

```markdown
3. Run `codex`, type `$interview` or `/interview`
4. Verify: Interview skill activates
```

- [ ] **Step 5: Commit**

```bash
git add docs/development/testing.md
git commit -m "docs(testing): update manual QA paths to skill format"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full verify**

Run: `bun run verify`

Expected: PASS (typecheck + lint + test).

- [ ] **Step 2: Run build**

Run: `bun run build`

Expected: Build succeeds, `packages/cli/dist/index.js` exists.

- [ ] **Step 3: Manual smoke test**

```bash
rm -rf /tmp/au-agentic-smoke
mkdir /tmp/au-agentic-smoke
cd /Users/phamau/Desktop/projects/me/au-agentic/packages/cli
node dist/index.js
# Path: /tmp/au-agentic-smoke
# Select all 4 tools
# Copy now
ls -la /tmp/au-agentic-smoke/.cursor/skills/interview/SKILL.md
ls -la /tmp/au-agentic-smoke/.claude/skills/interview/SKILL.md
ls -la /tmp/au-agentic-smoke/.github/prompts/interview.prompt.md
ls -la /tmp/au-agentic-smoke/.agents/skills/interview/SKILL.md
```

Expected: All 4 files exist at new paths.

- [ ] **Step 4: Clean up smoke test**

```bash
rm -rf /tmp/au-agentic-smoke
```

- [ ] **Step 5: Final commit nếu có thay đổi**

Không commit thêm nếu không có change — verify xong là done.
