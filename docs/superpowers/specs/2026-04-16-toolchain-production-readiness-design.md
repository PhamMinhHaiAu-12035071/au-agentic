**Status:** Draft
**Author:** Au Pham (with Claude assistance)
**Created:** 2026-04-16
**Type:** Design specification
**Related:** docs/ai/coding-rules.md, docs/ai/testing-policy.md, docs/ai/repo-map.md, AGENTS.md

---

# Toolchain Production-Readiness Design

## 1. Goal & Scope

Bring the au-agentic Bun monorepo (2 packages: `cli`, `templates`) to a production-ready, scalable, team-friendly state with sub-second feedback loops for TDD.

### In scope

- Lint and format consolidation
- Task graph with input/output cache
- Test coverage with LCOV reporting and per-file threshold
- Git hooks runner with parallel execution
- Pre-commit secret scanning
- Dead-code and unused-export detection
- Markdown documentation linting
- Path aliases safe for npm publishing
- Base TypeScript configuration shared across packages
- EditorConfig for editor consistency
- CI workflow files written but not auto-triggered
- Performance benchmark script and acceptance gates
- Removal of superseded tools (ESLint, Prettier-related, Husky, lint-staged)
- Synchronization of all `docs/` and `docs/ai/` content with the new toolchain

### Out of scope

- CSpell, publint, ls-lint, Nx, TypeScript project references, Oxlint hybrid
- Automatic CI execution (workflows remain manual-trigger only)
- Remote Turbo cache (deferred until CI auto-trigger is enabled)

Out-of-scope items are revisited only if the repo grows past five packages, typecheck exceeds five seconds, the contributor count exceeds three, or publishing introduces consumer-side breakage.

## 2. Tooling Stack: Current and Target

| Aspect | Current | Target |
|---|---|---|
| Format | none | Biome v2 |
| Lint | ESLint v9 + typescript-eslint | Biome v2 (lint, organize-imports, filename rule) |
| Task graph and cache | none | Turborepo + Bun lockfile cache |
| Coverage | none | `bun test --coverage --coverage-reporter=lcov` with per-file 70 percent threshold |
| Hooks runner | Husky | Lefthook (parallel, single binary) |
| Pre-commit lint | lint-staged | Lefthook `glob` and `staged_files` |
| Secret scan | none | gitleaks (pre-commit and CI) |
| Dead code | none | Knip (pre-push and CI) |
| Docs lint | none | markdownlint-cli2 (CI and opt-in pre-commit) |
| Commit message | commitlint | commitlint with tightened scope-enum and body-max-line-length |
| Path alias | none | `imports` field (`#utils/*`, `#steps/*`) and `workspace:*` cross-package |
| Base tsconfig | root and per-package only | `tsconfig.base.json` with per-package extends, paths mirror imports field |
| EditorConfig | none | `.editorconfig` (UTF-8, LF, indent 2 space) |
| CI | docs-check.yml, security.yml, ci.yml, release.yml (auto) | All five (existing four plus new verify.yml) set to `workflow_dispatch` only |
| Benchmark | none | `scripts/benchmark.ts` using Bun `performance.now()`; output to `docs/development/performance-benchmarks.md` |

## 3. Architecture and Components

### 3.1 Biome v2 (lint plus format plus organize-imports plus filename)

Single binary, single config (`biome.json`), replaces ESLint, Prettier, eslint-config-prettier, eslint-plugin-import, eslint-import-resolver-typescript, and any prospective filename plugin.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true, "ignore": ["**/dist/**", "**/.turbo/**", "**/coverage/**"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useFilenamingConvention": { "level": "error", "options": { "filenameCases": ["kebab-case"] } }
      },
      "suspicious": {
        "noFocusedTests": "error",
        "noEmptyBlockStatements": "error"
      },
      "correctness": {
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "off"
      }
    }
  },
  "organizeImports": { "enabled": true }
}
```

Scripts:
- `bun run format`: `biome format --write .`
- `bun run lint`: `biome lint .`
- `bun run check`: `biome check --write .` (lint plus format plus organize-imports in one pass)

### 3.2 Turborepo (task graph and cache)

`turbo.json` declares inputs, outputs, and dependency edges so Turbo can hash inputs and skip work when nothing changed.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [".tsbuildinfo"] },
    "test":      { "dependsOn": ["^build"], "outputs": ["coverage/**"], "env": ["CI"] },
    "lint":      { "outputs": [] },
    "format":    { "cache": false },
    "dev":       { "cache": false, "persistent": true }
  }
}
```

