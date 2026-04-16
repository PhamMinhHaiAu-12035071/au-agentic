import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import {
  ensureDir,
  fileExists,
  hasWritePermission,
  isDirectory,
  writeTemplate,
} from "../utils/files";

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "au-agentic-test-"));
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("isDirectory", () => {
  it("returns true for a real directory", async () => {
    expect(await isDirectory(tmpDir)).toBe(true);
  });

  it("returns false for a file", async () => {
    const file = join(tmpDir, "test.txt");
    await writeFile(file, "hello");
    expect(await isDirectory(file)).toBe(false);
  });

  it("returns false for non-existent path", async () => {
    expect(await isDirectory(join(tmpDir, "nope"))).toBe(false);
  });
});

describe("fileExists", () => {
  it("returns true for existing file", async () => {
    const file = join(tmpDir, "exists.txt");
    await writeFile(file, "hi");
    expect(await fileExists(file)).toBe(true);
  });

  it("returns false for non-existent file", async () => {
    expect(await fileExists(join(tmpDir, "missing.txt"))).toBe(false);
  });
});

describe("hasWritePermission", () => {
  it("returns true for writable directory", async () => {
    expect(await hasWritePermission(tmpDir)).toBe(true);
  });
});

describe("ensureDir", () => {
  it("creates nested directories", async () => {
    const nested = join(tmpDir, "a", "b", "c");
    await ensureDir(nested);
    expect(await isDirectory(nested)).toBe(true);
  });

  it("does not throw if directory already exists", async () => {
    await expect(ensureDir(tmpDir)).resolves.toBeUndefined();
  });
});

describe("writeTemplate", () => {
  it("writes content to file, creating parent dirs", async () => {
    const dest = join(tmpDir, "nested", "dir", "output.md");
    await writeTemplate("# Hello\n", dest);
    const content = await readFile(dest, "utf-8");
    expect(content).toBe("# Hello\n");
  });

  it("overwrites existing file", async () => {
    const dest = join(tmpDir, "overwrite.md");
    await writeTemplate("original", dest);
    await writeTemplate("updated", dest);
    const content = await readFile(dest, "utf-8");
    expect(content).toBe("updated");
  });
});
