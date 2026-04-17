import { expect, test } from "bun:test";
import type { BenchConfig, BenchResult, Fixture } from "#src/types";

test("Fixture type accepts minimal shape", () => {
  const f: Fixture = {
    id: "x",
    skill: "y",
    description: "z",
    turns: [{ prompt: "p", assertions: [] }],
  };
  expect(f.id).toBe("x");
});

test("BenchResult discriminates mode", () => {
  const r: BenchResult = {
    startedAt: "2026-04-17",
    finishedAt: "2026-04-17",
    mode: "smoke",
    models: ["m"],
    fixtureIds: ["f"],
    runs: 1,
    turns: [],
    passCount: 0,
    totalCount: 0,
    wallClockMs: 0,
    metadata: {
      commit: "unknown",
      skillChecksum: "00000000",
      env: { bun: "1.3.10", cursorAgent: "unknown", platform: "darwin" },
    },
  };
  expect(r.mode).toBe("smoke");
});

test("BenchConfig requires retry shape", () => {
  const c: BenchConfig = {
    models: ["a"],
    defaultModel: "a",
    defaultRuns: 1,
    matrixRuns: 3,
    perTurnTimeoutMs: 120_000,
    perFixtureDeadlineMs: 1_200_000,
    maxTurns: 20,
    retry: { max: 1, delayMs: 2_000 },
    trackerDir: "t",
    jsonlDir: "j",
    fixturesDir: "f",
  };
  expect(c.retry.max).toBe(1);
});
