**Purpose:** How to revert a bad release or config change safely.  
**Read this when:** A deployment causes regressions or incidents.  
**Do not use for:** Git revert policy for app code (may overlap [../development/branching-and-prs.md](../development/branching-and-prs.md)).  
**Related:** [deployment.md](deployment.md), [runbooks.md](runbooks.md), [incident-response.md](incident-response.md)  
**Update when:** Rollback mechanisms (deploy pins, feature flags) change.

---

# Rollback

**Status:** Currently not applicable — nothing is deployed as a long-running service from this repo.

**Trigger:** This file should be filled when:
- You publish versioned artifacts where rollback is operational
- Infrastructure supports traffic shift or previous revision pinning
