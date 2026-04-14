**Purpose:** Languages, runtimes, and primary libraries.  
**Read this when:** Assessing compatibility or onboarding a developer.  
**Do not use for:** Version pinning policy (use [../development/dependency-policy.md](../development/dependency-policy.md) when filled).  
**Related:** [project-structure.md](project-structure.md), [configuration.md](configuration.md), [../../package.json](../../package.json)  
**Update when:** Major dependency or runtime changes.

---

# Tech stack

**Status:** Currently not applicable — see [CLAUDE.md](../../CLAUDE.md) Architecture: Bun, ESM, `@clack/prompts`, `picocolors`; templates in `packages/templates/`, CLI in `packages/cli/`.

**Trigger:** This file should be filled when:
- You want a single canonical table decoupled from tool-specific shims
- Stack grows (e.g. web UI, additional packages)
