# ADR-0004: Adopt Lefthook in place of Husky and lint-staged

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

The previous setup paired Husky (shell-script hooks under `.husky/`) with lint-staged (JSON config in `package.json`). Hooks ran sequentially, and the user explicitly asked for Husky to be fully removed. The user prioritizes pre-commit speed because the TDD workflow runs many pre-commits per session.

## Decision

Adopt Lefthook as the sole hook runner. Configure all hooks (pre-commit, commit-msg, pre-push) in `lefthook.yml` with `parallel: true` for pre-commit. Delete `.husky/` directory and remove `husky` and `lint-staged` devDependencies.

## Consequences

**Positive**
- Single binary (Go), no Node startup cost per hook
- Parallel execution: pre-commit total time = max(slowest command), not sum
- One YAML file replaces two configs (`.husky/*` shell scripts + `lint-staged` JSON)
- Native `glob` and `staged_files` substitution; no need for lint-staged

**Negative**
- New tool to learn for contributors familiar with Husky
- macOS install on first clone requires `brew install` plus `bunx lefthook install` (documented in `docs/getting-started/local-setup.md`)

## Alternatives considered

- **Keep Husky, add gitleaks to pre-commit**: rejected because user explicitly asked for Husky removal and because Husky cannot run hooks in parallel
- **simple-git-hooks**: rejected because it lacks `glob` and `staged_files` substitution; we would need lint-staged anyway

## References

- Lefthook docs: https://lefthook.dev
- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.4
