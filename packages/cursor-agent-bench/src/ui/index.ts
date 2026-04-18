import type { BenchUI } from "#src/ui/types";
import { createClackUI } from "#src/ui/clack-ui";
import { createConsolaUI } from "#src/ui/consola-ui";

export type { BenchUI };

export function createBenchUI(opts: { isTty: boolean }): BenchUI {
  return opts.isTty ? createClackUI() : createConsolaUI();
}
