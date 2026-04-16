**Purpose:** Step-by-step operational procedures for on-call or releases.  
**Read this when:** Executing a routine that must not rely on tribal knowledge.  
**Do not use for:** One-off debugging (use [../development/debugging.md](../development/debugging.md)).  
**Related:** [incident-response.md](incident-response.md), [rollback.md](rollback.md), [deployment.md](deployment.md)  
**Update when:** Procedures change or automation replaces manual steps.

---

# Runbooks

**Status:** Currently not applicable — no production operations for this repository.

**Trigger:** This file should be filled when:
- On-call rotations or service ownership begins
- Common tasks (rotate secrets, scale, drain) need checklists

## Activate CI workflows

**When:** You want to re-enable auto-trigger for GitHub Actions (e.g., `push` or `pull_request` triggers).

**Prerequisites:** ADR-0006 updated with rationale; repository branch protection confirms workflows are reliable.

**Steps:**

1. Choose the workflow to re-enable (e.g., `verify.yml` for PR protection)
2. Edit `.github/workflows/<workflow>.yml`
3. Change `on: workflow_dispatch` to desired trigger:

```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
```

4. Commit with message referencing ADR-0006
5. Test by opening a draft PR — workflow should auto-start
6. If workflow passes consistently, update branch protection rules to require it

**Rollback:** Revert to `on: workflow_dispatch` if the workflow is unstable or costs exceed budget.
