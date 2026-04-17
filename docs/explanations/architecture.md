**Purpose:** Why the system is shaped the way it is at a high level.  
**Read this when:** You need mental model before a larger change.  
**Do not use for:** Step-by-step coding tasks (use development docs).  
**Related:** [design-principles.md](design-principles.md), [tradeoffs.md](tradeoffs.md), [../../CLAUDE.md](../../CLAUDE.md)  
**Update when:** Major structural decisions change (new packages, boundaries).

---

# Architecture

**Status:** Currently not applicable — [CLAUDE.md](../../CLAUDE.md) and [docs/ai/](../ai/) cover the current architecture; canonical narrative can merge here later.

**Trigger:** This file should be filled when:
- You want a human-oriented architecture doc separate from AI policies
- Subsystems multiply beyond templates + CLI wizard

## Toolchain architecture (2026-04)

The repository uses a layered verification model:

1. **Pre-commit (parallel):** Biome (format + lint), tsc (typecheck), secretlint (secrets — project-scope npm, replaces gitleaks per ADR-0007), ls-lint (filesystem naming — project-scope npm, ADR-0008), Knip (exports)
2. **Orchestration:** Turborepo caches task outputs by input hash; Lefthook triggers hooks
3. **Performance gate:** `scripts/benchmark.ts` measures T1-T4 tiers and fails if any task regresses
4. **Manual CI:** GitHub Actions workflows require `workflow_dispatch` (ADR-0006)

Key design decisions documented in `docs/adr/` (0002 Biome, 0003 Turborepo, 0004 Lefthook, 0006 disabled workflows, 0007 secretlint, 0008 ls-lint).
