import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const TRUNCATE_LIMIT = 8192;

export interface TruncateResult {
  output: string;
  outputTruncated: boolean;
  originalLen: number;
}

export function truncateOutput(raw: string): TruncateResult {
  if (raw.length <= TRUNCATE_LIMIT) {
    return { output: raw, outputTruncated: false, originalLen: raw.length };
  }
  return {
    output: raw.slice(0, TRUNCATE_LIMIT),
    outputTruncated: true,
    originalLen: raw.length,
  };
}

export interface DumpContext {
  dir: string;
  startedAt: Date;
  skill: string;
  fixture: string;
  model: string;
  runIndex: number;
  turn: number;
}

function timestamp(d: Date): string {
  return d.toISOString().replace(/[:]/g, "-").replace(/\..+/, "");
}

export function dumpPathFor(ctx: DumpContext): string {
  const safeModel = ctx.model.replace(/[^A-Za-z0-9._-]/g, "_");
  const filename = `${timestamp(ctx.startedAt)}-${ctx.skill}-fixture-${ctx.fixture}-m-${safeModel}-r${ctx.runIndex}-t${ctx.turn}.txt`;
  return join(ctx.dir, filename);
}

export async function writeDump(ctx: DumpContext & { output: string }): Promise<string> {
  const p = dumpPathFor(ctx);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, ctx.output, "utf8");
  return p;
}
