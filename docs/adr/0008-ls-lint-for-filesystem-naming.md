# ADR-0008: Adopt ls-lint for filesystem naming conventions

**Status:** Accepted
**Date:** 2026-04-17
**Deciders:** Au Pham
**Supersedes:** none
**Superseded by:** none

## Context

Biome's `useFilenamingConvention` rule enforces kebab-case on files Biome lints (TypeScript, JavaScript, JSON, JSONC). It does not cover directory names, Markdown / YAML / TOML / shell filenames, or per-directory name patterns (e.g. `docs/adr/<NNNN>-<slug>.md`).

The repo currently conforms to kebab-case by convention, but nothing prevents drift. A contributor or AI agent could introduce `PackageCase/` folders, `MyDoc.md` files, or oddly-named test files with no enforcement.

The project-scope dependency rule (ADR-0007, `docs/ai/dependency-scope-policy.md`) requires every new tool to install via `bun add -D`. Any filesystem linter chosen here must honor that.

## Decision

Adopt **`@ls-lint/ls-lint@^2`** as the repo's filesystem naming linter. It is an official npm package published by the upstream author (loeffel-io), MIT, 0 dependencies, with the Go binary delivered via postinstall to `node_modules` — identical pattern to `@biomejs/biome`, `turbo`, and `lefthook`.

Wire it into:
- Lefthook `pre-commit` (full-repo scan; ls-lint has no staged-only mode but is fast)
- Root `package.json` script `lint:fs` for on-demand runs
- `scripts/benchmark.ts` as a T1-tier bench row

Config lives at `.ls-lint.yml` with kebab-case defaults for directories and nine common file types, two per-directory regex patterns (ADR numbering and `*.test.ts` suffix), a regex exemption allowing `__tests__` to coexist with kebab-case siblings, and an ignore list covering community-convention root UPPERCASE files, build artifacts, templates, and external-tool directories.

Implementation note: ls-lint v2 applies the regex to the filename **stem** (extension stripped by the key filter). The ADR rule uses `regex:^[0-9]{4}-[a-z0-9-]+$` (not `\.md$` suffix) for this reason.

## Consequences

**Positive**
- Full parity with ls-lint: directories + all file types + per-directory patterns
- Honors ADR-0007 project-scope rule verbatim
- Zero custom code; battle-tested tool (35 versions since 2020)
- Fast (Go binary) — 44ms median on this repo, well within T1 budget

**Negative**
- `+`~19 MB under `node_modules/@ls-lint/ls-lint/` for the platform-specific Go binary. Accepted by precedent (Biome ~30 MB, Turbo ~20 MB)
- Postinstall is another failure surface on exotic platforms. Same risk class as Biome/Turbo/Lefthook; rare in practice

## Alternatives considered

- **Custom Bun TypeScript script (~200 LoC)**: reinvents character-class rules, per-directory overrides, glob matching. Easy to miss edge cases. Rejected
- **Hybrid: Biome's filename rule + tiny folder-only script**: does not cover all file types or per-directory patterns. Rejected
- **`case-police`**: narrower feature set, no per-directory patterns. Rejected
- **No enforcement**: drift invisible until it accumulates. Rejected

## References

- ls-lint upstream: https://github.com/loeffel-io/ls-lint
- npm package: https://www.npmjs.com/package/@ls-lint/ls-lint
- Project-scope rule: [ADR-0007](0007-secretlint-over-gitleaks.md), [../ai/dependency-scope-policy.md](../ai/dependency-scope-policy.md)
- Design spec: [../superpowers/specs/2026-04-17-filesystem-naming-lint-design.md](../superpowers/specs/2026-04-17-filesystem-naming-lint-design.md)
