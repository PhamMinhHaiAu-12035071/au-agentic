import { describe, expect, test } from "bun:test";
import { TEMPLATE_MANIFEST } from "#generated/template-manifest";

const EXPECTED_JS_PATTERNS_COUNT = 29;

describe("TEMPLATE_MANIFEST", () => {
  test("contains interview skill for all 4 tools", () => {
    expect(TEMPLATE_MANIFEST.interview).toBeDefined();
    expect(TEMPLATE_MANIFEST.interview.claude["SKILL.md"]).toMatch(/^---\n/);
    expect(TEMPLATE_MANIFEST.interview.cursor["SKILL.md"]).toMatch(/^---\n/);
    expect(TEMPLATE_MANIFEST.interview.codex["SKILL.md"]).toMatch(/^---\n/);
    expect(TEMPLATE_MANIFEST.interview.copilot["copilot.md"]).toBeDefined();
  });

  test("contains javascript-patterns skill with catalog + 29 refs per tool", () => {
    const js = TEMPLATE_MANIFEST["javascript-patterns"];
    expect(js).toBeDefined();

    for (const tool of ["claude", "cursor", "codex"] as const) {
      expect(js[tool]["SKILL.md"]).toContain("name: javascript-patterns");
      const refKeys = Object.keys(js[tool]).filter((k) => k.startsWith("references/"));
      expect(refKeys).toHaveLength(EXPECTED_JS_PATTERNS_COUNT);
    }

    // DEC-011: Copilot uses .prompt.md (slash-triggered manual), NOT .instructions.md (auto-attach)
    const copilot: Record<string, string | undefined> = js.copilot;
    expect(copilot["javascript-patterns.prompt.md"]).toBeDefined();
    expect(copilot["javascript-patterns.instructions.md"]).toBeUndefined();
    expect(copilot["javascript-patterns.prompt.md"]).not.toContain("applyTo:");
    const copilotRefs = Object.keys(js.copilot).filter((k) => k.startsWith("javascript-patterns/"));
    expect(copilotRefs).toHaveLength(EXPECTED_JS_PATTERNS_COUNT);
  });

  test("includes shared LICENSE for javascript-patterns (fan-out rule)", () => {
    const js = TEMPLATE_MANIFEST["javascript-patterns"];
    expect(js._shared.LICENSE).toContain("MIT License");
  });
});
