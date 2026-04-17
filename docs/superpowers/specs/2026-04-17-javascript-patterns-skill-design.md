---

## date: 2026-04-17
topic: javascript-patterns-skill
status: design-approved

# JavaScript Patterns Skill

## Goal

Port toàn bộ 29 JavaScript design / performance / loading patterns từ [PatternsDev/skills](https://github.com/PatternsDev/skills) (MIT) vào `au-agentic` như **một** skill duy nhất tên `javascript-patterns` (hub-and-spoke), scaffold được cho cả 4 tool (Cursor, Claude Code, GitHub Copilot, Codex CLI).

Khi user mở file JS/TS trong agent session, skill tự match (progressive disclosure): agent đọc catalog trong `SKILL.md` rồi `Read` reference chi tiết chỉ khi task khớp pattern.

## Rationale

- Upstream có 29 pattern — nếu mỗi pattern là 1 skill sẽ flood CLI wizard và Copilot auto-attach
- Hub-and-spoke cho phép catalog ~4KB load-on-trigger, refs lazy-load khi pattern khớp rõ
- Scaffold để "user-project-scope" (không user-scope install), đồng bộ với `interview/` skill hiện hữu

## Scope

**In scope:**

- Port 29 file từ `PatternsDev/skills/javascript/*/SKILL.md` thành 29 reference file per tool
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

### GitHub Copilot (`.github/prompts/` — slash-triggered manual)

```
.github/prompts/
├── javascript-patterns.prompt.md             # catalog, slash `/javascript-patterns`
└── javascript-patterns/
    ├── LICENSE
    ├── singleton.md                          # plain .md, reachable via #file:
    ├── observer.md
    └── ... (28 file khác)
```

**Manual-only:** Catalog nằm ở `.github/prompts/` (slash popup) thay vì `.github/instructions/` (auto-attach). Khi user gõ `/javascript-patterns` trong Copilot Chat, prompt load; Copilot dùng `#file:.github/prompts/javascript-patterns/<name>.md` để pull ref cụ thể.

## SKILL.md Shape (Claude/Cursor/Codex)

```yaml
---
name: javascript-patterns
description: 29 JavaScript design, performance, and loading patterns from patterns.dev. Use when user invokes `/javascript-patterns`, says "active skill javascript-patterns", or explicitly asks to apply a named pattern (singleton, observer, factory, proxy, etc.). Only applies to JS/TS source + test/spec files.
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

1. Bảng bên dưới liệt kê 29 pattern + 1 dòng "when to use"
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

Copilot catalog (`.github/prompts/javascript-patterns.prompt.md`) dùng **y hệt** nội dung body nhưng thay frontmatter theo `.prompt.md` convention:

```yaml
---
description: "Use 29 JavaScript design/performance/loading patterns from patterns.dev. Slash-triggered — manual only."
mode: "agent"
---
```

Copilot **KHÔNG** dùng `applyTo:` (đó là auto-attach). Prompt chỉ load khi user gõ `/javascript-patterns`.

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
    │   └── references/*.md (29)
    ├── cursor/
    │   ├── SKILL.md
    │   └── references/*.md (29)
    ├── codex/
    │   ├── SKILL.md
    │   └── references/*.md (29)
    └── copilot/
        ├── javascript-patterns.prompt.md         # catalog, slash /javascript-patterns
        └── javascript-patterns/*.md (29)         # plain refs, reachable via #file:
```

**Total source files:** 1 LICENSE + 3 SKILL.md + 87 refs (Claude/Cursor/Codex) + 1 catalog + 29 refs (Copilot) = **121 file** trong folder skill mới.

**LICENSE source:** Upstream `PatternsDev/skills` repo **không có** LICENSE file tại root (xác nhận tại Task 4 khi chạy sync). Từng `SKILL.md` upstream có frontmatter `license: MIT` (self-declared per-file) nhưng repo-level không explicit. Để không rely on ambiguous grant, **au-agentic tự viết `packages/templates/javascript-patterns/LICENSE`** chứa MIT License template + attribution section tới patterns.dev authors. Sync script tolerate-missing upstream LICENSE (warn, không throw).

**LICENSE fan-out rule:** 1 LICENSE source tại `packages/templates/javascript-patterns/LICENSE` được scaffold ra 4 target paths (một bản per tool đã chọn) để user-project-scope MIT compliance đầy đủ:

- `.claude/skills/javascript-patterns/LICENSE`
- `.cursor/skills/javascript-patterns/LICENSE`
- `.agents/skills/javascript-patterns/LICENSE`
- `.github/prompts/javascript-patterns/LICENSE`

Codegen manifest encode rule này qua key `_shared` (hoặc equivalent) — logic scaffold nhận biết và duplicate ra từng tool target.

## Codegen Manifest

### Problem

Static import 121 file trong `packages/cli/src/utils/templates.ts` sẽ phình file quá lớn + mỗi thêm skill mới = edit tay.

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
3. ~~Copy upstream LICENSE~~ → **Skip**: upstream has no LICENSE. LICENSE file ở `packages/templates/javascript-patterns/LICENSE` được viết riêng bởi au-agentic (MIT template + attribution) — không phụ thuộc sync.
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

### Tier 4: Skill contract (3 success criteria, DEC-013)

`packages/cli/src/__tests__/skill-contract.test.ts` — dedicated cho 3 yêu cầu trigger/scope/ambiguity:

**Manual-trigger contract:**

- Claude/Cursor/Codex SKILL.md chứa `disable-model-invocation: true`
- **KHÔNG** chứa `paths:` frontmatter key
- Copilot catalog tồn tại tại key `javascript-patterns.prompt.md` trong manifest (slash-triggered), **KHÔNG** tồn tại `.instructions.md` key
- Copilot catalog **KHÔNG** chứa `applyTo:` frontmatter

**Scope contract:**

- Mọi catalog (4 tool) chứa block "Scope" với các chuỗi `.js`, `.ts`, `.test.`, `.spec.`
- Regex assert scope declaration block xuất hiện trước Catalog table

**Ambiguity delegation contract:**

- Mọi catalog chứa block "Ambiguity Protocol" reference đến `/interview`
- Chứa hướng dẫn "KHÔNG đoán" + "delegate sang /interview" khi task mơ hồ

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


| Risk                                                                     | Mitigation                                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Agent vẫn cố auto-apply pattern dù `disable-model-invocation: true`      | Tier 4 contract test assert trigger fields; catalog body có "Trigger Model" block làm guardrail kép                |
| User trigger `/javascript-patterns` trong project không có file JS/TS    | "Scope" block trong catalog hướng dẫn skill self-abort khi file ngoài scope                                        |
| Pattern ambiguous dẫn đến chọn sai                                       | DEC-012 bắt buộc delegate `/interview` trước khi áp dụng; Tier 4 test assert delegation text hiện diện             |
| 121 file commit 1 PR sẽ to                                               | Split commit: (a) template content + LICENSE, (b) CLI wizard step, (c) codegen + tests, (d) docs — trong cùng 1 PR |
| Upstream update rename/delete file                                       | Sync script warn nếu local không còn tìm thấy upstream; dev xử lý thủ công                                         |
| MIT attribution thiếu sót                                                | Tier 2 golden test bao gồm header check; review checklist trong CONTRIBUTING                                       |


## Decision Log


| ID        | Decision                                                                                                                                                                         | Provenance     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| DEC-001   | Hub-and-spoke shape (1 SKILL.md + 29 refs)                                                                                                                                       | user-stated    |
| DEC-002'' | Copilot catalog tại `.github/prompts/javascript-patterns.prompt.md` (slash-triggered), refs tại `.github/prompts/javascript-patterns/*.md` — DEC-002' superseded bởi manual-only | user-confirmed |
| DEC-003   | Wizard thêm step "Select skills" multi-select; interview default-on, javascript-patterns default-off                                                                             | user-confirmed |
| DEC-004'' | SKILL.md = catalog + verbatim refs + MIT header + **Trigger Model + Scope + Ambiguity Protocol blocks** — DEC-004 superseded bởi manual-only + 3 success criteria                | user-confirmed |
| DEC-005   | Giữ path convention với interview cho Claude/Cursor/Codex (`.cursor/skills/`, `.agents/skills/`, `.claude/skills/`); Copilot theo DEC-002''                                      | user-confirmed |
| DEC-006'  | Codegen `scripts/generate-template-manifest.ts` → `template-manifest.ts` (DEC-006 superseded — `import.meta.glob()` không phải Bun API)                                          | user-confirmed |
| DEC-007   | One-time import + `scripts/sync-upstream-patterns.ts` manual resync                                                                                                              | user-confirmed |
| DEC-008'  | 4-tier focused test (Tier 1–3 cũ + Tier 4 `skill-contract.test.ts`) — DEC-008 extended cho 3 success criteria                                                                    | user-confirmed |
| DEC-009   | LICENSE tại folder skill + 1-line header per ref + README attribution section                                                                                                    | user-confirmed |
| DEC-010   | Docs update Tier 1 + 2 + 3 (kể cả ADR) cùng PR với code                                                                                                                          | user-confirmed |
| DEC-011   | **Trigger model: manual-only.** SKILL.md có `disable-model-invocation: true`; Copilot dùng `.prompt.md` slash thay vì `.instructions.md` auto-attach                             | user-stated    |
| DEC-012   | **Scope: JS/TS source + test/spec files only.** Explicit trong catalog "Scope" block; skill self-abort nếu file ngoài scope                                                      | user-stated    |
| DEC-013   | **Ambiguity → delegate `/interview`.** Catalog "Ambiguity Protocol" block yêu cầu agent KHÔNG đoán, phải gọi `/interview` skill trước khi áp dụng pattern                        | user-stated    |


## Open Follow-ups (deferred, not blocking)

- **React / Vue patterns:** cùng mô hình hub-and-spoke, skill riêng `react-patterns` / `vue-patterns`, sau khi `javascript-patterns` ổn định
- **Cursor `.cursor/rules/*.mdc` dual-scaffold:** nếu về sau muốn cho phép auto-attach-on-glob (opt-in per user), có thể thêm dual-scaffold (DEC-005 option C)
- **Plugin packaging:** nếu sau này có >5 skill và monorepo lớn, split thành `@au-agentic/template-`* packages per skill

