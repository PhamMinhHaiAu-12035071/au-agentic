import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

describe("lefthook.yml contract", () => {
  const repoRoot = join(import.meta.dir, "../../../..");
  const config = parseYaml(readFileSync(join(repoRoot, "lefthook.yml"), "utf-8"));

  it("runs pre-commit in parallel", () => {
    expect(config["pre-commit"]?.parallel).toBe(true);
  });

  it("declares biome, typecheck, secretlint, knip in pre-commit", () => {
    const cmds = Object.keys(config["pre-commit"]?.commands ?? {});
    expect(cmds).toContain("biome");
    expect(cmds).toContain("typecheck");
    expect(cmds).toContain("secretlint");
    expect(cmds).toContain("knip");
  });

  it("secret scanner is project-scope (bunx), not a system binary", () => {
    const secretlintCmd = config["pre-commit"]?.commands?.secretlint?.run ?? "";
    expect(secretlintCmd).toContain("bunx");
    expect(secretlintCmd).not.toContain("gitleaks");
  });

  it("declares commitlint in commit-msg", () => {
    const cmds = Object.keys(config["commit-msg"]?.commands ?? {});
    expect(cmds).toContain("commitlint");
  });

  it("declares knip-strict in pre-push", () => {
    const cmds = Object.keys(config["pre-push"]?.commands ?? {});
    expect(cmds).toContain("knip-strict");
  });
});
