# @au-agentic/cursor-agent-bench

Skill benchmarking framework for au-agentic. Spawns Cursor CLI (`cursor-agent`) with scripted multi-turn fixtures and validates skill quality across multiple LLM models.

## Prerequisites

- Bun 1.3.10+
- Cursor CLI installed (`curl https://cursor.com/install -fsSL | bash`)
- OAuth logged in: `cursor-agent login`

See [ADR-0010](../../docs/adr/0010-cursor-cli-system-prereq.md) for why Cursor CLI is a system prerequisite.

## Usage

```bash
# Smoke: default model × 1 run (fast iter)
bun run skill:bench

# Full matrix: 7 models × 3 runs (release gate)
bun run skill:bench --matrix

# Single fixture + specific model
bun run skill:bench --fixture interview-phase1 --model claude-4.5-sonnet --runs 3
```

## Output

- **Markdown tracker (commit):** `docs/superpowers/bench/<skill>.md`
- **JSONL raw (gitignored):** `coverage/cursor-bench/<timestamp>-<skill>.jsonl`

## Adding a fixture

Create `fixtures/<id>.ts` following `Fixture` type from `src/types.ts`.
