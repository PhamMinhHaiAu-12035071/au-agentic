# ADR-0003: Turborepo task cache

**Status:** Accepted  
**Date:** 2026-04-17  
**Authors:** System  
**Related ADRs:** ADR-0002 (Biome), ADR-0004 (Lefthook)

## Context

au-agentic is a Bun monorepo with two packages today and a TDD workflow that runs many test, lint, and typecheck cycles per development session. Without a task-graph cache, each cycle re-runs everything regardless of what changed. The user explicitly asked for "super caching" so feedback stays sub-second on no-op runs.

## Decision

Adopt Turborepo v2 as the task orchestrator. Wire root scripts (`bun run verify`, `bun run test`, `bun run typecheck`, `bun run lint`, `bun run build`) through `turbo run <task>`. Local cache only for now; remote cache deferred until CI auto-trigger is enabled.

## Consequences

**Positive**
- `turbo run X` on no change returns in sub-second (cache replay)
- Per-package fan-out: edits to one package skip others
- Task inputs/outputs are explicit, making cache reasoning transparent
- Official Bun support (lockfile hashed, workspace filtering)

**Negative**
- One more config file to maintain (`turbo.json`)
- First run misses cache for every task
- Wrong `outputs` glob can result in cached tasks not restoring artifacts; debugging requires `--force`
- Adds the `.turbo/` directory to gitignore management

## Alternatives considered

- **Nx**: more powerful (`affected`, distributed execution), but overkill for two packages and steeper learning curve
- **Bun-native scripts only**: no task-graph cache; edit one file → still runs everything
- **TypeScript project references**: orthogonal, complementary; deferred until repo grows past five packages or typecheck exceeds five seconds

## References

- Turborepo docs: https://turborepo.dev
- Spec: `docs/superpowers/specs/2026-04-16-toolchain-production-readiness-design.md` Section 3.2
