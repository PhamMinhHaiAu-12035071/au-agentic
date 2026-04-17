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

## ⚠️ Isolation warning

The runner spawns `cursor-agent` in the current working directory. If a
fixture prompt asks the skill to perform a coding task (e.g. "add feature X"),
Cursor CLI may write files into the real workspace. V1 does not sandbox
this — always inspect `git status` after a real bench run and discard any
unintended changes with `git checkout -- <files>` / `rm` before committing.

Follow-up: run the bench from an isolated git worktree or a copy of the
repo to prevent LLM-induced code pollution.
