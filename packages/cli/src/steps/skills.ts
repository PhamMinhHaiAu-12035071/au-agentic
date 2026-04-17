import * as p from "@clack/prompts";
import { DEFAULT_SKILL_SELECTION, SKILL_LABELS, SKILLS, type Skill } from "#utils/templates";

export async function stepSelectSkills(): Promise<Skill[]> {
  const selected = await p.multiselect<Skill>({
    message: "Which skills do you want to scaffold? (Space to toggle, Enter to confirm)",
    options: SKILLS.map((s) => ({
      value: s,
      label: SKILL_LABELS[s],
    })),
    initialValues: DEFAULT_SKILL_SELECTION,
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel("Cancelled — no files were modified");
    process.exit(1);
  }

  return selected as Skill[];
}
