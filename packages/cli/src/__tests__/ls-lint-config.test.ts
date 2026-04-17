import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

describe(".ls-lint.yml contract", () => {
  const repoRoot = join(import.meta.dir, "../../../..");
  const config = parseYaml(readFileSync(join(repoRoot, ".ls-lint.yml"), "utf-8"));

  it("declares top-level ls and ignore keys", () => {
    expect(config).toHaveProperty("ls");
    expect(config).toHaveProperty("ignore");
  });

  it("defaults directories and common file types to kebab-case", () => {
    expect(config.ls[".dir"]).toBe("kebab-case");
    expect(config.ls[".ts"]).toBe("kebab-case");
    expect(config.ls[".md"]).toBe("kebab-case");
    expect(config.ls[".yml"]).toBe("kebab-case");
  });

  it("enforces NNNN-<kebab>.md for ADR files", () => {
    const adrRule = config.ls["docs/adr"];
    expect(adrRule).toBeDefined();
    // ls-lint applies regex to the filename stem (extension stripped by the .md key filter)
    expect(adrRule[".md"]).toBe("regex:^[0-9]{4}-[a-z0-9-]+$");
  });

  it("enforces *.test.ts for unit test files", () => {
    const testsRule = config.ls["packages/cli/src/__tests__"];
    expect(testsRule).toBeDefined();
    expect(testsRule[".ts"]).toBe("regex:^[a-z0-9-]+\\.test\\.ts$");
  });

  it("exempts __tests__ directory from kebab-case (double-underscore convention)", () => {
    const srcDirRule = config.ls["packages/cli/src"];
    expect(srcDirRule).toBeDefined();
    expect(srcDirRule[".dir"]).toBe("regex:^(__tests__|[a-z0-9-]+)$");
  });

  it("ignores build artifacts and templates", () => {
    expect(config.ignore).toContain("node_modules");
    expect(config.ignore).toContain("dist");
    expect(config.ignore).toContain("coverage");
    expect(config.ignore).toContain("packages/templates");
  });

  it("ignores community-convention root UPPERCASE files", () => {
    expect(config.ignore).toContain("README.md");
    expect(config.ignore).toContain("AGENTS.md");
    expect(config.ignore).toContain("CLAUDE.md");
    expect(config.ignore).toContain("CONTRIBUTING.md");
    expect(config.ignore).toContain("LICENSE");
  });
});
