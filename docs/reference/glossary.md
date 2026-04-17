**Purpose:** Definitions of domain terms and acronyms used in docs.  
**Read this when:** A term in another doc is ambiguous.  
**Do not use for:** AI glossary (may overlap [../ai/glossary.md](../ai/glossary.md)); keep human-focused here.  
**Related:** [../ai/glossary.md](../ai/glossary.md), [../explanations/domain-overview.md](../explanations/domain-overview.md), [../index.md](../index.md)  
**Update when:** New domain language is introduced to human docs.

---

# Glossary

**Status:** Currently not applicable — vocabulary is small (CLI, template, tool targets); AI glossary may cover agent terms.

**Trigger:** This file should be filled when:
- Business or product language grows beyond a short list
- You split human vs AI term lists deliberately

## Toolchain terms

- **LCOV** — Line Coverage line-by-line text format produced by Bun's coverage reporter; consumed by editors (Coverage Gutters extension), CI (Codecov, etc.), and code review tools.
- **Cache hit / cache miss** — In Turborepo, a *cache hit* means the task input hash matches a previous run, so outputs are restored from `.turbo/` without re-running the task. A *cache miss* runs the task and stores the result.
- **T1 / T2 / T3 / T4 tier** — Performance tiers defined in `docs/explanations/design-principles.md` and enforced by `scripts/benchmark.ts`. T1 = sub-200 ms; T4 = full pipeline cold ≤ 10 s.
- **Per-file coverage threshold** — Bun applies the threshold to each individual file rather than the aggregate. A single file under threshold fails the whole run.
