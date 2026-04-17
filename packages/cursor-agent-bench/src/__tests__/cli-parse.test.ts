import { expect, test } from "bun:test";
import { parseCliArgs } from "#src/cli-parse";

test("default args parse to smoke mode with no overrides", () => {
  const args = parseCliArgs([]);
  expect(args.mode).toBe("smoke");
  expect(args.model).toBeUndefined();
  expect(args.runs).toBeUndefined();
  expect(args.fixture).toBeUndefined();
  expect(args.help).toBe(false);
});

test("--matrix sets mode=matrix", () => {
  const args = parseCliArgs(["--matrix"]);
  expect(args.mode).toBe("matrix");
});

test("--model <id> captures model", () => {
  const args = parseCliArgs(["--model", "composer-2-fast"]);
  expect(args.model).toBe("composer-2-fast");
});

test("--runs N captures numeric runs", () => {
  const args = parseCliArgs(["--runs", "3"]);
  expect(args.runs).toBe(3);
});

test("--runs rejects non-positive integer", () => {
  expect(() => parseCliArgs(["--runs", "0"])).toThrow();
  expect(() => parseCliArgs(["--runs", "-1"])).toThrow();
  expect(() => parseCliArgs(["--runs", "abc"])).toThrow();
});

test("--fixture <id> captures fixture id", () => {
  const args = parseCliArgs(["--fixture", "brainstorm-smoke"]);
  expect(args.fixture).toBe("brainstorm-smoke");
});

test("combined flags parse correctly", () => {
  const args = parseCliArgs([
    "--matrix",
    "--model",
    "claude-4.5-sonnet",
    "--runs",
    "2",
    "--fixture",
    "brainstorm-smoke",
  ]);
  expect(args.mode).toBe("matrix");
  expect(args.model).toBe("claude-4.5-sonnet");
  expect(args.runs).toBe(2);
  expect(args.fixture).toBe("brainstorm-smoke");
});

test("--help sets help=true", () => {
  const args = parseCliArgs(["--help"]);
  expect(args.help).toBe(true);
});

test("unknown flag throws", () => {
  expect(() => parseCliArgs(["--unknown"])).toThrow(/unknown flag/);
});
