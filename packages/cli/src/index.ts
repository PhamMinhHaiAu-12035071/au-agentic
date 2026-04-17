import * as p from "@clack/prompts";
import pc from "picocolors";
import { stepCopy } from "#steps/copy";
import { stepInputPath } from "#steps/path";
import { stepSelectSkills } from "#steps/skills";
import { stepSelectTools } from "#steps/tools";
import pkg from "../package.json" with { type: "json" };

// Non-TTY check — must run before any Clack call
if (!process.stdout.isTTY) {
  process.stderr.write(
    "✗ au-agentic requires an interactive terminal. Please run directly in your terminal.\n",
  );
  process.exit(1);
}

// Global Ctrl+C handler (before wizard starts)
process.on("SIGINT", () => {
  p.cancel("Cancelled — no files were modified");
  process.exit(1);
});

async function main(): Promise<void> {
  p.intro(
    `${pc.blue("◆ au-agentic")} ${pc.dim(`v${pkg.version}`)}\n` +
      `${pc.gray("Scaffold enterprise slash commands for AI coding tools")}`,
  );

  const projectPath = await stepInputPath();
  const tools = await stepSelectTools();
  const skills = await stepSelectSkills();
  await stepCopy(projectPath, tools, skills);
}

main().catch((err: unknown) => {
  p.log.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
