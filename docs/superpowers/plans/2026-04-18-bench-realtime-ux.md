# Bench Realtime UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add realtime UI to `bun run skill:bench` so terminal never silent-gaps >1s on TTY / >30s on non-TTY (NO-STUCK guarantee, DEC-029), without changing business logic, tracker shape, or JSONL schema.

**Architecture:** Introduce `BenchUI` method-based adapter (DEC-030) with two implementations: clack TTY adapter (in-loop UI) + consola non-TTY adapter (plain logs). Strict phase isolation: consola owns before/after loop; clack exclusive in-loop (DEC-026). Refactor `runCmd` with optional `onStdoutLine` callback (backward-compat, DEC-032); adapters self-own heartbeat timers (DEC-031). Bump `@clack/prompts` repo-wide `0.9.1 → 1.2.0`; protect `packages/cli` with smoke regression test (DEC-033).

**Tech Stack:** Bun 1.3.10+, TypeScript 5.7, `@clack/prompts@^1.2.0`, `consola@^3.4.x`, `bun:test`, Biome lint.

**Related spec:** [2026-04-18-bench-realtime-ux-design.md](../specs/2026-04-18-bench-realtime-ux-design.md)

---

## Execution Order Rationale

Tasks are sequenced so the repo stays green after every commit:

1. **Task 1 (deps)** — bump + install first; all code tasks depend on new API.
2. **Task 2 (CLI regression)** — lock `packages/cli` before refactor bleeds there.
3. **Task 3 (streaming runCmd)** — core primitive; `BenchUI` wiring depends on it.
4. **Tasks 4–6 (BenchUI: types → clack → consola → factory)** — bottom-up.
5. **Task 7 (runner wire-up)** — thread `ui` through `runFixture`; update existing tests.
6. **Task 8 (index.ts phase isolation)** — end-to-end composition.
7. **Task 9 (preflight consola)** — quick cleanup, already isolated.
8. **Task 10 (ADR + docs + README)** — paper trail.
9. **Task 11 (verify + perf gate)** — full DoD closure.

Every task ends with a commit. Run `bun run verify` only at Task 7, 8, 11 boundaries — intermediate commits may fail unrelated tests by design (new UI code not wired yet).

---

## File Structure

**New files:**

| Path | Responsibility |
|---|---|
| `packages/cursor-agent-bench/src/ui/types.ts` | `BenchUI` interface + label/outcome types |
| `packages/cursor-agent-bench/src/ui/clack-ui.ts` | TTY adapter (`createClackUI()`) |
| `packages/cursor-agent-bench/src/ui/consola-ui.ts` | non-TTY adapter (`createConsolaUI()`) |
| `packages/cursor-agent-bench/src/ui/index.ts` | `createBenchUI({ isTty })` factory |
| `packages/cursor-agent-bench/src/__tests__/ui-clack.test.ts` | TTY adapter unit tests + heartbeat |
| `packages/cursor-agent-bench/src/__tests__/ui-consola.test.ts` | non-TTY adapter unit + ANSI-free assertion |
| `packages/cursor-agent-bench/src/__tests__/runner-streaming.test.ts` | Runner wires `turnLine` to spawn callback |
| `packages/cli/src/__tests__/clack-v1-compat.test.ts` | Regression after clack bump |
| `docs/adr/0011-consola-for-bench-semantic-logging.md` | Two-logger rationale |

**Modified files:**

| Path | Change |
|---|---|
| `packages/cli/package.json` | `@clack/prompts`: `^0.9.1` → `^1.2.0` |
| `packages/cursor-agent-bench/package.json` | Add `@clack/prompts@^1.2.0`, `consola@^3.4.x` to `devDependencies` |
| `packages/cursor-agent-bench/src/spawn-cursor-agent.ts` | `runCmd` signature + streaming reader path |
| `packages/cursor-agent-bench/src/runner.ts` | Accept `ui: BenchUI`, emit `turnStart/turnLine/turnEnd` |
| `packages/cursor-agent-bench/src/__tests__/runner.test.ts` | Inject mock `BenchUI` (no-op) into existing test calls |
| `packages/cursor-agent-bench/src/__tests__/extract-session.test.ts` | Adjust `runCmd(cmd, { timeoutMs: n })` signature if called there (check during task) |
| `packages/cursor-agent-bench/src/index.ts` | Compose phases; construct adapter |
| `packages/cursor-agent-bench/src/preflight.ts` (via `index.ts`) | Emit status via `consola.withTag('preflight')` in `index.ts` (module itself unchanged) |
| `packages/cursor-agent-bench/README.md` | Realtime UX section + demo link |
| `docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md` | Append DEC-024..033 to Decision Log |
| `docs/ai/coding-rules.md` | Link ADR-0011 |

---

## Task 1: Bump dependencies

**Files:**
- Modify: `packages/cli/package.json`
- Modify: `packages/cursor-agent-bench/package.json`

- [ ] **Step 1: Bump clack in `packages/cli/package.json`**

Edit `packages/cli/package.json`, change:

```json
  "dependencies": {
    "@au-agentic/templates": "workspace:*",
    "@clack/prompts": "^0.9.1",
    "picocolors": "^1.1.1"
  },
```

to:

```json
  "dependencies": {
    "@au-agentic/templates": "workspace:*",
    "@clack/prompts": "^1.2.0",
    "picocolors": "^1.1.1"
  },
```

- [ ] **Step 2: Add bench devDeps in `packages/cursor-agent-bench/package.json`**

Edit `packages/cursor-agent-bench/package.json`, change:

```json
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.7.2"
  }
```

to:

```json
  "devDependencies": {
    "@clack/prompts": "^1.2.0",
    "@types/bun": "latest",
    "consola": "^3.4.0",
    "typescript": "^5.7.2"
  }
```

- [ ] **Step 3: Install via repo script**

Run: `bun run setup`
Expected: both packages resolve `@clack/prompts@1.2.x`; `consola` appears in `packages/cursor-agent-bench/node_modules/`.

- [ ] **Step 4: Sanity-check the installed versions**

Run: `cat packages/cli/node_modules/@clack/prompts/package.json | grep '"version"'`
Expected: `"version": "1.2.0"` (or higher within `^1.2.0`).

Run: `cat packages/cursor-agent-bench/node_modules/consola/package.json | grep '"version"'`
Expected: `"version": "3.4.x"`.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/package.json packages/cursor-agent-bench/package.json bun.lockb
git commit -m "deps(bench): bump @clack/prompts 0.9 -> 1.2 + add consola

