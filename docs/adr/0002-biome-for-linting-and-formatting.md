# ADR-0002: Biome for linting and formatting

**Status:** Accepted  
**Date:** 2026-04-16  
**Context:** Phase 2 (ESLint → Biome swap)

## Context

The au-agentic monorepo previously used ESLint for linting and had no unified formatting tool. This led to:

1. Incomplete tooling (no formatter)
2. Maintenance burden (ESLint + TypeScript-ESLint + Prettier would add complexity)
3. Performance issues (ESLint is slow on large codebases)
4. Inconsistent style enforcement

We needed a single, fast, zero-config tool for both linting and formatting.

## Decision

We adopt Biome v2 to replace ESLint and serve as both linter and formatter.

**Configuration:**
- `biome.json` at repo root
- Kebab-case filenames enforced via `useFilenamingConvention` rule
- Templates package excluded from linting via `overrides`
- Organized imports enabled via `javascript.organizeImports`
- Pre-commit hook via `lint-staged` runs `biome check --write --no-errors-on-unmatched`

**Scripts:**
- `bun run lint` → `biome lint .`
- `bun run format` → `biome format --write .`
- `bun run check` → `biome check --write .`

## Consequences

### Positive

1. **Single tool:** Biome handles linting, formatting, and import organization
2. **Performance:** Rust-based Biome is ~25x faster than ESLint
3. **Zero config:** Sensible defaults out of the box
4. **Consistency:** Uniform style enforcement across the monorepo
5. **Simplicity:** Fewer dependencies, less configuration

### Negative

1. **Ecosystem maturity:** Biome is newer than ESLint; some edge-case rules may be missing
2. **Migration cost:** One-time effort to remove ESLint and adapt workflows

### Neutral

1. **Templates package:** Excluded from linting as these are user-facing templates that may violate style rules intentionally
2. **TDD contract:** `biome-config.test.ts` enforces Biome configuration invariants

## Alternatives Considered

1. **ESLint + Prettier:** More mature but slower, requires two tools
2. **Rome (Biome's predecessor):** Abandoned project
3. **dprint:** Rust-based formatter, but lacks linting
4. **Status quo:** No formatter, incomplete tooling

## Related

- Phase 2 plan: `docs/superpowers/plans/2026-04-16-phase-2-biome-swap.md`
- Test contract: `packages/cli/src/__tests__/biome-config.test.ts`
- Configuration: `biome.json`