Top-level `package.json` scripts route through Turbo:
- `bun run test`: `turbo run test`
- `bun run typecheck`: `turbo run typecheck`
- `bun run lint`: `turbo run lint`
- `bun run build`: `turbo run build`
- `bun run verify`: `turbo run lint typecheck test`

Cache directory: `.turbo/` (gitignored). Cache mode: local only for now; remote cache deferred until CI auto-trigger is enabled.

### 3.3 Bun test with coverage

`bunfig.toml` at repo root:

```toml
[test]
coverage = true
coverageReporter = ["text", "lcov"]
coverageDir = "coverage"
coverageThreshold = { lines = 0.70, functions = 0.70, statements = 0.70 }
```

LCOV output at `coverage/lcov.info` per package. Bun enforces threshold per file, not aggregate; the value 0.70 was chosen because the user prioritizes test quality over coverage volume and wants a realistic floor that does not pressure contributors into hollow tests.

### 3.4 Lefthook (parallel git hooks)

Single Go binary, declared in `lefthook.yml`. Replaces Husky and lint-staged.

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,json,md}"
      run: bunx biome check --write {staged_files} --no-errors-on-unmatched
      stage_fixed: true
    typecheck:
      glob: "*.ts"
      run: bun run typecheck
    gitleaks:
      run: gitleaks protect --staged --redact --no-banner
    knip:
      run: bunx knip --no-progress --no-exit-code

commit-msg:
  commands:
    commitlint:
      run: bunx --bun commitlint --edit {1}

pre-push:
  commands:
    knip-strict:
      run: bunx knip
```

Installation: `bun add -D lefthook && bunx lefthook install`. Documented in `docs/getting-started/local-setup.md`.

### 3.5 gitleaks (secret scanning)

System binary (install via Homebrew, scoop, apt, or downloaded release). Configured by `.gitleaks.toml` extending the default ruleset, with an allowlist for `packages/templates/**` because template Markdown contains intentional placeholder tokens.

```toml
[extend]
useDefault = true

[[allowlists]]
description = "Templates contain placeholder tokens, not real secrets"
paths = ['''packages/templates/.*''']
```

Pre-commit invocation: `gitleaks protect --staged --redact --no-banner`. CI invocation: `gitleaks detect --redact --no-banner`.

### 3.6 Knip (dead code and unused dependencies)

`knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    "packages/cli": {
      "entry": ["src/index.ts", "src/__tests__/**/*.test.ts"],
      "project": ["src/**/*.ts"]
    }
  },
  "ignoreWorkspaces": ["packages/templates"],
  "ignoreBinaries": ["bun", "lefthook", "gitleaks", "biome", "turbo"]
}
```

Pre-commit runs Knip in non-blocking mode (`--no-exit-code`); pre-push runs strict mode that fails on unused exports or dependencies.

### 3.7 markdownlint-cli2 (docs hygiene)

`.markdownlint-cli2.jsonc`:

```jsonc
{
  "config": {
    "default": true,
    "MD013": false,
    "MD024": { "siblings_only": true },
    "MD033": false,
    "MD041": false
  },
  "globs": ["**/*.md"],
  "ignores": ["**/node_modules/**", "**/dist/**", "packages/templates/**"]
}
```

Templates excluded because they are content payloads, not documentation. Run via `bunx markdownlint-cli2`.

### 3.8 commitlint (tightened)

Existing `commitlint.config.ts` extended:

```ts
import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['cli', 'templates', 'docs', 'ci', 'deps', 'tooling', 'tests']],
    'body-max-line-length': [2, 'always', 100],
    'subject-max-length': [2, 'always', 72]
  }
};

