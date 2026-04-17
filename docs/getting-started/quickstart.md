**Purpose:** Fast path from zero to a working local setup.  
**Read this when:** You need to run or develop au-agentic for the first time.  
**Do not use for:** Deep environment tuning (use [environment.md](environment.md) when filled).  
**Related:** [local-setup.md](local-setup.md), [../development/workflow.md](../development/workflow.md), [../../CLAUDE.md](../../CLAUDE.md)  
**Update when:** Install prerequisites, default commands, or package scripts change.

---

# Quickstart

**Status:** Currently not applicable — quickstart content still lives in root [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md).

**Trigger:** This file should be filled when:
- README is split so canonical prose lives under `docs/`
- You publish `au-agentic` with install paths beyond `bun install` / `bunx`

Placeholder commands (today):

```bash
bun install
bunx lefthook install   # one-time hook setup
bun run verify          # lint + typecheck + test
bun run perf            # benchmark gate
```
