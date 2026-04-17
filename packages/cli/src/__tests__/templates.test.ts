import { describe, expect, it } from "bun:test";
import { getTemplateContent } from "#utils/templates";

describe("template frontmatter", () => {
  it("cursor template declares name and description", () => {
    const content = getTemplateContent("cursor");
    expect(content).toMatch(/^---\s*\nname:\s*interview\s*\n/m);
    expect(content).toMatch(/description:\s*Structured requirement interview/);
    expect(content).toMatch(/disable-model-invocation:\s*true/);
  });

  it("claude template declares name, description, argument-hint, allowed-tools", () => {
    const content = getTemplateContent("claude");
    expect(content).toMatch(/^---\s*\nname:\s*interview\s*\n/m);
    expect(content).toMatch(/description:\s*Structured requirement interview/);
    expect(content).toMatch(/argument-hint:/);
    expect(content).toMatch(/disable-model-invocation:\s*true/);
    expect(content).toMatch(/allowed-tools:\s*AskUserQuestion Read Glob Grep/);
  });
});
