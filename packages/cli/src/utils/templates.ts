import claudeTemplate from "@au-agentic/templates/interview/claude/SKILL.md" with { type: "text" };
import codexTemplate from "@au-agentic/templates/interview/codex/SKILL.md" with { type: "text" };
import copilotTemplate from "@au-agentic/templates/interview/copilot.md" with { type: "text" };
import cursorTemplate from "@au-agentic/templates/interview/cursor/SKILL.md" with { type: "text" };

export const TOOLS = ["cursor", "claude", "copilot", "codex"] as const;
export type Tool = (typeof TOOLS)[number];

interface ToolConfig {
  label: string;
  template: string;
  targetPath: string;
  nextStep: string;
}

const TOOLS_CONFIG: Record<Tool, ToolConfig> = {
  cursor: {
    label: "Cursor",
    template: cursorTemplate,
    targetPath: ".cursor/skills/interview/SKILL.md",
    nextStep: "Mở Cursor → Chat panel → Gõ /interview",
  },
  claude: {
    label: "Claude Code",
    template: claudeTemplate,
    targetPath: ".claude/skills/interview/SKILL.md",
    nextStep: "Chạy `claude` → Gõ /interview",
  },
  copilot: {
    label: "GitHub Copilot",
    template: copilotTemplate,
    targetPath: ".github/prompts/interview.prompt.md",
    nextStep: "VS Code → Copilot Chat → Gõ /interview",
  },
  codex: {
    label: "Codex CLI",
    template: codexTemplate,
    targetPath: ".agents/skills/interview/SKILL.md",
    nextStep: "Chạy `codex` → Gõ $interview hoặc /interview",
  },
};

export const TOOL_LABELS: Record<Tool, string> = {
  cursor: TOOLS_CONFIG.cursor.label,
  claude: TOOLS_CONFIG.claude.label,
  copilot: TOOLS_CONFIG.copilot.label,
  codex: TOOLS_CONFIG.codex.label,
};

export function getTemplateContent(tool: Tool): string {
  return TOOLS_CONFIG[tool].template;
}

export function getTargetPath(tool: Tool): string {
  return TOOLS_CONFIG[tool].targetPath;
}

export function getNextStep(tool: Tool): string {
  return TOOLS_CONFIG[tool].nextStep;
}
