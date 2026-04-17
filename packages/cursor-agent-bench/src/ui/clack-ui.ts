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
      progress = p.progress({ max: opts.max }) as unknown as ProgressHandle;
    },
    async cellStart(label: CellLabel): Promise<void> {
      const line = `[${label.idx}/${label.total}] ${label.fixture} / ${label.model} / run ${label.runIndex}`;
      progress?.advance(1, line);
    },
    async turnStart(label: TurnLabel): Promise<void> {
      task = p.taskLog({ title: `Turn ${label.turn}: "${truncatePrompt(label.prompt)}"` }) as unknown as TaskLogHandle;
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
