import * as p from "@clack/prompts";
import { TOOL_LABELS, TOOLS, type Tool } from "#utils/templates";

export async function stepSelectTools(): Promise<Tool[]> {
  const selected = await p.multiselect<Tool>({
    message: "Which AI tools do you use? (Space to select, Enter to confirm)",
    options: TOOLS.map((tool) => ({
      value: tool,
      label: TOOL_LABELS[tool],
    })),
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelled — no files were modified");
    process.exit(1);
  }

  return selected as Tool[];
}
