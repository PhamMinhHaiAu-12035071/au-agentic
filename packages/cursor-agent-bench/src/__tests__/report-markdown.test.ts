import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderTracker } from "#src/report/markdown";
import type { BenchResult, ReproMetadata, TurnResult } from "#src/types";

const fakeMeta: ReproMetadata = {
  commit: "deadbeef",
  skillChecksum: "cafebabe",
  env: { bun: "1.3.10", cursorAgent: "2.4.1", platform: "darwin 24.6" },
};

function mk(model: string, fixture: string, pass: boolean, ms: number, run = 0): TurnResult {
  return {
    skill: "interview",
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
    wallClockMs: 12_340,
    metadata: fakeMeta,
    ...overrides,
  };
}

async function tmp(): Promise<string> {
  return await mkdtemp(join(tmpdir(), "bench-md-"));
}

async function withTmp<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await tmp();
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("renderTracker emits 3 sections with metadata, percentiles, ranking", async () => {
  await withTmp(async (dir) => {
    const file = join(dir, "interview-bench.md");
    const turns = [
      mk("composer-2-fast", "f1", true, 100, 0),
      mk("composer-2-fast", "f1", true, 200, 1),
    ];
    await renderTracker(file, "interview", mkResult(turns));
    const content = await readFile(file, "utf8");
    expect(content).toContain("# Interview Skill — Bench Tracker");
    expect(content).toContain("## Latest Smoke");
    expect(content).toContain("### 1. Summary");
    expect(content).toContain("### 2. Per-Fixture × Model");
    expect(content).toContain("### 3. Per-Model Ranking");
    expect(content).toContain("pass_rate");
    expect(content).toContain("p50");
    expect(content).toContain("p95");
    expect(content).toContain("composer-2-fast");
    expect(content).toContain("Commit: `deadbeef`");
    expect(content).toContain("Skill checksum: `sha256:cafebabe`");
    expect(content).toContain("Env: bun 1.3.10");
    expect(content).toContain("cursor-agent 2.4.1");
    expect(content).toContain("darwin 24.6");
  });
});

test("renderTracker replaces existing Latest Smoke, preserves Latest Matrix", async () => {
  await withTmp(async (dir) => {
    const file = join(dir, "tracker.md");
    const existing = [
      "# Interview Skill — Bench Tracker",
      "",
      "## Latest Smoke",
      "",
      "OLD_SMOKE_DATA_UNIQUE_TOKEN",
      "",
      "## Latest Matrix",
      "",
      "KEEP_MATRIX_DATA_UNIQUE_TOKEN",
      "",
    ].join("\n");
    await writeFile(file, existing);

    const turns = [mk("m1", "f1", true, 50, 0)];
    await renderTracker(file, "interview", mkResult(turns));

    const content = await readFile(file, "utf8");
    expect(content).not.toContain("OLD_SMOKE_DATA_UNIQUE_TOKEN");
    expect(content).toContain("KEEP_MATRIX_DATA_UNIQUE_TOKEN");
    expect(content).toContain("## Latest Smoke");
    expect(content).toContain("## Latest Matrix");
  });
});

test("renderTracker does not over-match when heading has suffix", async () => {
  await withTmp(async (dir) => {
    const file = join(dir, "tracker.md");
    // Pre-existing file has a `## Latest Smoke More` section (heading with a suffix).
    // When we render a NEW `## Latest Smoke` section, the old regex without an
    // end-of-line anchor would match `## Latest Smoke` as a prefix of the existing
    // heading and clobber its content. The fixed regex must leave it intact.
    const existing = [
      "# Interview Skill — Bench Tracker",
      "",
      "## Latest Smoke More",
      "",
      "SUFFIXED_SECTION_UNIQUE_TOKEN",
      "",
    ].join("\n");
    await writeFile(file, existing);

    const turns = [mk("m1", "f1", true, 50, 0)];
    await renderTracker(file, "interview", mkResult(turns));

    const content = await readFile(file, "utf8");
    // Suffixed section + its content must be preserved.
    expect(content).toContain("## Latest Smoke More");
    expect(content).toContain("SUFFIXED_SECTION_UNIQUE_TOKEN");
    // New `## Latest Smoke` section must have been appended (no prior match).
    expect(content).toContain("## Latest Smoke\n");
  });
});

test("renderTracker matrix mode writes 'Runs per cell: 3'", async () => {
  await withTmp(async (dir) => {
    const file = join(dir, "tracker.md");
    const turns = [
      mk("m1", "f1", true, 100, 0),
      mk("m1", "f1", true, 100, 1),
      mk("m1", "f1", true, 100, 2),
    ];
    await renderTracker(file, "interview", mkResult(turns, { mode: "matrix", runs: 3 }));
    const content = await readFile(file, "utf8");
    expect(content).toContain("## Latest Matrix");
    expect(content).toContain("Runs per cell: 3");
  });
});
