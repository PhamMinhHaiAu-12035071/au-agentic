import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runFixture, type SpawnFn } from "#src/runner";
import type { BenchConfig, Fixture, ReproMetadata } from "#src/types";
import type { BenchUI } from "#src/ui/types";

const meta: ReproMetadata = {
  commit: "c0ffee12",
  skillChecksum: "deadbeef",
  env: { bun: "x", cursorAgent: "y", platform: "z" },
};
const config: BenchConfig = {
  models: ["m"],
  defaultModel: "m",
  defaultRuns: 1,
  matrixRuns: 1,
  perTurnTimeoutMs: 10_000,
  perFixtureDeadlineMs: 60_000,
  maxTurns: 10,
  retry: { max: 0, delayMs: 0 },
  trackerDir: "/tmp/t",
  jsonlDir: "/tmp/j",
  fixturesDir: "/tmp/f",
};

const fixture: Fixture = {
  id: "fx",
  skill: "s",
  description: "d",
  turns: [{ prompt: "say", assertions: [{ kind: "includes", pattern: "ok" }] }],
};

function makeFakeUI() {
  const events: string[] = [];
  const ui: BenchUI = {
    async intro() {
      return;
    },
    async progressStart() {
      return;
    },
    async cellStart() {
      return;
    },
    async turnStart(l) {
      events.push(`turnStart(${l.turn})`);
    },
    turnLine(line) {
      events.push(`turnLine(${line})`);
    },
    async turnEnd(o) {
      events.push(`turnEnd(${o.pass})`);
    },
    async cellEnd() {
      return;
    },
    async progressStop() {
      return;
    },
    async outro() {
      return;
    },
  };
  return { ui, events };
}

test("runner invokes ui.turnStart / turnLine / turnEnd in order", async () => {
  const { ui, events } = makeFakeUI();
  const spawn: SpawnFn = async (args) => {
    // Simulate two lines being streamed, then buffered result.
    args.onStdoutLine?.("alpha");
    args.onStdoutLine?.("ok line");
    return { stdout: "alpha\nok line\n", stderr: "", exitCode: 0, durationMs: 10, timedOut: false };
  };
  const dumpDir = await mkdtemp(join(tmpdir(), "bench-s-"));
  try {
    await runFixture(fixture, {
      config,
      model: "m",
      runIndex: 0,
      metadata: meta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: async () => {
        return;
      },
      ui,
    });
  } finally {
    await rm(dumpDir, { recursive: true, force: true });
  }
  expect(events).toEqual(["turnStart(0)", "turnLine(alpha)", "turnLine(ok line)", "turnEnd(true)"]);
});
