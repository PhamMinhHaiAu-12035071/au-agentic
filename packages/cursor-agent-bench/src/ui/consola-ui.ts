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
