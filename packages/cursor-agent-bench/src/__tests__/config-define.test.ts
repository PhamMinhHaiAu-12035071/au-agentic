import { expect, test } from "bun:test";
import { defineConfig } from "#src/config-define";

test("defineConfig returns input unchanged when valid", () => {
  const cfg = defineConfig({
    models: ["m1", "m2"],
    defaultModel: "m1",
    defaultRuns: 1,
    matrixRuns: 3,
    perTurnTimeoutMs: 120_000,
    perFixtureDeadlineMs: 1_200_000,
    maxTurns: 20,
    retry: { max: 1, delayMs: 2_000 },
    trackerDir: "./tracker",
    jsonlDir: "./jsonl",
    fixturesDir: "./fixtures",
  });
  expect(cfg.models).toEqual(["m1", "m2"]);
  expect(cfg.defaultModel).toBe("m1");
});

test("defineConfig throws when defaultModel not in models[]", () => {
  expect(() =>
    defineConfig({
      models: ["m1"],
      defaultModel: "m2",
      defaultRuns: 1,
      matrixRuns: 3,
      perTurnTimeoutMs: 120_000,
      perFixtureDeadlineMs: 1_200_000,
      maxTurns: 20,
      retry: { max: 1, delayMs: 2_000 },
      trackerDir: "./t",
      jsonlDir: "./j",
      fixturesDir: "./f",
    }),
  ).toThrow(/defaultModel/);
});

test("defineConfig throws when models[] is empty", () => {
  expect(() =>
    defineConfig({
      models: [],
      defaultModel: "m1",
      defaultRuns: 1,
      matrixRuns: 3,
      perTurnTimeoutMs: 120_000,
      perFixtureDeadlineMs: 1_200_000,
      maxTurns: 20,
      retry: { max: 1, delayMs: 2_000 },
      trackerDir: "./t",
      jsonlDir: "./j",
      fixturesDir: "./f",
    }),
  ).toThrow(/models.+empty/);
});
