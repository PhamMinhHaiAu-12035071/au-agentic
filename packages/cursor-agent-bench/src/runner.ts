import { evalAssertion } from "#src/eval/l1";
import { truncateOutput, writeDump } from "#src/truncate";
import type { AssertionResult, BenchConfig, Fixture, ReproMetadata, TurnResult } from "#src/types";

export interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  sessionId?: string;
}

export interface SpawnArgs {
  model: string;
  prompt: string;
  resumeId?: string;
  timeoutMs: number;
}

export type SpawnFn = (args: SpawnArgs) => Promise<SpawnResult>;

export interface RunFixtureOpts {
  config: BenchConfig;
  model: string;
  runIndex: number;
  metadata: ReproMetadata;
  dumpDir: string;
  startedAt: Date;
  spawn: SpawnFn;
  sleep: (ms: number) => Promise<void>;
}

export async function runFixture(fixture: Fixture, opts: RunFixtureOpts): Promise<TurnResult[]> {
  const { config, model, runIndex, metadata, dumpDir, startedAt, spawn, sleep } = opts;
  const results: TurnResult[] = [];
  const cap = Math.min(fixture.turns.length, fixture.maxTurns ?? config.maxTurns);
  const deadline = Date.now() + config.perFixtureDeadlineMs;
  let resumeId: string | undefined;

  const baseMetadata = {
    commit: metadata.commit,
    skillChecksum: metadata.skillChecksum,
    env: metadata.env,
  };

  function budgetExceededResult(i: number, prompt: string): TurnResult {
    return {
      skill: fixture.skill,
      fixture: fixture.id,
      model,
      runIndex,
      turn: i,
      input: prompt,
      output: "",
      outputTruncated: false,
      originalLen: 0,
      durationMs: 0,
      exitCode: -1,
      pass: false,
      assertions: [],
      retried: false,
      timedOut: true,
      reason: "budget-exceeded",
      ...baseMetadata,
    };
  }

  for (let i = 0; i < cap; i++) {
    const turn = fixture.turns[i];
    if (!turn) break;
    const prompt = turn.prompt;

    if (Date.now() >= deadline) {
      results.push(budgetExceededResult(i, prompt));
      break;
    }

    const remaining = Math.max(0, deadline - Date.now());
    const timeoutMs = Math.min(turn.timeoutMs ?? config.perTurnTimeoutMs, remaining);
    if (timeoutMs === 0) {
      results.push(budgetExceededResult(i, prompt));
      break;
    }

    let spawnRes: SpawnResult | undefined;
    let retried = false;
    const maxAttempts = config.retry.max;
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        spawnRes = await spawn({ model, prompt, resumeId, timeoutMs });
        if (spawnRes.timedOut && attempt < maxAttempts) {
          retried = true;
          await sleep(config.retry.delayMs);
          continue;
        }
        break;
      } catch {
        if (attempt < maxAttempts) {
          retried = true;
          await sleep(config.retry.delayMs);
          continue;
        }
        spawnRes = undefined;
        break;
      }
    }

    if (!spawnRes) {
      results.push({
        skill: fixture.skill,
        fixture: fixture.id,
        model,
        runIndex,
        turn: i,
        input: prompt,
        output: "",
        outputTruncated: false,
        originalLen: 0,
        durationMs: 0,
        exitCode: -1,
        pass: false,
        assertions: [],
        retried,
        timedOut: false,
        reason: "spawn-error",
        ...baseMetadata,
      });
      break;
    }

    if (spawnRes.sessionId) {
      resumeId = spawnRes.sessionId;
    }

    const finalSpawn: SpawnResult = spawnRes;
    const assertions: AssertionResult[] = turn.assertions.map((a) =>
      evalAssertion(a, { output: finalSpawn.stdout, exitCode: finalSpawn.exitCode }),
    );
    const allOk = assertions.every((a) => a.ok);
    const pass = !finalSpawn.timedOut && finalSpawn.exitCode === 0 && allOk;
    const reason: TurnResult["reason"] = pass
      ? undefined
      : finalSpawn.timedOut
        ? "turn-timeout"
        : "assertion";
    const trunc = truncateOutput(finalSpawn.stdout);
    let outputDumpPath: string | undefined;
    if (!pass) {
      try {
        outputDumpPath = await writeDump({
          dir: dumpDir,
          startedAt,
          skill: fixture.skill,
          fixture: fixture.id,
          model,
          runIndex,
          turn: i,
          output: finalSpawn.stdout,
        });
      } catch {
        // best-effort dump; disk full / permission errors must not crash the runner
        outputDumpPath = undefined;
      }
    }

    results.push({
      skill: fixture.skill,
      fixture: fixture.id,
      model,
      runIndex,
      turn: i,
      input: prompt,
      output: trunc.output,
      outputTruncated: trunc.outputTruncated,
      originalLen: trunc.originalLen,
      outputDumpPath,
      durationMs: finalSpawn.durationMs,
      exitCode: finalSpawn.exitCode,
      pass,
      assertions,
      retried,
      timedOut: finalSpawn.timedOut,
      reason,
      ...baseMetadata,
    });

    if (!pass) break;
  }

  return results;
}
