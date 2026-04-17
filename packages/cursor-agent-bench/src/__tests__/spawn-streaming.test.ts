import { expect, test } from "bun:test";
import { runCmd } from "#src/spawn-cursor-agent";

test("runCmd streams lines via onStdoutLine callback", async () => {
  const lines: string[] = [];
  const result = await runCmd(
    ["bash", "-lc", "printf 'alpha\\nbeta\\ngamma\\n'"],
    { timeoutMs: 5_000, onStdoutLine: (line) => lines.push(line) },
  );
  expect(result.exitCode).toBe(0);
  expect(lines).toEqual(["alpha", "beta", "gamma"]);
  expect(result.stdout).toBe("alpha\nbeta\ngamma\n");
});

test("runCmd legacy path (no callback) buffers stdout unchanged", async () => {
  const result = await runCmd(
    ["bash", "-lc", "printf 'hello\\nworld\\n'"],
    { timeoutMs: 5_000 },
  );
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toBe("hello\nworld\n");
});

test("runCmd streams final line even without trailing newline", async () => {
  const lines: string[] = [];
  await runCmd(
    ["bash", "-lc", "printf 'one\\ntwo'"],
    { timeoutMs: 5_000, onStdoutLine: (line) => lines.push(line) },
  );
  expect(lines).toEqual(["one", "two"]);
});
