# Contributing to au-agentic

Thank you for contributing!

## Setup

1. Install [Bun 1.3.10+](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
2. Install gitleaks v8 (system binary):
    - macOS: `brew install gitleaks`
    - Debian/Ubuntu: download from https://github.com/gitleaks/gitleaks/releases
    - Windows: `scoop install gitleaks`
3. Clone and install:
    ```bash
    git clone https://github.com/phamau/au-agentic
    cd au-agentic
    bun install
    bunx lefthook install
    ```
4. Verify everything works:
    ```bash
    bun run verify    # lint + typecheck + test
    bun run perf      # benchmark gate
    ```

## Development workflow

- Make changes (Biome auto-formats on save if VSCode extension is installed)
- Stage and commit (Lefthook runs Biome, typecheck, gitleaks, knip in parallel)
- Push (pre-push runs strict knip)
- CI is currently manual-trigger only; trigger via Actions tab if needed (see `docs/development/branching-and-prs.md`)

## Commit messages

Conventional Commits enforced by `commitlint`. Subject ≤ 72 chars (no upper-case or PascalCase first word); body lines ≤ 100 chars. Scope is free-form — pick the most specific subtree (`cli`, `templates`, `docs`, `ai`, `adr`, `reference`, `dev`, `setup`, `deployment`, `explanations`, `tooling`, `deps`, `tests`, `ci`, `security`, etc.).

## Tests

- Use `bun test` (or run via Turbo: `bun run test`)
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
