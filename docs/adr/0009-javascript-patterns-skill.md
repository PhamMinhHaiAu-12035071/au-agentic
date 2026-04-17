# ADR 0009: javascript-patterns Skill — Hub-and-Spoke, Manual-Trigger-Only, Codegen Manifest

**Status:** Accepted
**Date:** 2026-04-17
**Supersedes:** none
**Related:** ADR 0005 (imports-field alias pattern), spec 2026-04-17-javascript-patterns-skill-design.md

## Context

We want to port 29 JavaScript patterns from patterns.dev into au-agentic as a scaffoldable skill. Upstream repo has no root LICENSE file; per-file frontmatter declares `license: MIT`. We elected to ship a self-authored MIT LICENSE with attribution rather than rely on ambiguous per-file grants.

Three shape options were considered: 29 standalone skills, 29 flat templates, or 1 hub-and-spoke skill with a catalog routing to 29 reference files.

Separately: should the skill auto-activate on JS/TS file contexts, or only on explicit user trigger? User preference (mirroring `interview/` skill semantics) is manual-only.

## Decision

Adopt hub-and-spoke shape (1 catalog `SKILL.md` + 29 `references/*.md`) per tool, with **manual-trigger-only activation** (DEC-011). Catalog frontmatter declares `disable-model-invocation: true` on Claude/Cursor/Codex; Copilot uses `.github/prompts/javascript-patterns.prompt.md` (slash `/javascript-patterns`) instead of `.github/instructions/` (auto-attach). Refs live under `.github/prompts/javascript-patterns/` for Copilot, reachable via `#file:`.

Catalog body enforces 2 additional guardrails: **Scope restriction to JS/TS + test/spec files** (DEC-012) and **Ambiguity → delegate `/interview`** (DEC-013). A Tier 4 contract test (`skill-contract.test.ts`) asserts all 3 success criteria programmatically.

Target paths mirror existing `interview/` convention for Claude/Cursor/Codex (`.{tool}/skills/javascript-patterns/`). We introduce a codegen manifest script (`packages/cli/scripts/generate-template-manifest.ts`) to emit static imports for ~121 template files without bloating `templates.ts`. Manifest is gitignored and regenerated on `prebuild` via turbo pipeline.

We keep upstream sync manual via `scripts/sync/patterns-dev/index.ts` to preserve git diff review and avoid network at build/runtime.

## Consequences

**Positive:**
- Predictable activation: skill fires only on explicit user trigger — no surprise auto-pattern-application.
- Progressive disclosure: catalog ~4KB loads on trigger; refs lazy-loaded only when task matches a pattern.
- Ambiguity has a defined escape hatch (`/interview` delegation) instead of agent guessing.
- CLI wizard stays clean with a new "Select skills" step (multi-select, interview default-on).
- Adding a new skill (e.g. react-patterns) = drop folder, run codegen; no `templates.ts` churn.
- MIT compliance via self-authored `LICENSE` + per-ref attribution header + README section.
- 3 success criteria protected by dedicated contract test (Tier 4) against regression.

**Negative:**
- 121 files in one PR is large — mitigated via phased commits within the PR.
- Manual-only means user must know the skill exists and when to invoke — discoverability tradeoff; mitigated by README "Activation model" section + wizard skill-select labels.
- Upstream drift if we don't rerun sync script — acceptable tradeoff for review-before-apply safety.
- Upstream repo has no root LICENSE, so our shipped LICENSE is a best-effort interpretation of per-SKILL.md frontmatter grants.

## Alternatives Considered

- **29 standalone skills:** rejected — floods CLI wizard and user context on Copilot.
- **Flat 29-template layout:** rejected — doesn't scale when adding react/vue later.
- **Auto-activation via `paths:` / `applyTo:`:** rejected (DEC-011) — user wants predictable manual trigger matching `interview/` skill semantics.
- **Auto-sync at build:** rejected — violates no-runtime-I/O policy (AGENTS.md).
- **Vite `import.meta.glob()`:** rejected — not Bun-native API.
- **Bun macros:** considered — codegen is stabler and grep-friendly.
- **Copy upstream LICENSE:** rejected — upstream has no root LICENSE file.

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
| DEC-009   | Self-authored LICENSE + per-ref header + README attribution |
| DEC-010   | Docs Tier 1+2+3 + ADR same PR |
| DEC-011   | **Manual-trigger-only activation** (disable-model-invocation + Copilot `.prompt.md`) |
| DEC-012   | **Scope = JS/TS + test/spec files only**, declared in catalog body |
| DEC-013   | **Ambiguity → delegate `/interview`**, enforced in catalog body + Tier 4 test |

Full context in [docs/superpowers/specs/2026-04-17-javascript-patterns-skill-design.md](../superpowers/specs/2026-04-17-javascript-patterns-skill-design.md).
