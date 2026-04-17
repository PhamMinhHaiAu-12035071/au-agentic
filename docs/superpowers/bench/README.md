# Superpowers Skill Bench Tracker

Committed markdown summaries of `bun run skill:bench` runs. Each file corresponds to one skill and contains two sections:

- `## Latest Smoke` — most recent 1-model × 1-run run (updated on every smoke)
- `## Latest Matrix` — most recent full matrix (updated only when `bun run skill:bench --matrix` runs)

Older runs are not kept in this tracker. Raw per-turn records live in the gitignored `coverage/cursor-bench/*.jsonl`.

## How to read

- `Pass rate 3/3` — all runs of that fixture+model combo passed
- `Latency (ms)` uses `_` as thousands separator for diff-friendly
- Matrix overall pass_rate = sum pass across all (fixture × model × run)

## How to run

```bash
bun run skill:bench           # smoke (fast feedback)
bun run skill:bench --matrix  # full gate (2–3 h)
```

See [`packages/cursor-agent-bench/README.md`](../../../packages/cursor-agent-bench/README.md) for full options.
