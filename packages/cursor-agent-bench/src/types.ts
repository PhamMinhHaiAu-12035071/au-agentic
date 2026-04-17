export type AssertionKind = "includes" | "regex" | "exitCode" | "notIncludes";

export interface Assertion {
  kind: AssertionKind;
  pattern: string | RegExp | number;
  description?: string;
}

export interface Turn {
  prompt: string;
  assertions: Assertion[];
  timeoutMs?: number;
}

export interface Fixture {
  id: string;
  skill: string;
  description: string;
  maxTurns?: number;
  turns: Turn[];
}

export interface AssertionResult {
  kind: AssertionKind;
  description?: string;
  ok: boolean;
  reason?: string;
}

export type FailReason = "assertion" | "turn-timeout" | "budget-exceeded" | "spawn-error";

export interface EnvInfo {
  bun: string;
  cursorAgent: string;
  platform: string;
}

export interface ReproMetadata {
  commit: string; // git rev-parse --short HEAD (8 char)
  skillChecksum: string; // sha256 first 8 char of skill SKILL.md
  env: EnvInfo;
}

export interface TurnResult {
  skill: string;
  fixture: string;
  model: string;
  runIndex: number;
  turn: number;
  input: string;
  output: string; // truncated at 8192 char (DEC-022)
  outputTruncated: boolean;
  originalLen: number;
  outputDumpPath?: string; // set only when turn fails (C11)
  durationMs: number;
  exitCode: number;
  pass: boolean;
  assertions: AssertionResult[];
  retried: boolean;
  timedOut: boolean;
  reason?: FailReason;
  commit: string; // DEC-021 embed per-record
  skillChecksum: string;
  env: EnvInfo;
}

export interface BenchResult {
  startedAt: string;
  finishedAt: string;
  mode: "smoke" | "matrix";
  models: string[];
  fixtureIds: string[];
  runs: number;
  turns: TurnResult[];
  passCount: number;
  totalCount: number;
  wallClockMs: number;
  metadata: ReproMetadata; // DEC-021/023
}

export interface CellStats {
  fixture: string;
  model: string;
  passCount: number;
  totalCount: number;
  passRate: number; // 0..1
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  turnMean: number;
  retries: number;
  timeouts: number;
  budgetExceeded: number;
}

export interface ModelRanking {
  rank: number;
  model: string;
  passCount: number;
  totalCount: number;
  passRate: number;
  meanMs: number;
}

export interface AggregateReport {
  summary: {
    mode: "smoke" | "matrix";
    models: string[];
    fixtures: string[];
    runsPerCell: number;
    overallPass: number;
    overallTotal: number;
    overallPassRate: number;
    wallClockMs: number;
    totalRetries: number;
    totalTimeouts: number;
    totalBudgetExceeded: number;
    metadata: ReproMetadata; // DEC-021/023
  };
  cells: CellStats[];
  ranking: ModelRanking[];
}

export interface BenchConfig {
  models: string[];
  defaultModel: string;
  defaultRuns: number;
  matrixRuns: number;
  perTurnTimeoutMs: number;
  perFixtureDeadlineMs: number; // DEC-017 (20 min)
  maxTurns: number;
  retry: { max: number; delayMs: number };
  trackerDir: string;
  jsonlDir: string;
  fixturesDir: string;
}
