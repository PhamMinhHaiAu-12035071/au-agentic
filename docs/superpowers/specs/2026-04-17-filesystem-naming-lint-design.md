# Filesystem Naming Lint — Design Spec

**Status:** Approved — ready for implementation plan
**Date:** 2026-04-17
**Authors:** Au Pham
**Scope:** Enforce directory and filename conventions across the whole repo, complementing Biome's TS/JS/JSON-only `useFilenamingConvention`.
**Target tag after implementation:** `toolchain-v2`

---

## 1. Context

Biome's `useFilenamingConvention` already enforces kebab-case on files it lints (TypeScript, JavaScript, JSON, JSONC). It does NOT cover:

- **Directory / folder names** anywhere in the repo
- **Markdown / YAML / TOML / shell filenames** (Biome does not lint these file types)
- **Per-directory name patterns** such as `docs/adr/<NNNN>-<slug>.md` or `*.test.ts` for test files

Today the repo conforms to kebab-case by convention but nothing prevents drift. An AI agent or new contributor could introduce `PackageCase/` folder, `MyDoc.md`, or `packages/cli/src/__tests__/CopyTests.ts` with no enforcement.

The project-scope dependency rule (ADR-0007, `docs/ai/dependency-scope-policy.md`) requires every new tool to install via `bun add -D` — no brew, no global packages. Any chosen tool must honor this.

## 2. Decision summary

- Adopt **`@ls-lint/ls-lint@^2`** as the filesystem linter.
- Config in **`.ls-lint.yml`** at repo root.
- Invoke via `bunx ls-lint` in Lefthook pre-commit and as a root `lint:fs` script.
- Add one bench row to `scripts/benchmark.ts` to gate regressions (T1 tier; Go binary is fast).
- Wire contract tests so missing or regressed config shape fails CI.
- Document with ADR-0008 and a docs sweep mirroring the secretlint migration pattern.

### Why `@ls-lint/ls-lint`

It is an **official npm package** published by the upstream author (`loeffel-io`), 0 dependencies, MIT, 35 published versions since 2020, latest `2.3.1` (2025-06-04). The package downloads the platform-specific Go binary to `node_modules` via postinstall — identical pattern to `@biomejs/biome`, `turbo`, and `lefthook`, all of which we already trust. This satisfies the project-scope rule verbatim.

### Alternatives considered and rejected

- **Custom Bun TypeScript script** (~200 lines). Rejected: reinvents 5 years of ls-lint work on character-class rules, per-directory overrides, glob matching, and cross-platform path handling. Easy to miss edge cases.
- **Hybrid: keep Biome filename rule + tiny folder-only script**. Rejected: does not give full parity with the user's chosen scope (directory naming + all file types + per-dir patterns).
- **`case-police`**. Rejected: narrower feature set, does not enforce per-directory patterns.
- **No enforcement at all**. Rejected: the user explicitly asked for tradition enforcement; drift is invisible until it accumulates.

## 3. Rule design — `.ls-lint.yml`

### Defaults

Every directory and every file of these types must be `kebab-case`:

```yaml
ls:
  .dir: kebab-case
  .ts: kebab-case
  .md: kebab-case
  .yml: kebab-case
  .yaml: kebab-case
  .json: kebab-case
  .jsonc: kebab-case
  .toml: kebab-case
  .sh: kebab-case
```

### Per-directory patterns (tradition enforcement)

Two targeted rules, both expressed as regex so they capture the full convention including digits and required suffixes:

```yaml
  # ADR files must be NNNN-kebab-name.md
  docs/adr:
    .md: regex:^[0-9]{4}-[a-z0-9-]+\.md$

  # Unit test files must end .test.ts
  packages/cli/src/__tests__:
    .ts: regex:^[a-z0-9-]+\.test\.ts$
```

### Exemption for `__tests__` directory

The Jest / bun-test convention uses a double-underscore directory name that is not valid kebab-case. Override the default via a regex that accepts either `__tests__` or a kebab-case sibling:

```yaml
  packages/cli/src:
    .dir: regex:^(__tests__|[a-z0-9-]+)$
```

### Ignore list

Three categories, each justified by precedent:

```yaml
ignore:
  # Community-convention root files (UPPERCASE for discoverability)
  - README.md
  - AGENTS.md
  - CLAUDE.md
  - CONTRIBUTING.md
  - LICENSE
  - SECURITY.md
  - SUPPORT.md
  - CITATION.cff
  - CHANGELOG.md

  # Build / cache / lockfile artifacts
  - node_modules
  - dist
  - coverage
  - .cache
  - .turbo
  - .worktrees
  - bun.lock

  # Templates: user-facing, may follow external conventions (e.g. SKILL.md)
  - packages/templates

  # External-tool directories dictated by upstream
  - .github
  - .vscode
  - .claude
```

