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

export interface RunCmdOpts {
  timeoutMs: number;
  onStdoutLine?: (line: string) => void;
}

export async function runCmd(cmd: string[], opts: RunCmdOpts): Promise<SpawnResult> {
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
  }, opts.timeoutMs);

  const consumeStdout = opts.onStdoutLine
    ? consumeStream(proc.stdout, opts.onStdoutLine)
    : new Response(proc.stdout).text();

  const [stdout, stderr] = await Promise.all([
    consumeStdout,
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  clearTimeout(timer);
  const durationMs = Math.round(performance.now() - start);
  const sessionId = extractSessionId(stdout, stderr);
  return { stdout, stderr, exitCode, durationMs, timedOut: killedByTimer, sessionId };
}

async function consumeStream(
  stream: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      chunks.push(chunk);
      buffer += chunk;
      for (;;) {
        const nl = buffer.indexOf("\n");
        if (nl === -1) break;
        onLine(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    const tail = decoder.decode();
    if (tail) {
      chunks.push(tail);
      buffer += tail;
    }
    if (buffer.length > 0) onLine(buffer);
    return chunks.join("");
  } finally {
    reader.releaseLock();
  }
}

export const spawnCursorAgent: SpawnFn = async (args) => {
  return runCmd(buildCursorAgentCmd(args), {
    timeoutMs: args.timeoutMs,
    onStdoutLine: args.onStdoutLine,
  });
};
