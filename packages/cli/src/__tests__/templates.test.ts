import { describe, expect, it } from "bun:test";
import { filesForSkillTool } from "#utils/templates";

describe("interview skill template frontmatter", () => {
  it("cursor template declares name, description, disable-model-invocation", () => {
    const files = filesForSkillTool("interview", "cursor");
    const skill = files.find((f) => f.targetPath.endsWith(".cursor/skills/interview/SKILL.md"));
    expect(skill).toBeDefined();
    expect(skill!.content).toMatch(/^---\s*\nname:\s*interview\s*\n/m);
    expect(skill!.content).toMatch(/description:\s*Structured requirement interview/);
    expect(skill!.content).toMatch(/disable-model-invocation:\s*true/);
  });

  it("claude template declares name, description, argument-hint, allowed-tools", () => {
    const files = filesForSkillTool("interview", "claude");
    const skill = files.find((f) => f.targetPath.endsWith(".claude/skills/interview/SKILL.md"));
    expect(skill).toBeDefined();
    expect(skill!.content).toMatch(/^---\s*\nname:\s*interview\s*\n/m);
    expect(skill!.content).toMatch(/description:\s*Structured requirement interview/);
    expect(skill!.content).toMatch(/argument-hint:/);
    expect(skill!.content).toMatch(/disable-model-invocation:\s*true/);
    expect(skill!.content).toMatch(/allowed-tools:\s*AskUserQuestion Read Glob Grep/);
  });
});