export default config;
```

### 3.9 Path aliases (Node-safe)

In `packages/cli/package.json`:

```json
{
  "imports": {
    "#utils/*": "./src/utils/*.ts",
    "#steps/*": "./src/steps/*.ts"
  },
  "dependencies": {
    "@au-agentic/templates": "workspace:*"
  }
}
```

Source code:

```ts
import { writeFile } from '#utils/files';
import { copyStep } from '#steps/copy';
```

Mirrored in `packages/cli/tsconfig.json` for editor and typecheck:

```json
{
  "compilerOptions": {
    "paths": {
      "#utils/*": ["./src/utils/*"],
      "#steps/*": ["./src/steps/*"]
    }
  }
}
```

The `imports` field is the runtime source of truth; `tsconfig.paths` exists only so the language server resolves the same identifiers. This pattern survives npm publishing because Node and Bun both honor the package.json `imports` field natively.

### 3.10 Base tsconfig

The existing `tsconfig.json` at repo root remains the base file (no rename); each package's `tsconfig.json` extends `../../tsconfig.json`. Bun and Biome both look for `tsconfig.json` by default, so keeping the canonical filename avoids discovery edge cases. Final base content:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "incremental": true,
    "types": ["bun"]
  }
}
```

Each package has its own `tsconfig.json` extending the base and adding `outDir`, `rootDir`, `paths`, and `include`.

### 3.11 EditorConfig

`.editorconfig` at repo root:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### 3.12 CI workflows (manual trigger only)

All five workflow files (`ci.yml`, `docs-check.yml`, `release.yml`, `security.yml`, `verify.yml`) use:

```yaml
on:
  workflow_dispatch:
```

No `push`, `pull_request`, or `schedule` triggers. Workflows are present, version-controlled, and editable, but commit, push, and merge actions never start a run. Activation is documented in `docs/deployment/runbooks.md` as a deliberate manual step.

`verify.yml` (new) is the canonical full-pipeline workflow; the others are kept as previously written but degraded to manual.

### 3.13 Benchmark script (no external tool)

`scripts/benchmark.ts`, run via `bun run perf`. Uses Bun's built-in `performance.now()` and `Bun.spawn`; no Homebrew dependency, no Node, no hyperfine.

```ts
#!/usr/bin/env bun
interface Bench {
  name: string;
  cmd: string[];
  targetMs: number;
  ceilingMs: number;
  warmupRuns?: number;
  measureRuns?: number;
}

const benches: Bench[] = [
  { name: 'biome format',                cmd: ['bunx','biome','format','--write','.'],                  targetMs: 200,   ceilingMs: 500 },
  { name: 'biome lint',                  cmd: ['bunx','biome','lint','.'],                              targetMs: 200,   ceilingMs: 500 },
  { name: 'biome check (full)',          cmd: ['bunx','biome','check','.'],                             targetMs: 300,   ceilingMs: 800 },
  { name: 'gitleaks staged',             cmd: ['gitleaks','protect','--staged','--redact','--no-banner'], targetMs: 500,   ceilingMs: 1500 },
  { name: 'bun test (single file)',      cmd: ['bun','test','packages/cli/src/__tests__/copy.test.ts'], targetMs: 300,   ceilingMs: 1000 },
  { name: 'bun test (full)',             cmd: ['bun','test'],                                           targetMs: 1000,  ceilingMs: 3000 },
  { name: 'bun typecheck (warm)',        cmd: ['bun','run','typecheck'],                                targetMs: 1000,  ceilingMs: 3000 },
  { name: 'turbo test (cache hit)',      cmd: ['bunx','turbo','run','test'],                            targetMs: 300,   ceilingMs: 1000 },
  { name: 'turbo verify (cache hit)',    cmd: ['bunx','turbo','run','lint','typecheck','test'],         targetMs: 1000,  ceilingMs: 3000 },
  { name: 'turbo verify (cold)',         cmd: ['bunx','turbo','run','lint','typecheck','test','--force'], targetMs: 10000, ceilingMs: 30000 },
  { name: 'knip',                        cmd: ['bunx','knip'],                                          targetMs: 3000,  ceilingMs: 8000 },
  { name: 'markdownlint',                cmd: ['bunx','markdownlint-cli2'],                             targetMs: 2000,  ceilingMs: 5000 }
];

async function runOnce(cmd: string[]): Promise<number> {
  const t0 = performance.now();
  const proc = Bun.spawn(cmd, { stdout: 'ignore', stderr: 'ignore' });
  await proc.exited;
  return performance.now() - t0;
}

const median = (xs: number[]) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const rows: string[] = [];
rows.push('| Status | Command | Median (ms) | Target (ms) | Ceiling (ms) |');
rows.push('|---|---|---:|---:|---:|');

let anyFail = false;
for (const b of benches) {
  for (let i = 0; i < (b.warmupRuns ?? 2); i++) await runOnce(b.cmd);
  const samples: number[] = [];
  for (let i = 0; i < (b.measureRuns ?? 5); i++) samples.push(await runOnce(b.cmd));
  const m = median(samples);
  const status = m <= b.targetMs ? 'PASS' : m <= b.ceilingMs ? 'WARN' : 'FAIL';
  if (status === 'FAIL') anyFail = true;
  rows.push(`| ${status} | \`${b.name}\` | ${m.toFixed(0)} | ${b.targetMs} | ${b.ceilingMs} |`);
}

