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
| Cursor | `.cursor/skills/interview/SKILL.md` |
| Claude Code | `.claude/skills/interview/SKILL.md` |
| GitHub Copilot | `.github/prompts/interview.prompt.md` |
| Codex CLI | `.agents/skills/interview/SKILL.md` |

## Using `/interview`

After scaffolding, open your AI tool and type `/interview` (Cursor, Claude Code, Copilot, and Codex all use the `/` popup; Codex also supports `$interview`).
The command will conduct a structured requirement interview to help you turn vague ideas
into clear specs.

Tested with: Claude Sonnet 4.6 (Claude Code), GPT-4o (Copilot), Cursor Agent mode, Codex Skills.

## Requirements

- Node.js 18+ (for `npx`) or Bun 1.3.10 (for `bunx`)
- An interactive terminal (TTY required)

## Quick start (for contributors/developers)

```bash
# Clone and install
git clone https://github.com/<owner>/au-agentic.git
cd au-agentic
bun install

# One-time hook setup
bunx lefthook install

# Verify everything works
bun run verify    # lint + typecheck + test (Turbo-cached)
bun run perf      # benchmark suite; refreshes docs/development/performance-benchmarks.md
```

System prerequisites: only **Bun 1.3.10+** and **git** — every other tool (Biome, Turbo, Lefthook, secretlint, Knip, markdownlint-cli2) installs into `node_modules` via `bun install`. See [docs/getting-started/local-setup.md](docs/getting-started/local-setup.md) and [docs/ai/dependency-scope-policy.md](docs/ai/dependency-scope-policy.md) for the project-scope rule.
