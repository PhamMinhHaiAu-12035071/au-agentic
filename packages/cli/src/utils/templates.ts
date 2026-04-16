import claudeTemplate from "@au-agentic/templates/interview/claude/SKILL.md" with { type: "text" };
import codexTemplate from "@au-agentic/templates/interview/codex/SKILL.md" with { type: "text" };
import copilotTemplate from "@au-agentic/templates/interview/copilot.md" with { type: "text" };
import cursorTemplate from "@au-agentic/templates/interview/cursor/SKILL.md" with { type: "text" };

export const TOOLS = ["cursor", "claude", "copilot", "codex"] as const;
export type Tool = (typeof TOOLS)[number];

export const TOOL_LABELS: Record<Tool, string> = {
  cursor: "Cursor",
  claude: "Claude Code",
  copilot: "GitHub Copilot",
  codex: "Codex CLI",
};

const TEMPLATE_MAP: Record<Tool, string> = {
  cursor: cursorTemplate,
  claude: claudeTemplate,
  copilot: copilotTemplate,
  codex: codexTemplate,
};

const TARGET_PATH_MAP: Record<Tool, string> = {
  cursor: ".cursor/skills/interview/SKILL.md",
  claude: ".claude/skills/interview/SKILL.md",
  copilot: ".github/prompts/interview.prompt.md",
  codex: ".agents/skills/interview/SKILL.md",
};

export function getTemplateContent(tool: Tool): string {
  return TEMPLATE_MAP[tool];
}

export function getTargetPath(tool: Tool): string {
  return TARGET_PATH_MAP[tool];
}
