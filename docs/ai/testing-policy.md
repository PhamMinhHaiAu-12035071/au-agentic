**Purpose:** Verification minimum, test strategy, and when to add tests  
**Read this when:** Bug fix, test change, or any task claiming "complete"  
**Do not use for:** Coding style (see coding-rules.md) or execution safety (see execution-policy.md)  
**Related:** docs/development/testing.md  
**Update when:** Verification commands change or test strategy evolves

---

# Testing Policy

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT RUNNING `bun run verify`
```

If `verify` has not been run in the current message with output shown, the work is NOT verified.

## Verification Minimum

**Before claiming any work complete, creating PRs, or merging branches:**

```bash
bun run verify
```

This runs `typecheck`, then `lint`, then `test` (see `package.json` scripts).

### Individual Commands

| Command | When to Use | Expected |
|---------|-------------|----------|
| `bun run typecheck` | Check types only | Exit code 0, no TypeScript errors |
| `bun run lint` | Check code style only | Exit code 0, no ESLint errors |
| `bun run test` | Run tests only | All tests pass |
| `bun run verify` | **Full verification** (prefer this) | All three commands pass |
| `bun run build` | After verify passes | Dist files created successfully |

## Red Flags

- Claiming "tests pass" without running `verify`
- Ignoring VSCode Problems tab errors
- Merging or opening a PR with `verify` failing
- Assuming "build works" means types are clean (build is lenient versus full verify)
- Treating ESLint green as a substitute for `typecheck`

## Why Full Verify Matters

Lint, tests, and build can succeed while TypeScript errors remain (for example when typecheck was skipped). The Problems tab reflects those errors. Run `bun run verify` before claiming work complete.

## When to Add Tests

**Always add tests for:** new exported functions in `src/utils/`; bug fixes (regression); complex logic (roughly more than ~10 lines, conditionals, loops).

**Often optional:** interaction code in `src/steps/` without a TTY harness; one-liner utilities; type-only changes.

**Test location:** `src/__tests__/`. **Naming:** match source file (`copy.ts` → `copy.test.ts`).

## Test Strategy

Unit tests for pure functions (`copyFilesToProject`, path utilities). No Clack/TTY integration tests in CI today; mock the file system for file operations. **Runner:** Bun (`bun test`, `bun test src/__tests__/copy.test.ts`, `bun test --watch`).

## Integration with Skills

- **executing-plans:** After each batch of tasks, run `bun run verify` and show output.
- **finishing-a-development-branch:** Before merge/PR options, run `bun run verify` and `bun run build`; proceed only on exit code 0.
- **verification-before-completion:** Before any completion claim, run `bun run verify` and confirm typecheck, lint, and test all passed.

## Pre-commit Hook

On `git commit`, lint-staged runs `eslint --fix` and `tsc --noEmit` on staged `.ts` files. This catches many issues early; if the hook fails, fix before committing.

## VSCode Integration

The TypeScript language server reports errors in the **Problems** tab; those are the same class of issues that fail `bun run typecheck`. Do not ignore Problems tab errors before claiming verification passed.