const report = `# Performance Benchmarks\n\nGenerated by \`bun run perf\` on ${new Date().toISOString()}.\n\n${rows.join('\n')}\n`;
await Bun.write('docs/development/performance-benchmarks.md', report);
console.log(report);
if (anyFail) process.exit(1);
```

`package.json` adds: `"perf": "bun scripts/benchmark.ts"`.

## 4. Dev Workflow

```
edit file
  -> VSCode auto-format on save (Biome extension)
  -> git add
  -> git commit
       -> Lefthook pre-commit (parallel):
            biome check --write {staged}, typecheck, gitleaks, knip non-blocking
       -> Lefthook commit-msg: commitlint
  -> git push
       -> Lefthook pre-push: knip strict
  -> CI runs only when manually dispatched via GitHub UI or `gh workflow run verify.yml`
```

## 5. File Layout: Added, Changed, Removed

### Added

- `biome.json`
- `turbo.json`
- `bunfig.toml`
- `lefthook.yml`
- `.gitleaks.toml`
- `knip.json`
- `.markdownlint-cli2.jsonc`
- `.editorconfig`
- `scripts/benchmark.ts`
- `.github/workflows/verify.yml`
- `docs/development/performance-benchmarks.md` (auto-generated)
- `docs/adr/0002-biome-over-eslint-prettier.md`
- `docs/adr/0003-turborepo-task-cache.md`
- `docs/adr/0004-lefthook-over-husky.md`
- `docs/adr/0005-imports-field-alias-pattern.md`
- `docs/adr/0006-workflows-disabled-by-default.md`

### Changed

- `package.json` (root): scripts overhaul, devDependencies swap, add `imports` and `lefthook` install hint
- `packages/cli/package.json`: add `imports` field, simplify scripts
- `packages/templates/package.json`: align scripts
- `tsconfig.json` (root): expanded with `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `incremental`; remains the base extended by per-package configs
- `packages/cli/tsconfig.json`: extend root base, add `paths` mirror, set `outDir`, `rootDir`, `include`
- `packages/templates/tsconfig.json` (new): extend root base; thin file so Biome and IDE see consistent settings
- `commitlint.config.ts`: scope-enum, body-max-line-length, subject-max-length
- `.gitignore`: add `.turbo/`, `coverage/`, `*.tsbuildinfo`, `lcov.info`
- `.github/workflows/ci.yml`, `docs-check.yml`, `release.yml`, `security.yml`: change `on:` to `workflow_dispatch:` only
- `docs/ai/coding-rules.md`, `testing-policy.md`, `repo-map.md`, `routing.md`, `security-policy.md`, `deployment-policy.md`, `execution-policy.md`, `docs-policy.md`, `core.md`, `glossary.md`, `legacy-context.md`, `gold-rules.md`: see Section 8 for per-file diffs
- `docs/development/testing.md`, `styleguide.md`, `workflow.md`, `dependency-policy.md`, `branching-and-prs.md`, `docs-contributing.md`, `debugging.md`: align with new tools
- `docs/reference/techstack.md`, `configuration.md`, `project-structure.md`, `glossary.md`: update tool listing and config purpose
- `docs/explanations/architecture.md`, `tradeoffs.md`, `design-principles.md`: add toolchain layer and speed budgets
- `docs/getting-started/local-setup.md`, `quickstart.md`, `environment.md`, `onboarding.md`: install steps for gitleaks and lefthook
- `docs/deployment/deployment.md`, `runbooks.md`: manual workflow trigger procedure
- `README.md`: update Quick Start commands
- `CONTRIBUTING.md`: setup section refresh

