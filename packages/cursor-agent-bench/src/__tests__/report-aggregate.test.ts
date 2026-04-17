import { expect, test } from "bun:test";
import { aggregate, percentile } from "#src/report/aggregate";
import type { BenchResult, ReproMetadata, TurnResult } from "#src/types";

const fakeMeta: ReproMetadata = {
  commit: "deadbeef",
  skillChecksum: "cafebabe",
  env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "test 0.0" },
};

function mk(model: string, fixture: string, pass: boolean, ms: number, run = 0): TurnResult {
  return {
    skill: "s1",
    fixture,
    model,
    runIndex: run,
    turn: 0,
    input: "",
    output: "",
    outputTruncated: false,
    originalLen: 0,
    durationMs: ms,
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

function mkResult(turns: TurnResult[], overrides: Partial<BenchResult> = {}): BenchResult {
  const models = Array.from(new Set(turns.map((t) => t.model)));
  const fixtureIds = Array.from(new Set(turns.map((t) => t.fixture)));
  return {
    startedAt: "2026-04-17T10:00:00Z",
    finishedAt: "2026-04-17T10:01:00Z",
    mode: "smoke",
    models,
    fixtureIds,
    runs: 1,
    turns,
    passCount: turns.filter((t) => t.pass).length,
    totalCount: turns.length,
    wallClockMs: 60_000,
    metadata: fakeMeta,
    ...overrides,
  };
}

test("percentile returns p50 and p95 for [1..10]", () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  expect(percentile(xs, 50)).toBe(5);
  expect(percentile(xs, 95)).toBe(10);
});

test("percentile handles single element", () => {
  expect(percentile([42], 50)).toBe(42);
  expect(percentile([42], 95)).toBe(42);
});

test("percentile returns 0 for empty array", () => {
  expect(percentile([], 50)).toBe(0);
  expect(percentile([], 95)).toBe(0);
});

test("aggregate computes per-cell pass_rate, mean, p50, p95", () => {
  const turns: TurnResult[] = [
    mk("m1", "f1", true, 100, 0),
    mk("m1", "f1", true, 200, 1),
    mk("m1", "f1", false, 300, 2),
  ];
  const report = aggregate(mkResult(turns));
  expect(report.cells).toHaveLength(1);
  const cell = report.cells[0]!;
  expect(cell.fixture).toBe("f1");
  expect(cell.model).toBe("m1");
  expect(cell.passCount).toBe(2);
  expect(cell.totalCount).toBe(3);
  expect(cell.passRate).toBeCloseTo(2 / 3, 5);
  expect(cell.meanMs).toBe(200);
  expect(cell.p50Ms).toBe(200);
});

test("aggregate builds per-model ranking sorted by pass_rate desc then mean asc", () => {
  const turns: TurnResult[] = [
    // fast-fail: 0/2, fast
    mk("fast-fail", "f1", false, 50, 0),
    mk("fast-fail", "f1", false, 60, 1),
    // slow-pass: 2/2 @ 1000ms
    mk("slow-pass", "f1", true, 1000, 0),
    mk("slow-pass", "f1", true, 1000, 1),
    // fast-pass: 2/2 @ 100ms
    mk("fast-pass", "f1", true, 100, 0),
    mk("fast-pass", "f1", true, 100, 1),
  ];
  const report = aggregate(mkResult(turns));
  expect(report.ranking.map((r) => r.model)).toEqual(["fast-pass", "slow-pass", "fast-fail"]);
  expect(report.ranking[0]!.rank).toBe(1);
  expect(report.ranking[1]!.rank).toBe(2);
  expect(report.ranking[2]!.rank).toBe(3);
});

test("aggregate sums retries, timeouts, budgetExceeded into summary", () => {
  const turns: TurnResult[] = [
    { ...mk("m1", "f1", true, 100, 0), retried: true },
    { ...mk("m1", "f1", false, 100, 1), reason: "turn-timeout" },
    { ...mk("m1", "f1", false, 100, 2), reason: "budget-exceeded" },
    { ...mk("m1", "f1", false, 100, 3), reason: "turn-timeout", retried: true },
  ];
  const report = aggregate(mkResult(turns));
  expect(report.summary.totalRetries).toBe(2);
  expect(report.summary.totalTimeouts).toBe(2);
  expect(report.summary.totalBudgetExceeded).toBe(1);
});
