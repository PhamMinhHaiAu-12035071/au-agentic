import { TEMPLATE_MANIFEST } from "#generated/template-manifest";

export const TOOLS = ["cursor", "claude", "copilot", "codex"] as const;
export type Tool = (typeof TOOLS)[number];

export const SKILLS = ["interview", "javascript-patterns"] as const;
export type Skill = (typeof SKILLS)[number];

interface ToolMeta {
  label: string;
  nextStep: (skill: Skill) => string;
}

const TOOL_META: Record<Tool, ToolMeta> = {
  cursor: {
    label: "Cursor",
    nextStep: (s) =>
      s === "interview"
        ? "Open Cursor → Chat panel → Type /interview"
        : "Cursor Chat → Type /javascript-patterns (manual-only, JS/TS + test/spec files only)",
  },
  claude: {
    label: "Claude Code",
    nextStep: (s) =>
      s === "interview"
        ? "Run `claude` → Type /interview"
        : "Run `claude` → Type /javascript-patterns (manual-only, JS/TS + test/spec files only)",
  },
  copilot: {
    label: "GitHub Copilot",
    nextStep: (s) =>
      s === "interview"
        ? "VS Code → Copilot Chat → Type /interview"
        : "VS Code → Copilot Chat → Type /javascript-patterns (slash popup, manual-only)",
  },
  codex: {
    label: "Codex CLI",
    nextStep: (s) =>
      s === "interview"
        ? "Run `codex` → Type $interview or /interview"
        : "Run `codex` → Type $javascript-patterns or /javascript-patterns (manual-only)",
  },
};

export const TOOL_LABELS: Record<Tool, string> = {
  cursor: TOOL_META.cursor.label,
  claude: TOOL_META.claude.label,
  copilot: TOOL_META.copilot.label,
  codex: TOOL_META.codex.label,
};

export const SKILL_LABELS: Record<Skill, string> = {
  interview: "interview — structured requirement Q&A",
  "javascript-patterns":
    "javascript-patterns — 29 JS patterns from patterns.dev (JS/TS projects only)",
};

export const DEFAULT_SKILL_SELECTION: Skill[] = ["interview"];

interface ScaffoldFile {
  targetPath: string;
  content: string;
}

/**
 * Map a skill + tool + source-key to the project-relative target path.
 * Example: (javascript-patterns, claude, references/singleton.md) → .claude/skills/javascript-patterns/references/singleton.md
 */
function targetFor(skill: Skill, tool: Tool, key: string): string {
  // interview has legacy one-file-per-tool layout
  if (skill === "interview") {
    switch (tool) {
      case "cursor":
        return `.cursor/skills/interview/SKILL.md`;
      case "claude":
        return `.claude/skills/interview/SKILL.md`;
      case "copilot":
        return `.github/prompts/interview.prompt.md`;
      case "codex":
        return key === "SKILL.md"
          ? `.agents/skills/interview/SKILL.md`
          : `.agents/skills/interview/${key}`;
    }
  }

  // javascript-patterns
  switch (tool) {
    case "claude":
      return `.claude/skills/javascript-patterns/${key}`;
    case "cursor":
      return `.cursor/skills/javascript-patterns/${key}`;
    case "codex":
      return `.agents/skills/javascript-patterns/${key}`;
    case "copilot":
      // copilot source keys are "javascript-patterns.prompt.md" (catalog,
      // slash-triggered manual per DEC-011) or "javascript-patterns/<slug>.md" (ref).
      return `.github/prompts/${key}`;
  }
}

function sharedTargetsFor(skill: Skill, tool: Tool, key: string): string {
  // LICENSE fan-out: 1 source → N target (one per selected tool folder).
  if (skill === "javascript-patterns" && key === "LICENSE") {
    switch (tool) {
      case "claude":
        return `.claude/skills/javascript-patterns/LICENSE`;
      case "cursor":
        return `.cursor/skills/javascript-patterns/LICENSE`;
      case "codex":
        return `.agents/skills/javascript-patterns/LICENSE`;
      case "copilot":
        return `.github/prompts/javascript-patterns/LICENSE`;
    }
  }
  throw new Error(`Unknown shared file for ${skill}: ${key}`);
}

/**
 * Enumerate every (targetPath, content) pair that should be written
 * for the given skill × tool combination.
 */
export function filesForSkillTool(skill: Skill, tool: Tool): ScaffoldFile[] {
  const files: ScaffoldFile[] = [];
  const entry = TEMPLATE_MANIFEST[skill];
  if (!entry) throw new Error(`Unknown skill: ${skill}`);

  // Per-tool files
  const toolBucket = (entry as Record<string, Record<string, string>>)[tool];
  if (toolBucket) {
    for (const [key, content] of Object.entries(toolBucket)) {
      files.push({ targetPath: targetFor(skill, tool, key), content });
    }
  }

  // Shared fan-out (e.g. LICENSE)
  const shared = (entry as Record<string, Record<string, string>>)._shared;
  if (shared) {
    for (const [key, content] of Object.entries(shared)) {
      files.push({ targetPath: sharedTargetsFor(skill, tool, key), content });
    }
  }

  return files;
}

export function getToolLabel(tool: Tool): string {
  return TOOL_META[tool].label;
}

export function getNextStep(tool: Tool, skill: Skill): string {
  return TOOL_META[tool].nextStep(skill);
}
