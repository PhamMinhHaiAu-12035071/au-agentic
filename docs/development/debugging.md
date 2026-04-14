**Purpose:** How to debug the CLI and tests locally.  
**Read this when:** A failure is unclear from test output alone.  
**Do not use for:** Production incident response (use [../deployment/incident-response.md](../deployment/incident-response.md) when applicable).  
**Related:** [testing.md](testing.md), [workflow.md](workflow.md), [../../packages/cli/src/index.ts](../../packages/cli/src/index.ts)  
**Update when:** Debug entrypoints, logging, or test harnesses change.

---

# Debugging

**Status:** Currently not applicable — use `bun run dev`, single-file `bun test`, and source maps as needed.

**Trigger:** This file should be filled when:
- You add structured logging, trace flags, or debug subcommands
- Common failure modes deserve a documented playbook
