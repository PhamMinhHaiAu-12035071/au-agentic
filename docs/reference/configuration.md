**Purpose:** Configuration files, flags, and environment variables.
**Read this when:** Changing how the CLI or build is configured.
**Do not use for:** Secret management in deployment (use deployment docs when applicable).
**Related:** [../../package.json](../../package.json), [techstack.md](techstack.md), [../getting-started/environment.md](../getting-started/environment.md)
**Update when:** New config files, CLI flags, or env vars are introduced.

---

# Configuration

**Status:** Currently not applicable — configuration is minimal (Bun, `package.json` scripts, build externals in CLAUDE). If env vars or secret-backed config are introduced, document the config surface here and keep secret values out of git.

**Trigger:** This file should be filled when:
- The CLI reads a config file or env-based settings
- You document publishConfig, binary name changes, or workspace settings
