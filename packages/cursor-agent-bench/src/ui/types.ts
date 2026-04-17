/**
 * BenchUI — method-based adapter contract (DEC-030).
 *
 * Call sequence (enforced by runner / index.ts):
 *   intro
 *   progressStart
 *   for each cell:
 *     cellStart
 *     for each turn:
 *       turnStart
 *       turnLine*          // hot path, sync
 *       turnEnd
 *     cellEnd
 *   progressStop
 *   outro
 *
 * Heartbeat ticks (DEC-031) are owned by the adapter: started inside
 * turnStart, cleared inside turnEnd. Runner never knows the interval.
 */

export interface CellLabel {
  idx: number; // 1-based
  total: number;
  fixture: string;
  model: string;
  runIndex: number;
}

export interface TurnLabel {
  turn: number; // 0-based
  prompt: string; // caller should truncate to ~60 chars for display
}

export interface TurnOutcome {
  pass: boolean;
  durationMs: number;
  reason?: "assertion" | "turn-timeout" | "budget-exceeded" | "spawn-error";
}

export interface CellOutcome {
  pass: boolean;
  durationMs: number;
}

export interface BenchUI {
  intro(title: string): Promise<void>;
  progressStart(opts: { max: number }): Promise<void>;
  cellStart(label: CellLabel): Promise<void>;
  turnStart(label: TurnLabel): Promise<void>;
  /** Sync — hot path, called per subprocess stdout line. */
  turnLine(line: string): void;
  turnEnd(outcome: TurnOutcome): Promise<void>;
  cellEnd(outcome: CellOutcome): Promise<void>;
  progressStop(message: string): Promise<void>;
  outro(message: string): Promise<void>;
}
