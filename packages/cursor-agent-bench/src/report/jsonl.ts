import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { TurnResult } from "#src/types";

/**
 * Build a timestamped JSONL filepath under `dir` for a given `skill`.
 *
 * Timestamp format: ISO8601 with ':' replaced by '-' and the milliseconds
 * suffix stripped — e.g. `2026-04-17T10-42-00`.
 */
export function jsonlPathFor(dir: string, skill: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[:]/g, "-").replace(/\..+/, "");
  return join(dir, `${stamp}-${skill}.jsonl`);
}

/**
 * Append one JSONL line per TurnResult to `file`, creating parent dir if
 * missing. Each batch ends with a trailing newline so repeated calls stay
 * parseable line-by-line.
 */
export async function appendJsonlBatch(file: string, turns: TurnResult[]): Promise<void> {
  if (turns.length === 0) return;
  await mkdir(dirname(file), { recursive: true });
  const body = turns.map((t) => JSON.stringify(t)).join("\n") + "\n";
  await appendFile(file, body);
}
