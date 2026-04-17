import type { SpawnArgs, SpawnFn, SpawnResult } from "#src/runner";

const SESSION_RE = /(?:session[_ -]?id|sid)[:=]\s*([A-Za-z0-9_-]{6,})/i;

export function extractSessionId(stdout: string, stderr: string): string | undefined {
  for (const src of [stderr, stdout]) {
    const m = src.match(SESSION_RE);
    if (m?.[1]) return m[1];
  }
  return undefined;
}

export function buildCursorAgentCmd(args: SpawnArgs): string[] {
  return [
    "cursor-agent",
    "--print",
    "--output-format",
    "text",
    "--model",
    args.model,
    ...(args.resumeId ? ["--resume", args.resumeId] : []),
    args.prompt,
  ];
}

export async function runCmd(cmd: string[], timeoutMs: number): Promise<SpawnResult> {
  const start = performance.now();
  const proc = Bun.spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  let killedByTimer = false;
  const timer = setTimeout(() => {
    killedByTimer = true;
    try {
      proc.kill();
    } catch {
      // best-effort kill; process may have already exited
    }
  }, timeoutMs);
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  clearTimeout(timer);
  const durationMs = Math.round(performance.now() - start);
  const timedOut = killedByTimer;
  const sessionId = extractSessionId(stdout, stderr);
  return { stdout, stderr, exitCode, durationMs, timedOut, sessionId };
}

export const spawnCursorAgent: SpawnFn = async (args) => {
  return runCmd(buildCursorAgentCmd(args), args.timeoutMs);
};
