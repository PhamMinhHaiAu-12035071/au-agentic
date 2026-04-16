**Purpose:** Manual QA for releases, automated checks, and editor integration for this repo.  
**Read this when:** Verifying the CLI end-to-end, changing wizard behavior, or before claiming work complete.  
**Do not use for:** Load testing or production SLOs (not in scope for this CLI).  
**Related:** [workflow.md](workflow.md), [../../package.json](../../package.json), [../../CLAUDE.md](../../CLAUDE.md)  
**Update when:** Wizard flows, supported tools, verification scripts, or hooks change.

---

# Testing

## Manual QA script

Run this after each release to verify the CLI works end-to-end per tool.

### Setup

```bash
mkdir /tmp/test-project
bunx au-agentic
```

### Cursor

1. Enter `/tmp/test-project` as path
2. Select only "Cursor"
3. Choose "Copy now"
4. Verify: `/tmp/test-project/.cursor/skills/interview/SKILL.md` exists
5. Open Cursor, Chat, type `/interview`
6. Verify: Interview wizard starts, asks questions about requirements

### Claude Code

1. Select only "Claude Code"
2. Verify: `/tmp/test-project/.claude/skills/interview/SKILL.md` exists
3. Run `claude` in terminal, type `/interview`
4. Verify: AskUserQuestion UI appears, interview starts

### GitHub Copilot

1. Select only "GitHub Copilot"
2. Verify: `/tmp/test-project/.github/prompts/interview.prompt.md` exists
3. Open VS Code, Copilot Chat, type `/interview`
4. Verify: Interview questions appear in agent mode

### Codex CLI

1. Select only "Codex CLI"
2. Verify: `/tmp/test-project/.agents/skills/interview/SKILL.md` exists
3. Run `codex`, type `$interview` or `/interview`
4. Verify: Interview skill activates

### Re-entry test

1. Run `bunx au-agentic` again with same path
2. Select all tools
3. Choose "Preview files first"
4. Verify: Files show (overwrite) label
5. Choose "Proceed to copy", confirm overwrite for each file
6. Verify: Success screen shows (overwritten) labels

### Error tests

- Run `echo "" | bunx au-agentic` → must print error and exit 1
- Enter `/nonexistent/path` → must re-prompt with "Directory not found"
- Press Ctrl+C during wizard → must print "Cancelled" and exit 1

## Automated verification

Run before claiming work complete, opening PRs, or merging:

| Command | Purpose |
|---------|---------|
| `bun run typecheck` | TypeScript (`tsc --noEmit`) |
| `bun run lint` | ESLint over `packages/` |
| `bun run test` | Package tests |
| `bun run verify` | **Preferred:** typecheck + lint + test |
| `bun run build` | Bundle CLI (lenient; run after verify passes) |

**Iron rule:** Do not claim completion without a successful `bun run verify` in the current change set.

Single test file example:

```bash
bun test packages/cli/src/__tests__/copy.test.ts
```

## Pre-commit hook

On `git commit`, lint-staged runs:

- `eslint --fix` on staged files
- `tsc --noEmit` (typecheck) on staged `.ts` files

## VSCode integration

The TypeScript language server runs continuously. Errors in the **Problems** tab are real: they will fail `bun run typecheck`. Do not ignore them before claiming verification passed.

## Red flags

- Claiming "tests pass" without running `verify`
- Ignoring Problems tab TypeScript errors
- Merging when `verify` fails
- Assuming build success implies type safety (build does not replace `typecheck`)
