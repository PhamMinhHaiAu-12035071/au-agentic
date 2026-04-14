**Purpose:** Required and optional tooling, versions, and environment variables.  
**Read this when:** Debugging "works on my machine" or documenting supported platforms.  
**Do not use for:** Runtime deployment config (use [../deployment/environments.md](../deployment/environments.md) when applicable).  
**Related:** [local-setup.md](local-setup.md), [../reference/configuration.md](../reference/configuration.md), [../../package.json](../../package.json)  
**Update when:** Minimum Bun/Node versions, env vars, or OS support changes.

---

# Environment

**Status:** Currently not applicable — only Bun and local `bun` scripts matter today; no managed env matrix.

**Trigger:** This file should be filled when:
- You document pinned toolchain versions (`.tool-versions`, CI images)
- The CLI reads configuration from env vars or config files that users must set
