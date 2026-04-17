**Purpose:** End-to-end narratives for major features.  
**Read this when:** Learning how pieces fit together for a real task.  
**Do not use for:** Exhaustive reference (use `docs/reference/`).  
**Related:** [testing-examples.md](testing-examples.md), [../getting-started/quickstart.md](../getting-started/quickstart.md), [migration-examples.md](migration-examples.md)  
**Update when:** User-visible flows change materially.

---

# Feature walkthroughs

**Status:** Currently not applicable — the wizard is self-explanatory; deep walkthroughs are not maintained yet.

**Trigger:** This file should be filled when:
- You add non-trivial configuration or multi-step workflows
- Video or prose tutorials should live in-repo

## Using javascript-patterns Skill (end-to-end)

1. Scaffold:

   ```bash
   bunx au-agentic
   # Step 1: path → .
   # Step 2: tools → claude
   # Step 3: skills → javascript-patterns
   # Step 4: preview → copy
   ```

2. Open a JS/TS file in Claude Code.
3. Trigger manually: type `/javascript-patterns` in the slash popup, or ask "active skill javascript-patterns, refactor this global state into a Singleton".
4. Claude reads the catalog, finds the "Singleton" row, then `Read`s `.claude/skills/javascript-patterns/references/singleton.md` before coding. If the task were ambiguous, Claude would delegate to `/interview` first.
5. Add more patterns: edit upstream OR run `bun run sync:upstream-patterns`, then commit the diff.
