import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { platform, release } from "node:os";
import type { ReproMetadata } from "#src/types";

export function shortSha256(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 8);
}

export interface MetadataDeps {
  readSkillFile: () => Promise<string>;
  readGitSha: () => Promise<string | null>;
  readBunVersion: () => Promise<string>;
  readCursorAgentVersion: () => Promise<string | null>;
  readPlatform: () => Promise<string>;
}

async function trySpawnStdout(cmd: string[]): Promise<string | null> {
  try {
    const p = Bun.spawnSync({ cmd, stdout: "pipe", stderr: "pipe" });
    if (p.exitCode !== 0) return null;
    const out = p.stdout.toString().trim();
    return out || null;
  } catch {
    return null;
  }
}

export function defaultDeps(skillPath: string): MetadataDeps {
  return {
    readSkillFile: () => readFile(skillPath, "utf8"),
    readGitSha: () => trySpawnStdout(["git", "rev-parse", "--short=8", "HEAD"]),
    readBunVersion: async () => Bun.version,
    readCursorAgentVersion: async () => {
      const out = await trySpawnStdout(["cursor-agent", "--version"]);
      if (!out) return null;
      // Take first token (strip "cursor-agent " prefix if present)
      const parts = out.split(/\s+/);
      return parts[parts.length - 1] ?? null;
    },
    readPlatform: async () => `${platform()} ${release()}`,
  };
}

export async function collectMetadata(deps: MetadataDeps): Promise<ReproMetadata> {
  const [skill, commit, bunV, cursorV, plat] = await Promise.all([
    deps.readSkillFile(),
    deps.readGitSha(),
    deps.readBunVersion(),
    deps.readCursorAgentVersion(),
    deps.readPlatform(),
  ]);
  return {
    commit: commit ?? "unknown",
    skillChecksum: shortSha256(skill),
    env: {
      bun: bunV,
      cursorAgent: cursorV ?? "unknown",
      platform: plat,
    },
  };
}
