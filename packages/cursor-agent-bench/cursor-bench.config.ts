import { defineConfig } from "#src/config-define";

export default defineConfig({
  models: [
    "composer-2-fast",
    "claude-4.5-sonnet",
    "gemini-3-flash",
    "gpt-5.4-mini-medium",
    "grok-4-20",
    "claude-4-sonnet-thinking",
    "grok-4-20-thinking",
  ],
  defaultModel: "composer-2-fast",
  defaultRuns: 1,
  matrixRuns: 3,
  perTurnTimeoutMs: 120_000,
  perFixtureDeadlineMs: 1_200_000,
  maxTurns: 20,
  retry: { max: 1, delayMs: 2_000 },
  trackerDir: "../../docs/superpowers/bench",
  jsonlDir: "../../coverage/cursor-bench",
  fixturesDir: "./fixtures",
});
