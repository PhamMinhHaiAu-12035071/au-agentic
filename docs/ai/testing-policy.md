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
| `bun run lint` | Check code style only | Exit code 0, no Biome errors |
| `bun run test` | Run tests only | All tests pass |
| `bun run verify` | **Full verification** (prefer this) | All three commands pass |
| `bun run build` | After verify passes | Dist files created successfully |

## Red Flags

- Claiming "tests pass" without running `verify`
- Ignoring VSCode Problems tab errors
- Merging or opening a PR with `verify` failing
- Assuming "build works" means types are clean (build is lenient versus full verify)
- Treating Biome green as a substitute for `typecheck`

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

On `git commit`, Lefthook runs (in parallel): Biome check + organize imports on staged files, `tsc --noEmit` (typecheck) via Turbo, secretlint secret scan (bunx, project-scope), ls-lint filesystem-naming scan (bunx, project-scope), and Knip unused-export warning. If the hook fails, fix before committing — never bypass with `--no-verify`.

## VSCode Integration

The TypeScript language server reports errors in the **Problems** tab; those are the same class of issues that fail `bun run typecheck`. Do not ignore Problems tab errors before claiming verification passed.

## Coverage policy

Per-file thresholds are enforced at 80% lines, functions, and statements. The baseline is defined in `bunfig.toml` `coverageThreshold`; if the file does not yet reach 80%, the baseline matches its current coverage. New code should reach 80%; if reducing code raises coverage, bump `bunfig.toml` accordingly.

## Test Quality Anti-Patterns

The user prefers high-quality tests over high coverage numbers. Avoid these patterns; reviewers will reject them:

- **Tautological assertions** — `expect(true).toBe(true)` or `expect(x).toBe(x)`. The test asserts nothing.
- **Pass-through tests** — `it('calls the function', () => { fn() })` with no assertion on behavior.
- **No-IO no-mock tests** — exercises a function that has no observable effect because the test stubbed nothing and read nothing.
- **Snapshot for non-snapshot data** — snapshotting a JSON object that should have explicit field-by-field assertions.
- **Mixed setup and assertion bodies** — a single `it` block with 50+ lines doing arrange, act, and 10 separate asserts. Split into focused tests.
- **Empty test bodies** — `it('handles X', () => {})`. Biome `noEmptyBlockStatements` blocks this at lint time; reviewers should reject any `// @biome-disable-next-line` exemption without a written reason in the PR.

When LLM-assisted code generates tests, the human reviewer is responsible for verifying each test asserts a real behavior contract. Coverage percentage is not a substitute for this judgment.

## Focused-Test Tiers

When a feature involves N-way multiplication (e.g. N skills × M tools = K files), do NOT write K separate assertion tests. Use 4 focused tiers:

1. **Manifest snapshot** — catches "new file added but not registered". One test asserts shape (counts, keys, minimum content markers).
2. **Golden file** — catches content drift through transforms. 1–2 representative samples per tool, not all K.
3. **Integration** — catches path-mapping / wiring bugs. End-to-end scaffold into a tmp dir, assert path tree.
4. **Contract** — catches regressions on user-facing contracts (e.g., manual-trigger-only, scope restriction, ambiguity delegation). Grep-level assertions over template content.

Rationale: each test targets one specific bug class. No "coverage for coverage's sake".

Example implementation: `javascript-patterns` skill uses all 4 tiers — see `packages/cli/src/__tests__/{template-manifest,scaffold-golden,copy,skill-contract}.test.ts`.

## Performance gate

`bun run perf` runs `scripts/benchmark.ts` and writes `docs/development/performance-benchmarks.md`. Spec acceptance requires zero FAIL rows and at most two WARN rows.
