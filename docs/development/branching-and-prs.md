**Purpose:** Branch naming, PR expectations, and review norms.  
**Read this when:** Opening or reviewing a pull request.  
**Do not use for:** Git internals tutorial (link external docs if needed).  
**Related:** [workflow.md](workflow.md), [../../CONTRIBUTING.md](../../CONTRIBUTING.md), [../governance/repository-controls.md](../governance/repository-controls.md)  
**Update when:** Commit conventions, review bar, or CI gate requirements change.

---

# Branching and pull requests

**Status:** Currently not applicable — commitlint enforces Conventional Commits; no extra repo-specific PR guide yet.

**Trigger:** This file should be filled when:
- You document required labels, reviewers, or merge strategies
- You add long-lived branches or release branches

## CI status

GitHub Actions workflows are **disabled by default** (all workflows require `workflow_dispatch` manual trigger). No commit, push, or PR automatically starts an Actions run. This is intentional (see ADR-0006).

To manually verify a PR:

```bash
gh workflow run verify.yml --ref <pr-branch> -f reason="PR pre-merge check"
```

Check run status in the Actions tab or `gh run list --workflow=verify.yml`.
