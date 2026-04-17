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
| `bun run lint` | Biome lint over `packages/` (via Turbo) |
| `bun run test` | Package tests |
| `bun run verify` | **Preferred:** typecheck + lint + test |
| `bun run build` | Bundle CLI (lenient; run after verify passes) |

**Iron rule:** Do not claim completion without a successful `bun run verify` in the current change set.

## Pre-commit hook

On `git commit`, Lefthook runs (in parallel):

- Biome check + organize imports on staged files
- `tsc --noEmit` (typecheck) via Turbo
- secretlint secret scan on staged files (bunx, project-scope)
- ls-lint filesystem naming scan (bunx, project-scope)
- Knip unused-export check (warning-only)

## VSCode integration

The TypeScript language server runs continuously. Errors in the **Problems** tab are real: they will fail `bun run typecheck`. Do not ignore them before claiming verification passed.

## Red flags

- Claiming "tests pass" without running `verify`
- Ignoring Problems tab TypeScript errors
- Merging when `verify` fails
- Assuming build success implies type safety (build does not replace `typecheck`)

## 4-tier test example: javascript-patterns

The `javascript-patterns` skill (29 patterns × 4 tools ≈ 121 files) is covered by 4 focused tests rather than hundreds of per-file assertions:

| Tier | File | What it asserts |
|---|---|---|
| 1. Manifest snapshot | `packages/cli/src/__tests__/template-manifest.test.ts` | Static manifest shape: counts, tool keys, pattern IDs present |
| 2. Golden file | `packages/cli/src/__tests__/scaffold-golden.test.ts` | Representative samples survive transforms verbatim |
| 3. Integration | `packages/cli/src/__tests__/copy.test.ts` | End-to-end scaffold into a tmp dir, path tree matches expected layout |
| 4. Contract | `packages/cli/src/__tests__/skill-contract.test.ts` | DEC-011 manual-trigger, DEC-012 JS/TS scope, DEC-013 `/interview` ambiguity delegation |

See [testing-policy.md](../ai/testing-policy.md#focused-test-tiers) for when to adopt this pattern.
