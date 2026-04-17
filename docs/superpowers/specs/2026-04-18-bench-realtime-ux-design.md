---
date: 2026-04-18
topic: bench-realtime-ux
status: design-approved
related-brief: file:temp/epic.md
related-v1-spec: file:docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md
---

# Bench Realtime UX — No-Stuck Guarantee (V1.1)

## Goal

Thêm realtime observability cho `bun run skill:bench` (`@au-agentic/cursor-agent-bench`). Sau khi user invoke command, terminal **không bao giờ silent gap > 1s ở TTY** và **> 30s ở non-TTY (pipe)**. Ràng buộc cứng: **NO-STUCK GUARANTEE** (DEC-029). Business logic bench (assertion, retry, deadline, report shape, JSONL) **không đổi**; chỉ thêm display tier + refactor `runCmd` để stream stdout line-by-line.

## Rationale

- V1 ship đúng 12 criteria, nhưng lần chạy đầu đụng UX blocker: smoke silent 2-5 phút, matrix silent 2-3h. Trái policy "verify before claiming complete" (AGENTS.md).
- `cursor-agent` mỗi turn thinking 30-120s — root pain dài nhất (P0), không có heartbeat = cảm giác "treo".
- Fix sớm = additive: không đổi public API, không đổi tracker/JSONL shape, zero migration cost.
- Hai thư viện đã align qua interview: `consola` (semantic logger trước & sau loop) và `@clack/prompts` v1.x (UI orchestration trong loop: progress bar + per-turn taskLog + heartbeat).

## Scope

**In scope (V1.1):**

- Refactor `packages/cursor-agent-bench/src/spawn-cursor-agent.ts:runCmd()` — stream stdout line-by-line via `ReadableStreamDefaultReader.read()` + text splitting; expose optional `onStdoutLine(line)` callback trong `SpawnArgs`. `SpawnResult` shape giữ nguyên backward-compat (DEC-032).
- New `src/ui/types.ts` — method-based `BenchUI` interface (DEC-030): preflight/config + intro/outro/progress/taskLog/box + heartbeat lifecycle.
- New `src/ui/clack-ui.ts` — TTY adapter dùng `@clack/prompts@^1.2.0`.
- New `src/ui/consola-ui.ts` — non-TTY adapter dùng `consola@^3.4.x`.
- New `src/ui/index.ts` — factory `createBenchUI({ isTty })` tự detect `process.stdout.isTTY` (DEC-027).
- Heartbeat implementation: **adapter self-ticks** (DEC-031) — adapter own setInterval(1s TTY / 30s non-TTY) khi `turnStart`, clear khi `turnEnd`. Runner logic không biết về UI timing policy.
- Refactor `src/runner.ts:runFixture()` accept `BenchUI` adapter; emit `turnStart/onStdoutLine/turnEnd` lifecycle (không emit `onElapsed` — adapter tự tick).
- Refactor `src/index.ts:main()` construct adapter + wire phase boundaries theo strict isolation (DEC-026): consola trước+sau loop, clack độc quyền trong loop.
- Refactor `src/preflight.ts` emit qua `consola.withTag('preflight')` thay `console.error`.
- Bump `@clack/prompts` repo-wide `^0.9.1 → ^1.2.0` ở `packages/cli/package.json` (deps) và add ở `packages/cursor-agent-bench/package.json` (devDeps).
- Add `consola@^3.4.x` devDep chỉ ở `packages/cursor-agent-bench/package.json`.
- New `packages/cli/src/__tests__/clack-v1-compat.test.ts` — smoke regression test (DEC-033): mock clack primitives, assert wizard khởi động OK + "no unused exports" (import mọi clack symbol wizard đang dùng).
- New unit tests: `ui-clack.test.ts`, `ui-consola.test.ts`, `runner-streaming.test.ts`.
- Update existing tests (`packages/cursor-agent-bench/src/__tests__/`) inject mock `BenchUI` adapter.
- Update `packages/cursor-agent-bench/README.md` với demo realtime UX (asciinema link).
- New `docs/adr/0011-consola-for-bench-semantic-logging.md`.
- Update `docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md` sync DEC-024..033.
- Update `docs/ai/coding-rules.md` link ADR-0011.

**Out of scope (defer, V1.2+):**

