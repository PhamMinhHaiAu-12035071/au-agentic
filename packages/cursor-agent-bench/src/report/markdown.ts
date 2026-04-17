import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { aggregate } from "#src/report/aggregate";
import type { BenchResult } from "#src/types";

function cap(s: string): string {
  if (s.length === 0) return s;
  return s[0]!.toUpperCase() + s.slice(1);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmt(n: number): string {
  // Produce `12_340` style grouping using underscore as thousands separator.
  return n.toLocaleString("en-US").replace(/,/g, "_");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderSummary(result: BenchResult): string {
  const { summary } = aggregate(result);
  const lines: string[] = [];
  lines.push("### 1. Summary");
  lines.push("");
  lines.push(`- Mode: ${summary.mode}`);
  lines.push(
    `- Commit: \`${summary.metadata.commit}\` | Skill checksum: \`sha256:${summary.metadata.skillChecksum}\``,
  );
  lines.push(
    `- Env: bun ${summary.metadata.env.bun} | cursor-agent ${summary.metadata.env.cursorAgent} | ${summary.metadata.env.platform}`,
  );
  lines.push(`- Models: ${summary.models.join(", ")}`);
  lines.push(`- Fixtures: ${summary.fixtures.join(", ")}`);
  lines.push(`- Runs per cell: ${summary.runsPerCell}`);
  lines.push(
    `- pass_rate: ${pct(summary.overallPassRate)} (${summary.overallPass}/${summary.overallTotal})`,
  );
  lines.push(`- Wall-clock: ${fmt(summary.wallClockMs)} ms`);
  lines.push(
    `- Retries: ${summary.totalRetries} | Timeouts: ${summary.totalTimeouts} | Budget-exceeded: ${summary.totalBudgetExceeded}`,
  );
  return lines.join("\n");
}

function renderCells(result: BenchResult): string {
  const { cells } = aggregate(result);
  const header = [
    "| Fixture | Model | Pass rate | Mean (ms) | p50 (ms) | p95 (ms) | Turn mean | Retries | Timeouts | Budget-exceeded |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  const rows = cells.map(
    (c) =>
      `| ${c.fixture} | ${c.model} | ${pct(c.passRate)} (${c.passCount}/${c.totalCount}) | ${fmt(c.meanMs)} | ${fmt(c.p50Ms)} | ${fmt(c.p95Ms)} | ${c.turnMean} | ${c.retries} | ${c.timeouts} | ${c.budgetExceeded} |`,
  );
  return ["### 2. Per-Fixture × Model", "", ...header, ...rows].join("\n");
}

function renderRanking(result: BenchResult): string {
  const { ranking } = aggregate(result);
  const header = [
    "| Rank | Model | Overall pass_rate | Mean latency (ms) |",
    "| --- | --- | --- | --- |",
  ];
  const rows = ranking.map(
    (r) =>
      `| ${r.rank} | ${r.model} | ${pct(r.passRate)} (${r.passCount}/${r.totalCount}) | ${fmt(r.meanMs)} |`,
  );
  return ["### 3. Per-Model Ranking", "", ...header, ...rows].join("\n");
}

function renderSection(result: BenchResult): { heading: string; body: string } {
  const headingText = result.mode === "smoke" ? "Latest Smoke" : "Latest Matrix";
  const heading = `## ${headingText}`;
  const body = [
    heading,
    "",
    `_Finished at: ${result.finishedAt}_`,
    "",
    renderSummary(result),
    "",
    renderCells(result),
    "",
    renderRanking(result),
  ].join("\n");
  return { heading, body };
}

function replaceOrAppendSection(existing: string, heading: string, body: string): string {
  const pattern = new RegExp(`${escapeRegExp(heading)}(?=\\n|$)[\\s\\S]*?(?=\\n## |$)`);
  const normalized = `${body.trimEnd()}\n`;
  if (pattern.test(existing)) {
    return existing.replace(pattern, normalized);
  }
  return `${existing.trimEnd()}\n\n${normalized}`;
}

export async function renderTracker(
  file: string,
  skill: string,
  result: BenchResult,
): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const header = `# ${cap(skill)} Skill — Bench Tracker\n\n`;
  let existing: string;
  try {
    existing = await readFile(file, "utf8");
  } catch {
    existing = header;
  }
  if (!existing.startsWith("# ")) {
    existing = header + existing;
  }

  const { heading, body } = renderSection(result);
  const next = replaceOrAppendSection(existing, heading, body);
  await writeFile(file, next);
}
