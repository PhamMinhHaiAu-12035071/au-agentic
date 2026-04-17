---

## date: 2026-04-17
topic: javascript-patterns-skill
status: design-approved

# JavaScript Patterns Skill

## Goal

Port toàn bộ 30 JavaScript design / performance / loading patterns từ [PatternsDev/skills](https://github.com/PatternsDev/skills) (MIT) vào `au-agentic` như **một** skill duy nhất tên `javascript-patterns` (hub-and-spoke), scaffold được cho cả 4 tool (Cursor, Claude Code, GitHub Copilot, Codex CLI).

Khi user mở file JS/TS trong agent session, skill tự match (progressive disclosure): agent đọc catalog trong `SKILL.md` rồi `Read` reference chi tiết chỉ khi task khớp pattern.

## Rationale

- Upstream có 30 pattern — nếu mỗi pattern là 1 skill sẽ flood CLI wizard và Copilot auto-attach
- Hub-and-spoke cho phép catalog ~4KB auto-load, refs lazy-load theo nhu cầu
- Scaffold để "user-project-scope" (không user-scope install), đồng bộ với `interview/` skill hiện hữu

## Scope

**In scope:**

- Port 30 file từ `PatternsDev/skills/javascript/*/SKILL.md` thành 30 reference file per tool
- Viết 1 catalog `SKILL.md` (hoặc equivalent per tool) điều hướng refs
- Extend CLI wizard: thêm step "Select skills" multi-select
- Codegen script sinh template manifest
- Script đồng bộ upstream manual
- 3-tier test, docs updates đầy đủ

**Out of scope:**

- Upstream `react/` và `vue/` folders (dành cho skill riêng sau này)
- Upstream `README.md` và `KEY-DIFFS.md` (meta của repo upstream, không phải content skill)
- Auto-sync trên build hay network fetch ở runtime

## Target Layout Per Tool

### Claude Code / Cursor / Codex (convention `.{tool}/skills/`)

```
.claude/skills/javascript-patterns/
├── SKILL.md                                  # catalog với paths: frontmatter
├── LICENSE                                   # MIT full text, patterns.dev copyright
└── references/
    ├── singleton.md
    ├── observer.md
    ├── factory.md
    └── ... (27 file khác)
```

Tương tự cho `.cursor/skills/` và `.agents/skills/`.

### GitHub Copilot (`.github/instructions/`)

```
.github/instructions/
├── javascript-patterns.instructions.md       # catalog, applyTo: **/*.{js,ts,jsx,tsx}
└── javascript-patterns/
    ├── LICENSE
    ├── singleton.md                          # plain .md, KHÔNG auto-attach
    ├── observer.md
    └── ... (28 file khác)
```

Catalog hướng dẫn Copilot dùng `#file:.github/instructions/javascript-patterns/<name>.md` khi cần chi tiết.

## SKILL.md Shape (Claude/Cursor/Codex)

```yaml
---
name: javascript-patterns
description: 30 JavaScript design, performance, and loading patterns from patterns.dev. Auto-activates on JS/TS files. Use when implementing shared state (singleton), pub-sub (observer), object creation (factory), code splitting (dynamic-import), asset loading (prefetch/preload), or other common JS patterns.
paths:
  - "**/*.{js,ts,jsx,tsx,mjs,cjs}"
license: MIT
metadata:
  author: au-agentic
  upstream: https://github.com/PatternsDev/skills
  upstream_license: MIT (patterns.dev authors)
---

# JavaScript Patterns Catalog

## How to Use

1. Bảng bên dưới liệt kê 30 pattern + 1 dòng "when to use"
2. Khi task khớp cột "when to use", `Read` file tương ứng trong `references/` **TRƯỚC** khi viết code
3. Copy code ví dụ từ reference, không phải tự nhớ
4. KHÔNG load tất cả references cùng lúc (tốn context)

## Catalog

### Design Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Singleton | Exactly one shared instance across app | `references/singleton.md` |
| Observer | Pub-sub; broadcast state changes | `references/observer.md` |
| Factory | Centralize object creation logic | `references/factory.md` |
| ... (8 dòng design khác) | ... | ... |

### Performance Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Bundle Splitting | Reduce initial JS payload | `references/bundle-splitting.md` |
| Tree Shaking | Strip unused exports at bundle time | `references/tree-shaking.md` |
| ... (đủ mục) | ... | ... |

### Loading Patterns

| Pattern | When to use | Reference |
|---------|-------------|-----------|
| Prefetch | Hint browser to fetch low-priority resource | `references/prefetch.md` |
| Preload | Critical-resource priority hint | `references/preload.md` |
| PRPL | Push, render, pre-cache, lazy-load | `references/prpl.md` |
| ... | ... | ... |

## Attribution

Refs phái sinh từ [patterns.dev](https://patterns.dev) (MIT) — xem `LICENSE`.
```

Copilot catalog (`.github/instructions/javascript-patterns.instructions.md`) dùng **y hệt** nội dung nhưng thay frontmatter:

```yaml
---
applyTo: "**/*.{js,ts,jsx,tsx,mjs,cjs}"
---
```

## Reference File Shape

Mỗi file `references/<pattern>.md` (verbatim từ upstream + 1 header):

```markdown
<!-- Source: https://github.com/PatternsDev/skills/tree/main/javascript/<slug>-pattern | MIT — see ../LICENSE -->

# Singleton Pattern

...(nội dung verbatim upstream SKILL.md, bỏ frontmatter upstream)...
```

Naming: strip suffix `-pattern` nếu có (`singleton-pattern` → `singleton.md`); giữ nguyên nếu không có (`bundle-splitting.md`). Decision ghi trong sync script.

## Wizard Flow Change

**Hiện tại (3 step):**

1. Prompt path
2. Multi-select tools (cursor/claude/copilot/codex)
3. Preview + confirm + write

**Mới (4 step):**

1. Prompt path
2. Multi-select tools (unchanged)
3. **Multi-select skills** — check list:
  - `[x] interview` — default CHECKED (backward compat với user hiện tại)
  - `[ ] javascript-patterns` — default UNCHECKED
4. Preview + confirm + write (hiển thị tất cả file sẽ scaffold theo cartesian tool × skill)

Step 3 implementation: thêm `packages/cli/src/steps/skills.ts`, parallel layout với `steps/tools.ts`.

## Templates Package Layout

```
packages/templates/
├── package.json
├── tsconfig.json
├── interview/                                # unchanged
│   ├── claude/SKILL.md
│   ├── cursor/SKILL.md
│   ├── codex/SKILL.md + references/
│   └── copilot.md
└── javascript-patterns/                      # new
    ├── LICENSE                               # MIT full text
    ├── claude/
    │   ├── SKILL.md
    │   └── references/*.md (30)
    ├── cursor/
    │   ├── SKILL.md
    │   └── references/*.md (30)
    ├── codex/
    │   ├── SKILL.md
    │   └── references/*.md (30)
    └── copilot/
        ├── javascript-patterns.instructions.md   # catalog
        └── javascript-patterns/*.md (30)         # plain refs
```

**Total source files:** 1 LICENSE + 3 SKILL.md + 90 refs (Claude/Cursor/Codex) + 1 catalog + 30 refs (Copilot) = **125 file** trong folder skill mới.

**LICENSE fan-out rule:** 1 LICENSE source tại `packages/templates/javascript-patterns/LICENSE` được scaffold ra 4 target paths (một bản per tool đã chọn) để user-project-scope MIT compliance đầy đủ:

- `.claude/skills/javascript-patterns/LICENSE`
- `.cursor/skills/javascript-patterns/LICENSE`
- `.agents/skills/javascript-patterns/LICENSE`
- `.github/instructions/javascript-patterns/LICENSE`

Codegen manifest encode rule này qua key `_shared` (hoặc equivalent) — logic scaffold nhận biết và duplicate ra từng tool target.

## Codegen Manifest

### Problem

Static import 125 file trong `packages/cli/src/utils/templates.ts` sẽ phình file quá lớn + mỗi thêm skill mới = edit tay.

### Solution

Script `packages/cli/scripts/generate-template-manifest.ts`:

1. Scan `packages/templates/*/` tìm mọi folder skill
2. Với mỗi skill, walk tree tìm mọi `.md`
3. Emit `packages/cli/src/generated/template-manifest.ts`:

```ts
// AUTO-GENERATED — do not edit. Run `bun run gen:manifest` to refresh.
import interview_claude_SKILL from "@au-agentic/templates/interview/claude/SKILL.md" with { type: "text" };
import javascript_patterns_claude_SKILL from "@au-agentic/templates/javascript-patterns/claude/SKILL.md" with { type: "text" };
import javascript_patterns_claude_ref_singleton from "@au-agentic/templates/javascript-patterns/claude/references/singleton.md" with { type: "text" };
// ... (tất cả explicit static imports)

export const TEMPLATE_MANIFEST = {
  interview: { claude: { "SKILL.md": interview_claude_SKILL, ... }, ... },
  "javascript-patterns": { claude: { "SKILL.md": ..., "references/singleton.md": ..., ... }, ... },
} as const;
```

1. `templates.ts` import `TEMPLATE_MANIFEST`, dùng làm source of truth

### Triggers

- `packages/cli/package.json`: `"prebuild": "bun run gen:manifest"`, `"gen:manifest": "bun scripts/generate-template-manifest.ts"`
- Add `generated/` to `.gitignore` dưới `packages/cli/src/`
- Turbo pipeline: `gen:manifest` là input của `build` task

### Verification

Snapshot test: run `gen:manifest`, assert manifest chứa đúng expected shape. Test fail nếu ai thêm file mà quên chạy lại.

## Upstream Sync Script

Script `scripts/sync-upstream-patterns.ts` (runs locally khi muốn refresh):

1. `git clone https://github.com/PatternsDev/skills.git` vào tmp dir (hoặc `gh api` contents)
2. Với mỗi folder `javascript/<slug>`:
  - Read `SKILL.md`
  - Strip upstream frontmatter
  - Prepend attribution header
  - Write vào cả 4 tool folder (Claude/Cursor/Codex refs + Copilot refs)
3. Copy upstream LICENSE vào `packages/templates/javascript-patterns/LICENSE`
4. Report divergence nếu local ref đã có modifications lệch upstream (warn, không auto-overwrite)
5. Không tự commit — dev review diff rồi commit

Không runtime network call — script chỉ chạy khi dev invoke thủ công.

## Testing Strategy (3-tier Focused)

**Nguyên tắc:** Mỗi test = 1 bug class cụ thể. Không test cho có.

### Tier 1: Manifest snapshot (bắt "quên register")

`packages/cli/src/__tests__/template-manifest.test.ts`:

- Run codegen với fixture folder
- Assert manifest shape (skill names, tool keys, expected ref count)
- Fail nếu ai drop file vào `packages/templates/` mà chưa chạy `gen:manifest`

### Tier 2: Golden-file (bắt content drift qua transform)

`packages/cli/src/__tests__/scaffold-golden.test.ts`:

- 1–2 pattern mẫu (singleton, observer) × 4 tool = 4–8 golden file
- Compile scaffold → diff với golden
- Bắt regression về attribution header, path remap, frontmatter substitution

### Tier 3: Integration (bắt path mapping bug)

Extend `packages/cli/src/__tests__/copy.test.ts`:

- Multi-skill scaffold case (tick interview + javascript-patterns)
- Assert đúng path tree, đúng số file, đúng content slice

Threshold: 70% per-file (giữ nguyên `bunfig.toml`). Không chạy 480 assertion.

## Attribution & Legal

- LICENSE file tại `packages/templates/javascript-patterns/LICENSE` chứa full MIT text + copyright của patterns.dev authors
- Per-ref header: `<!-- Source: https://github.com/PatternsDev/skills/tree/main/javascript/<slug>-pattern | MIT — see ../LICENSE -->`
- Section "Attribution" mới trong root README nêu upstream + license
- Scaffold duplicate LICENSE vào user project khi scaffold — user cũng tuân MIT khi commit vào repo họ

## Docs Updates (Tier 1 + 2 + 3, same PR)

Theo bảng mapping trong [docs/ai/docs-policy.md](docs/ai/docs-policy.md):

**Tier 1 — Mandatory:**

- [README.md](README.md): bảng "What gets scaffolded" thêm row javascript-patterns per tool; update step count; thêm "Attribution" section
- [docs/ai/repo-map.md](docs/ai/repo-map.md): thêm folder `javascript-patterns/`; document codegen + sync script; update "Sensitive Zones"
- [docs/reference/project-structure.md](docs/reference/project-structure.md): hub-and-spoke structure, generated manifest
- [docs/development/workflow.md](docs/development/workflow.md): scripts `gen:manifest`, `sync:upstream-patterns`
- [docs/ai/testing-policy.md](docs/ai/testing-policy.md): 3-tier focused-test pattern
- [docs/development/testing.md](docs/development/testing.md): document manifest snapshot + golden + integration tiers
- [CHANGELOG.md](CHANGELOG.md): `feat(templates): add javascript-patterns skill` entry

**Tier 2 — Strongly recommended:**

- [docs/ai/routing.md](docs/ai/routing.md): task-type "Adding a new skill template"
- [docs/getting-started/quickstart.md](docs/getting-started/quickstart.md): wizard walkthrough 4 step
- [docs/examples/feature-walkthroughs.md](docs/examples/feature-walkthroughs.md): end-to-end walkthrough dùng javascript-patterns

**Tier 3 — ADR:**

- `docs/adr/0009-javascript-patterns-skill.md` (next sequential ADR) — ghi DEC-001..010, lý do hub-and-spoke vs flat, lý do codegen, lý do giữ path convention

## Backward Compatibility

- `interview` vẫn default-checked trong step mới → user hiện tại chạy wizard nhận hành vi cũ (chỉ scaffold interview)
- Target paths của `interview` không đổi (DEC-005)
- Không breaking change trong exported CLI API
- Semver: MINOR bump (feature), không MAJOR

## Risks


| Risk                                               | Mitigation                                                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Cursor không auto-invoke theo `paths:` frontmatter | DEC-005 chấp nhận — rely on agent `Read` khi context có file JS/TS; ghi rõ limitation trong SKILL.md               |
| Codex `paths:` chưa kiểm chứng 100%                | Spec this assumption; check trước khi ship Tier 1 docs                                                             |
| 125 file commit 1 PR sẽ to                         | Split commit: (a) template content + LICENSE, (b) CLI wizard step, (c) codegen + tests, (d) docs — trong cùng 1 PR |
| Upstream update rename/delete file                 | Sync script warn nếu local không còn tìm thấy upstream; dev xử lý thủ công                                         |
| MIT attribution thiếu sót                          | Tier 1 golden test bao gồm header check; review checklist trong CONTRIBUTING                                       |


## Decision Log


| ID       | Decision                                                                                                                                | Provenance     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| DEC-001  | Hub-and-spoke shape (1 SKILL.md + 30 refs)                                                                                              | user-stated    |
| DEC-002' | Copilot = 1 catalog `.instructions.md` + 30 plain `.md` refs (DEC-002 superseded — tránh 150KB auto-attach bloat)                       | user-confirmed |
| DEC-003  | Wizard thêm step "Select skills" multi-select; interview default-on, javascript-patterns default-off                                    | user-confirmed |
| DEC-004  | SKILL.md = catalog table + verbatim refs + MIT attribution header                                                                       | user-confirmed |
| DEC-005  | Giữ path convention với interview (`.cursor/skills/`, `.agents/skills/`, `.claude/skills/`); Copilot theo DEC-002'                      | user-confirmed |
| DEC-006' | Codegen `scripts/generate-template-manifest.ts` → `template-manifest.ts` (DEC-006 superseded — `import.meta.glob()` không phải Bun API) | user-confirmed |
| DEC-007  | One-time import + `scripts/sync-upstream-patterns.ts` manual resync                                                                     | user-confirmed |
| DEC-008  | 3-tier focused test (manifest snapshot + 1–2 golden + integration)                                                                      | user-confirmed |
| DEC-009  | LICENSE tại folder skill + 1-line header per ref + README attribution section                                                           | user-confirmed |
| DEC-010  | Docs update Tier 1 + 2 + 3 (kể cả ADR) cùng PR với code                                                                                 | user-confirmed |


## Open Follow-ups (deferred, not blocking)

- **React / Vue patterns:** cùng mô hình hub-and-spoke, skill riêng `react-patterns` / `vue-patterns`, sau khi `javascript-patterns` ổn định
- **Cursor `.cursor/rules/*.mdc` dual-scaffold:** nếu user feedback cho thấy auto-invoke Cursor yếu, thêm option dual-scaffold (DEC-005 option C)
- **Plugin packaging:** nếu sau này có >5 skill và monorepo lớn, split thành `@au-agentic/template-`* packages per skill

