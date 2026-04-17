import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAllFixtures, validateFixture } from "#src/fixture";
import type { Fixture } from "#src/types";

test("validateFixture accepts minimal valid fixture", () => {
  const f: Fixture = {
    id: "x",
    skill: "y",
    description: "z",
    turns: [{ prompt: "p", assertions: [{ kind: "exitCode", pattern: 0 }] }],
  };
  expect(() => validateFixture(f)).not.toThrow();
});

test("validateFixture throws when id missing", () => {
  expect(() => validateFixture({} as Fixture)).toThrow(/id/);
});

test("validateFixture throws when turns empty", () => {
  expect(() =>
    validateFixture({
      id: "x",
      skill: "y",
      description: "z",
      turns: [],
    }),
  ).toThrow(/turns/);
});

test("validateFixture throws when turn has no prompt", () => {
  expect(() =>
    validateFixture({
      id: "x",
      skill: "y",
      description: "z",
      turns: [{ prompt: "", assertions: [] }],
    }),
  ).toThrow(/prompt/);
});

test("validateFixture allows turn with zero assertions (smoke)", () => {
  expect(() =>
    validateFixture({
      id: "x",
      skill: "y",
      description: "z",
      turns: [{ prompt: "p", assertions: [] }],
    }),
  ).not.toThrow();
});

test("validateFixture rejects maxTurns < turns.length", () => {
  expect(() =>
    validateFixture({
      id: "x",
      skill: "y",
      description: "z",
      maxTurns: 1,
      turns: [
        { prompt: "p1", assertions: [] },
        { prompt: "p2", assertions: [] },
      ],
    }),
  ).toThrow(/maxTurns/);
});

test("loadAllFixtures wraps validation error with filename context (I-1)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "bench-fx-"));
  try {
    await writeFile(
      join(dir, "broken.ts"),
      'export default { skill: "s", description: "d", turns: [] };',
    );
    await expect(loadAllFixtures(dir)).rejects.toThrow(/broken\.ts.+id is required/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("loadAllFixtures wraps missing default export with filename context (I-1)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "bench-fx-"));
  try {
    await writeFile(join(dir, "no-default.ts"), "export const x = 1;");
    await expect(loadAllFixtures(dir)).rejects.toThrow(/no-default\.ts.+missing default export/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
