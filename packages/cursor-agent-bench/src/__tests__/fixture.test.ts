import { expect, test } from "bun:test";
import { validateFixture } from "#src/fixture";
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
