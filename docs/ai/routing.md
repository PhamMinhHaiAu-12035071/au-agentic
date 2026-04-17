**Purpose:** Task routing matrix mapping task types to required/optional docs and verification steps  
**Read this when:** Starting any task to determine which docs to load  
**Do not use for:** General principles (see core.md) or specific coding rules (see coding-rules.md)  
**Related:** core.md, docs-policy.md  
**Update when:** Adding new task types, policies, or docs files

---

# Task Routing Matrix

## How to Use This

1. Identify your primary task type (8 types below)
2. Check if any modifier overlays apply
3. Load required files from primary row + overlays
4. Load optional files only if ambiguity remains
5. Run verification commands before claiming done
6. Update docs per "Docs to update" column

## Primary Task Types

| Task Type | Required reads | Optional reads | Verify | Docs to update |
|-----------|---------------|----------------|--------|----------------|
| **Feature work** | repo-map.md<br>coding-rules.md | docs/reference/project-structure.md<br>docs/explanations/architecture.md | `bun run verify` | docs/reference/* if API/config changed |
| **Bug fix** | testing-policy.md | docs/support/troubleshooting.md | `bun run test` (regression test) | docs/support/known-issues.md if needed |
| **Refactor** | execution-policy.md<br>coding-rules.md | docs/explanations/architecture.md | `bun run verify` | docs/reference/project-structure.md if structure changed |
| **Test change** | testing-policy.md | docs/development/testing.md | `bun run test` | - |
| **Docs-only** | docs-policy.md | - | - | - |
| **CI/Deploy** | deployment-policy.md | docs/deployment/deployment.md | - | docs/deployment/* |
| **Security** | security-policy.md | docs/reference/configuration.md | `bun run lint`<br>`bun run test` | SECURITY.md if needed |
| **Dependency** | dependency-scope-policy.md<br>coding-rules.md | docs/development/dependency-policy.md | `bun run verify` | docs/reference/techstack.md |
| **Unclear / Mixed change** | repo-map.md<br>docs-policy.md | docs/reference/project-structure.md<br>docs/explanations/architecture.md | Expand 1 layer minimal context;<br>if still unclear stop and ask user | Identify nearest source-of-truth then sync docs |
| **Adding a new skill template** | repo-map.md<br>docs/reference/project-structure.md | docs/development/testing.md | `bun run gen:manifest`<br>`bun run verify` | repo-map.md + project-structure.md; drop folder under `packages/templates/<skill>/`, run codegen, add 4-tier tests, update wizard skill-select step |
| **Skill quality validation** (benchmark run, adding fixtures, reviewing tracker diff) | packages/cursor-agent-bench/README.md<br>docs/superpowers/bench/README.md | docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md<br>docs/adr/0010-cursor-cli-system-prereq.md | `bun run skill:bench` (smoke)<br>`bun run skill:bench --matrix` (release gate) | docs/superpowers/bench/&lt;skill&gt;.md tracker entry |

## Modifier Overlays

Apply these **in addition to** primary row when task also involves:

| Modifier | Apply when | Add required reads | Extra rule |
|----------|-----------|-------------------|-----------|
| **API change** | Task changes public contracts or generated surface | docs/reference/api.md<br>docs/reference/openapi.yaml | Sync API docs in same task |
| **Migration / Data change** | Task changes schema, stored data, or compatibility data flow | docs/deployment/migrations.md<br>docs/reference/data-model.md | Maintain compatibility; sync deployment/reference docs |
| **Legacy area** | Task touches code with historical constraints | docs/ai/legacy-context.md | Reduce blast radius; no broad rewrites |
| **Auth-sensitive area** | Task touches auth, secrets, or sensitive config | docs/ai/security-policy.md<br>docs/reference/configuration.md | Don't assume; if unclear ask user |

## Routing Rules

- **No chain-loading:** Max 3 cross-references per file (exception: index/mapping files like routing.md and docs-policy.md are terminal nodes)
- **Budget:** Per-task context ≤28KB (shim 5KB + routing 5KB + policies 6KB + canonical 12KB)
- **Unclear task?** Expand 1 layer minimal context → if still unclear → stop and ask user before changing code
- **Docs contradict?** Expand 1 layer minimal context → if conflict remains → stop and ask user

## Context Budget Tracking

| Layer | Budget | Purpose |
|-------|--------|---------|
| Shim (AGENTS.md + CLAUDE.md) | ≤5KB | Always-loaded mission + routing pointer |
| Routing (this file) | ≤5KB | Task type lookup table |
| Policies (1-2 files from table) | ≤10KB | Task-specific rules (agents load 2-3 files, not entire 45KB layer) |
| Canonical (on-demand) | ≤12KB | Detailed references when needed |
| **Total per task** | **≤32KB** | |

---

*If you can't classify your task using this matrix, it may indicate the task needs decomposition or clarification. Stop and ask user.*
