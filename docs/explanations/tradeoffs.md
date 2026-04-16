**Purpose:** Record why alternatives were not chosen and what was accepted in exchange.  
**Read this when:** Questioning an established pattern or proposing reversals.  
**Do not use for:** Formal ADRs (use [../adr/](../adr/) and [../governance/decision-records.md](../governance/decision-records.md)).  
**Related:** [design-principles.md](design-principles.md), [../adr/0001-adopt-jit-docs-architecture.md](../adr/0001-adopt-jit-docs-architecture.md), [architecture.md](architecture.md)  
**Update when:** Significant decisions are revisited or new tradeoffs appear.

---

# Tradeoffs

**Status:** Currently not applicable — small codebase; ADR 0001 captures one major docs decision.

**Trigger:** This file should be filled when:
- You want a running log of architectural tradeoffs outside ADR numbering
- Patterns accumulate that deserve explicit cost/benefit notes

## Coverage baseline vs aspirational target

**Choice:** Per-file coverage thresholds match current baseline (26%–39% for legacy files); new files start at 80%.

**Trade-off:** Aspirational 80% across the board would block landing this toolchain phase. Baseline pinning lets existing code stay as-is while new files meet high bar.

**Consequence:** Coverage percent creep is invisible until a file crosses threshold. Manual vigilance required; future tooling could auto-bump thresholds on each PR that improves a file.

## Turbo first-run vs incremental cost

**Choice:** Added Turborepo for caching; first run is ~200 ms slower than raw `bun` commands due to graph resolution.

**Trade-off:** Cache hits reduce subsequent runs to sub-100 ms, making iterated TDD cycles faster. One-shot CI pipelines pay the overhead every time.

**Consequence:** `bun run verify` is slower on GitHub Actions unless Turbo remote cache is enabled. For local TDD, the cache-hit speedup dominates after the first cycle.