### Removed

- `.husky/` directory (entire)
- `eslint.config.ts`
- From devDependencies: `eslint`, `@eslint/js`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `globals`, `husky`, `lint-staged`
- `prepare` script from root `package.json` (Husky bootstrap)

## 6. Test Quality Guardrails

The user prefers high-quality tests over high coverage percentages and is wary of AI-generated tests with hollow or tautological assertions. The toolchain encodes this preference:

- Biome rule `noFocusedTests` (error): catches `.only` left in code.
- Biome rule `noEmptyBlockStatements` (error): catches `it('does X', () => {})` shells with no body.
- Biome rule `noUnusedImports` (error): catches imports kept around without use, often a sign of abandoned test setup.
- Bun coverage threshold at 70 percent per file: a low floor that does not pressure contributors into padding.
- `docs/ai/testing-policy.md` gains a "Test Quality Anti-Patterns" subsection enumerating: tautological assertions (`expect(true).toBe(true)`), pass-through tests with no behavior verification, snapshot-only tests for non-snapshot data, no-mock no-IO tests that exercise nothing, oversized test bodies that combine setup and assertion without clear separation.
- `.github/PULL_REQUEST_TEMPLATE.md` adds a checkbox: "Each new test asserts a behavior contract, not just smoke."

## 7. Performance Success Criteria

Acceptance gate before declaring this spec implemented: `bun run perf` reports zero `FAIL` rows and at most two `WARN` rows. Tier definitions:

| Tier | Median time band | Examples |
|---|---|---|
| T1 instant | under 200 ms | biome format, biome lint, biome check on staged subset |
| T1 sub-second | under 500 ms | gitleaks staged scan |
| T2 snappy | under 1 s | bun test full, bun typecheck warm, turbo run cache hit |
| T3 workflow | under 2 to 3 s | lefthook pre-commit total, knip, markdownlint, typecheck cold |
| T4 full pipeline | under 10 s cold, under 1 s cached | turbo run lint typecheck test |

Time budgets derive from human perception research and observed industry practice for pre-commit hook acceptance thresholds. The benchmark script writes `docs/development/performance-benchmarks.md` so any drift over time is visible in version control.

## 8. Documentation Synchronization Mapping

This is a code-change-with-docs-update task as defined by `AGENTS.md`. Each implementation phase carries its docs updates in the same commit; no follow-up issues.

### docs/ai/

