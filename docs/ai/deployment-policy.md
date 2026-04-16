**Purpose:** Deployment and npm publish guardrails  
**Read this when:** CI/Deploy tasks or publishing to npm  
**Do not use for:** Local development workflow (see docs/development/workflow.md)  
**Related:** docs/deployment/deployment.md  
**Update when:** Publishing process changes or deployment guardrails added

---

# Deployment Policy

**Status:** Currently not applicable — repo not yet deployed to production or published to npm registry as stable package.

**Trigger:** This file should be filled when:
- First npm publish to non-preview version
- Deployment automation added to CI
- Production deployment process established

## Placeholder Guardrails

Until this file is filled with real content:

**Before npm publish:**
1. Run `bun run verify` — all checks must pass
2. Run `bun run build` — dist/ must be created successfully
3. Verify package.json version bumped appropriately (semver)
4. Check CHANGELOG.md updated with release notes

**Manual publish:**

```bash
bun run verify
bun run build
npm publish
```

**For future automation:** This file should document CI-based publish triggers, version tagging, and deployment rollback procedures.

## CI policy: manual trigger only

All five workflow files (`ci.yml`, `docs-check.yml`, `release.yml`, `security.yml`, `verify.yml`) declare `on: workflow_dispatch` only. No push, pull-request, merge, or schedule event will start an Actions run.

To run a workflow:

- Web UI: GitHub → Actions tab → select workflow → "Run workflow" button → choose branch and reason
- CLI: `gh workflow run verify.yml --ref <branch> -f reason="<why>"`

Never re-enable auto-triggers without updating ADR-0006 and the runbook.
