# ADR-0005: Use package.json `imports` field for intra-package aliases

**Status:** Accepted
**Date:** 2026-04-16
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

au-agentic publishes the `cli` package to npm as `au-agentic`. Source code uses relative imports like `../../utils/files` which become hard to refactor as the source tree grows. We want a stable alias that survives publishing, works in Bun runtime and standard Node, and does not require a runtime loader on the consumer side.

## Decision

Use the package.json `imports` field for intra-package aliases: `#utils/*`, `#steps/*`. Cross-package references continue to use the workspace protocol: `"@au-agentic/templates": "workspace:*"`. The `tsconfig.json` `paths` block exists only as a mirror for the editor and TypeScript language server; it is never the runtime source of truth.

## Consequences

**Positive**
- Native to Node 14+ and Bun, no `tsconfig-paths` runtime dependency
- Survives `bun publish` to npm; consumers do not need any loader
- Works in the editor via `paths` mirror
- Refactor-safe: moving a file under `src/utils/` only changes the `imports` mapping, not every call site

**Negative**
- Two places to keep in sync (`imports` field and `tsconfig.paths`); a drift can silently break the editor without breaking runtime
- Less familiar than the `@/*` convention popular in framework-based frontends

## Alternatives considered

- **`tsconfig.paths` only**: rejected because TypeScript does not rewrite import specifiers at emit time; consumers using Node would fail to resolve `@/utils/files`
- **`tsconfig-paths` runtime loader**: rejected because it forces every consumer to install and configure the loader, defeating the purpose of a published CLI
- **Relative imports forever**: rejected because refactor cost and readability degrade quickly past ~30 source files

## References

- Node.js `imports` field: https://nodejs.org/api/packages.html#subpath-imports
- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.9