| File | Change |
|---|---|
| `coding-rules.md` | Replace "ESLint v9" lint stack with Biome v2; update import patterns to include `#utils/*` and `workspace:*`; remove `tsc --noEmit` references in import section |
| `testing-policy.md` | Verify command remains `bun run verify` but routes through Turbo internally; add coverage section (LCOV path, per-file 70 percent threshold, `bun run perf` gate); add Test Quality Anti-Patterns subsection |
| `repo-map.md` | Configuration block adds biome.json, turbo.json, lefthook.yml, bunfig.toml, knip.json, .markdownlint-cli2.jsonc, .gitleaks.toml, .editorconfig, scripts/benchmark.ts; note root tsconfig.json expanded; update Test Coverage section |
| `routing.md` | Add row: "Performance or tooling task -> coding-rules.md and performance-benchmarks.md" |
| `security-policy.md` | Add gitleaks pre-commit and CI section |
| `deployment-policy.md` | Note: all workflows are workflow_dispatch only; describe manual activation |
| `execution-policy.md` | Update verify command description; add `bun run perf` benchmark gate |
| `docs-policy.md` | Add mapping: tool config change -> ai/coding-rules.md plus reference/techstack.md plus reference/configuration.md plus adr/ |
| `core.md`, `glossary.md`, `legacy-context.md`, `gold-rules.md` | Sweep for ESLint, Husky, lint-staged mentions; replace or remove |

### docs/development/

| File | Change |
|---|---|
| `testing.md` | `bun test --coverage`, watch mode, threshold, anti-patterns |
| `styleguide.md` | Biome rules replace ESLint config |
| `workflow.md` | Lefthook hooks, commit flow, perf gate |
| `dependency-policy.md` | New devDeps list, `bun add` commands |
| `branching-and-prs.md` | Note CI workflows manual-only |
| `docs-contributing.md` | markdownlint rules |
| `debugging.md` | Turbo cache reset (`rm -rf .turbo`), Biome troubleshooting |
| `performance-benchmarks.md` (new) | Auto-generated by `scripts/benchmark.ts`; records baseline, re-run instructions, tier definitions |

### docs/reference/

| File | Change |
|---|---|
| `techstack.md` | Add Biome, Turborepo, Lefthook, gitleaks, Knip, markdownlint-cli2 |
| `configuration.md` | Document every config file and its key fields |
| `project-structure.md` | New files in tree |
| `glossary.md` | Define LCOV, cache hit, T1 through T4 tiers |

### docs/adr/

Five new ADRs, one per major reversible decision:

- `0002-biome-over-eslint-prettier.md`
- `0003-turborepo-task-cache.md`
- `0004-lefthook-over-husky.md`
- `0005-imports-field-alias-pattern.md`
- `0006-workflows-disabled-by-default.md`

### docs/explanations/

| File | Change |
|---|---|
| `architecture.md` | Toolchain layer diagram |
| `tradeoffs.md` | Biome versus ESLint section, per-file coverage trap, Turbo first-run cost |
| `design-principles.md` | Speed budgets (T1 to T4) |

### docs/getting-started/

| File | Change |
|---|---|
| `local-setup.md` | Install gitleaks (brew, scoop, apt), `bunx lefthook install` |
| `quickstart.md` | `bun install && bunx lefthook install && bun run perf` |
| `environment.md` | Bun 1.3.10, no Node required, gitleaks system dependency |
| `onboarding.md` | Point to performance-benchmarks.md |

### docs/deployment/

| File | Change |
|---|---|
| `deployment.md` | Note manual workflow trigger only |
| `runbooks.md` | Add runbook "Activate CI workflows" and "Re-run benchmark" |

### docs/governance/, docs/support/, docs/examples/

Sweep for ESLint, Husky, Prettier mentions; otherwise leave untouched.

### Root files

| File | Change |
|---|---|
| `README.md` | Quick Start commands updated |
| `CONTRIBUTING.md` | Setup section: install gitleaks, lefthook |
| `AGENTS.md`, `CLAUDE.md` | Verify Non-Negotiables remain aligned (verify command name unchanged) |
| `package.json` | Scripts overhaul (see Section 5) |
| `.gitignore` | Add `.turbo/`, `coverage/`, `*.tsbuildinfo`, `lcov.info` |

## 9. Implementation Phases

The plan-writing skill consumes these phase boundaries directly. Each phase is independently mergeable and ships its docs updates in the same commit.

