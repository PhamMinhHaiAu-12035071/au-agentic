# Design: PatternsDev Re-org — Author Identity in Folder Structure

**Date:** 2026-04-17
**Status:** Approved

## Problem

Currently, patterns synced from the upstream `PatternsDev/skills` repo land in a flat path that carries no authorship signal:

```
packages/templates/javascript-patterns/
scripts/sync-upstream-patterns.ts
```

There is no way to distinguish PatternsDev-sourced content from future first-party or third-party template packages by folder structure alone.

## Goal

Make PatternsDev authorship visible in the directory hierarchy — both in the template output and in the sync script location — so the structure itself documents provenance.

## Decisions

### D-001: Template namespace at package level

Move `packages/templates/javascript-patterns/` into a `patterns-dev/` namespace:

```
packages/templates/
└── patterns-dev/
    └── javascript-patterns/
        ├── LICENSE
        ├── claude/references/
        ├── cursor/references/
        ├── codex/references/
        └── copilot/javascript-patterns/
```

**Why:** Consistent with how npm scopes (`@patterns-dev/`) and monorepo workspaces (`packages/<author>/`) express authorship. Scales cleanly if future authors contribute template packages.

### D-002: Sync script relocated into author-scoped subfolder

Move `scripts/sync-upstream-patterns.ts` to a two-level hierarchy:

```
scripts/sync/
└── patterns-dev/
    └── index.ts
```

**Why:** Mirrors the template namespace. The folder `patterns-dev/` acts as the namespace; `index.ts` is the single entry point (no splitting — same logic as today).

### D-003: Single file retained

No decomposition into `clone.ts` / `transform.ts` / `write.ts`. The existing single-file approach is sufficient for the current scope.

### D-004: ls-lint compliance

All new paths are kebab-case:
- `sync/` ✓
- `patterns-dev/` ✓
- `index.ts` ✓

`packages/templates` is already exempt from ls-lint (see `.ls-lint.yml` line 56).

## File Changes

| Before | After |
|---|---|
| `scripts/sync-upstream-patterns.ts` | `scripts/sync/patterns-dev/index.ts` |
| `scripts/__tests__/sync-upstream-patterns.test.ts` | `scripts/__tests__/sync-patterns-dev.test.ts` |
| `packages/templates/javascript-patterns/` | `packages/templates/patterns-dev/javascript-patterns/` |

## Dependent Updates Required

| Component | Change |
|---|---|
| `scripts/sync/patterns-dev/index.ts` | Update `TARGET_ROOT` to new template path |
| `scripts/__tests__/sync-patterns-dev.test.ts` | Update import path |
| `package.json` `sync:upstream-patterns` script | Update entry point path |
| `packages/cli/scripts/generate-template-manifest.ts` | Update glob scan root |
| Docs referencing old paths | Update path strings |

## Out of Scope

- Content of pattern `.md` files — unchanged
- Logic inside the sync script — unchanged
- Tool-specific subfolder layout (`claude/`, `cursor/`, etc.) — unchanged
- ls-lint rules — no new rules needed

## Success Criteria

1. `bun run sync:upstream-patterns` writes patterns to the new path without error
2. `bun run verify` passes (lint + typecheck + tests)
3. Manifest codegen picks up patterns from the new path
4. No references to the old path remain in source or docs
