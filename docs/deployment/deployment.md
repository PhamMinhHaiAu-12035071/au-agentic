**Purpose:** How production or published artifacts are built and released.  
**Read this when:** Shipping a version or wiring CI/CD.  
**Do not use for:** Local dev setup (use [../getting-started/local-setup.md](../getting-started/local-setup.md)).  
**Related:** [environments.md](environments.md), [../governance/release-policy.md](../governance/release-policy.md), [rollback.md](rollback.md)  
**Update when:** Pipeline, registry, or artifact shape changes.

---

# Deployment

**Status:** Currently not applicable — no managed deployment for this repo; npm publish flow is not documented here yet.

**Trigger:** This file should be filled when:
- CI publishes packages or binaries
- You deploy docs sites or companion services

## CI pipeline (manual trigger only)

All five GitHub Actions workflows (`ci.yml`, `docs-check.yml`, `release.yml`, `security.yml`, `verify.yml`) require manual activation from the Actions UI or via `gh workflow run <workflow.yml>`. This is documented in ADR-0006.

The `verify.yml` workflow runs the full pipeline: Bun cache, Turbo cache, lint, typecheck, test, Knip strict, markdownlint, performance benchmark, gitleaks full scan, and uploads coverage and benchmark artifacts.

To manually trigger before release:

```bash
gh workflow run verify.yml --ref main -f reason="pre-release validation"
gh run watch  # polls until done
```

If verify.yml passes, release is safe to publish.
