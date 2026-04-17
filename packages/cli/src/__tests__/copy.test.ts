import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyFilesToProject } from "#steps/copy";
import { fileExists } from "#utils/files";
import { filesForSkillTool, type Skill } from "#utils/templates";

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "au-agentic-copy-test-"));
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

const INTERVIEW_ONLY: Skill[] = ["interview"];

describe("copyFilesToProject", () => {
  it("copies cursor interview template to correct target path", async () => {
    const results = await copyFilesToProject(tmpDir, ["cursor"], INTERVIEW_ONLY, {
      confirmOverwrite: async () => true,
    });

    const expected = filesForSkillTool("interview", "cursor").map((f) =>
      join(tmpDir, f.targetPath),
    );
    for (const p of expected) {
      expect(await fileExists(p)).toBe(true);
    }
    expect(results.every((r) => r.result === "copied")).toBe(true);
    expect(results.map((r) => r.tool)).toContain("cursor");
  });

  it("copies multiple tools for interview", async () => {
    const tmpDir2 = await mkdtemp(join(tmpdir(), "au-agentic-multi-"));
    const tools = ["cursor", "claude", "copilot", "codex"] as const;
    const results = await copyFilesToProject(tmpDir2, [...tools], INTERVIEW_ONLY, {
      confirmOverwrite: async () => true,
    });

    for (const tool of tools) {
      const expected = filesForSkillTool("interview", tool).map((f) => join(tmpDir2, f.targetPath));
      for (const p of expected) {
        expect(await fileExists(p)).toBe(true);
      }
    }
    expect(results.every((r) => r.result === "copied")).toBe(true);
    await rm(tmpDir2, { recursive: true, force: true });
  });

  it("skips file when confirmOverwrite returns false", async () => {
    const tmpDir3 = await mkdtemp(join(tmpdir(), "au-agentic-skip-"));
    await copyFilesToProject(tmpDir3, ["cursor"], INTERVIEW_ONLY, {
      confirmOverwrite: async () => true,
    });
    const results = await copyFilesToProject(tmpDir3, ["cursor"], INTERVIEW_ONLY, {
      confirmOverwrite: async () => false,
    });

    expect(results.some((r) => r.result === "skipped")).toBe(true);
    await rm(tmpDir3, { recursive: true, force: true });
  });

  it("records failure when write throws", async () => {
    const results = await copyFilesToProject(
      "/nonexistent/readonly/path",
      ["cursor"],
      INTERVIEW_ONLY,
      { confirmOverwrite: async () => true },
    );

    expect(results.some((r) => r.result === "failed")).toBe(true);
    expect(results.find((r) => r.result === "failed")?.error).toBeDefined();
  });

  it("does not track copy state after copyFilesToProject returns", async () => {
    const tmpDir4 = await mkdtemp(join(tmpdir(), "au-agentic-state-"));
    await copyFilesToProject(tmpDir4, ["cursor"], INTERVIEW_ONLY, {
      confirmOverwrite: async () => true,
    });

    const results = await copyFilesToProject(tmpDir4, ["cursor"], INTERVIEW_ONLY, {
      confirmOverwrite: async () => true,
    });

    expect(results.every((r) => r.status === "overwrite")).toBe(true);
    expect(results.every((r) => r.result === "copied")).toBe(true);
    await rm(tmpDir4, { recursive: true, force: true });
  });

  it("multi-skill scaffold writes javascript-patterns refs under each tool", async () => {
    const freshDir = await mkdtemp(join(tmpdir(), "au-agentic-multiskill-"));
    try {
      const results = await copyFilesToProject(freshDir, ["claude"], ["javascript-patterns"], {
        confirmOverwrite: async () => true,
      });

      const copied = results.filter((r) => r.result === "copied").map((r) => r.targetPath);
      expect(copied.some((p) => p.endsWith(".claude/skills/javascript-patterns/SKILL.md"))).toBe(
        true,
      );
      expect(copied.some((p) => p.endsWith(".claude/skills/javascript-patterns/LICENSE"))).toBe(
        true,
      );
      expect(copied.filter((p) => p.includes("/references/")).length).toBe(29);
    } finally {
      await rm(freshDir, { recursive: true, force: true });
    }
  });
});
