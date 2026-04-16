import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("biome.json contract", () => {
  const repoRoot = join(import.meta.dir, "../../../..");
  const config = JSON.parse(readFileSync(join(repoRoot, "biome.json"), "utf-8"));

  it("enables formatter and linter", () => {
    expect(config.formatter?.enabled).toBe(true);
    expect(config.linter?.enabled).toBe(true);
  });

  it("enforces kebab-case filenames", () => {
    const rule = config.linter?.rules?.style?.useFilenamingConvention;
    expect(rule?.level).toBe("error");
    expect(rule?.options?.filenameCases).toContain("kebab-case");
  });

  it("blocks focused tests and empty blocks", () => {
    expect(config.linter?.rules?.suspicious?.noFocusedTests).toBe("error");
    expect(config.linter?.rules?.suspicious?.noEmptyBlockStatements).toBe("error");
  });

  it("blocks unused imports", () => {
    expect(config.linter?.rules?.correctness?.noUnusedImports).toBe("error");
  });

  it("enables organizeImports", () => {
    const organized =
      config.javascript?.organizeImports?.enabled ||
      config.assist?.actions?.source?.organizeImports;
    expect(organized).toBeTruthy();
  });
});
