**Purpose:** How to change documentation under `docs/` and keep it consistent.  
**Read this when:** Adding or editing canonical docs.  
**Do not use for:** AI policy edits (use [../ai/docs-policy.md](../ai/docs-policy.md)).  
**Related:** [../governance/docs-styleguide.md](../governance/docs-styleguide.md), [../index.md](../index.md), [workflow.md](workflow.md)  
**Update when:** Doc taxonomy, review expectations, or blueprint rules change.

---

# Contributing to documentation

**Status:** Currently not applicable — follow [docs-styleguide.md](../governance/docs-styleguide.md) and mirror existing skeletons until process grows.

**Trigger:** This file should be filled when:
- You require doc PRs for certain change types
- You add doc linting or link checking in CI

## Markdown linting

Markdown files are linted by `markdownlint-cli2` (`.markdownlint-cli2.jsonc` config). Run locally:

```bash
bunx markdownlint-cli2
```

Common rules enforced: heading hierarchy (MD001), no duplicate headings within a section (MD024 siblings_only), fenced code with language (MD040). Long lines and inline HTML are allowed.

`packages/templates/**` is excluded — those are content payloads, not documentation.
