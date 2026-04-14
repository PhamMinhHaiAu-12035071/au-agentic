**Purpose:** How dependencies are chosen, upgraded, and audited.  
**Read this when:** Adding or upgrading npm/bun packages.  
**Do not use for:** Security disclosure process (use root SECURITY policy when present).  
**Related:** [../../package.json](../../package.json), [workflow.md](workflow.md), [../reference/techstack.md](../reference/techstack.md)  
**Update when:** Pinning strategy, allowed licenses, or update cadence changes.

---

# Dependency policy

**Status:** Currently not applicable — small dependency surface; no formal policy document yet.

**Trigger:** This file should be filled when:
- You require license allowlists or SBOM output
- You introduce native addons or postinstall scripts needing review rules