1. **Phase 1: Foundations.** EditorConfig, expand root `tsconfig.json` and add per-package extends, `imports` field path aliases, `bunfig.toml` coverage. Docs: coding-rules.md, repo-map.md, reference/configuration.md, reference/techstack.md, ADR-0005.
2. **Phase 2: Lint and format swap.** Add Biome, remove ESLint and related deps, update scripts, run `biome check --write .` over the repo. Docs: coding-rules.md, styleguide.md, dependency-policy.md, ADR-0002.
3. **Phase 3: Hooks and secrets.** Migrate Husky to Lefthook, add gitleaks (system install plus config), tighten commitlint. Docs: workflow.md, security-policy.md, local-setup.md, environment.md, ADR-0004.
4. **Phase 4: Cache and quality.** Turborepo, Knip, markdownlint-cli2, coverage threshold enforcement, scripts/benchmark.ts and `bun run perf`. Docs: testing-policy.md, performance-benchmarks.md, debugging.md, design-principles.md, tradeoffs.md, ADR-0003.
5. **Phase 5: CI workflow files (disabled).** Write `verify.yml`; downgrade `ci.yml`, `docs-check.yml`, `release.yml`, `security.yml` to `workflow_dispatch` only. Docs: deployment.md, runbooks.md, branching-and-prs.md, deployment-policy.md, ADR-0006.
6. **Phase 6: Docs sweep and finalization.** Resolve any remaining mentions of legacy tools across all docs; update README.md and CONTRIBUTING.md; verify `bun run perf` passes the acceptance gate; update PR template with test-quality checkbox.

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Biome lacks deep type-aware rules (for example, `no-floating-promises` parity with typescript-eslint) | Enable Biome's equivalent (`noFloatingPromises` available in v2). Revisit ESLint hybrid only if a needed rule is missing for six months. |
| Bun issue 12262 (nested tsconfig not picked up locally) | The `imports` field is the runtime source of truth; `tsconfig.paths` is editor-only. Design avoids this trap. |
| Per-file coverage threshold fails the build because of one tiny utility under 70 percent | Threshold deliberately conservative (0.70). For files under 5 LOC, add an exclude pattern in `bunfig.toml`. |
| Turbo first run misses cache and CI is slower than expected | Documented in `docs/development/debugging.md`; first-run is around 60 seconds, subsequent runs 0 to 1 second. Remote cache deferred until needed. |
| gitleaks false positives in template files containing example tokens | `.gitleaks.toml` allowlist covers `packages/templates/**`. |
| Big-bang migration breaks `verify` mid-way | Phased implementation in Section 9 keeps each step independently mergeable; rollback is `git revert` of the phase commit. |
| Disabling all CI removes the safety net for unrelated repository hygiene | `bun run verify` and `bun run perf` remain mandatory locally; pre-commit hooks block obvious failures; manual workflow trigger remains available. |
| Bun's `performance.now()` benchmark may be noisy on a busy machine | Script runs two warmups plus five measurements and reports the median, smoothing transient noise. |

## 11. Open Questions

None at the time of writing. All major decisions were resolved during the brainstorming session via four rounds of multiple-choice questions on stack, orchestration, coverage, secret-scan, alias style, hooks runner, extras, CI scope, workflow trigger mode, and benchmark tool.

## 12. Acceptance Checklist

Spec is implemented when:

- [ ] All ten new config files in Section 5 "Added" exist and pass their own validators
- [ ] All listed devDependencies in Section 5 "Removed" are absent from `bun.lock`
- [ ] `bun run verify` exits 0
- [ ] `bun run perf` exits 0 with zero FAIL rows and at most two WARN rows
- [ ] Every file enumerated in Section 8 has been edited and committed
- [ ] All five workflow files use `on: workflow_dispatch` only; `gh workflow list` shows them
- [ ] `bun test --coverage` produces `coverage/lcov.info` for each package
- [ ] Pre-commit on a sample staged change runs all four hook commands in parallel and reports per-command timing
- [ ] All five new ADRs are committed to `docs/adr/`
- [ ] `README.md` Quick Start uses the new commands and works on a fresh clone
