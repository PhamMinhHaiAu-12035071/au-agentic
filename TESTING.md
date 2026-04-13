# Manual QA Script

Run this after each release to verify the CLI works end-to-end per tool.

## Setup

```bash
mkdir /tmp/test-project
bunx au-agentic
```

## Cursor

1. Enter `/tmp/test-project` as path
2. Select only "Cursor"
3. Choose "Copy now"
4. Verify: `/tmp/test-project/.cursor/commands/interview.md` exists
5. Open Cursor → Chat → Type `/interview`
6. Verify: Interview wizard starts, asks questions about requirements

## Claude Code

1. Select only "Claude Code"
2. Verify: `/tmp/test-project/.claude/commands/interview.md` exists
3. Run `claude` in terminal → Type `/interview`
4. Verify: AskUserQuestion UI appears, interview starts

## GitHub Copilot

1. Select only "GitHub Copilot"
2. Verify: `/tmp/test-project/.github/prompts/interview.prompt.md` exists
3. Open VS Code → Copilot Chat → Attach prompt file → Send
4. Verify: Interview questions appear in agent mode

## Codex CLI

1. Select only "Codex CLI"
2. Verify: `/tmp/test-project/.agents/skills/interview/SKILL.md` exists
3. Run `codex` → Type `$interview`
4. Verify: Interview skill activates

## Re-entry test

1. Run `bunx au-agentic` again with same path
2. Select all tools
3. Choose "Preview files first"
4. Verify: Files show (overwrite) label
5. Choose "Proceed to copy" → confirm overwrite for each file
6. Verify: Success screen shows (overwritten) labels

## Error tests

- Run `echo "" | bunx au-agentic` → must print error and exit 1
- Enter `/nonexistent/path` → must re-prompt with "Directory not found"
- Press Ctrl+C during wizard → must print "Cancelled" and exit 1
