---
date: 2026-04-16
topic: skill-surface-parity
status: design-approved
supersedes: 2026-04-16-skill-surface-parity-brainstorm.md
---

# Skill Surface Parity

## Goal

`/interview` hiện trong `/` popup của Cursor, Claude Code, Copilot, Codex bằng file project-scope — không cần user-scope install.

## Rationale

Docs chính thức:

- Claude Code: *"Custom commands have been merged into skills."* `.claude/skills/<name>/SKILL.md` ≡ `/name`.
- Cursor: skill discovery từ `.cursor/skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`. Có `/migrate-to-skills`.
- Copilot: `.github/prompts/<name>.prompt.md` xuất hiện `/` autocomplete.
- Codex: đã dùng `.agents/skills/<name>/SKILL.md`.

## Target Paths

| Tool | Path | Trigger |
|------|------|---------|
| Cursor | `.cursor/skills/interview/SKILL.md` | `/interview` |
| Claude Code | `.claude/skills/interview/SKILL.md` | `/interview` |
| Copilot | `.github/prompts/interview.prompt.md` | `/interview` |
| Codex | `.agents/skills/interview/SKILL.md` | `$interview` + `/` popup |

## Template Restructure

```
packages/templates/interview/
├── cursor/SKILL.md      # new (from cursor.md)
├── claude/SKILL.md      # new (from claude.md)
├── copilot.md           # unchanged
└── codex/SKILL.md       # unchanged
```

## Frontmatter

**Cursor `SKILL.md`:**

```yaml
---
name: interview
description: Phỏng vấn requirement theo methodology có cấu trúc — biến yêu cầu mơ hồ thành spec rõ ràng bằng Tiếng Việt. Dùng khi user nói "interview me", "phỏng vấn requirement", "biến ý tưởng thành spec", hoặc trước khi plan/implement feature mới.
disable-model-invocation: true
---
```

**Claude Code `SKILL.md`:**

```yaml
---
name: interview
description: Phỏng vấn requirement theo methodology có cấu trúc — biến yêu cầu mơ hồ thành spec rõ ràng bằng Tiếng Việt. Dùng khi user nói "interview me", "phỏng vấn requirement", "biến ý tưởng thành spec", hoặc trước khi plan/implement feature mới.
argument-hint: "[optional: context về project hoặc feature]"
disable-model-invocation: true
allowed-tools: AskUserQuestion Read Glob Grep
---
```

Body giữ nguyên từ file hiện có.

## Code Changes

**[packages/cli/src/utils/templates.ts](../../../packages/cli/src/utils/templates.ts)**

```ts
import cursorTemplate from '@au-agentic/templates/interview/cursor/SKILL.md' with { type: 'text' };
import claudeTemplate from '@au-agentic/templates/interview/claude/SKILL.md' with { type: 'text' };

export const TARGET_PATH_MAP: Record<Tool, string> = {
  cursor: '.cursor/skills/interview/SKILL.md',
  claude: '.claude/skills/interview/SKILL.md',
  copilot: '.github/prompts/interview.prompt.md',
  codex: '.agents/skills/interview/SKILL.md',
};
```

**[packages/cli/src/steps/copy.ts](../../../packages/cli/src/steps/copy.ts) — `showNextSteps()`**

```ts
const steps: Record<Tool, string> = {
  cursor: 'Mở Cursor → Chat panel → Gõ /interview',
  claude: 'Chạy `claude` → Gõ /interview',
  copilot: 'VS Code → Copilot Chat → Gõ /interview',
  codex: 'Chạy `codex` → Gõ $interview hoặc /interview',
};
```

## Tests

- [paths.test.ts](../../../packages/cli/src/__tests__/paths.test.ts): update path assertions (cursor + claude).
- [copy.test.ts](../../../packages/cli/src/__tests__/copy.test.ts): update expected paths.
- New assertion: cursor + claude templates có `name: interview` trong frontmatter.

## Docs

Update:

- [README.md](../../../README.md) lines 22-25 — path table.
- [docs/ai/repo-map.md](../../ai/repo-map.md) lines 61-65 — repo structure.
- [docs/ai/glossary.md](../../ai/glossary.md) line 52 — "Target path" example.
- [docs/development/testing.md](../../development/testing.md) lines 27, 34, 41, 48 — manual test paths.

Freeze (historical):

- `docs/superpowers/specs/2026-04-16-interview-recommended-constraint-design.md`
- `docs/superpowers/plans/2026-04-14-enterprise-docs-architecture.md`

## Verification

```bash
bun run verify
```

Manual: scaffold vào project test, verify 4 path, gõ `/interview` trong mỗi tool.

## Rollout

- Version: giữ `1.0.0` (chưa có consumer ngoài → không cần bump major).
- Release note: "Cursor/Claude output chuyển sang `.{tool}/skills/interview/SKILL.md`. Scaffold lại."
- Không migration script auto.

## Out of Scope

- User-scope install (`au-agentic install --global`)
- Plugin marketplace publish
- Gemini / OpenCode
- Shared skill symlink giữa tools

## Open Risks

- Cursor chưa document frontmatter spec chính thức; `name` + `description` đủ theo observation nhưng chưa có guarantee.
- Copilot không có `/` popup control giống 3 tool kia; chỉ dựa vào chat autocomplete behavior.