- `--quiet` / `--no-tty` CLI flag explicit override (auto-detect cover 99%).
- `consola` JSON reporter cho CI structured logs (DEC-013 local-only).
- Switching consola to default reporter (giữ `fancy: true`).
- Trend graph / sparkline / live latency chart.
- Token cost meter trong UI (Cursor CLI chưa expose API ổn định).
- Replace clack với `ink`/`blessed` (clack đủ).
- Persistent `events.log` file.
- Per-turn telemetry (OpenTelemetry traces) → external observability.

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│ packages/cursor-agent-bench/src/                                      │
│                                                                       │
│   index.ts                                                            │
│     │  parse args                                                     │
│     │  ┌──────────── consola phase (before loop, DEC-026) ────────┐   │
│     │  │  preflight.ts  → consola.withTag('preflight').{start/…}  │   │
│     │  │  load config   → consola.withTag('config').info(...)     │   │
│     │  └──────────────────────────────────────────────────────────┘   │
│     │                                                                 │
│     │  const ui = createBenchUI({ isTty: process.stdout.isTTY })      │
│     │  await ui.intro('⚡ cursor-agent-bench')                        │
│     │  await ui.progressStart({ max: totalCells })                    │
│     │  for each (fixture × model × run):                              │
│     │     await ui.cellStart({ idx, total, label })                   │
│     │     runFixture(fx, { ..., ui })                                 │
│     │     await ui.cellEnd({ pass, durationMs })                      │
│     │  await ui.progressStop('Bench finished')                        │
│     │  await ui.outro('Tracker updated: ...')                         │
│     │                                                                 │
│     │  ┌──────────── consola phase (after loop, DEC-026) ─────────┐   │
│     │  │  consola.box('Result: 19/21 pass | 2h 14m | ranking:...')│   │
│     │  │  consola.success / consola.error (exit rationale)        │   │
│     │  └──────────────────────────────────────────────────────────┘   │
│                                                                       │
│   ui/types.ts        ← BenchUI interface (method-based, DEC-030)      │
│   ui/clack-ui.ts     ← TTY adapter (clack v1.x)                       │
│   ui/consola-ui.ts   ← non-TTY adapter (consola)                      │
│   ui/index.ts        ← factory createBenchUI({ isTty })               │
│                                                                       │
│   runner.ts          ← wires ui.turnStart/onStdoutLine/turnEnd        │
│   spawn-cursor-agent.ts  ← streaming runCmd() (line-by-line)          │
└───────────────────────────────────────────────────────────────────────┘
```

## BenchUI Interface (Method-Based, DEC-030)

File: `packages/cursor-agent-bench/src/ui/types.ts`

```ts
export interface CellLabel {
  idx: number;           // 1-based
  total: number;
  fixture: string;
  model: string;
  runIndex: number;
}

export interface TurnLabel {
  turn: number;          // 0-based
  prompt: string;        // truncated to ~60 chars cho display
}

