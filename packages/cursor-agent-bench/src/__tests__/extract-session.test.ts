import { expect, test } from "bun:test";
import { buildCursorAgentCmd, extractSessionId, runCmd } from "#src/spawn-cursor-agent";

test("extractSessionId captures session_id from stdout", () => {
  expect(extractSessionId("session_id: abc123def", "")).toBe("abc123def");
});

test("extractSessionId captures sid from stderr", () => {
  expect(extractSessionId("", "sid=xyz-789_ok")).toBe("xyz-789_ok");
});

test("extractSessionId returns undefined when no match", () => {
  expect(extractSessionId("hello world", "no error")).toBeUndefined();
});

test("buildCursorAgentCmd constructs cmd without resumeId", () => {
  const cmd = buildCursorAgentCmd({ model: "sonnet-4", prompt: "hi", timeoutMs: 1000 });
  expect(cmd).toContain("--model");
  expect(cmd).toContain("sonnet-4");
  expect(cmd).not.toContain("--resume");
  expect(cmd[cmd.length - 1]).toBe("hi");
});

test("buildCursorAgentCmd includes --resume when resumeId set", () => {
  const cmd = buildCursorAgentCmd({
    model: "m",
    prompt: "p",
    resumeId: "sess-1",
    timeoutMs: 1000,
  });
  expect(cmd).toContain("--resume");
  expect(cmd).toContain("sess-1");
});

test("runCmd captures stdout and exitCode from a real command", async () => {
  const r = await runCmd(["sh", "-c", "echo hello"], 5000);
  expect(r.exitCode).toBe(0);
  expect(r.stdout).toMatch(/hello/);
  expect(r.timedOut).toBe(false);
});

test("runCmd marks timedOut=true when timer fires (I-1)", async () => {
  const r = await runCmd(["sh", "-c", "sleep 0.3"], 30);
  expect(r.timedOut).toBe(true);
  expect(r.exitCode).not.toBe(0);
});

test("runCmd marks timedOut=false on fast nonzero exit (I-1)", async () => {
  const r = await runCmd(["sh", "-c", "exit 1"], 5000);
  expect(r.timedOut).toBe(false);
  expect(r.exitCode).toBe(1);
});
