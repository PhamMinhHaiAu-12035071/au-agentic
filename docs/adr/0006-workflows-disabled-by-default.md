# ADR-0006: GitHub Actions workflows disabled by default

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

au-agentic is currently a personal project in active toolchain refactoring. The owner does not want commits, pushes, or PRs to consume GitHub Actions minutes during this period. Local pre-commit hooks (Lefthook) and `bun run verify` already cover the same checks, and the spec's performance budgets keep them fast.

## Decision

Every workflow file in `.github/workflows/` declares `on: workflow_dispatch` only — no `push`, `pull_request`, `schedule`, or release event triggers. Workflows still exist, are version-controlled, and can be triggered manually from the Actions UI or `gh workflow run <name>`.

The new `verify.yml` is the canonical full pipeline: Bun setup, Bun install cache, Turbo cache, `bun run verify`, `bunx knip`, `bunx markdownlint-cli2`, `bun run perf`, gitleaks full scan, and artifact uploads for coverage and benchmark.

## Consequences

**Positive**
- Zero unintended Actions minutes
- Workflows are still tracked and reviewable
- Manual trigger remains available for ad-hoc verification or release runs
- Forces local verification discipline (which the spec already enforces)

**Negative**
- No automatic safety net for unrelated repository hygiene (e.g., dependency vulnerability alerts)
- Contributors who skip pre-commit hooks (`--no-verify`) can land broken code without immediate CI catching it
- To re-enable any workflow, both the `on:` block and any related branch protection must be updated together

## Alternatives considered

- **Auto-trigger on PR only**: rejected because PR ergonomics still cost minutes on every push to a PR branch
- **Schedule-only daily verify**: rejected because feedback latency does not match TDD workflow
- **Delete the workflow files entirely**: rejected because losing the configuration loses institutional knowledge; manual trigger preserves them

## Reactivation procedure

See `docs/deployment/runbooks.md` for the "Activate CI workflows" runbook.

## References

- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.12
