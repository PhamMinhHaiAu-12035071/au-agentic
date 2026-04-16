**Purpose:** Clone, install, and day-one local development commands.  
**Read this when:** Setting up a working tree for feature work.  
**Do not use for:** CI/CD or hosted environments (see deployment docs when filled).  
**Related:** [quickstart.md](quickstart.md), [../development/workflow.md](../development/workflow.md), [../development/testing.md](../development/testing.md)  
**Update when:** Repo layout, scripts, or dev dependencies change.

---

# Local setup

## System dependencies (install once)

Two binaries must be present on `PATH` because they are not Bun packages:

- **gitleaks** — secret scanning at commit time
    - macOS: `brew install gitleaks`
    - Debian/Ubuntu: download from https://github.com/gitleaks/gitleaks/releases and place in `/usr/local/bin`
    - Windows: `scoop install gitleaks`
    - Verify: `gitleaks version` returns `8.x`

After installing, run `bunx lefthook install` to wire Lefthook hooks into `.git/hooks/`.

## Setup flow

**Status:** Currently not applicable — overlaps with [CLAUDE.md](../../CLAUDE.md) commands and root README until consolidated here.

**Trigger:** This file should be filled when:
- You want all human setup steps out of shim files and under `docs/`
- Optional services (Docker, local registry) are added

Typical flow today:

```bash
git clone <repo-url>
cd au-agentic
bun install
bunx lefthook install
bun run verify
```
