import { expect, test } from "bun:test";
import { evalAssertion } from "#src/eval/l1";

test("includes matcher passes when pattern in output", () => {
  const r = evalAssertion(
    { kind: "includes", pattern: "hello" },
    { output: "hello world", exitCode: 0 },
  );
  expect(r.ok).toBe(true);
});

test("includes matcher fails when pattern absent", () => {
  const r = evalAssertion(
    { kind: "includes", pattern: "xyz" },
    { output: "hello world", exitCode: 0 },
  );
  expect(r.ok).toBe(false);
  expect(r.reason).toMatch(/not found/i);
});

test("notIncludes matcher passes when pattern absent", () => {
  const r = evalAssertion(
    { kind: "notIncludes", pattern: "error" },
    { output: "all good", exitCode: 0 },
  );
  expect(r.ok).toBe(true);
});

test("regex matcher works with RegExp pattern", () => {
  const r = evalAssertion(
    { kind: "regex", pattern: /recommended/i },
    { output: "This is RECOMMENDED", exitCode: 0 },
  );
  expect(r.ok).toBe(true);
});

test("regex matcher compiles string pattern", () => {
  const r = evalAssertion(
    { kind: "regex", pattern: "^turn\\s+\\d+" },
    { output: "Turn 3 complete", exitCode: 0 },
  );
  expect(r.ok).toBe(false);
});

test("exitCode matcher compares numeric", () => {
  const r = evalAssertion({ kind: "exitCode", pattern: 0 }, { output: "", exitCode: 0 });
  expect(r.ok).toBe(true);
  const r2 = evalAssertion({ kind: "exitCode", pattern: 0 }, { output: "", exitCode: 1 });
  expect(r2.ok).toBe(false);
});

test("unknown kind returns ok=false with reason", () => {
  const r = evalAssertion({ kind: "bogus" as never, pattern: "x" }, { output: "", exitCode: 0 });
  expect(r.ok).toBe(false);
  expect(r.reason).toMatch(/unknown/i);
});
