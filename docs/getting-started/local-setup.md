**Purpose:** Clone, install, and day-one local development commands.  
**Read this when:** Setting up a working tree for feature work.  
**Do not use for:** CI/CD or hosted environments (see deployment docs when filled).  
**Related:** [quickstart.md](quickstart.md), [../development/workflow.md](../development/workflow.md), [../development/testing.md](../development/testing.md)  
**Update when:** Repo layout, scripts, or dev dependencies change.

---

# Local setup

**Status:** Currently not applicable — overlaps with [CLAUDE.md](../../CLAUDE.md) commands and root README until consolidated here.

**Trigger:** This file should be filled when:
- You want all human setup steps out of shim files and under `docs/`
- Optional services (Docker, local registry) are added

Typical flow today:

```bash
git clone <repo-url>
cd au-agentic
bun install
bun run verify
```