Notes on choices:

- **Root UPPERCASE**: established open-source convention (GitHub surfaces these in the repo UI). Listed explicitly so the full set is auditable in one place.
- **Template package**: tool-specific file naming (e.g. Claude's `SKILL.md`) is not ours to enforce.
- **External directories**: VSCode settings, GitHub workflows, Claude plugin manifests follow vendor conventions.

## 4. Integration points

| Point | Invocation | Purpose |
|---|---|---|
| Lefthook pre-commit | `bunx ls-lint` (full repo) | Block commit on any violation |
| Root `package.json` script | `"lint:fs": "bunx ls-lint"` | Manual / ad-hoc check |
| `scripts/benchmark.ts` | bench row `ls-lint (full repo)` | Speed regression gate |

Ls-lint has no native staged-only mode. Running on the full tree at pre-commit is acceptable because:

1. Go binary speed: expect < 200 ms on this repo's ~1k files (to be confirmed by the bench row).
2. Violations often come from file renames / new-file additions that touch more than the "staged line range" a git-diff-aware tool would see.
3. Stays well under the T1 budget (500 ms target / 2 s ceiling).

CI is currently `workflow_dispatch`-only. `verify.yml` already runs `bun run verify`; if that script later fans `lint:fs` into Turbo's `lint` task, CI picks it up automatically. In-scope addition to `verify.yml` is explicitly deferred — not required for this design's success.

## 5. Testing strategy

### Contract test (new)

`packages/cli/src/__tests__/ls-lint-config.test.ts` asserts the YAML shape stays truthful to this spec:

- `.ls-lint.yml` exists at repo root
- `ls` and `ignore` top-level keys present
- Default `.dir: kebab-case` and at minimum `.ts`, `.md` rules present
- `docs/adr` per-directory rule matches the NNNN regex
- Ignore list includes `node_modules`, `packages/templates`, `README.md`

### Regression test (expanded)

`packages/cli/src/__tests__/lefthook-config.test.ts` already asserts the secret scanner is project-scope. Add a symmetric assertion for the filesystem linter:

```ts
it("filesystem name linter is project-scope (bunx)", () => {
  const cmd = config["pre-commit"]?.commands?.["ls-lint"]?.run ?? "";
  expect(cmd).toContain("bunx");
  expect(cmd).not.toMatch(/^ls-lint /);  // raw system binary
});
```

Also extend the existing "declares biome, typecheck, secretlint, knip in pre-commit" test to also expect `ls-lint` in the command list.

### Manual dry run

Before wiring Lefthook, run `bunx ls-lint` once locally. Expected: zero violations since the repo already conforms. If there are findings, triage: either rename the offending file OR expand the ignore list with a one-line reason in the PR description.

## 6. Benchmark gate

Add one row to `scripts/benchmark.ts`:

```ts
{
  name: "ls-lint (full repo)",
  cmd: ["bunx", "ls-lint"],
  targetMs: 500,
  ceilingMs: 2000,
}
```

Placed alongside the other `bunx` hook-adjacent rows. The next `bun run perf` after implementation writes the baseline into `docs/development/performance-benchmarks.md`.

Tier: **T1 sub-second** if < 500 ms (expected for Go binary on ~1k files), otherwise T2/T3. The bench row ceiling (2 s) is generous; a consistent WARN (500 ms – 2 s) is fine, a FAIL (> 2 s) investigates.

## 7. Documentation updates (ride-along)

Every doc that enumerates the pre-commit pipeline or the toolchain must gain a line for ls-lint. Same pattern the secretlint migration followed.

| File | Change |
|---|---|
| `docs/ai/repo-map.md` | Add `.ls-lint.yml` under "Configuration" |
| `docs/ai/testing-policy.md` | Pre-commit list now: Biome, tsc, secretlint, ls-lint, Knip |
| `docs/development/workflow.md` | Same list update |
| `docs/development/testing.md` | Same list update |
| `docs/development/debugging.md` | New "ls-lint blocking a legitimate name" subsection |
| `docs/development/dependency-policy.md` | Add `@ls-lint/ls-lint` to pinned-versions table |
| `docs/development/performance-benchmarks.md` | Auto-regenerated on next `bun run perf` |
| `docs/explanations/architecture.md` | Pipeline description line update |
| `docs/getting-started/local-setup.md` | "installs through bun install" list |
| `docs/getting-started/environment.md` | Same list update |
| `docs/reference/techstack.md` | New row: File/Folder Linter — ls-lint 2.x |
| `docs/reference/project-structure.md` | Mention `.ls-lint.yml` alongside `.secretlintrc.json` etc. |

## 8. ADR-0008

**File:** `docs/adr/0008-ls-lint-for-filesystem-naming.md`

**Summary:**
- Status: Accepted
- Context: Biome gap described in §1
- Decision: adopt `@ls-lint/ls-lint@^2` via `bun add -D`
- Consequences (positive): full parity — directories + all file types + per-directory patterns; honors ADR-0007 project-scope rule verbatim; zero custom code
- Consequences (negative): +~19 MB under `node_modules` for the Go binary (precedent: Biome, Turbo, Lefthook); Go toolchain is another postinstall failure surface on exotic platforms (accepted: upstream publishes prebuilt platform binaries)
- Alternatives rejected: custom script, hybrid, `case-police`, no enforcement

## 9. Migration / implementation order

One phase, one PR; keep commits in logical groups matching the secretlint migration style.

1. `bun add -D @ls-lint/ls-lint@^2` (commits: devDep + lockfile)
2. Write `.ls-lint.yml` matching §3
3. **Dry run** `bunx ls-lint`. Triage any findings before moving on. If findings are legitimate drift, fix file/folder names in a separate commit with a clear message. If findings are false positives (not expected given current state), expand the ignore list with justification.
4. Wire `lefthook.yml` pre-commit command
5. Add root `lint:fs` script in `package.json`
6. Write contract test `ls-lint-config.test.ts`
7. Extend `lefthook-config.test.ts` with the ls-lint project-scope assertion and command-list entry
8. Add benchmark row in `scripts/benchmark.ts`
9. `bun run verify` — all tests green
10. `bun run perf` — new row PASS or WARN, zero FAIL
11. Docs sweep (§7) + ADR-0008 (§8)
12. Refresh `docs/development/performance-benchmarks.md` with the new baseline
13. Tag `toolchain-v2`

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Dry run surfaces unexpected violations | Triage per §9 step 3; small rename commits or targeted ignore entries |
| Lefthook pre-commit total time exceeds T3 ceiling (2–3 s) after adding ls-lint | Benchmark row gates this. If it happens, investigate first; do NOT relax ceilings to make tests pass |
| ls-lint postinstall fails on an exotic platform | Same risk as Biome/Turbo/Lefthook — low frequency; unblock by matching their established troubleshooting guides |
| Per-directory regex for ADR blocks a legitimate new ADR (e.g. with a sub-letter suffix) | Update the regex in a small PR; prefer fixing the config over bypassing the check |
| Config drift silently accepted because no one runs `lint:fs` manually | Lefthook pre-commit + the contract test together catch both runtime drift and config-shape drift |

## 11. Acceptance gate

A successful landing of this spec means every assertion below passes cleanly:

- `.ls-lint.yml` present at repo root, matches §3
- `bunx ls-lint` exits 0 on the current tree
- `bun run verify` exits 0 (includes the new contract test + updated lefthook test)
- `bun run perf` shows the new row at PASS or WARN, zero FAIL
- Lefthook pre-commit runs ls-lint in parallel alongside biome/typecheck/secretlint/knip
- ADR-0008 present and cross-linked from `docs/adr/` index (if present), `dependency-scope-policy.md` "References", and `dependency-policy.md` pinned list
- All 12 doc files in §7 updated
- Tag `toolchain-v2` exists on the branch

## 12. Out of scope

- Enforcing file naming inside `packages/templates/` (tool-defined)
- Enforcing file naming inside `.github/`, `.vscode/`, `.claude/` (vendor-defined)
- Markdown link checking, YAML schema linting, etc. — separate tools if ever needed
- Automatic renaming of violations — ls-lint reports, humans rename
- Integration into `verify.yml` CI workflow (deferred; local pre-commit is the primary gate while CI is manual-trigger only)

---

## References

- ls-lint upstream: https://github.com/loeffel-io/ls-lint
- npm package: https://www.npmjs.com/package/@ls-lint/ls-lint
- Project-scope policy (ADR-0007): [../../adr/0007-secretlint-over-gitleaks.md](../../adr/0007-secretlint-over-gitleaks.md)
- Dependency scope canonical: [../../ai/dependency-scope-policy.md](../../ai/dependency-scope-policy.md)
- Preceding migration pattern: secretlint replacement (commits `bcf21a2` … `3191ff4`)
