**Purpose:** Docs sync mapping — code change type to docs files to update  
**Read this when:** Docs-only tasks or after any code change  
**Do not use for:** How to write docs (see docs/governance/docs-styleguide.md)  
**Related:** core.md, routing.md  
**Update when:** New docs files added or code-to-docs mappings change

---

# Docs Sync Policy

## Core Rule

**Code change without docs update = task incomplete.**

After changing code, ask what source-of-truth you changed, then use the table below.

## Mapping: Code Change to Docs to Update

| Code Change Type | Docs Files to Update | When to Update |
|------------------|---------------------|----------------|
| **New feature in CLI** | docs/reference/project-structure.md; README.md if user-facing | Same task |
| **Change CLI commands** | packages/templates/**/*.md (interview commands); README.md | Same task |
| **Add/remove/change tool support** | README.md; docs/reference/techstack.md; docs/ai/repo-map.md | Same task |
| **Change build config** | docs/ai/repo-map.md if entry points change; docs/development/workflow.md | Same task |
| **Add/remove dependencies** | docs/reference/techstack.md; docs/ai/coding-rules.md if new patterns | Same task |
| **Change file structure** | docs/ai/repo-map.md; docs/reference/project-structure.md | Same task |
| **Add/remove npm scripts** | docs/development/workflow.md; docs/ai/testing-policy.md if verification commands | Same task |
| **Bug fix** | docs/support/known-issues.md or troubleshooting.md if documented | Remove from known-issues when fixed |
| **Change verification commands** | docs/ai/testing-policy.md; docs/development/testing.md; CONTRIBUTING.md | Same task |
| **Add/change tests** | docs/development/testing.md | Only if test strategy changes |
| **Refactor without behavior change** | (none) | No docs update needed |

## Special Cases

**Configuration:** New options or default changes go to docs/reference/configuration.md; note default changes in CHANGELOG.md.

**Deprecation:** Notice in relevant docs; "Deprecated" in CHANGELOG.md; do not delete docs until the feature is removed.

**Breaking changes:** Update docs/reference/*; "Breaking Changes" plus migration in CHANGELOG.md; README if onboarding changes.

## Verification After Docs Update

Check: cross-references resolve; examples still run; no contradictions; docs/ai/* stays within line budgets (see project standards).

Quick checks: search for stale `Related:` targets under `docs/ai/`; `wc -l docs/ai/*.md` for budget.

## When You Cannot Update Docs Immediately

If you lack information: stop and ask the user, or defer the code change until the doc target is clear. If code is urgent, open an explicit follow-up listing files, required content, and owner. Do not use vague TODOs or claim done without the mapped doc updates.

## Docs-Only Changes

No need to run `bun run verify` for markdown-only edits. Still check references and budgets. Use a `docs:` commit prefix (for example `docs: update routing table`). No new tests required.

## Emergency Exception

Critical production harm with immediate fix: ship the fix, then within 24 hours complete the mapped doc updates (or a tracked follow-up linked from the fix commit). Use only for genuine emergencies.
