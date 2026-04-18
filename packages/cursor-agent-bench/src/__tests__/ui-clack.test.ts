import { afterEach, beforeEach, expect, mock, test } from "bun:test";

// Mock @clack/prompts before importing the adapter.
const calls: Array<{ name: string; args: unknown[] }> = [];

function record(name: string) {
  return (...args: unknown[]) => {
    calls.push({ name, args });
  };
}

const taskLogCalls: Array<{ name: string; args: unknown[] }> = [];
const makeTaskLog = () => ({
  message: (...args: unknown[]) => taskLogCalls.push({ name: "message", args }),
  success: (...args: unknown[]) => taskLogCalls.push({ name: "success", args }),
  error: (...args: unknown[]) => taskLogCalls.push({ name: "error", args }),
});

const makeProgress = () => ({
  advance: record("progress.advance"),
  stop: record("progress.stop"),
});

mock.module("@clack/prompts", () => ({
  intro: record("intro"),
  outro: record("outro"),
  progress: (opts: unknown) => {
    calls.push({ name: "progress", args: [opts] });
    return makeProgress();
  },
  taskLog: (opts: unknown) => {
    calls.push({ name: "taskLog", args: [opts] });
    return makeTaskLog();
  },
}));

import { createClackUI } from "#src/ui/clack-ui";

beforeEach(() => {
  calls.length = 0;
  taskLogCalls.length = 0;
});

afterEach(() => {
  calls.length = 0;
  taskLogCalls.length = 0;
});

test("intro / progressStart / cellStart call clack in order", async () => {
  const ui = createClackUI();
  await ui.intro("⚡ bench");
  await ui.progressStart({ max: 3 });
  await ui.cellStart({ idx: 1, total: 3, fixture: "fx1", model: "m1", runIndex: 0 });
  expect(calls.map((c) => c.name)).toEqual(["intro", "progress", "progress.advance"]);
  expect(calls[0]!.args[0] as string).toContain("bench");
  expect(calls[2]!.args[0] as number).toBe(1);
});

test("turnLine forwards to taskLog.message", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "hello" });
  ui.turnLine("line A");
  ui.turnLine("line B");
  await ui.turnEnd({ pass: true, durationMs: 100 });
  const messages = taskLogCalls.filter((c) => c.name === "message").map((c) => c.args[0]);
  expect(messages).toContain("line A");
  expect(messages).toContain("line B");
});

test("turnEnd(pass=true) calls taskLog.success", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });
  await ui.turnEnd({ pass: true, durationMs: 42 });
  expect(taskLogCalls.map((c) => c.name)).toContain("success");
  expect(taskLogCalls.map((c) => c.name)).not.toContain("error");
});

test("turnEnd(pass=false) calls taskLog.error with reason", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });
  await ui.turnEnd({ pass: false, durationMs: 42, reason: "assertion" });
  expect(taskLogCalls.map((c) => c.name)).toContain("error");
});

test("heartbeat schedules a 1s setInterval that emits 'elapsed' via taskLog.message (DEC-031)", async () => {
  // Spy on setInterval instead of waiting 1s+ of real wall-clock.
  // Invariant: turnStart schedules an interval at HEARTBEAT_MS (1000), whose
  // callback calls taskLog.message with text containing "elapsed". turnEnd clears it.
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const intervals: Array<{ handler: () => void; ms: number; cleared: boolean }> = [];
  let fakeHandle = 1;

  (globalThis as unknown as { setInterval: typeof setInterval }).setInterval = ((
    handler: () => void,
    ms: number,
  ) => {
    const record = { handler, ms, cleared: false };
    intervals.push(record);
    const id = fakeHandle++ as unknown as ReturnType<typeof setInterval>;
    return id;
  }) as typeof setInterval;

  (globalThis as unknown as { clearInterval: typeof clearInterval }).clearInterval = ((
    id: unknown,
  ) => {
    // We don't index by id (only one interval at a time in this adapter); mark last as cleared.
    const last = intervals[intervals.length - 1];
    if (last) last.cleared = true;
    void id;
  }) as typeof clearInterval;

  try {
    const ui = createClackUI();
    await ui.intro("t");
    await ui.progressStart({ max: 1 });
    await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
    await ui.turnStart({ turn: 0, prompt: "p" });

    // One interval should be registered at 1000ms.
    expect(intervals.length).toBe(1);
    expect(intervals[0]?.ms).toBe(1_000);
    expect(intervals[0]?.cleared).toBe(false);

    // Fire the scheduled callback once — it should call taskLog.message with "elapsed".
    intervals[0]?.handler();
    const hbMessages = taskLogCalls
      .filter((c) => c.name === "message")
      .map((c) => String(c.args[0]));
    expect(hbMessages.some((m) => m.includes("elapsed"))).toBe(true);

    // turnEnd clears the interval.
    await ui.turnEnd({ pass: true, durationMs: 1_000 });
    expect(intervals[0]?.cleared).toBe(true);
  } finally {
    globalThis.setInterval = originalSetInterval;
    globalThis.clearInterval = originalClearInterval;
  }
});

test("progressStop then outro", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.progressStop("done");
  await ui.outro("bye");
  const names = calls.map((c) => c.name);
  expect(names).toContain("progress.stop");
  expect(names).toContain("outro");
});
