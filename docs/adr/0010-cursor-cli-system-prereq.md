# ADR-0010: Cursor CLI as system prerequisite for bench

**Status:** Accepted
**Date:** 2026-04-17
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

`packages/cursor-agent-bench/` validates skill quality by spawning `cursor-agent` (the Cursor CLI) with scripted fixtures. `cursor-agent` is distributed only as a shell installer (`curl https://cursor.com/install -fsSL | bash`), not as an npm package. `docs/ai/dependency-scope-policy.md` forbids global / user-scope installers with two documented exceptions: Bun and git.

## Decision

Cursor CLI is added as a third system prerequisite, scoped to the `cursor-agent-bench` package only. It is **not** a transitive dependency of `au-agentic` runtime or of `bun run verify`. The bench runner preflight-checks for the binary and OAuth session; missing prereqs fail-fast with exit code 2 and an actionable install message.

## Consequences

**Positive**

- Unlocks cross-model skill validation impossible without Cursor CLI
- Scope is narrow: only when running `bun run skill:bench`
- Preflight keeps error surface localized

**Negative**

- Breaks the two-prereq invariant (Bun + git)
- Contributors who only build / verify don't need it, but the bench command now lists it in its README

## Alternatives considered

- **Anthropic SDK direct calls**: rejected — loses Cursor's OAuth, CLI session resume, multi-provider routing that the whole bench premise depends on
- **Dockerize Cursor CLI**: rejected — the CLI requires host OAuth, Docker would need `-v ~/.cursor` mount and still does not solve OAuth flow
- **Replace Cursor CLI with Copilot CLI / Codex CLI**: rejected — we specifically chose Cursor for model diversity in free slow tier (DEC-015)

## References

- Spec: `docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md`
- Policy: `docs/ai/dependency-scope-policy.md`
- Decision log entry: DEC-001 (HIGH risk accepted)
