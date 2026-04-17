import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runFixture, type SpawnFn, type SpawnResult } from "#src/runner";
import type { BenchConfig, Fixture, ReproMetadata } from "#src/types";

const fakeMeta: ReproMetadata = {
  commit: "deadbeef",
  skillChecksum: "cafebabe",
  env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "test 0.0" },
};

const baseConfig: BenchConfig = {
  models: ["m1"],
  defaultModel: "m1",
  defaultRuns: 1,
  matrixRuns: 1,
  perTurnTimeoutMs: 10_000,
  perFixtureDeadlineMs: 60_000,
  maxTurns: 10,
  retry: { max: 1, delayMs: 0 },
  trackerDir: "/tmp/tracker",
  jsonlDir: "/tmp/jsonl",
  fixturesDir: "/tmp/fixtures",
};

async function tmp(): Promise<string> {
  return await mkdtemp(join(tmpdir(), "bench-run-"));
}

async function withTmp<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await tmp();
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function ok(stdout: string): SpawnResult {
  return { stdout, stderr: "", exitCode: 0, durationMs: 10, timedOut: false };
}

async function noSleep(_ms: number): Promise<void> {
  return;
}

const fixture1: Fixture = {
  id: "fx1",
  skill: "s1",
  description: "desc",
  turns: [{ prompt: "say hello", assertions: [{ kind: "includes", pattern: "hello" }] }],
};

test("runner returns passing TurnResult when spawn output matches", async () => {
  await withTmp(async (dumpDir) => {
    const spawn: SpawnFn = async () => ok("hello world");
    const results = await runFixture(fixture1, {
      config: baseConfig,
      model: "m1",
      runIndex: 0,
      metadata: fakeMeta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: noSleep,
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.pass).toBe(true);
    expect(results[0]?.retried).toBe(false);
  });
});

test("runner retries once on spawn error, then succeeds", async () => {
  await withTmp(async (dumpDir) => {
    let calls = 0;
    const spawn: SpawnFn = async () => {
      calls++;
      if (calls === 1) throw new Error("boom");
      return ok("hello world");
    };
    const results = await runFixture(fixture1, {
      config: baseConfig,
      model: "m1",
      runIndex: 0,
      metadata: fakeMeta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: noSleep,
    });
    expect(calls).toBe(2);
    expect(results[0]?.pass).toBe(true);
    expect(results[0]?.retried).toBe(true);
  });
});

test("runner marks turn failed on assertion mismatch, no retry", async () => {
  await withTmp(async (dumpDir) => {
    let calls = 0;
    const spawn: SpawnFn = async () => {
      calls++;
      return ok("goodbye world");
    };
    const results = await runFixture(fixture1, {
      config: baseConfig,
      model: "m1",
      runIndex: 0,
      metadata: fakeMeta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: noSleep,
    });
    expect(results[0]?.pass).toBe(false);
    expect(calls).toBe(1);
  });
});

test("runner marks timedOut when spawn reports it", async () => {
  await withTmp(async (dumpDir) => {
    const spawn: SpawnFn = async () => ({
      stdout: "",
      stderr: "",
      exitCode: 124,
      durationMs: 100,
      timedOut: true,
    });
    const results = await runFixture(fixture1, {
      config: { ...baseConfig, retry: { max: 0, delayMs: 0 } },
      model: "m1",
      runIndex: 0,
      metadata: fakeMeta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: noSleep,
    });
    expect(results[0]?.pass).toBe(false);
    expect(results[0]?.timedOut).toBe(true);
  });
});

test("runner kills fixture when per-fixture deadline exceeded (C4, DEC-017)", async () => {
  await withTmp(async (dumpDir) => {
    const shortDeadlineConfig: BenchConfig = { ...baseConfig, perFixtureDeadlineMs: 20 };
    const fx3: Fixture = {
      id: "fx3",
      skill: "s1",
      description: "d",
      turns: [
        { prompt: "p1", assertions: [{ kind: "includes", pattern: "ok" }] },
        { prompt: "p2", assertions: [{ kind: "includes", pattern: "ok" }] },
        { prompt: "p3", assertions: [{ kind: "includes", pattern: "ok" }] },
      ],
    };
    const spawn: SpawnFn = async () => {
      await new Promise((r) => setTimeout(r, 30));
      return ok("ok");
    };
    const results = await runFixture(fx3, {
      config: shortDeadlineConfig,
      model: "m1",
      runIndex: 0,
      metadata: fakeMeta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: noSleep,
    });
    const last = results[results.length - 1];
    expect(last?.reason).toBe("budget-exceeded");
  });
});

test("runner respects fixture.maxTurns override", async () => {
  await withTmp(async (dumpDir) => {
    let calls = 0;
    const spawn: SpawnFn = async () => {
      calls++;
      return ok("ok");
    };
    const fx: Fixture = {
      id: "fx-limit",
      skill: "s1",
      description: "d",
      maxTurns: 2,
      turns: [
        { prompt: "p1", assertions: [{ kind: "includes", pattern: "ok" }] },
        { prompt: "p2", assertions: [{ kind: "includes", pattern: "ok" }] },
      ],
    };
    await runFixture(fx, {
      config: baseConfig,
      model: "m1",
      runIndex: 0,
      metadata: fakeMeta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: noSleep,
    });
    expect(calls).toBe(2);
  });
});

test("runner survives writeDump failure, still emits result with outputDumpPath=undefined (I-4)", async () => {
  // `/dev/null` is a file, so `mkdir /dev/null/nope` fails with ENOTDIR.
  const dumpDir = "/dev/null/nope";
  const spawn: SpawnFn = async () => ok("goodbye world");
  const results = await runFixture(fixture1, {
    config: { ...baseConfig, retry: { max: 0, delayMs: 0 } },
    model: "m1",
    runIndex: 0,
    metadata: fakeMeta,
    dumpDir,
    startedAt: new Date(),
    spawn,
    sleep: noSleep,
  });
  expect(results).toHaveLength(1);
  expect(results[0]?.pass).toBe(false);
  expect(results[0]?.outputDumpPath).toBeUndefined();
});

test("runner embeds metadata + truncates long output + dumps on fail", async () => {
  await withTmp(async (dumpDir) => {
    const longOutput = "x".repeat(20_000);
    const spawn: SpawnFn = async () => ok(longOutput);
    const fx: Fixture = {
      id: "fx-trunc",
      skill: "s1",
      description: "d",
      turns: [
        {
          prompt: "p",
          assertions: [{ kind: "includes", pattern: "never-present-xyz" }],
        },
      ],
    };
    const results = await runFixture(fx, {
      config: baseConfig,
      model: "m1",
      runIndex: 0,
      metadata: fakeMeta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: noSleep,
    });
    const r = results[0];
    if (!r) throw new Error("expected result");
    expect(r.commit).toBe("deadbeef");
    expect(r.skillChecksum).toBe("cafebabe");
    expect(r.env.bun).toBe("1.3.10");
    expect(r.outputTruncated).toBe(true);
    expect(r.originalLen).toBe(20_000);
    expect(r.output.length).toBe(8192);
    expect(r.pass).toBe(false);
    expect(typeof r.outputDumpPath).toBe("string");
  });
});
