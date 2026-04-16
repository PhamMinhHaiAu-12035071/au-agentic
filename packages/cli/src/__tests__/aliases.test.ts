import { describe, expect, it } from "bun:test";
import { copyFilesToProject } from "#steps/copy";
import { writeTemplate } from "#utils/files";

describe("package.json imports field aliases", () => {
  it("resolves #utils/* to packages/cli/src/utils/*", () => {
    expect(typeof writeTemplate).toBe("function");
  });

  it("resolves #steps/* to packages/cli/src/steps/*", () => {
    expect(typeof copyFilesToProject).toBe("function");
  });
});
