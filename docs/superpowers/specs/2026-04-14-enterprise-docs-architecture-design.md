# Enterprise Docs Architecture for au-agentic — Design Spec

**Version:** 1.0  
**Date:** 2026-04-14  
**Prepared by:** AI-assisted (Claude Sonnet 4.5)  
**Status:** Approved — Ready for Planning

---

## Executive Summary

**Goal:** Transform au-agentic from adhoc documentation (AGENTS.md 17 lines, CLAUDE.md 57 lines) to enterprise 4-layer JIT architecture supporting AI Agentic Engineering — where AI agents self-navigate via `docs/ai/` tool-agnostic policies, and humans read `docs/` canonical documentation.

**Approach:** Implement 4-layer JIT architecture with routing table-driven context loading, absorb existing VERIFICATION.md + TESTING.md into new structure, and scaffold 79 files across 5 sequential batches with clear dependencies.

**Success Criteria:**
- AI agents can self-identify required docs per task type without loading entire docs/
- Human maintainers can self-onboard with clear source-of-truth hierarchy
- After code changes, contributors know exactly when and where to sync docs
- Repo achieves baseline health (LICENSE, CONTRIBUTING, SECURITY, issue templates, CI)

**Tech Stack:**
- Markdown for all documentation
- Diátaxis framework for canonical docs structure
- YAML for GitHub issue templates
- GitHub Actions for CI/CD skeletons

---

## Architecture

### 4-Layer Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: Shim (always-loaded, ≤5KB total)          │
│ - AGENTS.md (≤120 lines, ~4KB): Tool-agnostic      │
│ - CLAUDE.md (≤30 lines, ~1KB): Claude-specific     │
│ → Mission, non-negotiables, routing pointer        │
└─────────────────────────────────────────────────────┘
                      ↓ references
