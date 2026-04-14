**Purpose:** Core philosophy and operating principles for AI agents working on au-agentic  
**Read this when:** Starting work in this repo, before reading other docs/ai/ policies  
**Do not use for:** Tool-specific instructions (see routing.md for task-specific policies)  
**Related:** routing.md, execution-policy.md  
**Update when:** Core principles or source-of-truth hierarchy changes

---

# Core Operating Principles

## Quality Bar

- **Smallest correct change:** Prefer targeted fixes over broad rewrites
- **Preserve conventions:** Follow existing patterns in codebase
- **Verify before claim:** Run `bun run verify` before claiming work complete
- **Update nearest docs:** Code change without docs update = task incomplete

## Source of Truth Hierarchy

When information conflicts, trust in this order:

1. **Code** — The actual implementation is ground truth
2. **docs/ai/*** — Policies and rules for AI agents
3. **docs/reference/*** — API contracts, schemas, configuration
4. **docs/development/*** — Workflows, testing, contributing
5. **docs/explanations/*** — Architecture, design principles
6. **Other docs/** — Supporting documentation

## Small Diffs Philosophy

- One logical change per commit
- Break large tasks into incremental steps
- Each step should leave code in working state
- Easier to review, easier to revert, easier to debug

## Docs Sync Contract

**Rule:** Code change without docs update = task not complete.

See docs/ai/docs-policy.md for mapping: code change type → docs files to update.

If you can't update docs immediately, create explicit follow-up task before claiming done.
