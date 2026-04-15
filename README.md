# au-agentic

Scaffold enterprise slash commands for AI coding tools.

## Usage

```bash
bunx au-agentic
# or
npx au-agentic
```

Run in your terminal (requires interactive mode). The wizard will:
1. Ask for your project path
2. Ask which AI tools you use (Cursor, Claude Code, GitHub Copilot, Codex CLI)
3. Copy `/interview` slash command files to the right locations

## What gets scaffolded

| Tool | File created |
|---|---|
| Cursor | `.cursor/commands/interview.md` |
| Claude Code | `.claude/commands/interview.md` |
| GitHub Copilot | `.github/prompts/interview.prompt.md` |
| Codex CLI | `.agents/skills/interview/SKILL.md` |

## Using `/interview`

After scaffolding, open your AI tool and type `/interview` (or trigger the skill for Codex).
The command will conduct a structured requirement interview to help you turn vague ideas
into clear specs.

Tested with: Claude Sonnet 4.6 (Claude Code), GPT-4o (Copilot), Cursor Agent mode, Codex Skills.

## Requirements

- Node.js 18+ (for `npx`) or Bun 1.3.10 (for `bunx`)
- An interactive terminal (TTY required)
