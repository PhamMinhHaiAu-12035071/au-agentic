import { resolve } from "node:path";
import { HELP_TEXT, parseCliArgs } from "#src/cli-parse";
import { loadAllFixtures, loadFixtureById } from "#src/fixture";
import { collectMetadata, defaultDeps as metadataDeps } from "#src/metadata";
import { preflightCheck } from "#src/preflight";
import { appendJsonlBatch, jsonlPathFor } from "#src/report/jsonl";
import { renderTracker } from "#src/report/markdown";
import { runFixture } from "#src/runner";
import { spawnCursorAgent } from "#src/spawn-cursor-agent";
import type { BenchResult, Fixture, ReproMetadata, TurnResult } from "#src/types";
import { createBenchUI } from "#src/ui/index";
import config from "../cursor-bench.config";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<number> {
  let args: ReturnType<typeof parseCliArgs>;
  try {
    args = parseCliArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`error: ${(e as Error).message}`);
    console.error(HELP_TEXT);
    return 4;
  }

  if (args.help) {
    console.log(HELP_TEXT);
    return 0;
  }

  const pre = await preflightCheck();
  if (!pre.ok) {
    console.error(`preflight: ${pre.message}`);
    return pre.exitCode;
  }

  const fixturesDir = resolve(import.meta.dirname, "..", config.fixturesDir);
  let fixtures: Fixture[];
  try {
    fixtures = args.fixture
      ? [await loadFixtureById(fixturesDir, args.fixture)]
      : await loadAllFixtures(fixturesDir);
  } catch (e) {
    console.error(`fixture error: ${(e as Error).message}`);
    return 4;
  }

  const models = args.mode === "matrix" ? config.models : [args.model ?? config.defaultModel];
  const runs = args.runs ?? (args.mode === "matrix" ? config.matrixRuns : config.defaultRuns);

  const ui = createBenchUI({ isTty: process.stdout.isTTY ?? false });

  const startedAt = new Date();
  const startTs = Date.now();
  const bySkill = new Map<string, TurnResult[]>();
  const metadataBySkill = new Map<string, ReproMetadata>();
  const jsonlRoot = resolve(import.meta.dirname, "..", config.jsonlDir);
  let passCount = 0;
  let totalCount = 0;

  for (const fx of fixtures) {
    let meta = metadataBySkill.get(fx.skill);
    if (!meta) {
      const skillPath = resolve(
        import.meta.dirname,
        "..",
        "..",
        "templates",
        fx.skill,
        "claude",
        "SKILL.md",
      );
      meta = await collectMetadata(metadataDeps(skillPath));
      metadataBySkill.set(fx.skill, meta);
    }

    for (const model of models) {
      for (let r = 0; r < runs; r++) {
        const turns = await runFixture(fx, {
          config,
          model,
          runIndex: r,
          metadata: meta,
          dumpDir: jsonlRoot,
          startedAt,
          spawn: spawnCursorAgent,
          sleep,
          ui,
        });
        totalCount += turns.length;
        passCount += turns.filter((t) => t.pass).length;
        const arr = bySkill.get(fx.skill) ?? [];
        arr.push(...turns);
        bySkill.set(fx.skill, arr);
      }
    }
  }

  const finishedAt = new Date();
  const wallClockMs = Date.now() - startTs;
  const trackerRoot = resolve(import.meta.dirname, "..", config.trackerDir);

  for (const [skill, turns] of bySkill) {
    const meta = metadataBySkill.get(skill);
    if (!meta) continue;
    const result: BenchResult = {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      mode: args.mode,
      models,
      fixtureIds: [...new Set(turns.map((t) => t.fixture))],
      runs,
      passCount: turns.filter((t) => t.pass).length,
      totalCount: turns.length,
      wallClockMs,
      metadata: meta,
      turns,
    };
    await appendJsonlBatch(jsonlPathFor(jsonlRoot, skill, startedAt), turns);
    await renderTracker(`${trackerRoot}/${skill}.md`, skill, result);
  }

  console.log(`bench: ${passCount}/${totalCount} pass (${args.mode} mode)`);
  return passCount === totalCount ? 0 : 1;
}

const code = await main();
process.exit(code);