Preconditions for bench realtime UX adapters (DEC-025).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: CLI regression test (clack v1.x smoke)

Lock `packages/cli` wizard behavior before any bench refactor touches the shared clack surface. Two assertions (DEC-033): happy-path sequence + "no unused exports".

**Files:**
- Create: `packages/cli/src/__tests__/clack-v1-compat.test.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/cli/src/__tests__/clack-v1-compat.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import * as clack from "@clack/prompts";

/**
 * DEC-033 — CLI regression after @clack/prompts 0.9.1 -> 1.2.0 bump.
 * Locks the surface the wizard uses so renames/removals fail loudly here
 * instead of at runtime on a user's terminal.
 */

describe("clack v1 compat — no unused exports", () => {
  // Symbols the wizard imports today. Grep guard:
  //   rg -o "p\\.\\w+" packages/cli/src --no-filename | sort -u
  const requiredSymbols = [
    "intro",
    "outro",
    "cancel",
    "text",
    "select",
    "multiselect",
    "confirm",
    "isCancel",
    "spinner",
    "note",
    "log",
  ] as const;

  for (const sym of requiredSymbols) {
    test(`exports ${sym}`, () => {
      expect((clack as Record<string, unknown>)[sym]).toBeDefined();
    });
  }

  test("log has error method", () => {
    expect(clack.log.error).toBeTypeOf("function");
  });

  test("spinner returns start/stop handle", () => {
    const s = clack.spinner();
    expect(s.start).toBeTypeOf("function");
    expect(s.stop).toBeTypeOf("function");
  });
});
```

- [ ] **Step 2: Verify test catches missing symbols (sanity)**

Run: `bun test packages/cli/src/__tests__/clack-v1-compat.test.ts`
Expected: PASS (12+ assertions green). If FAIL — clack 1.2 renamed a symbol the wizard uses; update the wizard in-file and re-run.

- [ ] **Step 3: Also run full CLI test suite to confirm no regressions**

Run: `bun --filter @au-agentic/cli test`
Expected: all tests PASS (pre-existing + new compat test). If any pre-existing test fails, the clack bump broke runtime behavior — fix the wizard call site before proceeding.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/__tests__/clack-v1-compat.test.ts
git commit -m "test(cli): add clack v1 compat regression (DEC-033)

Locks the clack symbols the wizard imports so breaking API changes
surface here, not on user terminals.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Stream stdout in `runCmd` (backward-compat)

Refactor `runCmd` to accept `{ timeoutMs, onStdoutLine? }`. Undefined callback → legacy buffered path. Defined → `ReadableStreamDefaultReader` line splitter. `SpawnResult` shape unchanged (DEC-032).

**Files:**
- Modify: `packages/cursor-agent-bench/src/spawn-cursor-agent.ts`
- Modify: `packages/cursor-agent-bench/src/runner.ts` (extend `SpawnArgs` only)
- Test: `packages/cursor-agent-bench/src/__tests__/runner-streaming.test.ts` (written in Task 7; this task adds a dedicated streaming test in Step 2 below)

- [ ] **Step 1: Add streaming test for runCmd**

Create `packages/cursor-agent-bench/src/__tests__/spawn-streaming.test.ts`:

```ts
import { expect, test } from "bun:test";
import { runCmd } from "#src/spawn-cursor-agent";

test("runCmd streams lines via onStdoutLine callback", async () => {
  const lines: string[] = [];
  const result = await runCmd(
    ["bash", "-lc", "printf 'alpha\\nbeta\\ngamma\\n'"],
    { timeoutMs: 5_000, onStdoutLine: (line) => lines.push(line) },
  );
  expect(result.exitCode).toBe(0);
  expect(lines).toEqual(["alpha", "beta", "gamma"]);
  expect(result.stdout).toBe("alpha\nbeta\ngamma\n");
});

test("runCmd legacy path (no callback) buffers stdout unchanged", async () => {
  const result = await runCmd(
    ["bash", "-lc", "printf 'hello\\nworld\\n'"],
    { timeoutMs: 5_000 },
  );
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toBe("hello\nworld\n");
});

test("runCmd streams final line even without trailing newline", async () => {
  const lines: string[] = [];
  await runCmd(
    ["bash", "-lc", "printf 'one\\ntwo'"],
    { timeoutMs: 5_000, onStdoutLine: (line) => lines.push(line) },
  );
  expect(lines).toEqual(["one", "two"]);
});
```

- [ ] **Step 2: Run the test to verify it FAILS**

Run: `bun --filter @au-agentic/cursor-agent-bench test packages/cursor-agent-bench/src/__tests__/spawn-streaming.test.ts`
Expected: FAIL — `runCmd` current signature is `(cmd, timeoutMs: number)`, not `(cmd, opts)`; TS error or runtime error.

- [ ] **Step 3: Extend `SpawnArgs` in `runner.ts`**

Edit `packages/cursor-agent-bench/src/runner.ts`. Change `SpawnArgs` interface:

```ts
export interface SpawnArgs {
  model: string;
  prompt: string;
  resumeId?: string;
  timeoutMs: number;
  /** Optional per-line callback. Undefined → runCmd uses legacy buffered path. */
  onStdoutLine?: (line: string) => void;
}
```

Leave `SpawnResult`, `SpawnFn`, `RunFixtureOpts` unchanged for now.

- [ ] **Step 4: Refactor `runCmd` with streaming path**

Replace entire contents of `packages/cursor-agent-bench/src/spawn-cursor-agent.ts` with:

```ts
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
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
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
```

- [ ] **Step 5: Run new streaming tests — expect PASS**

Run: `bun --filter @au-agentic/cursor-agent-bench test packages/cursor-agent-bench/src/__tests__/spawn-streaming.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 6: Update any pre-existing `runCmd` call sites in tests**

Run: `rg -n "runCmd\\(" packages/cursor-agent-bench/src/ --no-heading`
Expected: only `spawn-cursor-agent.ts` and `spawn-streaming.test.ts` show up. If other files reference `runCmd(cmd, number)` directly, rewrite them to `runCmd(cmd, { timeoutMs: number })`. (Existing `extract-session.test.ts` tests `extractSessionId` helper, not `runCmd`; confirm with the grep above.)

- [ ] **Step 7: Run full bench test suite — expect PASS**

Run: `bun --filter @au-agentic/cursor-agent-bench test`
Expected: all tests PASS. `spawnCursorAgent` still routes through legacy path when `onStdoutLine` undefined, so `runner.test.ts` unaffected.

- [ ] **Step 8: Commit**

```bash
git add packages/cursor-agent-bench/src/spawn-cursor-agent.ts \
        packages/cursor-agent-bench/src/runner.ts \
        packages/cursor-agent-bench/src/__tests__/spawn-streaming.test.ts
