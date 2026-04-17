import type { AggregateReport, BenchResult, CellStats, ModelRanking, TurnResult } from "#src/types";

/**
 * Nearest-rank percentile over a numeric sample.
 *
 * Sorts a copy ascending. Empty input returns 0.
 * Index = min(n-1, ceil(p/100 * n) - 1), clamped to [0, n-1].
 */
export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const raw = Math.ceil((p / 100) * sorted.length) - 1;
  const idx = Math.max(0, Math.min(sorted.length - 1, raw));
  // idx is within [0, length-1] — safe to non-null assert
  return sorted[idx]!;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sum = xs.reduce((a, b) => a + b, 0);
  return Math.round(sum / xs.length);
}

function computeCells(turns: TurnResult[]): CellStats[] {
  const groups = new Map<string, TurnResult[]>();
  for (const t of turns) {
    const key = `${t.fixture}|${t.model}`;
    const arr = groups.get(key);
    if (arr) arr.push(t);
    else groups.set(key, [t]);
  }

  const cells: CellStats[] = [];
  for (const [key, group] of groups) {
    const [fixture, model] = key.split("|") as [string, string];
    const durations = group.map((t) => t.durationMs);
    const passCount = group.filter((t) => t.pass).length;
    const totalCount = group.length;

    // Turn mean: average turn count per runIndex
    const perRun = new Map<number, number>();
    for (const t of group) {
      perRun.set(t.runIndex, (perRun.get(t.runIndex) ?? 0) + 1);
    }
    const turnCounts = Array.from(perRun.values());

    cells.push({
      fixture,
      model,
      passCount,
      totalCount,
      passRate: totalCount === 0 ? 0 : passCount / totalCount,
      meanMs: mean(durations),
      p50Ms: percentile(durations, 50),
      p95Ms: percentile(durations, 95),
      turnMean: mean(turnCounts),
      retries: group.filter((t) => t.retried).length,
      timeouts: group.filter((t) => t.reason === "turn-timeout").length,
      budgetExceeded: group.filter((t) => t.reason === "budget-exceeded").length,
    });
  }
  return cells;
}

function computeRanking(turns: TurnResult[]): ModelRanking[] {
  const groups = new Map<string, TurnResult[]>();
  for (const t of turns) {
    const arr = groups.get(t.model);
    if (arr) arr.push(t);
    else groups.set(t.model, [t]);
  }
  const rows: ModelRanking[] = [];
  for (const [model, group] of groups) {
    const passCount = group.filter((t) => t.pass).length;
    const totalCount = group.length;
    rows.push({
      rank: 0, // assigned after sort
      model,
      passCount,
      totalCount,
      passRate: totalCount === 0 ? 0 : passCount / totalCount,
      meanMs: mean(group.map((t) => t.durationMs)),
    });
  }
  rows.sort((a, b) => {
    if (b.passRate !== a.passRate) return b.passRate - a.passRate;
    return a.meanMs - b.meanMs;
  });
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function aggregate(result: BenchResult): AggregateReport {
  const { turns } = result;
  const totalRetries = turns.filter((t) => t.retried).length;
  const totalTimeouts = turns.filter((t) => t.reason === "turn-timeout").length;
  const totalBudgetExceeded = turns.filter((t) => t.reason === "budget-exceeded").length;
  const overallPass = turns.filter((t) => t.pass).length;
  const overallTotal = turns.length;

  return {
    summary: {
      mode: result.mode,
      models: result.models,
      fixtures: result.fixtureIds,
      runsPerCell: result.runs,
      overallPass,
      overallTotal,
      overallPassRate: overallTotal === 0 ? 0 : overallPass / overallTotal,
      wallClockMs: result.wallClockMs,
      totalRetries,
      totalTimeouts,
      totalBudgetExceeded,
      metadata: result.metadata,
    },
    cells: computeCells(turns),
    ranking: computeRanking(turns),
  };
}
