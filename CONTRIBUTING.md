# Contributing to au-agentic

Thank you for contributing!

## Setup

1. Install [Bun 1.3.10+](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`. Bun and git are the **only** system prerequisites — every other dev tool ships inside `node_modules`. See [docs/ai/dependency-scope-policy.md](docs/ai/dependency-scope-policy.md) for why.
2. Clone and install:
    ```bash
    git clone https://github.com/phamau/au-agentic
    cd au-agentic
    bun install            # first-time deps (biome, turbo, lefthook, secretlint, …)
    bunx lefthook install  # wire git hooks into .git/hooks/
    ```
3. Verify everything works:
    ```bash
    bun run verify    # lint + typecheck + test
    bun run perf      # benchmark gate
    ```

## Development workflow

- Make changes (Biome auto-formats on save if VSCode extension is installed)
- Stage and commit (Lefthook runs Biome, typecheck, secretlint, knip in parallel)
- Push (pre-push runs strict knip)
- CI is currently manual-trigger only; trigger via Actions tab if needed (see `docs/development/branching-and-prs.md`)

## Commit messages

Conventional Commits enforced by `commitlint`. Subject ≤ 72 chars (no upper-case or PascalCase first word); body lines ≤ 100 chars. Scope is free-form — pick the most specific subtree (`cli`, `templates`, `docs`, `ai`, `adr`, `reference`, `dev`, `setup`, `deployment`, `explanations`, `tooling`, `deps`, `tests`, `ci`, `security`, etc.).

## Tests

- Use `bun run test` — routes through Turbo + `scripts/run-bun-test.sh` so the root `bunfig.toml` is honored (coverage reporters, thresholds) and worker `.tmp` fragments are cleaned. Raw `bun test` at the repo root works too; raw `bun test` from inside a package dir silently disables coverage config.
- Coverage threshold: 70% per file (lines, functions, statements)
- Quality > quantity: see `docs/ai/testing-policy.md` "Test Quality Anti-Patterns"

## Pull Requests

See [Branching and PRs guide](docs/development/branching-and-prs.md) and [Development Workflow](docs/development/workflow.md).

Before submitting:
1. Run `bun run verify` — all checks must pass
2. Update docs if you changed behavior/API
3. Add tests for new functionality
4. Follow [Code Style Guide](docs/development/styleguide.md)

## Questions?

See [SUPPORT.md](SUPPORT.md) or open a discussion.
