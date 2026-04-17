**Purpose:** How dependencies are chosen, upgraded, and audited.
**Read this when:** Adding or upgrading npm/bun packages, or wondering whether a tool belongs in the repo at all.
**Do not use for:** Security disclosure process (use root SECURITY policy when present).
**Related:** [../../package.json](../../package.json), [workflow.md](workflow.md), [../reference/techstack.md](../reference/techstack.md), [../ai/dependency-scope-policy.md](../ai/dependency-scope-policy.md)
**Update when:** Pinning strategy, allowed licenses, or update cadence changes.

---

# Dependency policy

## Golden rule — project-scope only

Every tool the repo uses at dev or CI time ships inside `node_modules`. The only permitted system prerequisites are **Bun** (the runtime) and **git**. No `brew install`, no `apt install`, no `npm install -g`, no `pipx`, no `cargo install`, nothing outside the lockfile.

Full rationale and enforcement: [../ai/dependency-scope-policy.md](../ai/dependency-scope-policy.md) (the canonical agent-facing policy — same rule, with enforcement and exception criteria).

## Picking a new tool

1. Is the feature you need already covered by an existing devDep? Prefer reuse over stacking.
2. Search `npm` / `jsr` for the tool. Official package? Binary wrapper (e.g. `lefthook`, `turbo`, `@biomejs/biome`) that downloads the native binary to `node_modules` on install?
3. If yes, `bun add -D <pkg>` and pin via `bun.lock`.
4. If no, look for an alternative with npm distribution (e.g. secretlint replaced gitleaks; see ADR-0007).
5. If still no alternative, **stop and ask the maintainer**. Do not silently propose `brew install`.

## Version pinning

- `^X.Y.Z` for devDeps (minor + patch updates accepted on `bun install`)
- `bun.lock` is the source of truth — always commit changes
- Major version bumps require a PR justification (add to the description: what changed, any breaking adjustments made)

## Upgrade cadence

- **Low-risk (patch)**: anytime, as part of feature PRs
- **Medium (minor)**: review CHANGELOG; run `bun run verify` + `bun run perf`
- **Major**: explicit PR with migration notes, ADR if user-facing behavior shifts

## Audit

- `bunx knip` (pre-commit warns, pre-push enforces) catches unused dependencies
- License review is manual today — check new deps are MIT / Apache-2 / BSD before adding

## Pinned prerequisites today

| Tool | Version | Why pinned |
|---|---|---|
| Bun | 1.3.10+ | `packageManager` field; features the repo relies on |
| TypeScript | 5.7.x | Compiler used by `tsc --noEmit` |
| Biome | 2.x | Lint + format contract; tests verify config shape |
| Turborepo | 2.x | Task graph + cache layout |
| Lefthook | 1.x | Hook orchestration |
| Knip | 6.x | Dead-code detection |
| markdownlint-cli2 | 0.13.x | Docs style |
| secretlint + preset-recommend | 11.x | Secret scanning (replaces Phase-3 gitleaks per ADR-0007) |
| commitlint | 19.x | Conventional Commits gate |

## Postinstall scripts

Native-binary wrappers (lefthook, turbo, biome) run a postinstall script that downloads the platform binary. Review postinstall scripts for any new dep before adding — they're a real supply-chain surface.
