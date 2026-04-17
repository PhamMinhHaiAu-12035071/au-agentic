**Purpose:** Historical constraints and legacy area context  
**Read this when:** Legacy area modifier overlay applies (from routing.md)  
**Do not use for:** Greenfield code with no historical constraints  
**Related:** execution-policy.md, docs/explanations/architecture.md  
**Update when:** Legacy constraints identified or brownfield migrations begin

---

# Legacy Context

**Status:** Currently not applicable — au-agentic is a greenfield project with no legacy zones or historical constraints.

**Trigger:** This file should be filled when:
- Migrating from old architecture to new
- Maintaining backward compatibility with deprecated features
- Working around known technical debt that can't be immediately fixed
- Interacting with external systems with historical constraints

## No Legacy Zones Currently

This codebase started fresh in 2024. All code follows current conventions. There are no "don't touch this" areas due to historical reasons.

## If Legacy Areas Emerge

Future content should document:
- Which files/modules have historical constraints
- Why constraints exist (backward compat, external dependencies, etc.)
- Safe vs unsafe changes in those areas
- Migration strategy out of legacy patterns
- Who to ask for context on historical decisions

## Toolchain refactor (2026-04)

The 2026-04-16 toolchain hardening replaced ESLint v9 + Husky + lint-staged with Biome v2 + Lefthook, added Turborepo for task caching, gitleaks for secret scanning, and Knip for dead-code detection. All GitHub Actions workflows were downgraded to manual-trigger only. See:

- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md`
- ADRs: 0002 (Biome), 0003 (Turborepo), 0004 (Lefthook), 0005 (imports field aliases), 0006 (workflows disabled)

If you are reading this and wondering why the repo no longer uses ESLint or Husky — those are the answers.
