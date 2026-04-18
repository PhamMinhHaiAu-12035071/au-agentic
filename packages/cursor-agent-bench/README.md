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

## Realtime UX

When the terminal is a TTY, `bun run skill:bench` renders:

- `clack.intro` — header
- `clack.progress` — overall cell counter (`[idx/total] fixture / model / run N`)
- `clack.taskLog` — per-turn stream with line-by-line stdout and a
  heartbeat tick every ≈1s so the run never appears stuck
- `clack.outro` — "Tracker dir: …"
- `consola.box` — final result summary

When stdout is **not** a TTY (e.g. `bun run skill:bench > bench.log 2>&1`),
a consola-based adapter replaces the in-loop UI with plain tagged log
lines. Heartbeat cadence drops to 30s to avoid log bloat. Output is
ANSI-free and `grep`-able:

```bash
bun run skill:bench > bench.log 2>&1
grep $'\x1b' bench.log   # → no matches, safe to commit / share
```

See [ADR-0011](../../docs/adr/0011-consola-for-bench-semantic-logging.md)
for the phase-isolation rule.
