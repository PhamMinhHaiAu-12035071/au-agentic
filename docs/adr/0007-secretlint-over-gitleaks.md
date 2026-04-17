# ADR-0007: Adopt secretlint in place of gitleaks for project-scope secret scanning

**Status:** Accepted
**Date:** 2026-04-17
**Deciders:** Au Pham
**Supersedes:** none (gitleaks was introduced in Phase 3, never had its own ADR)
**Superseded by:** none

## Context

Phase 3 of the 2026-04-16 toolchain hardening (ADR-0004) wired `gitleaks protect --staged` into the Lefthook pre-commit hook. Gitleaks is a Go binary distributed via Homebrew / scoop / apt / release tarball — not an npm package. That made it the **only** non-runtime system dependency the repo required: contributors had to install it separately from `bun install`, CI containers needed an extra setup step, and version drift between machines was silent.

The toolchain hardening spec explicitly aims to keep every dev tool inside `node_modules` so that `git clone` + `bun install` is the complete onboarding path. Gitleaks was the one hold-out. This ADR captures the decision to replace it with a project-scope alternative and introduces the permanent "project-scope dependencies only" rule.

## Decision

Migrate secret scanning from **gitleaks** (system binary) to **secretlint** (pure npm devDep) as of 2026-04-17. Add a canonical policy document ([docs/ai/dependency-scope-policy.md](../ai/dependency-scope-policy.md)) establishing the project-scope rule with exceptions limited to the Bun runtime and git.

Concrete changes:
- Remove `.gitleaks.toml`; add `.secretlintrc.json` with `@secretlint/secretlint-rule-preset-recommend` and `.secretlintignore` mirroring the previous path allowlist.
- Replace `gitleaks protect --staged ...` in `lefthook.yml` with `bunx secretlint --maskSecrets --secretlintignore .secretlintignore {staged_files}`.
- Update `scripts/benchmark.ts` W1-adjacent secret-scan bench to call secretlint.
- Update `packages/cli/src/__tests__/lefthook-config.test.ts` to assert the secret scanner is project-scope (must start with `bunx`, must not contain `gitleaks`).
- Uninstall gitleaks from machines where it was previously `brew install`-ed.

Documentation updates: `AGENTS.md` (Non-Negotiables + task routing), `docs/ai/dependency-scope-policy.md` (new canonical), `docs/ai/routing.md`, `docs/development/dependency-policy.md`, `docs/getting-started/local-setup.md`, `docs/getting-started/environment.md`, `docs/development/{workflow,testing,debugging,performance-benchmarks}.md`, `docs/explanations/architecture.md`, `docs/ai/{repo-map,security-policy,testing-policy}.md`, `docs/deployment/deployment.md`, `docs/reference/techstack.md`, `README.md`, `CONTRIBUTING.md`.

## Consequences

**Positive**
- Zero system prerequisites beyond Bun and git. `git clone` + `bun install` is the complete setup; `brew install gitleaks` is deleted.
- Version pinning is honored (`bun.lock`). Every machine gets secretlint 11.x deterministically.
- CI parity: the disabled-by-default `verify.yml` container needs no extra install step.
- Binaries are deleted with `rm -rf node_modules`. No lingering `/opt/homebrew/Cellar/gitleaks/*`.
- Policy precedent documented: [docs/ai/dependency-scope-policy.md](../ai/dependency-scope-policy.md) makes the project-scope rule explicit and enforced by test.

**Negative**
- Secretlint's rule library is smaller than gitleaks' 100+ built-in signatures. Preset-recommend covers the common classes (AWS, GCP, Slack, GitHub, npm, SendGrid, private keys, basic auth) — matches the gitleaks default spirit for this repo's threat model but would miss vendor-specific patterns (Stripe, Twilio) that the previous setup also did not enable.
- Secretlint runs under Bun/Node, not a native Go binary. Single-file staged scans are in the 200–2000 ms range versus gitleaks' ~40 ms. This moves the scanner from T1 tier to T3 tier but stays well below the pre-commit T3 ceiling (2–3 s) the project already budgets for Knip and others.

**Mitigations / follow-ups**
- If a specific vendor rule is later needed, add the corresponding `@secretlint/secretlint-rule-<vendor>` devDep. Keep everything inside `node_modules`.
- If a project ever needs a secret scanner faster than secretlint and no npm option exists, revisit the policy — but default is rejection, not accommodation (see dependency-scope-policy.md).

## Alternatives considered

- **Keep gitleaks**: loses project-scope compliance; already rejected by the new policy.
- **gitleaks via Docker**: replaces one system dep (brew) with another (Docker); still violates project-scope. Rejected.
- **gitleaks via unofficial npm wrapper**: wrappers download the Go binary on `postinstall`. Would technically live under `node_modules`, but the wrappers are unofficial with uneven maintenance. Rejected on supply-chain risk.
- **TruffleHog**: similar story to gitleaks — Go binary, no official npm package.
- **detect-secrets**: Python, needs `pip install --user` or `pipx`. Same problem class. Rejected.

## References

- Previous ADR: [ADR-0004 — Lefthook in place of Husky](0004-lefthook-over-husky.md) introduced the Lefthook hook that originally called gitleaks.
- Canonical dependency-scope rule: [../ai/dependency-scope-policy.md](../ai/dependency-scope-policy.md)
- Secretlint: https://github.com/secretlint/secretlint
- Toolchain design spec: [../superpowers/specs/2026-04-16-toolchain-production-readiness-design.md](../superpowers/specs/2026-04-16-toolchain-production-readiness-design.md) (original plan that allowed the gitleaks system dep — now superseded by this ADR)