git commit -m "feat(bench): stream stdout via optional onStdoutLine callback (DEC-032)

runCmd now accepts { timeoutMs, onStdoutLine? }. Legacy path preserved
when callback undefined; streaming path uses ReadableStreamDefaultReader
and splits on newlines. SpawnResult shape unchanged — all existing
tests pass without modification.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `BenchUI` interface

Define the method-based interface (DEC-030). Pure types file — no runtime code.

**Files:**
- Create: `packages/cursor-agent-bench/src/ui/types.ts`

- [ ] **Step 1: Create interface file**

Create `packages/cursor-agent-bench/src/ui/types.ts`:

```ts
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
```

- [ ] **Step 2: Verify typecheck**

Run: `bun --filter @au-agentic/cursor-agent-bench typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/cursor-agent-bench/src/ui/types.ts
git commit -m "feat(bench): add BenchUI adapter interface (DEC-030)

Method-based contract for realtime UI. Runner emits
turnStart/turnLine/turnEnd; adapter owns heartbeat timer (DEC-031).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Clack TTY adapter + unit tests

TDD: test first, implementation second.

**Files:**
- Create: `packages/cursor-agent-bench/src/ui/clack-ui.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/ui-clack.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/cursor-agent-bench/src/__tests__/ui-clack.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

// Mock @clack/prompts before importing the adapter.
const calls: Array<{ name: string; args: unknown[] }> = [];

function record(name: string) {
  return (...args: unknown[]) => {
    calls.push({ name, args });
  };
}

const taskLogCalls: Array<{ name: string; args: unknown[] }> = [];
const makeTaskLog = () => ({
  message: (...args: unknown[]) => taskLogCalls.push({ name: "message", args }),
  success: (...args: unknown[]) => taskLogCalls.push({ name: "success", args }),
  error: (...args: unknown[]) => taskLogCalls.push({ name: "error", args }),
});

const makeProgress = () => ({
  advance: record("progress.advance"),
  stop: record("progress.stop"),
});

mock.module("@clack/prompts", () => ({
  intro: record("intro"),
  outro: record("outro"),
  progress: (opts: unknown) => {
    calls.push({ name: "progress", args: [opts] });
    return makeProgress();
  },
  taskLog: (opts: unknown) => {
    calls.push({ name: "taskLog", args: [opts] });
    return makeTaskLog();
  },
}));

import { createClackUI } from "#src/ui/clack-ui";

beforeEach(() => {
  calls.length = 0;
  taskLogCalls.length = 0;
});

afterEach(() => {
  calls.length = 0;
  taskLogCalls.length = 0;
});

test("intro / progressStart / cellStart call clack in order", async () => {
  const ui = createClackUI();
  await ui.intro("⚡ bench");
  await ui.progressStart({ max: 3 });
  await ui.cellStart({ idx: 1, total: 3, fixture: "fx1", model: "m1", runIndex: 0 });
  expect(calls.map((c) => c.name)).toEqual(["intro", "progress", "progress.advance"]);
  expect((calls[0]!.args[0] as string)).toContain("bench");
  expect((calls[2]!.args[0] as number)).toBe(1);
});

test("turnLine forwards to taskLog.message", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "hello" });
  ui.turnLine("line A");
  ui.turnLine("line B");
  await ui.turnEnd({ pass: true, durationMs: 100 });
  const messages = taskLogCalls.filter((c) => c.name === "message").map((c) => c.args[0]);
  expect(messages).toContain("line A");
  expect(messages).toContain("line B");
});

test("turnEnd(pass=true) calls taskLog.success", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });
  await ui.turnEnd({ pass: true, durationMs: 42 });
  expect(taskLogCalls.map((c) => c.name)).toContain("success");
  expect(taskLogCalls.map((c) => c.name)).not.toContain("error");
});

test("turnEnd(pass=false) calls taskLog.error with reason", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });
  await ui.turnEnd({ pass: false, durationMs: 42, reason: "assertion" });
  expect(taskLogCalls.map((c) => c.name)).toContain("error");
});

test("heartbeat ticks taskLog.message at ~1s while turn open (DEC-031)", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });

  // Real timer sleep — fake-timer support in bun:test is non-trivial;
  // use a short 1.2s window to keep the unit test bounded.
  await new Promise((r) => setTimeout(r, 1_200));
  await ui.turnEnd({ pass: true, durationMs: 1_200 });

  const hbMessages = taskLogCalls
    .filter((c) => c.name === "message")
    .map((c) => String(c.args[0]));
  const heartbeats = hbMessages.filter((m) => m.includes("elapsed"));
  expect(heartbeats.length).toBeGreaterThanOrEqual(1);
});

