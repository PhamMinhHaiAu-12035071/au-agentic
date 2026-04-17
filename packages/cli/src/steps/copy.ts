import { join } from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { fileExists, writeTemplate } from "#utils/files";
import {
  filesForSkillTool,
  getNextStep,
  getToolLabel,
  type Skill,
  type Tool,
} from "#utils/templates";

type CopyResult = "copied" | "skipped" | "failed";
type FileStatus = "new" | "overwrite";

interface FileResult {
  skill: Skill;
  tool: Tool;
  targetPath: string;
  status: FileStatus;
  result: CopyResult;
  error?: string;
}

interface CopyOptions {
  confirmOverwrite: (targetPath: string) => Promise<boolean>;
  onResult?: (result: FileResult) => void;
}

interface ScaffoldItem {
  skill: Skill;
  tool: Tool;
  abs: string;
  content: string;
  exists: boolean;
}

async function enumerateScaffoldItems(
  projectPath: string,
  tools: Tool[],
  skills: Skill[],
): Promise<ScaffoldItem[]> {
  const items: Omit<ScaffoldItem, "exists">[] = [];
  for (const skill of skills) {
    for (const tool of tools) {
      for (const { targetPath, content } of filesForSkillTool(skill, tool)) {
        items.push({ skill, tool, abs: join(projectPath, targetPath), content });
      }
    }
  }
  // Parallelize stat calls — independent and hot-path for a 120+ file scaffold
  return Promise.all(items.map(async (i) => ({ ...i, exists: await fileExists(i.abs) })));
}

export async function copyFilesToProject(
  projectPath: string,
  tools: Tool[],
  skills: Skill[],
  options: CopyOptions,
): Promise<FileResult[]> {
  const items = await enumerateScaffoldItems(projectPath, tools, skills);
  return runCopy(items, options);
}

async function runCopy(items: ScaffoldItem[], options: CopyOptions): Promise<FileResult[]> {
  const results: FileResult[] = [];

  for (const { skill, tool, abs, content, exists } of items) {
    const status: FileStatus = exists ? "overwrite" : "new";

    if (exists) {
      const confirmed = await options.confirmOverwrite(abs);
      if (!confirmed) {
        const r: FileResult = { skill, tool, targetPath: abs, status, result: "skipped" };
        results.push(r);
        options.onResult?.(r);
        continue;
      }
    }

    try {
      await writeTemplate(content, abs);
      const r: FileResult = { skill, tool, targetPath: abs, status, result: "copied" };
      results.push(r);
      options.onResult?.(r);
    } catch (err) {
      const r: FileResult = {
        skill,
        tool,
        targetPath: abs,
        status,
        result: "failed",
        error: (err as Error).message,
      };
      results.push(r);
      options.onResult?.(r);
    }
  }

  return results;
}

function showResults(results: FileResult[]): void {
  const hasFailure = results.some((r) => r.result === "failed");
  if (hasFailure) p.log.warn("Scaffold completed with errors");

  for (const r of results) {
    const icon =
      r.result === "copied" ? pc.green("✓") : r.result === "skipped" ? pc.dim("–") : pc.red("✗");
    const label =
      r.result === "copied" && r.status === "new"
        ? pc.dim("(new)")
        : r.result === "copied" && r.status === "overwrite"
          ? pc.dim("(overwritten)")
          : r.result === "skipped"
            ? pc.dim("(skipped)")
            : pc.red(`(failed: ${r.error})`);
    p.log.message(`  ${icon} ${r.targetPath} ${label}`);
  }
}

function showNextSteps(tools: Tool[], skills: Skill[]): void {
  p.log.message(`\n${pc.dim("Next steps:")}`);
  for (const skill of skills) {
    p.log.message(`  ${pc.bold(skill)}:`);
    for (const tool of tools) {
      p.log.message(`    ${getToolLabel(tool)}: ${getNextStep(tool, skill)}`);
    }
  }
}

export async function stepCopy(projectPath: string, tools: Tool[], skills: Skill[]): Promise<void> {
  const previews = await enumerateScaffoldItems(projectPath, tools, skills);

  p.log.info(
    `Will scaffold ${skills.length} skill(s) × ${tools.length} tool(s) = ${previews.length} file(s)`,
  );

  const action = await p.select({
    message: "What would you like to do?",
    options: [
      { value: "preview", label: "Preview files first" },
      { value: "copy", label: "Copy now" },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel("Cancelled — no files were modified");
    process.exit(1);
  }

  if (action === "preview") {
    p.log.message(pc.dim("\nFile preview:"));
    for (const f of previews) {
      const label = f.exists ? pc.yellow("(overwrite)") : pc.green("(new)");
      p.log.message(`  ${f.abs} ${label}`);
    }
    const proceed = await p.confirm({ message: "Proceed to copy?" });
    if (p.isCancel(proceed) || !proceed) {
      p.outro("No files were copied.");
      process.exit(0);
    }
  }

  const copiedPaths: string[] = [];

  const results = await copyFilesToProject(projectPath, tools, skills, {
    confirmOverwrite: async (targetPath) => {
      const answer = await p.confirm({ message: `${targetPath} already exists. Overwrite?` });
      if (p.isCancel(answer)) {
        const copiedList =
          copiedPaths.length > 0
            ? `\nFiles already copied:\n${copiedPaths.map((x) => `  ${x}`).join("\n")}`
            : "";
        p.cancel(`Cancelled.${copiedList}\nRemaining files were not copied.`);
        process.exit(1);
      }
      return answer as boolean;
    },
    onResult: (r) => {
      if (r.result === "copied") copiedPaths.push(r.targetPath);
    },
  });

  showResults(results);
  showNextSteps(tools, skills);

  const hasFailure = results.some((r) => r.result === "failed");
  if (hasFailure) {
    const failCount = results.filter((r) => r.result === "failed").length;
    const okCount = results.filter((r) => r.result === "copied").length;
    p.outro(`${okCount} file(s) created, ${failCount} failed. Fix permissions and run again.`);
    process.exit(1);
  }

  p.outro(pc.green("✓ Scaffold complete!"));
}