export interface TurnOutcome {
  pass: boolean;
  durationMs: number;
  reason?: string;       // 'assertion' | 'turn-timeout' | 'budget-exceeded' | 'spawn-error'
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
  /** Gọi mỗi khi subprocess emit 1 line stdout. */
  turnLine(line: string): void;
  turnEnd(outcome: TurnOutcome): Promise<void>;
  cellEnd(outcome: CellOutcome): Promise<void>;
  progressStop(message: string): Promise<void>;
  outro(message: string): Promise<void>;
}
```

**Invariants:**

- Gọi theo sequence: `intro` → `progressStart` → (for each cell: `cellStart` → (for each turn: `turnStart` → `turnLine*` → `turnEnd`) → `cellEnd`) → `progressStop` → `outro`.
- `turnLine` là sync (hot path, gọi rất nhiều lần); tất cả methods khác `async`.
- Adapter MUST handle interleaved `turnLine` giữa `turnStart` và `turnEnd` an toàn (buffer hoặc stream trực tiếp tuỳ adapter).
- Heartbeat: adapter **self-owns** setInterval (DEC-031) — start trong `turnStart`, clear trong `turnEnd`. Runner không biết về interval.

## Clack TTY Adapter

File: `packages/cursor-agent-bench/src/ui/clack-ui.ts`

Dùng `@clack/prompts@^1.2.0`:

- `intro` / `outro` → `p.intro()` / `p.outro()`.
- `progressStart({ max })` → `p.progress({ max })`; giữ handle instance.
- `cellStart(label)` → `progress.advance(1, 'Cell [idx/total] fixture / model / run N')`.
- `turnStart(label)` → tạo `const tlog = p.taskLog({ title: 'Turn N: "prompt…"' })`; start `setInterval(1000, () => tlog.message('⏱  elapsed ${elapsed}s'))`.
- `turnLine(line)` → `tlog.message(line)` (clack batches tự động).
- `turnEnd(outcome)` → clear interval; `outcome.pass ? tlog.success() : tlog.error(outcome.reason ?? 'failed')`. `success()` clear-on-success; `error()` persist.
- `cellEnd` → no-op (progress counter đã advance trong cellStart).
- `progressStop` → `progress.stop(message)`.

## Consola Non-TTY Adapter

File: `packages/cursor-agent-bench/src/ui/consola-ui.ts`

Dùng `consola@^3.4.x` với `fancy: true` default reporter:

- `intro` → `consola.withTag('bench').start(title)`.
- `progressStart` → `consola.withTag('bench').info('Running ${max} cells')`.
- `cellStart(label)` → `consola.withTag('bench').start('[idx/total] fixture / model / run N')`; lưu start timestamp.
- `turnStart(label)` → `consola.withTag('bench').info('Turn N: prompt…')`; start `setInterval(30_000, () => consola.withTag('bench').info('… still running (${elapsed}s)'))`.
- `turnLine(line)` → stream as `consola.withTag('bench').info(line)` — mỗi line một log entry (plain text, no ANSI).
- `turnEnd(outcome)` → clear interval; `outcome.pass ? consola.withTag('bench').success('Turn OK (${durationMs}ms)') : consola.withTag('bench').error('Turn FAIL: ${reason}')`.
- `cellEnd` → `consola.withTag('bench').success/error('Cell ...')`.
- `progressStop(message)` → `consola.withTag('bench').success(message)`.
- `outro(message)` → `consola.withTag('bench').info(message)`.

**Non-TTY safety:** consola default reporter strip ANSI khi `!process.stdout.isTTY` — verify qua test `grep $'\x1b' bench.log → nothing` (DoD-3).

## Factory

File: `packages/cursor-agent-bench/src/ui/index.ts`

```ts
import type { BenchUI } from "#src/ui/types";
import { createClackUI } from "#src/ui/clack-ui";
import { createConsolaUI } from "#src/ui/consola-ui";

export function createBenchUI(opts: { isTty: boolean }): BenchUI {
  return opts.isTty ? createClackUI() : createConsolaUI();
}
```

Zero new CLI flags (DEC-027). Override qua monkey-patch `process.stdout.isTTY` trong test.

## Streaming `runCmd` Refactor (DEC-032)

File: `packages/cursor-agent-bench/src/spawn-cursor-agent.ts`

```ts
export interface SpawnArgs {
  model: string;
  prompt: string;
  resumeId?: string;
  timeoutMs: number;
  /** Optional line callback. Nếu undefined → legacy buffered path (existing tests). */
  onStdoutLine?: (line: string) => void;
}

