import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyFilesToProject } from "../steps/copy";
import { fileExists } from "../utils/files";
import { getTargetPath } from "../utils/templates";

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "au-agentic-copy-test-"));
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("copyFilesToProject", () => {
  it("copies cursor template to correct target path", async () => {
    const results = await copyFilesToProject(tmpDir, ["cursor"], {
      confirmOverwrite: async () => true,
    });

    const targetPath = join(tmpDir, getTargetPath("cursor"));
    expect(await fileExists(targetPath)).toBe(true);
    expect(results).toEqual([expect.objectContaining({ tool: "cursor", result: "copied" })]);
  });

  it("copies multiple tools", async () => {
    const tmpDir2 = await mkdtemp(join(tmpdir(), "au-agentic-multi-"));
    const results = await copyFilesToProject(tmpDir2, ["cursor", "claude"], {
      confirmOverwrite: async () => true,
    });

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.result === "copied")).toBe(true);
    await rm(tmpDir2, { recursive: true, force: true });
  });

  it("skips file when confirmOverwrite returns false", async () => {
    const tmpDir3 = await mkdtemp(join(tmpdir(), "au-agentic-skip-"));
    // First copy to create the file
    await copyFilesToProject(tmpDir3, ["cursor"], { confirmOverwrite: async () => true });
    // Second copy with skip
    const results = await copyFilesToProject(tmpDir3, ["cursor"], {
      confirmOverwrite: async () => false,
    });

    expect(results[0]?.result).toBe("skipped");
    await rm(tmpDir3, { recursive: true, force: true });
  });

  it("records failure when write throws", async () => {
    const results = await copyFilesToProject("/nonexistent/readonly/path", ["cursor"], {
      confirmOverwrite: async () => true,
    });

    expect(results[0]?.result).toBe("failed");
    expect(results[0]?.error).toBeDefined();
  });

  it("does not track copy state after copyFilesToProject returns", async () => {
    const tmpDir4 = await mkdtemp(join(tmpdir(), "au-agentic-state-"));
    await copyFilesToProject(tmpDir4, ["cursor"], { confirmOverwrite: async () => true });

    const results = await copyFilesToProject(tmpDir4, ["cursor"], {
      confirmOverwrite: async () => true,
    });

    expect(results[0]?.status).toBe("overwrite");
    expect(results[0]?.result).toBe("copied");
    await rm(tmpDir4, { recursive: true, force: true });
  });

  it("uses skill path for cursor and claude, prompt path for copilot, skill path for codex", () => {
    expect(getTargetPath("cursor")).toBe(".cursor/skills/interview/SKILL.md");
    expect(getTargetPath("claude")).toBe(".claude/skills/interview/SKILL.md");
    expect(getTargetPath("copilot")).toBe(".github/prompts/interview.prompt.md");
    expect(getTargetPath("codex")).toBe(".agents/skills/interview/SKILL.md");
  });
});
