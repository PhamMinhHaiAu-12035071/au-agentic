# Contributing to au-agentic

Thank you for contributing!

## Setup

```bash
git clone https://github.com/phamau/au-agentic
cd au-agentic
bun install
bun run verify  # typecheck + lint + test
```

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — New features
- `fix:` — Bug fixes
- `docs:` — Documentation changes
- `chore:` — Maintenance tasks
- `refactor:` — Code restructuring
- `test:` — Test changes

Enforced by commitlint pre-commit hook.

## Pull Requests

See [Branching and PRs guide](docs/development/branching-and-prs.md) and [Development Workflow](docs/development/workflow.md).

Before submitting:
1. Run `bun run verify` — all checks must pass
2. Update docs if you changed behavior/API
3. Add tests for new functionality
4. Follow [Code Style Guide](docs/development/styleguide.md)

## Questions?

See [SUPPORT.md](SUPPORT.md) or open a discussion.
