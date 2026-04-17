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
  expect((calls[0]!.args[0] as string)).toContain("bench");
  expect((calls[2]!.args[0] as number)).toBe(1);
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

test("heartbeat ticks taskLog.message at ~1s while turn open (DEC-031)", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });

  // Real timer sleep — keep the window small to avoid perf-gate bloat.
  await new Promise((r) => setTimeout(r, 1_200));
  await ui.turnEnd({ pass: true, durationMs: 1_200 });

  const hbMessages = taskLogCalls
    .filter((c) => c.name === "message")
    .map((c) => String(c.args[0]));
  const heartbeats = hbMessages.filter((m) => m.includes("elapsed"));
  expect(heartbeats.length).toBeGreaterThanOrEqual(1);
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
