import { resolve } from "node:path";
import { consola } from "consola";
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

function formatMs(ms: number): string {
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

async function main(): Promise<number> {
  // ---- Phase A: consola (before loop) ---------------------------------
  let args: ReturnType<typeof parseCliArgs>;
  try {
    args = parseCliArgs(process.argv.slice(2));
  } catch (e) {
    consola.error(`arg parse: ${(e as Error).message}`);
    consola.info(HELP_TEXT);
    return 4;
  }
  if (args.help) {
    consola.info(HELP_TEXT);
    return 0;
  }

  const preflightLog = consola.withTag("preflight");
  preflightLog.start("Checking cursor-agent CLI + login");
  const pre = await preflightCheck();
  if (!pre.ok) {
    preflightLog.error(pre.message ?? "preflight failed");
    return pre.exitCode;
  }
  preflightLog.success("OK");

  const fixturesDir = resolve(import.meta.dirname, "..", config.fixturesDir);
  let fixtures: Fixture[];
  try {
    fixtures = args.fixture
      ? [await loadFixtureById(fixturesDir, args.fixture)]
      : await loadAllFixtures(fixturesDir);
  } catch (e) {
    consola.error(`fixture load: ${(e as Error).message}`);
    return 4;
  }

  const models = args.mode === "matrix" ? config.models : [args.model ?? config.defaultModel];
  const runs = args.runs ?? (args.mode === "matrix" ? config.matrixRuns : config.defaultRuns);
  const totalCells = fixtures.length * models.length * runs;

  consola
    .withTag("config")
    .info(
      `mode=${args.mode} models=[${models.join(",")}] runs=${runs} fixtures=${fixtures.length} totalCells=${totalCells}`,
    );

  // ---- Phase B: adapter (in-loop) -------------------------------------
  const ui = createBenchUI({ isTty: Boolean(process.stdout.isTTY) });
  await ui.intro("⚡ cursor-agent-bench");
  await ui.progressStart({ max: totalCells });

  const startedAt = new Date();
  const startTs = Date.now();
  const bySkill = new Map<string, TurnResult[]>();
  const metadataBySkill = new Map<string, ReproMetadata>();
  const jsonlRoot = resolve(import.meta.dirname, "..", config.jsonlDir);
  let passCount = 0;
  let totalCount = 0;
  let cellIdx = 0;

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
        cellIdx++;
        await ui.cellStart({
          idx: cellIdx,
          total: totalCells,
          fixture: fx.id,
          model,
          runIndex: r,
        });

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

        const cellPass = turns.every((t) => t.pass);
        const cellMs = turns.reduce((s, t) => s + t.durationMs, 0);
        await ui.cellEnd({ pass: cellPass, durationMs: cellMs });

        totalCount += turns.length;
        passCount += turns.filter((t) => t.pass).length;
        const arr = bySkill.get(fx.skill) ?? [];
        arr.push(...turns);
        bySkill.set(fx.skill, arr);
      }
    }
  }

  await ui.progressStop("Bench finished");
  await ui.outro(`Tracker dir: ${config.trackerDir}`);

  // ---- Phase C: consola (after loop) ----------------------------------
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

  consola.box(
    `Result: ${passCount}/${totalCount} pass | ${formatMs(wallClockMs)} | mode=${args.mode}`,
  );
  if (passCount === totalCount) consola.success("All cells pass");
  else consola.error(`${totalCount - passCount} cells failed`);

  return passCount === totalCount ? 0 : 1;
}

const code = await main();
process.exit(code);
