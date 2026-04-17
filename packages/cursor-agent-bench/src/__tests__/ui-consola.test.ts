import { afterEach, beforeEach, expect, mock, test } from "bun:test";

const logCalls: Array<{ tag: string; level: string; msg: string }> = [];

function makeTagged(tag: string) {
  return {
    start: (msg: string) => logCalls.push({ tag, level: "start", msg }),
    success: (msg: string) => logCalls.push({ tag, level: "success", msg }),
    info: (msg: string) => logCalls.push({ tag, level: "info", msg }),
    error: (msg: string) => logCalls.push({ tag, level: "error", msg }),
  };
}

mock.module("consola", () => ({
  consola: {
    withTag: (tag: string) => makeTagged(tag),
  },
}));

import { createConsolaUI } from "#src/ui/consola-ui";

beforeEach(() => {
  logCalls.length = 0;
});

afterEach(() => {
  logCalls.length = 0;
});

test("consola adapter: intro -> start on 'bench' tag", async () => {
  const ui = createConsolaUI();
  await ui.intro("hello");
  expect(logCalls).toContainEqual({ tag: "bench", level: "start", msg: "hello" });
});

test("turnLine emits plain info per line (no ANSI)", async () => {
  const ui = createConsolaUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });
  ui.turnLine("alpha");
  ui.turnLine("beta");
  await ui.turnEnd({ pass: true, durationMs: 5 });

  const streamed = logCalls.filter((c) => c.level === "info" && c.tag === "bench");
  const msgs = streamed.map((c) => c.msg);
  expect(msgs).toContain("alpha");
  expect(msgs).toContain("beta");
  // ANSI escape should never appear; consola default reporter handles non-TTY.
  for (const { msg } of streamed) {
    expect(msg).not.toMatch(new RegExp("\x1b\\["));
  }
});

test("turnEnd pass=false emits error with reason", async () => {
  const ui = createConsolaUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });
  await ui.turnEnd({ pass: false, durationMs: 10, reason: "turn-timeout" });
  const errs = logCalls.filter((c) => c.level === "error");
  expect(errs.length).toBeGreaterThan(0);
  expect(errs[0]!.msg).toContain("turn-timeout");
});

test("turnStart then quick turnEnd does not emit heartbeat tick", async () => {
  const ui = createConsolaUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  const before = logCalls.length;
  await ui.turnStart({ turn: 0, prompt: "p" });
  // Immediately end — 30s heartbeat should not have fired.
  await ui.turnEnd({ pass: true, durationMs: 1 });
  // Sanity: start + end each emit at least one log line.
  expect(logCalls.length).toBeGreaterThan(before);
  // Specifically, no "still running" heartbeat should appear.
  const heartbeats = logCalls.filter((c) => c.msg.includes("still running"));
  expect(heartbeats).toHaveLength(0);
});
