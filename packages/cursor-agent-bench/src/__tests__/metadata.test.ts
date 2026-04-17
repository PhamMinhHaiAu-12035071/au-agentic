import { expect, test } from "bun:test";
import { collectMetadata, shortSha256 } from "#src/metadata";

test("shortSha256 returns 8-char lowercase hex", () => {
  const h = shortSha256("hello world");
  expect(h).toMatch(/^[0-9a-f]{8}$/);
  expect(h).toBe("b94d27b9");
});

test("collectMetadata assembles commit + checksum + env via DI", async () => {
  const meta = await collectMetadata({
    readSkillFile: async () => "SKILL content",
    readGitSha: async () => "a1b2c3d4",
    readBunVersion: async () => "1.3.10",
    readCursorAgentVersion: async () => "2.4.1",
    readPlatform: async () => "darwin 24.6",
  });
  expect(meta.commit).toBe("a1b2c3d4");
  expect(meta.skillChecksum).toMatch(/^[0-9a-f]{8}$/);
  expect(meta.env.bun).toBe("1.3.10");
  expect(meta.env.cursorAgent).toBe("2.4.1");
  expect(meta.env.platform).toBe("darwin 24.6");
});

test("collectMetadata uses commit='unknown' when git spawn fails", async () => {
  const meta = await collectMetadata({
    readSkillFile: async () => "x",
    readGitSha: async () => null,
    readBunVersion: async () => "1.3.10",
    readCursorAgentVersion: async () => "2.4.1",
    readPlatform: async () => "darwin 24.6",
  });
  expect(meta.commit).toBe("unknown");
});

test("collectMetadata uses cursorAgent='unknown' when CLI spawn fails", async () => {
  const meta = await collectMetadata({
    readSkillFile: async () => "x",
    readGitSha: async () => "a1b2c3d4",
    readBunVersion: async () => "1.3.10",
    readCursorAgentVersion: async () => null,
    readPlatform: async () => "darwin 24.6",
  });
  expect(meta.env.cursorAgent).toBe("unknown");
});
