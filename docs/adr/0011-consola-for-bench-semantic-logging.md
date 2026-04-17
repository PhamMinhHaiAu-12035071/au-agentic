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
