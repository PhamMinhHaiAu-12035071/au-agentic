import { expect, test } from "bun:test";
import { preflightCheck } from "#src/preflight";

const okCmd = async () => ({ exitCode: 0, stdout: "logged in as user@x.com", stderr: "" });
const failCmd = async () => ({ exitCode: 1, stdout: "", stderr: "not logged in" });
const emptyCmd = async () => ({ exitCode: 0, stdout: "", stderr: "" });

test("preflight passes when binary present and status returns info", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => "/usr/local/bin/cursor-agent",
    runStatus: okCmd,
    runWhoami: failCmd,
  });
  expect(r.ok).toBe(true);
});

test("preflight fails exit 2 when binary missing (C5)", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => null,
    runStatus: okCmd,
    runWhoami: okCmd,
  });
  expect(r.ok).toBe(false);
  expect(r.exitCode).toBe(2);
  expect(r.message).toMatch(/cursor-agent.+not found/i);
});

test("preflight falls back from status to whoami when status fails (C6)", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => "/usr/local/bin/cursor-agent",
    runStatus: failCmd,
    runWhoami: okCmd,
  });
  expect(r.ok).toBe(true);
});

test("preflight fails exit 2 when both status + whoami fail (C6)", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => "/usr/local/bin/cursor-agent",
    runStatus: failCmd,
    runWhoami: failCmd,
  });
  expect(r.ok).toBe(false);
  expect(r.exitCode).toBe(2);
  expect(r.message).toMatch(/cursor-agent login/);
});

test("preflight fails when status exit=0 but stdout empty (stale session)", async () => {
  const r = await preflightCheck({
    whichCursorAgent: async () => "/usr/local/bin/cursor-agent",
    runStatus: emptyCmd,
    runWhoami: emptyCmd,
  });
  expect(r.ok).toBe(false);
  expect(r.message).toMatch(/cursor-agent login/);
});
