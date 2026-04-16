import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("turbo.json contract", () => {
  const repoRoot = join(import.meta.dir, "../../../..");
  const config = JSON.parse(readFileSync(join(repoRoot, "turbo.json"), "utf-8"));

  it("declares build, typecheck, test, lint, format, dev tasks", () => {
    const tasks = Object.keys(config.tasks ?? {});
    for (const t of ["build", "typecheck", "test", "lint", "format", "dev"]) {
      expect(tasks).toContain(t);
    }
  });

  it("build outputs to dist/", () => {
    expect(config.tasks.build.outputs).toContain("dist/**");
  });

  it("test outputs coverage", () => {
    expect(config.tasks.test.outputs).toContain("coverage/**");
  });

  it("format and dev are not cached", () => {
    expect(config.tasks.format.cache).toBe(false);
    expect(config.tasks.dev.cache).toBe(false);
  });

  it("dev is persistent", () => {
    expect(config.tasks.dev.persistent).toBe(true);
  });
});
