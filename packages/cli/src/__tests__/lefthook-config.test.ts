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

  it("declares biome, typecheck, gitleaks, knip in pre-commit", () => {
    const cmds = Object.keys(config["pre-commit"]?.commands ?? {});
    expect(cmds).toContain("biome");
    expect(cmds).toContain("typecheck");
    expect(cmds).toContain("gitleaks");
    expect(cmds).toContain("knip");
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
