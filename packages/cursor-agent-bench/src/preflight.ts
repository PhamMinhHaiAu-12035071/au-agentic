export interface CmdResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface PreflightDeps {
  whichCursorAgent: () => Promise<string | null>;
  runStatus: () => Promise<CmdResult>;
  runWhoami: () => Promise<CmdResult>;
}

export interface PreflightResult {
  ok: boolean;
  exitCode: number;
  message?: string;
}

async function runCmd(cmd: string[]): Promise<CmdResult> {
  const p = Bun.spawnSync({ cmd, stdout: "pipe", stderr: "pipe" });
  return {
    exitCode: p.exitCode,
    stdout: p.stdout.toString().trim(),
    stderr: p.stderr.toString().trim(),
  };
}

export const defaultDeps: PreflightDeps = {
  whichCursorAgent: async () => {
    const r = await runCmd(["which", "cursor-agent"]);
    return r.exitCode === 0 && r.stdout ? r.stdout : null;
  },
  runStatus: () => runCmd(["cursor-agent", "status"]),
  runWhoami: () => runCmd(["cursor-agent", "whoami"]),
};

function isLoggedIn(r: CmdResult): boolean {
  return r.exitCode === 0 && r.stdout.length > 0;
}

export async function preflightCheck(deps: PreflightDeps = defaultDeps): Promise<PreflightResult> {
  const cli = await deps.whichCursorAgent();
  if (!cli) {
    return {
      ok: false,
      exitCode: 2,
      message:
        "cursor-agent binary not found on PATH. Install: curl https://cursor.com/install -fsSL | bash",
    };
  }
  const status = await deps.runStatus();
  if (isLoggedIn(status)) return { ok: true, exitCode: 0 };

  const whoami = await deps.runWhoami();
  if (isLoggedIn(whoami)) return { ok: true, exitCode: 0 };

  return {
    ok: false,
    exitCode: 2,
    message: "Not logged in to Cursor. Run: cursor-agent login",
  };
}
