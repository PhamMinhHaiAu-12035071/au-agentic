import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { filesForSkillTool } from "#utils/templates";

const GOLDEN_DIR = join(import.meta.dir, "__golden__");

function loadGolden(name: string): string {
  return readFileSync(join(GOLDEN_DIR, name), "utf8");
}

function findFile(files: ReturnType<typeof filesForSkillTool>, suffix: string): string {
  const hit = files.find((f) => f.targetPath.endsWith(suffix));
  if (!hit) throw new Error(`No scaffolded file ending in ${suffix}`);
  return hit.content;
}

describe("scaffold-golden: javascript-patterns", () => {
  test("claude singleton.md matches golden", () => {
    const files = filesForSkillTool("javascript-patterns", "claude");
    expect(findFile(files, "/references/singleton.md")).toBe(loadGolden("claude-singleton.md"));
  });

  test("claude observer.md matches golden", () => {
    const files = filesForSkillTool("javascript-patterns", "claude");
    expect(findFile(files, "/references/observer.md")).toBe(loadGolden("claude-observer.md"));
  });

  test("copilot singleton.md matches golden (no attribution header change)", () => {
    const files = filesForSkillTool("javascript-patterns", "copilot");
    expect(findFile(files, "/javascript-patterns/singleton.md")).toBe(
      loadGolden("copilot-singleton.md"),
    );
  });

  test("all scaffolded refs start with attribution header", () => {
    for (const tool of ["claude", "cursor", "codex"] as const) {
      const files = filesForSkillTool("javascript-patterns", tool);
      const refs = files.filter((f) => f.targetPath.includes("/references/"));
      for (const ref of refs) {
        expect(ref.content.startsWith("<!-- Source:")).toBe(true);
        expect(ref.content).toContain("MIT — see ../LICENSE");
      }
    }
  });
});