export async function runCmd(cmd: string[], args: {
  timeoutMs: number;
  onStdoutLine?: (line: string) => void;
}): Promise<SpawnResult> {
  const start = performance.now();
  const proc = Bun.spawn({ cmd, stdout: "pipe", stderr: "pipe" });
  let killedByTimer = false;
  const timer = setTimeout(() => {
    killedByTimer = true;
    try { proc.kill(); } catch {}
  }, args.timeoutMs);

  const stdoutChunks: string[] = [];
  const decoder = new TextDecoder();

  const consumeStdout = args.onStdoutLine
    ? (async () => {
        const reader = proc.stdout.getReader();
        let buffer = "";
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            stdoutChunks.push(chunk);
            let nl: number;
            while ((nl = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, nl);
              buffer = buffer.slice(nl + 1);
              args.onStdoutLine!(line);
            }
          }
          if (buffer.length) {
            args.onStdoutLine!(buffer);
            stdoutChunks.push(""); // already captured
          }
        } finally {
          reader.releaseLock();
        }
      })()
    : new Response(proc.stdout).text().then((t) => { stdoutChunks.push(t); });

  const [, stderr] = await Promise.all([consumeStdout, new Response(proc.stderr).text()]);
  const exitCode = await proc.exited;
  clearTimeout(timer);
  const stdout = stdoutChunks.join("");
  const durationMs = Math.round(performance.now() - start);
  return { stdout, stderr, exitCode, durationMs, timedOut: killedByTimer, sessionId: extractSessionId(stdout, stderr) };
}
```

**Invariants:**

- `SpawnResult` shape **không đổi** — existing tests pass mà không refactor.
- `runCmd` signature từ `(cmd, timeoutMs)` → `(cmd, { timeoutMs, onStdoutLine? })` — **internal breaking change** (chỉ `spawnCursorAgent` gọi). Existing unit test phải update call site (1-line change); vì file test hiện đã dùng `runCmd(cmd, 1000)` nên update thành `runCmd(cmd, { timeoutMs: 1000 })`. Not backward-compat ở binding nhưng KHÔNG phá behavior.
- Nếu `onStdoutLine` undefined → legacy path `new Response(proc.stdout).text()` (behavior cũ).
- Nếu set → reader loop, split `\n`, gọi callback per line, aggregate vào `stdoutChunks` để trả `stdout` đầy đủ cho assertion eval.
- Decoder `stream: true` handle multi-byte boundary split đúng.

## Runner Wiring

File: `packages/cursor-agent-bench/src/runner.ts`

Thêm `ui: BenchUI` vào `RunFixtureOpts`. Trong `for` loop turn:

```ts
await opts.ui.turnStart({ turn: i, prompt: truncatePrompt(prompt, 60) });

spawnRes = await spawn({
  model, prompt, resumeId, timeoutMs,
  onStdoutLine: (line) => opts.ui.turnLine(line),
});

// ... assertion eval, truncate, dump ...

await opts.ui.turnEnd({
  pass,
  durationMs: finalSpawn.durationMs,
  reason,
});
```

Business logic khác (deadline check, retry, assertion, dump) **không đổi**.

## Index Wiring

File: `packages/cursor-agent-bench/src/index.ts`

Strict phase-based isolation (DEC-026):

```ts
import { consola } from "consola";
import { createBenchUI } from "#src/ui";