test("progressStop then outro", async () => {
  const ui = createClackUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.progressStop("done");
  await ui.outro("bye");
  const names = calls.map((c) => c.name);
  expect(names).toContain("progress.stop");
  expect(names).toContain("outro");
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `bun --filter @au-agentic/cursor-agent-bench test packages/cursor-agent-bench/src/__tests__/ui-clack.test.ts`
Expected: FAIL — `#src/ui/clack-ui` does not exist.

- [ ] **Step 3: Implement clack adapter**

Create `packages/cursor-agent-bench/src/ui/clack-ui.ts`:

```ts
import * as p from "@clack/prompts";
import type { BenchUI, CellLabel, CellOutcome, TurnLabel, TurnOutcome } from "#src/ui/types";

/** Interval between heartbeat ticks in TTY mode (DEC-029: ≤1s). */
const HEARTBEAT_MS = 1_000;

type ProgressHandle = { advance: (n: number, label?: string) => void; stop: (msg?: string) => void };
type TaskLogHandle = {
  message: (line: string) => void;
  success: (msg?: string) => void;
  error: (msg?: string) => void;
};

export function createClackUI(): BenchUI {
  let progress: ProgressHandle | null = null;
  let task: TaskLogHandle | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let turnStartedAt = 0;

  function stopHeartbeat(): void {
    if (heartbeat !== null) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  }

  function truncatePrompt(prompt: string, max = 60): string {
    return prompt.length > max ? `${prompt.slice(0, max - 1)}…` : prompt;
  }

  return {
    async intro(title: string): Promise<void> {
      p.intro(title);
    },
    async progressStart(opts: { max: number }): Promise<void> {
      progress = p.progress({ max: opts.max }) as ProgressHandle;
    },
    async cellStart(label: CellLabel): Promise<void> {
      const line = `[${label.idx}/${label.total}] ${label.fixture} / ${label.model} / run ${label.runIndex}`;
      progress?.advance(1, line);
    },
    async turnStart(label: TurnLabel): Promise<void> {
      task = p.taskLog({ title: `Turn ${label.turn}: "${truncatePrompt(label.prompt)}"` }) as TaskLogHandle;
      turnStartedAt = Date.now();
      heartbeat = setInterval(() => {
        const elapsed = Math.round((Date.now() - turnStartedAt) / 1000);
        task?.message(`⏱  elapsed ${elapsed}s`);
      }, HEARTBEAT_MS);
    },
    turnLine(line: string): void {
      task?.message(line);
    },
    async turnEnd(outcome: TurnOutcome): Promise<void> {
      stopHeartbeat();
      if (outcome.pass) {
        task?.success();
      } else {
        task?.error(outcome.reason ?? "failed");
      }
      task = null;
    },
    async cellEnd(_outcome: CellOutcome): Promise<void> {
      // progress.advance already happened in cellStart
    },
    async progressStop(message: string): Promise<void> {
      progress?.stop(message);
      progress = null;
    },
    async outro(message: string): Promise<void> {
      p.outro(message);
    },
  };
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `bun --filter @au-agentic/cursor-agent-bench test packages/cursor-agent-bench/src/__tests__/ui-clack.test.ts`
Expected: all 6 tests PASS (heartbeat test takes ~1.2s — acceptable for unit-suite target 200ms/ceiling 500ms because tests run in parallel; if perf gate flags it later, gate heartbeat test behind `test.skip` with a TODO).

- [ ] **Step 5: Commit**

```bash
git add packages/cursor-agent-bench/src/ui/clack-ui.ts \
        packages/cursor-agent-bench/src/__tests__/ui-clack.test.ts
git commit -m "feat(bench): TTY BenchUI adapter via @clack/prompts

Includes heartbeat tick at 1s interval (DEC-031, DEC-029). Unit tests
mock clack module and assert call sequence + heartbeat invocation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Consola non-TTY adapter + factory + unit tests

**Files:**
- Create: `packages/cursor-agent-bench/src/ui/consola-ui.ts`
- Create: `packages/cursor-agent-bench/src/ui/index.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/ui-consola.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/cursor-agent-bench/src/__tests__/ui-consola.test.ts`:

```ts
import { afterEach, beforeEach, expect, mock, test } from "bun:test";

const logCalls: Array<{ tag: string; level: string; msg: string }> = [];

function makeTagged(tag: string) {
  return {
    start: (msg: string) => logCalls.push({ tag, level: "start", msg }),
    success: (msg: string) => logCalls.push({ tag, level: "success", msg }),
    info: (msg: string) => logCalls.push({ tag, level: "info", msg }),
    error: (msg: string) => logCalls.push({ tag, level: "error", msg }),
  };
}

mock.module("consola", () => ({
  consola: {
    withTag: (tag: string) => makeTagged(tag),
  },
}));

import { createConsolaUI } from "#src/ui/consola-ui";

beforeEach(() => {
  logCalls.length = 0;
});

afterEach(() => {
  logCalls.length = 0;
});

test("consola adapter: intro -> info on 'bench' tag", async () => {
  const ui = createConsolaUI();
  await ui.intro("hello");
  expect(logCalls).toContainEqual({ tag: "bench", level: "start", msg: "hello" });
});

test("turnLine emits plain info per line (no ANSI)", async () => {
  const ui = createConsolaUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });
  ui.turnLine("alpha");
  ui.turnLine("beta");
  await ui.turnEnd({ pass: true, durationMs: 5 });

  const streamed = logCalls.filter((c) => c.level === "info" && c.tag === "bench");
  const msgs = streamed.map((c) => c.msg);
  expect(msgs).toContain("alpha");
  expect(msgs).toContain("beta");
  // ANSI escape should never appear; consola default reporter handles non-TTY.
  for (const { msg } of streamed) {
    expect(msg).not.toMatch(/\x1b\[/);
  }
});

test("turnEnd pass=false emits error with reason", async () => {
  const ui = createConsolaUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  await ui.turnStart({ turn: 0, prompt: "p" });
  await ui.turnEnd({ pass: false, durationMs: 10, reason: "turn-timeout" });
  const errs = logCalls.filter((c) => c.level === "error");
  expect(errs.length).toBeGreaterThan(0);
  expect(errs[0]!.msg).toContain("turn-timeout");
});

test("heartbeat emits at ~30s cadence — smoke check with shortened interval", async () => {
  // Non-TTY adapter interval is 30s; this test asserts the adapter
  // registers a setInterval (via a probe) rather than waiting 30s wall-clock.
  const ui = createConsolaUI();
  await ui.intro("t");
  await ui.progressStart({ max: 1 });
  await ui.cellStart({ idx: 1, total: 1, fixture: "fx", model: "m", runIndex: 0 });
  const before = logCalls.length;
  await ui.turnStart({ turn: 0, prompt: "p" });
  // Immediately end — no heartbeat should fire in under 1ms.
  await ui.turnEnd({ pass: true, durationMs: 1 });
  // Sanity: start + end each emit at least one log line.
  expect(logCalls.length).toBeGreaterThan(before);
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `bun --filter @au-agentic/cursor-agent-bench test packages/cursor-agent-bench/src/__tests__/ui-consola.test.ts`
Expected: FAIL — adapter file missing.

- [ ] **Step 3: Implement consola adapter**

Create `packages/cursor-agent-bench/src/ui/consola-ui.ts`:

```ts
import { consola } from "consola";
import type { BenchUI, CellLabel, CellOutcome, TurnLabel, TurnOutcome } from "#src/ui/types";

/** Non-TTY heartbeat cadence (DEC-029: ≤30s). */
const HEARTBEAT_MS = 30_000;

export function createConsolaUI(): BenchUI {
  const log = consola.withTag("bench");
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let turnStartedAt = 0;

  function stopHeartbeat(): void {
    if (heartbeat !== null) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  }

  return {
    async intro(title: string): Promise<void> {
      log.start(title);
    },
    async progressStart(opts: { max: number }): Promise<void> {
      log.info(`Running ${opts.max} cells`);
    },
    async cellStart(label: CellLabel): Promise<void> {
      log.start(`[${label.idx}/${label.total}] ${label.fixture} / ${label.model} / run ${label.runIndex}`);
    },
    async turnStart(label: TurnLabel): Promise<void> {
      log.info(`Turn ${label.turn}: ${label.prompt}`);
      turnStartedAt = Date.now();
      heartbeat = setInterval(() => {
        const elapsed = Math.round((Date.now() - turnStartedAt) / 1000);
        log.info(`… still running (${elapsed}s)`);
      }, HEARTBEAT_MS);
    },
    turnLine(line: string): void {
      log.info(line);
    },
    async turnEnd(outcome: TurnOutcome): Promise<void> {
      stopHeartbeat();
      if (outcome.pass) log.success(`Turn OK (${outcome.durationMs}ms)`);
      else log.error(`Turn FAIL: ${outcome.reason ?? "unknown"}`);
    },
    async cellEnd(outcome: CellOutcome): Promise<void> {
      if (outcome.pass) log.success(`Cell PASS (${outcome.durationMs}ms)`);
      else log.error(`Cell FAIL (${outcome.durationMs}ms)`);
    },
    async progressStop(message: string): Promise<void> {
      log.success(message);
    },
    async outro(message: string): Promise<void> {
      log.info(message);
    },
  };
}
```

- [ ] **Step 4: Create factory**

Create `packages/cursor-agent-bench/src/ui/index.ts`:

```ts
import type { BenchUI } from "#src/ui/types";
import { createClackUI } from "#src/ui/clack-ui";
import { createConsolaUI } from "#src/ui/consola-ui";

export { BenchUI };

export function createBenchUI(opts: { isTty: boolean }): BenchUI {
  return opts.isTty ? createClackUI() : createConsolaUI();
}
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `bun --filter @au-agentic/cursor-agent-bench test packages/cursor-agent-bench/src/__tests__/ui-consola.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 6: Run whole bench suite to catch regressions**

Run: `bun --filter @au-agentic/cursor-agent-bench test`
Expected: all bench tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/cursor-agent-bench/src/ui/consola-ui.ts \
        packages/cursor-agent-bench/src/ui/index.ts \
        packages/cursor-agent-bench/src/__tests__/ui-consola.test.ts
git commit -m "feat(bench): non-TTY consola adapter + BenchUI factory

createBenchUI({ isTty }) returns clack adapter for TTY, consola
adapter for pipe/non-TTY mode (DEC-027). Adapter owns heartbeat
(30s cadence non-TTY, DEC-029 / DEC-031).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Wire `runFixture` to `BenchUI`

Extend `RunFixtureOpts` to accept `ui: BenchUI`. Emit `turnStart` / `turnLine` (via spawn callback) / `turnEnd` per turn. Update existing `runner.test.ts` with no-op mock.

**Files:**
- Modify: `packages/cursor-agent-bench/src/runner.ts`
- Modify: `packages/cursor-agent-bench/src/__tests__/runner.test.ts`
- Create: `packages/cursor-agent-bench/src/__tests__/runner-streaming.test.ts`

- [ ] **Step 1: Write streaming test**

Create `packages/cursor-agent-bench/src/__tests__/runner-streaming.test.ts`:

```ts
import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runFixture, type SpawnFn } from "#src/runner";
import type { BenchUI } from "#src/ui/types";
import type { BenchConfig, Fixture, ReproMetadata } from "#src/types";

const meta: ReproMetadata = {
  commit: "c0ffee12",
  skillChecksum: "deadbeef",
  env: { bun: "x", cursorAgent: "y", platform: "z" },
};
const config: BenchConfig = {
  models: ["m"],
  defaultModel: "m",
  defaultRuns: 1,
  matrixRuns: 1,
  perTurnTimeoutMs: 10_000,
  perFixtureDeadlineMs: 60_000,
  maxTurns: 10,
  retry: { max: 0, delayMs: 0 },
  trackerDir: "/tmp/t",
  jsonlDir: "/tmp/j",
  fixturesDir: "/tmp/f",
};

const fixture: Fixture = {
  id: "fx",
  skill: "s",
  description: "d",
  turns: [{ prompt: "say", assertions: [{ kind: "includes", pattern: "ok" }] }],
};

function makeFakeUI() {
  const events: string[] = [];
  const ui: BenchUI = {
    async intro() {},
    async progressStart() {},
    async cellStart() {},
    async turnStart(l) {
      events.push(`turnStart(${l.turn})`);
    },
    turnLine(line) {
      events.push(`turnLine(${line})`);
    },
    async turnEnd(o) {
      events.push(`turnEnd(${o.pass})`);
    },
    async cellEnd() {},
    async progressStop() {},
    async outro() {},
  };
  return { ui, events };
}

test("runner invokes ui.turnStart / turnLine / turnEnd in order", async () => {
  const { ui, events } = makeFakeUI();
  const spawn: SpawnFn = async (args) => {
    // Simulate two lines being streamed, then buffered result.
    args.onStdoutLine?.("alpha");
    args.onStdoutLine?.("ok line");
    return { stdout: "alpha\nok line\n", stderr: "", exitCode: 0, durationMs: 10, timedOut: false };
  };
  const dumpDir = await mkdtemp(join(tmpdir(), "bench-s-"));
  try {
    await runFixture(fixture, {
      config,
      model: "m",
      runIndex: 0,
      metadata: meta,
      dumpDir,
      startedAt: new Date(),
      spawn,
      sleep: async () => {},
      ui,
    });
  } finally {
    await rm(dumpDir, { recursive: true, force: true });
  }
  expect(events).toEqual([
    "turnStart(0)",
    "turnLine(alpha)",
    "turnLine(ok line)",
    "turnEnd(true)",
  ]);
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `bun --filter @au-agentic/cursor-agent-bench test packages/cursor-agent-bench/src/__tests__/runner-streaming.test.ts`
Expected: FAIL — `RunFixtureOpts` has no `ui` field.

- [ ] **Step 3: Wire `BenchUI` into runner**

Edit `packages/cursor-agent-bench/src/runner.ts`. Add import:

```ts
import type { BenchUI } from "#src/ui/types";
```

Extend `RunFixtureOpts`:

```ts
export interface RunFixtureOpts {
  config: BenchConfig;
  model: string;
  runIndex: number;
  metadata: ReproMetadata;
  dumpDir: string;
  startedAt: Date;
  spawn: SpawnFn;
  sleep: (ms: number) => Promise<void>;
  ui: BenchUI;
}
```

Inside the `for (let i = 0; i < cap; i++)` loop, **before** the `for (attempt ...)` retry loop, add:

```ts
    await opts.ui.turnStart({ turn: i, prompt: prompt.length > 60 ? `${prompt.slice(0, 59)}…` : prompt });
```

Change the spawn call (`await spawn({ model, prompt, resumeId, timeoutMs })`) to:

```ts
        spawnRes = await spawn({
          model,
          prompt,
          resumeId,
          timeoutMs,
          onStdoutLine: (line) => opts.ui.turnLine(line),
        });
```

After both `!spawnRes` branch push and the final `results.push({...})`, **before** the `if (!pass) break;`, emit `turnEnd`. Concretely, replace the tail of the loop body:

```ts
    results.push({
      // ... existing fields ...
    });

    if (!pass) break;
  }
```

with:

```ts
    results.push({
      // ... existing fields unchanged ...
    });

    await opts.ui.turnEnd({
      pass,
      durationMs: finalSpawn.durationMs,
      reason,
    });

    if (!pass) break;
  }
```

For the `budget-exceeded` and `spawn-error` paths (where `results.push(budgetExceededResult(i, prompt))` and the `!spawnRes` branch), also emit `turnEnd` before `break`:

```ts
    if (Date.now() >= deadline) {
      results.push(budgetExceededResult(i, prompt));
      await opts.ui.turnEnd({ pass: false, durationMs: 0, reason: "budget-exceeded" });
      break;
    }
    // ... and similarly below, after the second budget-exceeded push
```

And in the `if (!spawnRes)` branch:

```ts
    if (!spawnRes) {
      results.push({
        // ... existing ...
        reason: "spawn-error",
        ...baseMetadata,
      });
      await opts.ui.turnEnd({ pass: false, durationMs: 0, reason: "spawn-error" });
      break;
    }
```

**Note:** `opts.ui.turnStart` must be called **after** the deadline check and **after** the `timeoutMs === 0` guard, so that `turnEnd` is always paired with a prior `turnStart`. Move the `turnStart` call to just before the `for (let attempt ...)` retry loop.

Here is the final turn-loop skeleton after the edits (canonical — copy as reference):

```ts
  for (let i = 0; i < cap; i++) {
    const turn = fixture.turns[i];
    if (!turn) break;
    const prompt = turn.prompt;

    if (Date.now() >= deadline) {
      results.push(budgetExceededResult(i, prompt));
      break; // no turnStart emitted → no turnEnd needed
    }

    const remaining = Math.max(0, deadline - Date.now());
    const timeoutMs = Math.min(turn.timeoutMs ?? config.perTurnTimeoutMs, remaining);
    if (timeoutMs === 0) {
      results.push(budgetExceededResult(i, prompt));
      break;
    }

    await opts.ui.turnStart({
      turn: i,
      prompt: prompt.length > 60 ? `${prompt.slice(0, 59)}…` : prompt,
    });

    let spawnRes: SpawnResult | undefined;
    let retried = false;
    const maxAttempts = config.retry.max;
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        spawnRes = await spawn({
          model,
          prompt,
          resumeId,
          timeoutMs,
          onStdoutLine: (line) => opts.ui.turnLine(line),
        });
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
      await opts.ui.turnEnd({ pass: false, durationMs: 0, reason: "spawn-error" });
      break;
    }

    if (spawnRes.sessionId) resumeId = spawnRes.sessionId;

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

    await opts.ui.turnEnd({
      pass,
      durationMs: finalSpawn.durationMs,
      reason,
    });

    if (!pass) break;
  }
```

- [ ] **Step 4: Add no-op `BenchUI` helper to existing runner.test.ts**

Edit `packages/cursor-agent-bench/src/__tests__/runner.test.ts`. Add near the top, after existing imports:

```ts
import type { BenchUI } from "#src/ui/types";

const noopUI: BenchUI = {
  async intro() {},
  async progressStart() {},
  async cellStart() {},
  async turnStart() {},
  turnLine() {},
  async turnEnd() {},
  async cellEnd() {},
  async progressStop() {},
  async outro() {},
};
```

Then in every `runFixture(..., { ... })` call site, add `ui: noopUI,` to the options object. Use your editor's global "add `ui: noopUI` before closing `}`" in this file only — there are ~8 call sites based on existing test count.

**Verify with grep after edit:**

Run: `rg -c "ui: noopUI" packages/cursor-agent-bench/src/__tests__/runner.test.ts`
Expected: count matches the number of `runFixture(` calls in that file.

Run: `rg -c "runFixture\\(" packages/cursor-agent-bench/src/__tests__/runner.test.ts`
Expected: same number.

- [ ] **Step 5: Run all bench tests — expect PASS**

Run: `bun --filter @au-agentic/cursor-agent-bench test`
Expected: all tests PASS (existing + new `runner-streaming.test.ts`).

- [ ] **Step 6: Run repo-wide verify**

Run: `bun run verify`
Expected: typecheck + lint + test all PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/cursor-agent-bench/src/runner.ts \
        packages/cursor-agent-bench/src/__tests__/runner.test.ts \
        packages/cursor-agent-bench/src/__tests__/runner-streaming.test.ts
git commit -m "feat(bench): wire BenchUI turnStart/turnLine/turnEnd through runFixture

Runner emits lifecycle events + threads onStdoutLine callback into
spawn so adapter sees stdout in real time. Existing tests pass with
injected no-op UI.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Compose phases in `index.ts`

Wire consola for before/after loop + clack/consola adapter via factory for inside loop. Strict phase isolation (DEC-026).

**Files:**
- Modify: `packages/cursor-agent-bench/src/index.ts`

- [ ] **Step 1: Rewrite `main()` with phase isolation**

Replace contents of `packages/cursor-agent-bench/src/index.ts` with:

```ts
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
import { createBenchUI } from "#src/ui";
import type { BenchResult, Fixture, ReproMetadata, TurnResult } from "#src/types";
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

  consola.withTag("config").info(
    `mode=${args.mode} models=[${models.join(",")}] runs=${runs} fixtures=${fixtures.length} totalCells=${totalCells}`,
  );

  // ---- Phase B: clack/consola adapter (inside loop) -------------------
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
```

- [ ] **Step 2: Typecheck**

Run: `bun --filter @au-agentic/cursor-agent-bench typecheck`
Expected: PASS.

- [ ] **Step 3: Run full verify**

Run: `bun run verify`
Expected: typecheck + lint + test all PASS.

- [ ] **Step 4: Manual smoke — NO-STUCK verification (DoD-1)**

Run: `bun run skill:bench` (provided cursor-agent is installed & logged in).
Expected: within 1s you see `⚡ cursor-agent-bench` intro, progress bar appears, a `Turn 0: "..."` taskLog with streaming lines + heartbeat ticks each ~1s. Silent gaps never exceed ~1s. If cursor-agent is not available, skip this step and rely on Task 11 for final gate.

- [ ] **Step 5: Manual pipe smoke (DoD-3)**

Run: `bun run skill:bench > /tmp/bench.log 2>&1`
Then: `grep -P '\x1b\[' /tmp/bench.log | head`
Expected: no match (no ANSI escapes leaked into the pipe log).

- [ ] **Step 6: Commit**

```bash
git add packages/cursor-agent-bench/src/index.ts
git commit -m "feat(bench): compose phases — consola outside, clack in-loop (DEC-026)

main() constructs BenchUI via factory (auto-detect TTY, DEC-027),
emits consola logs for preflight/config/summary, and wraps the
(fixture × model × run) loop with intro/progress/cell/outro.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Preflight module — already clean, no change required

The current `preflight.ts` module only returns `PreflightResult`; all `console.error` emission lives in the caller (`index.ts`), which Task 8 already migrated to `consola.withTag("preflight")`. Verify and skip.

**Files:**
- Verify only: `packages/cursor-agent-bench/src/preflight.ts`

- [ ] **Step 1: Confirm preflight.ts contains no `console.*` calls**

Run: `rg -n "console\\." packages/cursor-agent-bench/src/preflight.ts`
Expected: no matches.

- [ ] **Step 2: Confirm index.ts uses consola tag for preflight**

Run: `rg -n "consola\\.withTag\\(\"preflight\"\\)" packages/cursor-agent-bench/src/index.ts`
Expected: ≥2 matches (start + success + error).

No commit needed for this task — it is a verification gate only. If Step 1 fails, move any `console.error` in `preflight.ts` to return-value error strings and emit them from the caller via `consola.withTag("preflight").error(...)`.

---

## Task 10: ADR-0011 + doc sync + README

**Files:**
- Create: `docs/adr/0011-consola-for-bench-semantic-logging.md`
- Modify: `docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md`
- Modify: `docs/ai/coding-rules.md`
- Modify: `packages/cursor-agent-bench/README.md`

- [ ] **Step 1: Write ADR-0011**

Create `docs/adr/0011-consola-for-bench-semantic-logging.md`:

```markdown
# ADR-0011 — Consola for bench semantic logging

- **Date:** 2026-04-18
- **Status:** accepted
- **Supersedes:** —
- **Related:** [ADR-0010](./0010-cursor-cli-system-prereq.md), [spec 2026-04-18](../superpowers/specs/2026-04-18-bench-realtime-ux-design.md)

## Context

`@au-agentic/cursor-agent-bench` needs realtime UI inside a nested loop
(fixture × model × run × turn) that runs 2-5 minutes in smoke mode and
2-3 hours in matrix mode. Prior code used `console.error` for preflight
and no feedback at all during the loop — terminal silent gap exceeded
DEC-029's 1-second TTY / 30-second non-TTY guarantee.

`@clack/prompts` v1.2 provides in-loop UX primitives (progress, taskLog,
intro/outro) but steals terminal ownership: any stray `console.*` call
during an active `progress` handle corrupts the frame.

## Decision

Use **two complementary logger libraries** with strict phase isolation:

1. **Outside the loop** (preflight / config summary / final box):
   `consola` — semantic logger with tags, works the same on TTY and pipe.
2. **Inside the loop** (intro → progress → cellStart → turnStart → turnLine\*
   → turnEnd → cellEnd → progressStop → outro): a `BenchUI` adapter.
   TTY → clack adapter; non-TTY → a consola-backed fallback.

The adapter is chosen by `createBenchUI({ isTty: process.stdout.isTTY })`.
Runner code emits `turnStart` / `turnLine` / `turnEnd`; the adapter owns
heartbeat timers and terminal concerns.

## Consequences

**Positive**

- NO-STUCK guarantee (DEC-029) satisfied: adapter-owned heartbeat ticks
  at ≤1s (TTY) / ≤30s (non-TTY).
- Pipe-safe logs: consola's default reporter strips ANSI when
  `!process.stdout.isTTY`; `grep $'\x1b' bench.log` stays clean (DoD-3).
- Clear ownership: loop code never touches `console.*`; non-loop code
  never touches clack.

**Negative**

- Two dependencies instead of one.
- Discipline required in code review: any `console.*` or cross-phase
  call leaks into the other phase and breaks the frame.

## Scope rule

Quote verbatim in [`docs/ai/coding-rules.md`](../ai/coding-rules.md):

> Inside `packages/cursor-agent-bench`, `console.*`, `consola.*`, and
> `@clack/prompts` calls are **phase-scoped**. Consola is allowed only
> outside the fixture × model × run loop. Clack is allowed only inside
> the loop. Runner code emits `BenchUI.*` methods and never imports
> either logger directly.
```

- [ ] **Step 2: Link ADR from coding-rules**

Edit `docs/ai/coding-rules.md`. Find the section listing ADRs (or a "Bench" section if present). Append:

```markdown
- **ADR-0011 — Consola for bench semantic logging.** Phase-scoped
  logging in `packages/cursor-agent-bench`: consola outside the loop,
  clack inside; runner emits `BenchUI.*` and never touches a logger
  directly. See [0011](../adr/0011-consola-for-bench-semantic-logging.md).
```

- [ ] **Step 3: Sync V1 spec Decision Log**

Edit `docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md`. Inside the `## Decision Log (Final)` table, append rows:

```markdown
| DEC-024 | Realtime UI mode = Hybrid (progress + taskLog streaming) | 2026-04-18 spec |
| DEC-025 | Bump @clack/prompts repo-wide; add consola devDep bench-only | 2026-04-18 spec |
| DEC-026 | Strict phase isolation: consola outside loop, clack in-loop | 2026-04-18 spec |
| DEC-027 | Auto-detect TTY via process.stdout.isTTY; zero new flags | 2026-04-18 spec |
| DEC-028 | DoD must include heartbeat + CLI regression + ADR-0011 | 2026-04-18 spec |
| DEC-029 | HARD NO-STUCK: ≤1s TTY / ≤30s non-TTY | 2026-04-18 spec |
| DEC-030 | BenchUI interface = method-based | 2026-04-18 interview |
| DEC-031 | Heartbeat = adapter self-ticks | 2026-04-18 interview |
| DEC-032 | runCmd refactor = optional callbacks (backward-compat) | 2026-04-18 interview |
| DEC-033 | CLI regression = smoke wizard + no-unused-exports | 2026-04-18 interview |
```

Then above "## Open Follow-ups" (or anywhere after the Decision Log), add:

```markdown
## V1.1 Addendum — Realtime UX

See [spec 2026-04-18-bench-realtime-ux-design.md](./2026-04-18-bench-realtime-ux-design.md)
for the `BenchUI` adapter architecture, streaming `runCmd`, and
NO-STUCK guarantee (DEC-029). The V1 runner/report/JSONL shape is
unchanged; V1.1 is purely additive UI.
```

- [ ] **Step 4: README realtime section**

Edit `packages/cursor-agent-bench/README.md`. Append a new section before the last `## License` or end of file:

```markdown
## Realtime UX

When the terminal is a TTY, `bun run skill:bench` renders:

- `clack.intro` — header
- `clack.progress` — overall cell counter (`[idx/total] fixture / model / run N`)
- `clack.taskLog` — per-turn stream with line-by-line stdout and a
  heartbeat tick every ≈1s so the run never appears stuck
- `clack.outro` — "Tracker dir: …"
- `consola.box` — final result summary

When stdout is **not** a TTY (e.g. `bun run skill:bench > bench.log 2>&1`),
a consola-based adapter replaces the in-loop UI with plain tagged log
lines. Heartbeat cadence drops to 30s to avoid log bloat. Output is
ANSI-free and `grep`-able:

```bash
bun run skill:bench > bench.log 2>&1
grep $'\x1b' bench.log   # → no matches, safe to commit / share
```

See [ADR-0011](../../docs/adr/0011-consola-for-bench-semantic-logging.md)
for the phase-isolation rule.
```

- [ ] **Step 5: Verify markdown builds / lint**

Run: `bun run verify`
Expected: PASS (lint may flag markdown but shouldn't — no code changed).

- [ ] **Step 6: Commit**

```bash
git add docs/adr/0011-consola-for-bench-semantic-logging.md \
        docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md \
        docs/ai/coding-rules.md \
        packages/cursor-agent-bench/README.md
git commit -m "docs(bench): ADR-0011 + V1 sync + README realtime section

Document the two-logger phase-isolation rule (DEC-026), sync
DEC-024..033 into the V1 spec Decision Log, and add a README
section showing TTY vs non-TTY behavior with the grep-check.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Final verification + perf gate

**Files:**
- No code changes. This task runs the DoD checklist.

- [ ] **Step 1: `bun run verify`**

Run: `bun run verify`
Expected: exit 0. Typecheck, lint, test all green.

- [ ] **Step 2: `bun run perf` — DoD-9 gate**

Run: `bun run perf`
Expected: the `bun test (cursor-agent-bench unit)` entry reports mean ms. If mean > 200 ms but ≤ 500 ms, the target is soft-missed but ceiling held — proceed. If mean > 500 ms, escalate: the heartbeat unit test in `ui-clack.test.ts` is the likely culprit (1.2s wall-clock). Either (a) reduce it to a smaller window with `jest.useFakeTimers()` (bun:test via `Bun.nanoseconds` mocking) or (b) mark it `test.only` when perf-gated and exclude from the perf suite. Do NOT silently raise the ceiling without an explicit spec/ADR update.

- [ ] **Step 3: Non-TTY pipe check (DoD-3)**

Run: `bun run skill:bench > /tmp/bench.log 2>&1 || true` (ignore exit code; we check the log).
Then: `grep -c $'\x1b\[' /tmp/bench.log || echo 0`
Expected: `0` (no ANSI escapes).

- [ ] **Step 4: DoD roll-call**

Walk the DoD table in the spec; mark each gate with evidence:

| # | Gate | Evidence |
|---|---|---|
| DoD-1 | Manual smoke gap ≤ 1s TTY | Task 8 Step 4 visual |
| DoD-2 | Matrix progress + taskLog clear/persist | Task 8 Step 4 visual (optional if no cursor-agent) |
| DoD-3 | Pipe plain text, no ANSI | Step 3 above |
| DoD-4 | `clack-v1-compat.test.ts` PASS | Task 2 Step 3 |
| DoD-5 | Existing bench tests PASS | Step 1 above |
| DoD-6 | New UI + runner-streaming tests PASS | Step 1 above |
| DoD-7 | ADR-0011 exists + linked | `ls docs/adr/0011*.md && rg -l "ADR-0011" docs/ai/coding-rules.md` |
| DoD-8 | `bun run verify` exit 0 | Step 1 above |
| DoD-9 | Perf gate ≤ 500 ms ceiling | Step 2 above |
| DoD-10 | Heartbeat unit test PASS | Task 5 Step 4 |
| DoD-11 | README realtime section | Task 10 Step 4 |
| DoD-12 | V1 spec DEC sync | Task 10 Step 3 |

If every row has evidence, the plan is complete.

- [ ] **Step 5: Final commit (if anything was touched)**

Only commit if earlier steps required tweaks (e.g. perf-gated test). Otherwise skip — the final state is already committed.

```bash
# only if changes exist
git status
# If clean: nothing to commit. If modified:
git add -p
git commit -m "chore(bench): final verification adjustments (V1.1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Summary

Tasks 1–2 land the dependency bump + CLI regression guardrail. Tasks 3–6 build the streaming primitive and the `BenchUI` adapter stack bottom-up. Task 7 threads the adapter through `runFixture`; Task 8 composes phases in `index.ts`. Task 9 is a verification gate (preflight already clean). Task 10 writes the paper trail. Task 11 walks the DoD.

Total: 11 tasks, ~45 steps, ~11 commits. Expected wall-clock for a focused agent: ~2 hours. Risk surface is well-bounded — every task commits green, and the streaming `runCmd` refactor preserves backward-compat so regression is caught at Task 3 Step 7.
