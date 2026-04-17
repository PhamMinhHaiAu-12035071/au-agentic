import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dumpPathFor, TRUNCATE_LIMIT, truncateOutput, writeDump } from "#src/truncate";

test("TRUNCATE_LIMIT is 8192 (8KB)", () => {
  expect(TRUNCATE_LIMIT).toBe(8192);
});

test("truncateOutput leaves short string unchanged", () => {
  const { output, outputTruncated, originalLen } = truncateOutput("hello");
  expect(output).toBe("hello");
  expect(outputTruncated).toBe(false);
  expect(originalLen).toBe(5);
});

test("truncateOutput cuts at 8192 chars and flags truncation", () => {
  const input = "x".repeat(10_000);
  const r = truncateOutput(input);
  expect(r.output.length).toBe(8192);
  expect(r.outputTruncated).toBe(true);
  expect(r.originalLen).toBe(10_000);
});

test("dumpPathFor produces deterministic path format", () => {
  const p = dumpPathFor({
    dir: "/tmp/dump",
    startedAt: new Date("2026-04-17T10:42:00Z"),
    skill: "interview",
    fixture: "interview-phase1",
    model: "gemini-3-flash",
    runIndex: 2,
    turn: 3,
  });
  expect(p).toMatch(
    /2026-04-17T10-42-00.+interview-fixture-interview-phase1-m-gemini-3-flash-r2-t3\.txt$/,
  );
});

test("writeDump writes full output to file and returns path", async () => {
  const dir = await mkdtemp(join(tmpdir(), "bench-dump-"));
  try {
    const path = await writeDump({
      dir,
      startedAt: new Date("2026-04-17T10:42:00Z"),
      skill: "s",
      fixture: "f",
      model: "m",
      runIndex: 0,
      turn: 0,
      output: "FULL LLM OUTPUT",
    });
    const content = await readFile(path, "utf8");
    expect(content).toBe("FULL LLM OUTPUT");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
