import type { BenchConfig } from "#src/types";

export function defineConfig(input: BenchConfig): BenchConfig {
  if (input.models.length === 0) {
    throw new Error("cursor-bench.config: models[] must not be empty");
  }
  if (!input.models.includes(input.defaultModel)) {
    throw new Error(`cursor-bench.config: defaultModel "${input.defaultModel}" not in models[]`);
  }
  return input;
}
