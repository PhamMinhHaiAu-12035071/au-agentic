**Purpose:** Non-negotiable engineering and product principles.  
**Read this when:** Evaluating a design choice or refactor scope.  
**Do not use for:** Line-level code style (use [../development/styleguide.md](../development/styleguide.md)).  
**Related:** [tradeoffs.md](tradeoffs.md), [architecture.md](architecture.md), [../../AGENTS.md](../../AGENTS.md)  
**Update when:** Principles change or new constraints (accessibility, privacy) are adopted.

---

# Design principles

**Status:** Currently not applicable — [AGENTS.md](../../AGENTS.md) states approach and simplicity; expand here when principles need more depth.

**Trigger:** This file should be filled when:
- You codify explicit principles (e.g. no runtime template I/O) for contributors
- Tradeoffs doc grows and needs a normative companion

## Speed budgets

The toolchain is held to four time tiers; `bun run perf` enforces them.

| Tier | Time band | Rationale |
|---|---|---|
| T1 instant | < 200 ms | Human "instant" perception threshold |
| T1 sub-second | < 500 ms | Tolerable for staged-file scans |
| T2 snappy | < 1 s | Inner TDD loop must stay below attention break |
| T3 workflow | < 2–3 s | Pre-commit hook total — above this, contributors start `--no-verify` |
| T4 full pipeline | < 10 s cold, < 1 s cached | Fresh-clone verify time vs daily working baseline |

Every command in `scripts/benchmark.ts` is annotated with its target and ceiling. Drift is visible in version-controlled `docs/development/performance-benchmarks.md`.
