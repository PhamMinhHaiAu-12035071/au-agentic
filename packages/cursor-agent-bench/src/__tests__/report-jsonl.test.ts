import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendJsonlBatch, jsonlPathFor } from "#src/report/jsonl";
import type { ReproMetadata, TurnResult } from "#src/types";

const fakeMeta: ReproMetadata = {
  commit: "deadbeef",
  skillChecksum: "cafebabe",
  env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "test 0.0" },
};

function turn(fixture: string, pass: boolean): TurnResult {
  return {
    skill: "interview",
    fixture,
    model: "m1",
    runIndex: 0,
    turn: 0,
    input: "in",
    output: "out",
    outputTruncated: false,
    originalLen: 3,
    durationMs: 42,
    exitCode: pass ? 0 : 1,
    pass,
    assertions: [],
    retried: false,
    timedOut: false,
    commit: fakeMeta.commit,
    skillChecksum: fakeMeta.skillChecksum,
    env: fakeMeta.env,
  };
}

async function tmp(): Promise<string> {
  return await mkdtemp(join(tmpdir(), "bench-jsonl-"));
}

async function withTmp<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await tmp();
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("jsonlPathFor builds timestamped filename", () => {
  const p = jsonlPathFor("/tmp/x", "interview", new Date("2026-04-17T10:42:00Z"));
  expect(p).toMatch(/2026-04-17T10-42-00.+interview\.jsonl$/);
});

test("appendJsonlBatch writes one line per TurnResult", async () => {
  await withTmp(async (dir) => {
    const file = join(dir, "out.jsonl");
    const turns = [turn("f1", true), turn("f2", false)];
    await appendJsonlBatch(file, turns);
    const content = await readFile(file, "utf8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    const first = JSON.parse(lines[0]!);
    expect(first.fixture).toBe("f1");
    expect(first.pass).toBe(true);
    const second = JSON.parse(lines[1]!);
    expect(second.fixture).toBe("f2");
    expect(second.pass).toBe(false);
  });
});

test("appendJsonlBatch is idempotent — appends across calls", async () => {
  await withTmp(async (dir) => {
    const file = join(dir, "nested", "out.jsonl");
    await appendJsonlBatch(file, [turn("f1", true)]);
    await appendJsonlBatch(file, [turn("f2", true), turn("f3", false)]);
    const content = await readFile(file, "utf8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0]!).fixture).toBe("f1");
    expect(JSON.parse(lines[1]!).fixture).toBe("f2");
    expect(JSON.parse(lines[2]!).fixture).toBe("f3");
  });
});
