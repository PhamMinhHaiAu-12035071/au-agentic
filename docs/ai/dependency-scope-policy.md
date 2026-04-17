**Purpose:** Canonical policy for where dependencies are installed and how agents choose new tools.
**Read this when:** Adding a new dependency, CLI tool, linter, test helper, hook runner, or any binary the project calls during dev/CI.
**Do not use for:** Runtime behavior rules (see coding-rules.md) or performance rules (see performance-policy.md).
**Related:** [performance-policy.md](performance-policy.md), [coding-rules.md](coding-rules.md), [../development/dependency-policy.md](../development/dependency-policy.md), [../adr/0007-secretlint-over-gitleaks.md](../adr/0007-secretlint-over-gitleaks.md)
**Update when:** The allowed-system-prerequisite list changes, or a new dependency class (e.g. native toolchain) is introduced.

---

# Dependency scope policy — "project-scope only"

## TL;DR

```
All new tools install via `bun add -D` into node_modules.
No brew, apt, scoop, global npm, pipx, or any user/system package manager.
Permitted system prerequisites: **Bun** (runtime) and **git**.
Nothing else.
```

## Why

1. **Onboarding is zero-friction.** A new contributor runs `git clone` + `bun install` and has every tool the project uses at the right version — no "install gitleaks via brew" side quest that drifts by OS and shell.
2. **Version pinning is real.** `bun.lock` pins every devDep. System packages drift independently of the repo — a machine with `gitleaks 8.30` and another with `gitleaks 8.18` diverge silently. `node_modules/@biomejs/biome` is the same byte-for-byte on every machine for a given lockfile.
3. **CI parity.** Hosted CI containers install via `bun install` only. The more system prerequisites the repo needs, the more CI setup yaml diverges from local reality.
4. **Worktrees share cache.** With `scripts/cache-env.sh`, every worktree shares one `node_modules` bun cache. System-installed tools bypass this entirely.
5. **Uninstall is `rm -rf node_modules`.** Clean slate on a user's machine is one command, not "`brew uninstall` for each tool someone forgot to document."

## The rule

| Scope | Allowed? | Example |
|---|---|---|
| Project devDeps (`bun add -D`) | ✅ **Always prefer** | `bun add -D @biomejs/biome` |
| Project deps (`bun add`) | ✅ If runtime-needed | `bun add @clack/prompts` |
| Lockfile-pinned binary shipped via npm wrapper | ✅ Same as devDep | `lefthook` npm package downloads its Go binary to `node_modules` |
| System package manager (brew, apt, apk, dnf, scoop, pacman, zypper) | ❌ **Reject** | ~~`brew install gitleaks`~~ |
| Global npm (`npm i -g`, `bun add -g`) | ❌ **Reject** | ~~`bun add -g biome`~~ |
| User-scope Python (`pip install --user`) | ❌ **Reject** | ~~`pipx install detect-secrets`~~ |
| User-scope Rust / Go (`cargo install`, `go install`) | ❌ **Reject** | ~~`cargo install ripgrep`~~ |
| Docker-wrapped binary | ⚠️ Case-by-case | Only if the binary has no npm wrapper **and** the value is high (e.g., a full db for integration tests) |

**Permitted system prerequisites** (the only exceptions):

- **Bun 1.3.10+** — the runtime executing everything else
- **git 2.40+** — universal SCM; not a devDep anyone can replace

Everything else MUST live inside `node_modules`.

**Narrow exception — cursor-agent-bench only:** Cursor CLI (`cursor-agent`) is permitted as a system prerequisite for the `@au-agentic/cursor-agent-bench` workspace package. It is not a runtime dependency of any shipped artifact. See [ADR-0010](../adr/0010-cursor-cli-system-prereq.md).

## Agent algorithm

Before proposing any new tool to the user:

1. **Search npm for the tool**. Official package? An npm wrapper that downloads the binary on postinstall (e.g., `lefthook`, `turbo`, `@biomejs/biome`)?
2. **If yes → `bun add -D <pkg>`**. Done.
3. **If no → search for an alternative with npm distribution**. Secretlint replaces gitleaks. ESLint replaces many linters. Prettier has several TS wrappers. Biome covers both.
4. **If still no alternative → STOP and ask the user**. Do not silently propose `brew install`. The user may decide the trade-off is worth it (rare), but the default is reject.

## Common traps

- **"But the README says `brew install foo`"** — Their README, not ours. Check npm first.
- **"It's fine, I already have it installed globally"** — Not on a fresh CI container. Not on a teammate's machine after a fresh OS. Pin it to the repo.
- **"The npm wrapper is 50MB smaller if I use brew"** — Disk is cheap, onboarding reliability is not. Accept the 50MB.
- **"Docker makes it project-scope, right?"** — Docker is a system dep. Same problem one level up. Only use when no alternative exists.
- **"It's a one-off dev utility, not a hard dep"** — If the project's hooks, scripts, CI, or docs reference it, it's a hard dep. Pin it.

## Violation examples (historical)

The original Phase-3 toolchain required a `brew install gitleaks` step for pre-commit secret scanning. [ADR-0007](../adr/0007-secretlint-over-gitleaks.md) records the migration away from this to **secretlint** (`bun add -D secretlint @secretlint/secretlint-rule-preset-recommend`) — an npm-distributed secret scanner — restoring 100% project-scope compliance.

Related rule on fresh-clone setup: [../getting-started/local-setup.md](../getting-started/local-setup.md) lists the full list of commands an agent may recommend for first-time setup. Any tool not in that list requires `bun add -D` before it is referenced elsewhere.

## Enforcement

- **Code review.** Any PR adding a `brew install` or `apt install` or similar in docs/scripts/CI is rejected by default.
- **Test.** `packages/cli/src/__tests__/lefthook-config.test.ts` asserts that every pre-commit hook command routes through `bunx` (project-scope) and not a bare binary name (system-scope). Adding a hook that calls a system binary breaks the test.
- **CI.** The `verify.yml` workflow (currently manual-trigger only) runs on a fresh container with just bun preinstalled. Any tool missing from `node_modules` fails the workflow loudly, before it can land on `main`.