┌─────────────────────────────────────────────────────┐
│ Layer 2: AI Operating (JIT load, ≤25KB total)      │
│ - docs/ai/routing.md: Task routing matrix          │
│ - docs/ai/*.md (10 files): Policies & rules        │
│ → Agent loads 1-2 files per task type              │
└─────────────────────────────────────────────────────┘
                      ↓ routes to
┌─────────────────────────────────────────────────────┐
│ Layer 3: Canonical Docs (on-demand, ≤6KB/file)     │
│ - docs/ (49 files): Diátaxis framework skeleton    │
│ → Human onboarding, detailed references            │
└─────────────────────────────────────────────────────┘
                      ↓ independent
┌─────────────────────────────────────────────────────┐
│ Layer 4: Root Health (not loaded by AI)            │
│ - LICENSE, CONTRIBUTING, SECURITY, etc. (6 files)  │
│ - .github/ templates + workflows (11 files)        │
│ → GitHub integration, contributor onboarding       │
└─────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**DEC-A1: Tool-agnostic abstraction**  
`docs/ai/` is the single abstraction layer. No tool-specific configs (`.claude/rules`, `.cursor/rules`, `.agents/policies`). Every AI tool reads `docs/ai/` through its own shim.  
*Trade-off:* Lose per-tool optimization, gain zero maintenance burden when adding new tools.

**DEC-A2: CLAUDE.md imports AGENTS.md**  
CLAUDE.md is redirect to AGENTS.md + Claude-specific compaction rules. AGENTS.md is the universal contract. Claude reads both (~5KB total).  
*Trade-off:* Slight duplication, but single source-of-truth for all tools.

**DEC-A3: Routing table over routing logic**  
`docs/ai/routing.md` uses static table (task type → file list) instead of complex decision tree.  
*Trade-off:* Less flexible than decision tree, but agents parse faster, fewer tokens, no infinite chain risk.

**DEC-A4: Max 3 cross-references per file**  
Every file can reference at most 3 other files. Prevents chain-loading pattern.  
**Exception (revised 2026-04-14):** Index/mapping files (routing.md, docs-policy.md) are exempt — they are terminal nodes that agents use for lookup without following references onward.

**DEC-A5: Absorb then delete**  
VERIFICATION.md and TESTING.md absorbed into new structure, then deleted. No dual source-of-truth.

**DEC-A6: Docs outdated = defect**  
Stale/outdated docs are defects that destroy source-of-truth value, not debt that can be deferred indefinitely.

**DEC-A7: Skeletons must be truthful about applicability**  
For files in domains that don't yet exist (API, deployment, incident response), skeleton must state `currently not applicable`, why, and what triggers filling it.  
*Trade-off:* Many files will be "not applicable" initially, but avoids creating fake source-of-truth.

**DEC-A8: Workflow enforcement only claims what repo actually supports**  
`docs-check.yml` and `security.yml` only run checks that exist in current repo; parts without tooling support must have clear TODO or limited placeholders.  
*Trade-off:* Initial enforcement is modest, but honest to codebase and easy to upgrade incrementally.

**DEC-A9: Routing taxonomy uses action-based rows + modifier overlays**  
`docs/ai/routing.md` uses 8 standard task types by action (feature work, bug fix, refactor, test change, docs-only, CI/deploy, security, dependency) + 1 fallback row `Unclear / Mixed change`. Cross-cutting cases like API change, migration/data change, legacy area, and auth-sensitive area are modeled as modifier overlays applied to primary row instead of separate primary rows.  
*Trade-off:* Need extra layer of overlay rules, but taxonomy is cleaner, fits real tasks better, avoids duplicate rows.

---

## Routing & Task Classification

### Routing Taxonomy

**8 Primary Task Types (action-based):**
1. Feature work
2. Bug fix
3. Refactor
4. Test change
5. Docs-only
6. CI/Deploy
7. Security
8. Dependency

**+ 1 Fallback:** `Unclear / Mixed change` — expand 1 layer of minimal context; if still unclear, stop and ask user before making changes.

**+ 4 Modifier Overlays** (apply when task is also):
- **API change** → add `docs/reference/api.md`
- **Migration/Data change** → add `docs/deployment/migrations.md`, `docs/reference/data-model.md`
- **Legacy area** → add `docs/ai/legacy-context.md`
- **Auth-sensitive area** → add `docs/ai/security-policy.md`, `docs/reference/configuration.md`

### Routing Table Format

Each primary row has 4 columns:

| Task Type | Required reads | Optional reads | Verify | Docs to update |
|-----------|---------------|----------------|--------|----------------|
| Feature work | repo-map.md, coding-rules.md | docs/reference/project-structure.md, docs/explanations/architecture.md | typecheck, lint, test | docs/reference/* if API/config changed |
| Bug fix | testing-policy.md | docs/support/troubleshooting.md | test (regression) | docs/support/known-issues.md if needed |
| Refactor | execution-policy.md, coding-rules.md | docs/explanations/architecture.md | typecheck, lint, test | docs/reference/project-structure.md if structure changed |
| Test change | testing-policy.md | docs/development/testing.md | test | - |
| Docs-only | docs-policy.md | - | - | - |
| CI/Deploy | deployment-policy.md | docs/deployment/deployment.md | - | docs/deployment/* |
| Security | security-policy.md | docs/reference/configuration.md | lint, test | SECURITY.md if needed |
| Dependency | coding-rules.md | docs/development/dependency-policy.md | typecheck, lint, test | docs/reference/techstack.md |
| Unclear / Mixed change | repo-map.md, docs-policy.md | docs/reference/project-structure.md, docs/explanations/architecture.md | expand 1 layer minimal context; if still unclear stop and ask user | identify nearest source-of-truth then sync docs |

### Routing Rules

- No chain-loading: max 3 cross-references per file
- Agent self-identifies task type, looks up table, loads only files in corresponding cell
- If task has modifier overlay, add files from overlay rules
- If cannot classify or docs contradict → expand 1 layer context → if still unclear → stop and ask user

---

## Data Model & File Inventory

### Layer 1 — Shim (2 files, rewrite 100%)

**AGENTS.md (≤120 lines, ~4KB)** — 8 sections:
1. **Mission** (2-3 lines): smallest correct change, preserve conventions
2. **Non-negotiables** (5-7 bullets): verify before claim, no assumptions, small diffs, update docs, no blind edits in sensitive zones
3. **Source of truth** (6 lines): map `docs/*` directories → information types
4. **JIT loading** (4 lines): flow AGENTS.md → routing.md → target files → expand only if ambiguity
5. **Task routing** (8 lines): compact version of routing.md (task type → read which files first)
6. **Verification minimum** (5 lines): `bun run verify` commands + "if can't run, say so"
7. **Docs sync** (5 lines): pointer to docs/ai/docs-policy.md + core rule: code change without docs update = task incomplete
8. **Communication** (4 lines): always report: docs consulted, assumptions, files changed, verifications run, remaining risks

**CLAUDE.md (≤30 lines, ~1KB)**:
1. **Import**: `@AGENTS.md`
2. **Compaction preservation** (5 bullets): docs consulted, files edited, commands run, assumptions, risks
3. **Delegation note** (1 line): prefer skills/hooks for repetitive workflows

### Layer 2 — AI Operating (11 files, create new)

**7 files with real content:**

| File | Content | Key sections |
|------|---------|--------------|
| `docs/ai/core.md` | Philosophy & principles | Quality bar, small diffs, source-of-truth hierarchy, verify before claim, update nearest docs |
| `docs/ai/routing.md` | Task routing matrix | 8 primary task types + 1 fallback + 4 modifier overlays with 4 columns each |
| `docs/ai/repo-map.md` | Module map | packages/cli (wizard entry + 3 steps + utils), packages/templates (raw markdown, 4 tools), test locations, build output, sensitive zones |
| `docs/ai/execution-policy.md` | Agent execution rules | Avoid broad rewrites, preserve compatibility, inspect blast radius, flag uncertainty |
| `docs/ai/coding-rules.md` | Coding standards | ESM throughout, Bun runtime, `with { type: 'text' }` imports, `@clack/prompts` UI, naming conventions, module boundaries, error handling, import patterns |
| `docs/ai/testing-policy.md` | Verification & testing | **Absorb from VERIFICATION.md:** verification minimum commands (typecheck, lint, test, verify), iron rule, red flags, when to add tests |
| `docs/ai/docs-policy.md` | Docs sync rules | Code change type → docs files to update mapping |

**4 skeleton files:**

| File | Content |
|------|---------|
| `docs/ai/deployment-policy.md` | Blueprint header + npm publish guardrails bullets |
| `docs/ai/security-policy.md` | Blueprint header + no hardcoded tokens, secrets handling bullets |
| `docs/ai/legacy-context.md` | Blueprint header + "currently not applicable — greenfield project, no legacy zones" + trigger when need to fill |
| `docs/ai/glossary.md` | Blueprint header + initial terms (au-agentic, JIT, shim, overlay) |

**Blueprint header format (5 lines, required for all docs/ai/ and docs/ files):**
```markdown
**Purpose:** [What this file covers]  
**Read this when:** [Task types or situations]  
**Do not use for:** [What this file does NOT cover]  
**Related:** [Max 3 file references]  
**Update when:** [Triggers for updating this file]
```

### Layer 3 — Canonical Docs (49 files, skeleton with blueprint headers)

**Directory structure (Diátaxis framework):**

| Directory | Files | Count | Key files |
|-----------|-------|-------|-----------|
| `docs/` | `index.md` | 1 | Landing page mapping entire structure |
| `docs/getting-started/` | overview, quickstart, onboarding, environment, local-setup | 5 | |
| `docs/development/` | workflow, branching-and-prs, **testing**, styleguide, debugging, dependency-policy, docs-contributing | 7 | **testing.md** absorbs TESTING.md + VERIFICATION.md human-relevant sections |
| `docs/reference/` | techstack, project-structure, api, openapi.yaml, configuration, data-model, integrations, glossary | 8 | |
| `docs/explanations/` | architecture, domain-overview, design-principles, tradeoffs | 4 | |
| `docs/examples/` | api-examples, feature-walkthroughs, testing-examples, migration-examples | 4 | |
| `docs/deployment/` | deployment, environments, migrations, runbooks, rollback, observability, incident-response | 7 | |
| `docs/governance/` | roadmap, release-policy, **docs-styleguide**, maintainers, deprecations, repository-controls, decision-records | 7 | **docs-styleguide.md** contains writing conventions |
| `docs/adr/` | **0001-adopt-jit-docs-architecture** | 1 | Full ADR with context, decision, consequences, alternatives |
| `docs/support/` | troubleshooting, faq, compatibility, known-issues, support-playbook | 5 | |

**Total:** 49 files

**Skeleton policy (DEC-A7):**  
Files in domains not yet applicable (API, deployment, incident response, etc.) must:
- State `currently not applicable`
- Explain why not applicable yet
- Specify trigger that will require filling real content

**Special files:**
- **`docs/index.md`**: Landing page, must map entire docs structure with links to every section
- **`docs/governance/docs-styleguide.md`**: Contains finalized writing conventions (concise, no emoji, no yapping, bullets over prose, blueprint header format)
- **`docs/adr/0001-adopt-jit-docs-architecture.md`**: Complete ADR documenting this 4-layer JIT architecture — context, decision, consequences, alternatives considered

### Layer 4 — Root Health + .github/ (17 files, skeleton)

**Root health (6 files):**

| File | Key content |
|------|-------------|
| `CONTRIBUTING.md` | Setup instructions, branch/commit conventions (Conventional Commits via commitlint), PR expectations, link to `docs/development/*` |
| `SECURITY.md` | Vulnerability reporting channel, supported versions, what NOT to open as public issue |
| `SUPPORT.md` | When to open issue vs discussion, FAQ link, expectations |
| `CHANGELOG.md` | Unreleased section + Added/Changed/Fixed/Removed format skeleton |
| `LICENSE` | MIT full text, year + author |
| `CITATION.cff` | cff-version, title, authors, repository URL, version |

**.github/ (11 files):**

| File | Key content |
|------|-------------|
| `.github/CODEOWNERS` | Root owner, packages/cli/ owner, packages/templates/ owner, docs/ owner, .github/ owner |
| `.github/PULL_REQUEST_TEMPLATE.md` | Summary, linked issue, test evidence, docs updated?, breaking changes? |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Steps to reproduce, expected vs actual, runtime version (YAML format) |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Problem description, proposed solution, alternatives (YAML format) |
| `.github/ISSUE_TEMPLATE/question.yml` | Question, context, searched docs? (YAML format) |
| `.github/workflows/ci.yml` | Skeleton: Bun setup → typecheck → lint → test |
| `.github/workflows/release.yml` | Skeleton: Bun setup → verify → build → npm publish |
| `.github/workflows/docs-check.yml` | Skeleton: only run checks that exist in repo; parts lacking tooling support have clear TODO or limited placeholder (DEC-A8) |
| `.github/workflows/security.yml` | Skeleton: only claim checks/security features actually supported; parts not supported have clear TODO (DEC-A8) |
| `security-insights.yml` | Machine-readable security posture YAML |
| `.worktreeinclude` | Patterns for Claude worktree file copying |

### Absorb Mapping (DEC-A5)

**VERIFICATION.md → 2 targets:**

| Source section | Target file | Transform |
|---------------|-------------|-----------|
| Required Before Claiming "Complete" (commands table) | `docs/ai/testing-policy.md` | Keep commands + iron rule, condense prose |
| Integration with Skills | `docs/ai/testing-policy.md` | Condense to bullets |
| Pre-commit Hook | `docs/development/testing.md` | Keep as-is |
| VSCode Integration | `docs/development/testing.md` | Condense |
| Red Flags + Iron Law | `docs/ai/testing-policy.md` | Merge into verification minimum |

**TESTING.md → 1 target:**

| Source section | Target file | Transform |
|---------------|-------------|-----------|
| Entire file (Setup, per-tool tests, re-entry, error tests) | `docs/development/testing.md` | Keep structure, condense prose, merge into skeleton |

**Delete after absorb:** VERIFICATION.md, TESTING.md  
**Update:** README.md if it references deleted files

### Grand Total

| Operation | Count |
|-----------|-------|
| Create new | 77 files |
| Rewrite 100% | 2 files (AGENTS.md, CLAUDE.md) |
| Delete | 2 files (VERIFICATION.md, TESTING.md) |
| Update | 1 file (README.md — remove references to deleted files) |

---

## Implementation Sequence & Dependencies

### 5 Batches with Dependency Graph

```
Batch 1 (docs/ai/ - 11 files)
   ↓ required by
Batch 2 (docs/ canonical - 49 files)
   ↓ required by        ↓ required by
Batch 3 (shims - 2)  Batch 4 (root health - 17)
   ↓                    ↓
   └───────→ Batch 5 (cleanup - 2 deletions + 1 update) ←───────┘
```

### Ticket Mapping

| Batch | Ticket | Scope | Files | Dependencies | Can parallelize |
|-------|--------|-------|-------|--------------|-----------------|
| 1 | Ticket 1 | Create docs/ai/ — AI Operating Layer | 11 files (7 real content + 4 skeleton) | None (must run first) | No |
| 2 | Ticket 2 | Create docs/ canonical — Skeleton with Blueprint Headers | 49 files (absorb TESTING.md + VERIFICATION.md) | Batch 1 complete | No |
| 3 | Ticket 3 | Rewrite AGENTS.md + CLAUDE.md — JIT Shims | 2 files (rewrite 100%) | Batch 1 complete | Yes (with Batch 4) |
| 4 | Ticket 4 | Create Root Health + .github/ — Skeleton | 17 files | Best after Batch 1+2 for cross-refs | Yes (with Batch 3) |
| 5 | Ticket 5 | Cleanup — Delete VERIFICATION.md + TESTING.md | 2 deletions + 1 update | Batch 1+2 complete (absorb done) | No (must be last) |

### Dependencies Explained

- **Batch 1 must run first** — shims (Batch 3) reference `docs/ai/routing.md`, canonical docs (Batch 2) reference `docs/ai/` files in Related headers
- **Batch 2 depends on Batch 1** — absorbing VERIFICATION.md/TESTING.md into `docs/development/testing.md` needs `docs/ai/testing-policy.md` to exist for cross-reference
- **Batch 3 + 4 can parallelize after Batch 1** — shims only need `docs/ai/` to exist, root health files are independent
- **Batch 5 must run last** — only delete after absorb is complete (Batch 1+2 done)

### Execution Strategy

**Sequential baseline (safest):**  
Batch 1 → Batch 2 → Batch 3 → Batch 4 → Batch 5

**Optimized with parallelism:**  
Batch 1 → Batch 2 → (Batch 3 + Batch 4 in parallel) → Batch 5

**Recommendation:** Start sequential. Only parallelize Batch 3+4 if bandwidth allows and Batch 1+2 have been verified thoroughly.

---

## Testing & Verification Strategy

### Verification per Batch

**Batch 1 (docs/ai/):**
- Manual verification: Read routing.md, check 8 primary rows + 4 overlays have sufficient coverage for current codebase
- Check cross-references: Each file ≤3 references, no chain-loading
- Size check: Total ≤25KB, routing.md ≤150 lines, each other file ≤100 lines
- Blueprint headers: Every file has complete 5-line header (Purpose / Read this when / Do not use for / Related / Update when)

**Batch 2 (docs/):**
- Absorb completeness: Grep VERIFICATION.md and TESTING.md → confirm all important sections mapped to `docs/ai/testing-policy.md` or `docs/development/testing.md`
- Index completeness: `docs/index.md` must link to all 49 files
- Skeleton truthfulness (DEC-A7): Files in domains not yet applicable must state "currently not applicable" + trigger
- ADR completeness: `docs/adr/0001-*` must have Context, Decision, Consequences, Alternatives sections

**Batch 3 (shims):**
- Size check: AGENTS.md ≤120 lines, CLAUDE.md ≤30 lines, total ≤5KB
- Structure check: AGENTS.md has all 8 sections in order
- Reference check: CLAUDE.md imports AGENTS.md on first line (`@AGENTS.md`)
- No stale content: No old architecture details, old command examples already moved to docs/

**Batch 4 (root health):**
- LICENSE: MIT full text, correct year + author
- CONTRIBUTING: References Conventional Commits, links `docs/development/*`
- Issue templates: YAML format (not markdown)
- CI workflows: Match `bun run verify` command chain
- DEC-A8 compliance: `docs-check.yml` and `security.yml` don't claim enforcement without tooling support

**Batch 5 (cleanup):**
- Files deleted: VERIFICATION.md, TESTING.md no longer exist
- No orphan references: Grep entire repo shows no references to deleted files
- README updated: If had links to VERIFICATION.md/TESTING.md, now updated to point to docs/
- `bun run verify` still passes: No code changes, only docs, so typecheck + lint + test still pass

### Integration Testing

**End-to-end JIT loading simulation:**
1. Pick 3 different task types (e.g., feature work, bug fix, docs-only)
2. For each task, simulate agent flow: read AGENTS.md → routing.md → look up task type → load required files
3. Verify context budget: Total KB loaded ≤28KB per task
4. Check routing correctness: Files loaded are relevant for task type

**Cross-reference validation:**
1. Grep all "Related:" headers in docs/ai/ and docs/
2. Verify every referenced file exists
3. Check no circular references
4. Check no file has >3 cross-references

### Success Criteria (from Epic Brief)

- ✅ **AI agent can self-identify required docs per task** → routing.md with 8 task types + 4 overlays
- ✅ **Human maintainer can self-onboard** → docs/index.md landing page + quickstart
- ✅ **After code change, know when to sync docs** → docs/ai/docs-policy.md mapping
- ✅ **Repo achieves baseline health** → LICENSE, CONTRIBUTING, SECURITY, issue templates, CI workflows

---

## Writing Conventions (apply to all layers)

| Rule | Application |
|------|-------------|
| Concise, actionable, focused | Every file |
| No emoji, no long explanations, no yapping | Every file |
| No filler phrases | Every file |
| Bullets/tables preferred over prose paragraphs | Every file |
| Blueprint header 5 lines (Purpose / Read this when / Do not use for / Related / Update when) | docs/ai/* and docs/* |
| Every file stands alone | Every file |

### Size Budgets

| Target | Budget |
|--------|--------|
| CLAUDE.md | ≤30 lines (~1KB) |
| AGENTS.md | ≤120 lines (~4KB) |
| Total always-loaded | ≤5KB |
| docs/ai/routing.md | ≤150 lines (~5KB) |
| Each other docs/ai/* file | ≤100 lines (~3KB) |
| Total docs/ai/ | ≤45KB (revised from 25KB after implementation) |
| Each docs/* file | ≤200 lines (~6KB) |
| Per-task context | ≤32KB (agents load 2-3 policy files, not entire layer) |
| If file exceeds budget | Split into 2 files |

---

## Risks & Trade-offs

### Risks

**Risk 1: Routing table coverage gaps**  
If 8 primary task types + 4 overlays don't cover real-world tasks, agents will hit `Unclear / Mixed change` fallback frequently.  
*Mitigation:* Monitor fallback usage after deployment. If >20% of tasks hit fallback, add new primary row or overlay.

**Risk 2: Absorb information loss**  
VERIFICATION.md (148 lines) + TESTING.md (56 lines) → docs/ai/testing-policy.md + docs/development/testing.md. Risk of losing important context during transformation.  
*Mitigation:* Manual diff check during Batch 2 verification. Grep both source files, confirm all sections accounted for in targets.

**Risk 3: Skeleton files never get filled**  
4 skeleton files in docs/ai/ + many in docs/ may stay "not applicable" indefinitely if no one owns backfill.  
*Mitigation:* DEC-A7 requires triggers — when trigger fires (e.g., first API added, first deployment), backfill is explicit task, not vague debt.

**Risk 4: Routing table maintenance burden**  
As project grows, routing.md needs updates. If not kept in sync, becomes stale source-of-truth.  
*Mitigation:* docs/ai/docs-policy.md explicitly maps code change types → docs to update. Adding new task type or policy file triggers routing.md update.

**Risk 5: Initial learning curve for contributors**  
4-layer architecture + JIT routing is more complex than flat docs structure.  
*Mitigation:* docs/index.md landing page explains architecture. docs/governance/docs-styleguide.md has contribution guide. Human onboarding path clearly documented.

### Trade-offs

**Complexity vs Scalability**  
Initial setup (79 files) is more complex than simple README + inline docs, but scales when project grows without token waste or routing ambiguity.

**Tool-agnostic vs Per-tool optimization**  
Single `docs/ai/` layer works for all tools (Claude, Cursor, Copilot, Codex), but can't leverage tool-specific features. Accept loss of optimization for zero maintenance burden when adding new tools.

**Static routing table vs Dynamic routing logic**  
Table is less flexible than code-based decision tree, but faster to parse, predictable token usage, no infinite chain risk.

**Skeleton truthfulness vs Perceived completeness**  
Many files will be "not applicable" initially, looks incomplete. But avoids fake source-of-truth and makes backfill triggers explicit.

---

## Acceptance Criteria

### Per-Batch Criteria

**Batch 1 (docs/ai/):**
- 11 files created in `docs/ai/`
- 7 files have real content — reading them tells you exactly what to do, no guessing
- 4 skeleton files have complete blueprint header + "currently not applicable" status if domain not yet applied
- `routing.md` has all 8 primary task types + 1 fallback row + 4 modifier overlays with 4 columns (required, optional, verify, docs to update)
- `testing-policy.md` contains entire verification minimum from VERIFICATION.md (commands, iron rule, red flags)
- No file exceeds size budget
- No file references >3 other files

**Batch 2 (docs/ canonical):**
- 49 files created in correct directory structure
- Every file has complete blueprint header (5 lines)
- `docs/index.md` maps entire structure with links
- `docs/development/testing.md` contains absorbed content from TESTING.md + human-relevant sections of VERIFICATION.md
- `docs/governance/docs-styleguide.md` contains finalized writing conventions
- `docs/adr/0001-*` contains complete ADR (context, decision, consequences, alternatives)
- Files in domains not yet applicable state "currently not applicable" + trigger

**Batch 3 (shims):**
- AGENTS.md rewritten completely, ≤120 lines
- CLAUDE.md rewritten completely, ≤30 lines
- AGENTS.md has all 8 sections in order
- CLAUDE.md imports AGENTS.md on first line (`@AGENTS.md`)
- No old content remains (architecture details, old command examples moved to docs/)
- References to `docs/ai/` files all point to files that exist (from Batch 1)
- Total always-loaded ≤5KB

**Batch 4 (root health):**
- 17 files created in correct locations
- `LICENSE` contains MIT full text
- `CONTRIBUTING.md` references Conventional Commits + links `docs/development/*`
- CI workflow skeletons match `bun run verify` command chain
- Issue templates use YAML form format (not markdown)
- `docs-check.yml` and `security.yml` don't claim enforcement without tooling support (DEC-A8)

**Batch 5 (cleanup):**
- VERIFICATION.md deleted
- TESTING.md deleted
- No file in repo references VERIFICATION.md or TESTING.md
- README.md updated if needed
- `bun run verify` still passes (no code change, only docs)

### Epic-Level Criteria (Success Criteria from Epic Brief)

- ✅ **AI agent can self-identify required docs per task type without loading entire docs/**  
  Verified by: Simulate 3 different task types, confirm routing table returns correct file list, context budget ≤28KB per task

- ✅ **Human maintainer can self-onboard with clear source-of-truth hierarchy**  
  Verified by: Follow onboarding path (README → docs/index.md → quickstart → testing → CONTRIBUTING), confirm no dead ends or ambiguity

- ✅ **After code change, contributor knows when and where to sync docs**  
  Verified by: Check docs/ai/docs-policy.md has mapping for all code change types in current codebase

- ✅ **Repo achieves baseline health**  
  Verified by: LICENSE, CONTRIBUTING, SECURITY exist; issue templates work; CI workflows run; CODEOWNERS valid

### Integration Test Passing

- End-to-end JIT loading simulation passes for 3 task types
- Cross-reference validation shows no broken links, no circular refs, no files with >3 refs
- Absorb completeness check confirms no information lost from VERIFICATION.md/TESTING.md
- Size budget check confirms all files within limits, total context ≤28KB per task

---

## Out of Scope

**Explicitly NOT included in this Epic:**

- **Docs content backfill beyond skeletons** — Filling real content for deployment/, support/, examples/ is future work triggered by actual deployment, incidents, or feature examples
- **Automation tooling for docs validation** — `docs-check.yml` and `security.yml` are skeletons; building actual validation scripts is follow-up work (DEC-A8)
- **Migration of existing documentation** — Repo currently has minimal docs; this is greenfield docs architecture, not migration project
- **Per-tool optimization** — No Claude-specific rules in `.claude/rules/`, no Cursor-specific rules in `.cursor/rules/` (DEC-A1)
- **OpenAPI spec generation** — `docs/reference/openapi.yaml` is skeleton placeholder; actual API doesn't exist yet
- **Deployment runbooks** — `docs/deployment/runbooks.md` is skeleton; actual runbooks written when deployment exists
- **Incident response playbooks** — `docs/deployment/incident-response.md` is skeleton; actual playbooks written after first incident or during production prep

---

## Explicit Decisions Made

### User-Stated Decisions

**[DEC-001] Single design spec for entire Epic** *(user-confirmed)*  
Status: accepted  
Decision: Create 1 comprehensive design spec for all 5 tickets, then create implementation plan(s).  
Alternative considered: Separate specs per ticket.  
Rationale: Tickets already decomposed with clear dependencies; single spec provides coherent architecture view.

**[DEC-002] Specs are sufficient to proceed** *(user-confirmed)*  
Status: accepted  
Decision: Existing Epic Brief, Core Flows, Tech Plan, and 5 Tickets provide sufficient detail; no additional validation or exploration needed before design.  
Alternatives considered: Validate routing taxonomy, validate absorb mapping, explore alternative structures.  
Rationale: Specs are already very detailed (4-layer architecture, routing taxonomy, absorb mapping, file inventory).

### AI-Recommended Decisions (Accepted by User)

**[DEC-003] 4-Layer JIT Architecture (Option 1)** *(ai-recommended → user-approved)*  
Status: accepted  
Decision: Implement 4-layer JIT architecture as specified in Tech Plan.  
Alternatives considered: Simpler 2-layer approach (rejected: token waste, not scalable), Enhanced 4-layer with automation enforcement (rejected: over-engineering upfront per DEC-A8).  
Rationale: Only solution meeting requirements "AI agent route đúng docs theo task" and "không lãng phí token" simultaneously. Repo designed for AI Agentic Engineering — needs this architecture from start.

---

## Open Risks

### [UNCONFIRMED - MEDIUM RISK] Routing table may need iteration after first real usage

Routing table designed based on projected task types. Real-world usage may reveal gaps or overlaps requiring taxonomy adjustment. Mitigation: Monitor fallback row usage in first 2 weeks after deployment; if >20% tasks hit fallback, refine taxonomy.

### [UNCONFIRMED - LOW RISK] Skeleton backfill ownership unclear

Many skeleton files will stay "not applicable" initially. No explicit owner assigned for backfill when triggers fire. Mitigation: docs/ai/docs-policy.md maps triggers → docs to update; when trigger fires, person making code change owns docs update.

---

## Future Scope / Deferred Features

Confirmed as outside current scope, not estimated, not committed:

- **Automated docs validation tooling** — Build scripts that validate routing table consistency, detect stale docs, check cross-reference validity
- **Automated docs sync enforcement** — Pre-commit hook that blocks commit if docs not updated per docs-policy.md mapping
- **Content backfill for deployment docs** — Fill real content for docs/deployment/* when first deployment happens
- **Content backfill for support docs** — Fill real content for docs/support/* when first incidents occur
- **OpenAPI spec generation** — Generate docs/reference/openapi.yaml when API surface added
- **Interactive docs navigation** — Web UI for browsing docs structure (MkDocs, Docusaurus, etc.)
- **Per-tool optimization layer** — Tool-specific enhancements (Claude Code skills, Cursor hooks, etc.) that augment but don't replace docs/ai/

---

## Next Steps

1. **Spec self-review** — Check for placeholders, contradictions, ambiguity, scope issues
2. **User reviews written spec** — Confirm spec accuracy before proceeding
3. **Invoke writing-plans skill** — Create detailed implementation plan with bite-sized tasks, test-first approach, exact file paths, and verification steps

---

*End of Design Spec*
