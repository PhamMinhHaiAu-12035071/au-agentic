import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { slugifyPattern, transformUpstreamRef } from "../sync-upstream-patterns";

const FIXTURE = readFileSync(join(import.meta.dir, "fixtures/sample-upstream-SKILL.md"), "utf8");

describe("transformUpstreamRef", () => {
  test("strips upstream YAML frontmatter", () => {
    const out = transformUpstreamRef(FIXTURE, "singleton-pattern");
    expect(out).not.toContain("name: singleton-pattern");
    expect(out).not.toContain("related_skills:");
  });

  test("prepends attribution header comment", () => {
    const out = transformUpstreamRef(FIXTURE, "singleton-pattern");
    expect(out.startsWith("<!-- Source:")).toBe(true);
    expect(out).toContain(
      "https://github.com/PatternsDev/skills/tree/main/javascript/singleton-pattern",
    );
    expect(out).toContain("MIT — see ../LICENSE");
  });

  test("preserves body content intact", () => {
    const out = transformUpstreamRef(FIXTURE, "singleton-pattern");
    expect(out).toContain("# Singleton Pattern");
    expect(out).toContain("Singletons are classes which can be instantiated once");
    expect(out).toContain("## When to Use");
  });
});

describe("slugifyPattern", () => {
  test("strips -pattern suffix", () => {
    expect(slugifyPattern("singleton-pattern")).toBe("singleton");
    expect(slugifyPattern("observer-pattern")).toBe("observer");
  });

  test("keeps non-pattern slugs as-is", () => {
    expect(slugifyPattern("bundle-splitting")).toBe("bundle-splitting");
    expect(slugifyPattern("tree-shaking")).toBe("tree-shaking");
    expect(slugifyPattern("prpl")).toBe("prpl");
  });
});