async function main(): Promise<number> {
  // 1. Parse args
  let args: ReturnType<typeof parseCliArgs>;
  try { args = parseCliArgs(process.argv.slice(2)); }
  catch (e) {
    consola.error(`error: ${(e as Error).message}`);
    consola.info(HELP_TEXT);
    return 4;
  }
  if (args.help) { consola.info(HELP_TEXT); return 0; }

  // 2. Preflight (consola phase)
  const preflightLog = consola.withTag("preflight");
  preflightLog.start("Checking cursor-agent CLI + login");
  const pre = await preflightCheck();
  if (!pre.ok) { preflightLog.error(pre.message); return pre.exitCode; }
  preflightLog.success("OK");

  // 3. Config summary (consola phase)
  consola.withTag("config").info(`mode=${args.mode} models=${models.join(",")} runs=${runs}`);

  // 4. Loop (clack phase, DEC-026 strict)
  const ui = createBenchUI({ isTty: Boolean(process.stdout.isTTY) });
  await ui.intro("⚡ cursor-agent-bench");
  await ui.progressStart({ max: totalCells });
  let cellIdx = 0;
  for (const fx of fixtures) {
    // ... existing logic ...
    for (const model of models) {
      for (let r = 0; r < runs; r++) {
        cellIdx++;
        await ui.cellStart({ idx: cellIdx, total: totalCells, fixture: fx.id, model, runIndex: r });
        const turns = await runFixture(fx, { ..., ui });
        const cellPass = turns.every((t) => t.pass);
        const cellMs = turns.reduce((s, t) => s + t.durationMs, 0);
        await ui.cellEnd({ pass: cellPass, durationMs: cellMs });
        // ... aggregate ...
      }
    }
  }
  await ui.progressStop("Bench finished");
  await ui.outro(`Tracker: ${config.trackerDir}`);

  // 5. Summary box + exit rationale (consola phase)
  consola.box(`Result: ${passCount}/${totalCount} pass | ${formatMs(wallClockMs)} | mode=${args.mode}`);
  if (passCount === totalCount) consola.success("All cells pass");
  else consola.error(`${totalCount - passCount} cells failed`);
  return passCount === totalCount ? 0 : 1;
}
```

## Dependencies Delta

| Action | Package | Version | Where |
|---|---|---|---|
| BUMP | `@clack/prompts` | `^0.9.1` → `^1.2.0` | `packages/cli/package.json` (deps) |
| ADD | `@clack/prompts` | `^1.2.0` | `packages/cursor-agent-bench/package.json` (devDeps) |
| ADD | `consola` | `^3.4.x` | `packages/cursor-agent-bench/package.json` (devDeps) |
| KEEP | `picocolors`, `@clack/core` | unchanged | auto-resolved peer |

ESM-only OK (cả 2 package `"type": "module"`).

## Testing Strategy

**Tier 1 — Unit:**

- `ui-clack.test.ts` — mock `@clack/prompts`, assert `BenchUI` method sequence → clack calls đúng thứ tự. **Heartbeat test**: mock `setInterval`/`setTimeout`, gọi `turnStart` → advance `jest.useFakeTimers` 1100ms → assert ≥1 `tlog.message` call chứa `'elapsed'`.
- `ui-consola.test.ts` — spy `consola.withTag(...)` methods; assert `turnLine` emit qua `.info()`; **no ANSI** — snapshot output không có `\x1b[` (monkey-patch `process.stdout.isTTY = false`).
- `runner-streaming.test.ts` — mock `spawn` chủ động gọi `onStdoutLine('line 1')`, `onStdoutLine('line 2')`; assert mock `BenchUI.turnLine` được gọi ≥2 lần theo đúng thứ tự.
- `spawn-cursor-agent.test.ts` — tests cũ pass không đổi (backward-compat path); thêm case mới: spawn stub `echo -e "a\nb\nc"`, pass callback, assert 3 invocations.

**Tier 2 — Integration:**

- Test cũ trong `packages/cursor-agent-bench/src/__tests__/` inject mock `BenchUI` (no-op methods) → không phá existing integration coverage.

**Tier 3 — CLI regression (DoD-4):**

- `packages/cli/src/__tests__/clack-v1-compat.test.ts` — mock `@clack/prompts` v1.2.0 surface. 2 test cases:
  1. Import wizard entry + run minimal happy path → assert sequence of clack calls đúng (intro, text, select, outro).
  2. "No unused exports" — import every clack symbol wizard dùng (list trong `rg` ở `packages/cli/src`) → assert mọi symbol tồn tại trong `@clack/prompts@^1.2.0` (catch renamed/removed API).

**Perf gate (DoD-9):**

- `scripts/benchmark.ts` entry `bun test (cursor-agent-bench unit)` giữ target 200ms / ceiling 500ms. Nếu thêm UI test làm vượt, relax ceiling tối đa 600ms — **escalate trước khi relax**.

## Documentation Updates Required (same PR)

- `packages/cursor-agent-bench/README.md` — add section "Realtime UX" + asciinema demo link.
- `docs/adr/0011-consola-for-bench-semantic-logging.md` — rationale: why 2 logger libs (strict phase isolation), DEC-026.
- `docs/ai/coding-rules.md` — link ADR-0011; add rule "bench adapter pattern: clack-in-loop, consola-outside".
- `docs/superpowers/specs/2026-04-17-cursor-agent-bench-design.md` — sync DEC-024..033 (append Decision Log, update Scope section).
- `docs/development/testing-policy.md` — add bullet "bench adapter tests: inject mock BenchUI".

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `packages/cli` wizard regression khi bump clack `0.9.1 → 1.2.0` | 🟡 medium | `clack-v1-compat.test.ts` 2-case regression (DEC-033); manual smoke `bun run cli` (wizard) 1 lần local trước merge. |
| ANSI race nếu boundary bị phá (consola lọt vào loop) | 🟡 medium | ADR-0011 explicit rule; adapter pattern enforce; code review checklist. |
| Heartbeat tick spam noisy UX | 🟢 low | TTY: `tlog.success()` clear-on-success; non-TTY 30s interval đã tune. |
| Non-TTY fallback chưa từng test (new code path) | 🟢 low | `ui-consola.test.ts` inject `isTty=false` + ANSI-free assertion. |
| ESM-only của clack 1.x phá build | 🟢 low | Cả 2 package đã `"type": "module"`; verify pass. |
| Perf gate vượt 500ms ceiling do thêm UI test | 🟢 low | Unit test adapter riêng, mock clack/consola → < 50ms. Escalate nếu vượt. |
| `Bun.spawn` stdout reader double-consume regression | 🟢 low | Code path tách rõ: `onStdoutLine` set → reader loop (không `new Response(proc.stdout).text()`); undefined → legacy. Unit test cover cả 2 paths. |

## Success Signals (from epic brief, verifiable)

- [ ] `bun run skill:bench` (smoke) → terminal không silent > 1s ở TTY (DEC-029). Manual verify.
- [ ] `bun run skill:bench > bench.log 2>&1` → `grep $'\x1b' bench.log` returns nothing. CI-style verify.
- [ ] `packages/cli` wizard regression test PASS sau bump clack.
- [ ] `bun run verify` xanh; existing tests pass; new tests pass.
- [ ] ADR-0011 published & linked.

## Definition of Done (ALL must PASS)

| # | Gate | Verification |
|---|---|---|
| DoD-1 | `bun run skill:bench` (smoke) silent gap ≤ 1s TTY | Manual run + visual check |
| DoD-2 | `bun run skill:bench --matrix` progress max=cells, taskLog clear-on-success, persist-on-fail | Manual run |
| DoD-3 | `bun run skill:bench > bench.log 2>&1` plain text, no ANSI literal | `grep $'\x1b' bench.log` returns nothing |
| DoD-4 | `clack-v1-compat.test.ts` PASS | `bun run test --filter @au-agentic/cli` |
| DoD-5 | All existing bench tests PASS | `bun run verify` |
| DoD-6 | New `ui-clack.test.ts`, `ui-consola.test.ts`, `runner-streaming.test.ts` PASS | `bun run test` |
| DoD-7 | ADR-0011 published + linked from `docs/ai/coding-rules.md` | file exists + grep |
| DoD-8 | `bun run verify` PASS (typecheck + lint + test) | exit 0 |
| DoD-9 | `bun run perf` bench unit ≤200ms target / ≤500ms ceiling | `benchmark.ts` output |
| DoD-10 | Heartbeat tick verified: TTY test mock `setInterval`, assert ≥1 tick trong 1100ms simulated delay | unit test |
| DoD-11 | README updated với realtime UX demo (asciinema link OK) | manual review |
| DoD-12 | V1 spec sync DEC-024..033 | diff review |

## Decision Log (V1.1 delta)

| ID | Decision | Status | Provenance |
|---|---|---|---|
| DEC-024 | Realtime UI mode = Hybrid (progress + per-turn taskLog streaming) | accepted | epic brief |
| DEC-025 | Bump `@clack/prompts` repo-wide; add `consola` devDep bench-only | accepted | epic brief |
| DEC-026 | Strict phase isolation: consola outside loop, clack in-loop | accepted | epic brief |
| DEC-027 | Auto-detect TTY via `process.stdout.isTTY`; zero new flags | accepted | epic brief |
| DEC-028 | DoD must include heartbeat + cli regression + ADR-0011 | accepted | epic brief |
| DEC-029 | HARD NO-STUCK: ≤1s TTY / ≤30s non-TTY | accepted | epic brief |
| DEC-030 | BenchUI interface = **method-based** (not event-emitter) | accepted | 2026-04-18 /ask-user-question |
| DEC-031 | Heartbeat = **adapter self-ticks** (not runner onElapsed) | accepted | 2026-04-18 /ask-user-question |
| DEC-032 | `runCmd` refactor = **optional callbacks** (backward-compat) | accepted | 2026-04-18 /ask-user-question |
| DEC-033 | CLI regression test = **smoke wizard + no-unused-exports** | accepted | 2026-04-18 /ask-user-question |

## Open Follow-ups (deferred, not blocking V1.1)

- `--quiet` / `--no-tty` CLI flag explicit override.
- consola JSON reporter mode cho CI structured logs.
- OpenTelemetry traces per turn.
- Live HTML dashboard (long-term).
- Benchmark target re-tune nếu measured > 200ms after UI adapter tests.
