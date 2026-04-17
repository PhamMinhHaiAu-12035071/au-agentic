import { describe, expect, test } from "bun:test";
import { TEMPLATE_MANIFEST } from "#generated/template-manifest";

const JS = TEMPLATE_MANIFEST["javascript-patterns"];
const AGENT_TOOLS = ["claude", "cursor", "codex"] as const;

function copilotCatalog(): string {
  const copilot = JS.copilot as Record<string, string | undefined>;
  const content = copilot["javascript-patterns.prompt.md"];
  if (!content) throw new Error("Copilot catalog missing");
  return content;
}

describe("javascript-patterns skill contract", () => {
  describe("DEC-011: manual-trigger-only", () => {
    for (const tool of AGENT_TOOLS) {
      test(`${tool} SKILL.md declares disable-model-invocation: true`, () => {
        expect(JS[tool]["SKILL.md"]).toContain("disable-model-invocation: true");
      });

      test(`${tool} SKILL.md does NOT declare paths: frontmatter key`, () => {
        const skillMd = JS[tool]["SKILL.md"];
        // paths: at start-of-line within frontmatter would enable auto-activation
        expect(skillMd).not.toMatch(/^paths:\s*$/m);
        expect(skillMd).not.toMatch(/^paths:\s*\n\s*-/m);
      });

      test(`${tool} SKILL.md body contains Trigger Model block`, () => {
        const skillMd = JS[tool]["SKILL.md"];
        expect(skillMd).toContain("## Trigger Model");
        expect(skillMd).toContain("Manual-only");
        expect(skillMd).toContain("/javascript-patterns");
      });
    }

    test("Copilot catalog is at .prompt.md (slash-triggered), NOT .instructions.md", () => {
      const copilot = JS.copilot as Record<string, string | undefined>;
      expect(copilot["javascript-patterns.prompt.md"]).toBeDefined();
      expect(copilot["javascript-patterns.instructions.md"]).toBeUndefined();
    });

    test("Copilot catalog does NOT declare applyTo: (manual-only)", () => {
      expect(copilotCatalog()).not.toMatch(/^applyTo:/m);
    });
  });

  describe("DEC-012: scope = JS/TS source + test/spec files only", () => {
    const catalogs: Array<{ tool: string; content: string }> = [
      ...AGENT_TOOLS.map((t) => ({ tool: t, content: JS[t]["SKILL.md"] })),
      { tool: "copilot", content: copilotCatalog() },
    ];

    for (const { tool, content } of catalogs) {
      test(`${tool} catalog declares Scope block listing JS + TS + test + spec`, () => {
        expect(content).toContain("## Scope");
        expect(content).toContain(".js");
        expect(content).toContain(".ts");
        expect(content).toMatch(/\.test\./);
        expect(content).toMatch(/\.spec\./);
      });

      test(`${tool} catalog Scope block precedes Catalog table`, () => {
        const scopeIdx = content.indexOf("## Scope");
        const catalogIdx = content.indexOf("## Catalog");
        expect(scopeIdx).toBeGreaterThan(-1);
        expect(catalogIdx).toBeGreaterThan(-1);
        expect(scopeIdx).toBeLessThan(catalogIdx);
      });
    }
  });

  describe("DEC-013: ambiguity → delegate /interview", () => {
    const catalogs: Array<{ tool: string; content: string }> = [
      ...AGENT_TOOLS.map((t) => ({ tool: t, content: JS[t]["SKILL.md"] })),
      { tool: "copilot", content: copilotCatalog() },
    ];

    for (const { tool, content } of catalogs) {
      test(`${tool} catalog contains Ambiguity Protocol referencing /interview`, () => {
        expect(content).toContain("## Ambiguity Protocol");
        expect(content).toContain("/interview");
        expect(content).toMatch(/KHÔNG đoán|do not guess|don't guess/i);
      });

      test(`${tool} catalog delegation block appears before Catalog table`, () => {
        const ambIdx = content.indexOf("## Ambiguity Protocol");
        const catalogIdx = content.indexOf("## Catalog");
        expect(ambIdx).toBeGreaterThan(-1);
        expect(ambIdx).toBeLessThan(catalogIdx);
      });
    }
  });
});
