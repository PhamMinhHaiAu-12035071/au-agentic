import * as p from '@clack/prompts';
import { join } from 'path';
import pc from 'picocolors';
import { fileExists, writeTemplate } from '../utils/files.js';
import {
  getTemplateContent,
  getTargetPath,
  TOOL_LABELS,
  type Tool,
} from '../utils/templates.js';

export type CopyResult = 'copied' | 'skipped' | 'failed';

export interface FileResult {
  tool: Tool;
  targetPath: string;
  status: 'new' | 'overwrite';
  result: CopyResult;
  error?: string;
}

interface CopyOptions {
  confirmOverwrite: (targetPath: string) => Promise<boolean>;
}

/**
 * Core copy logic, extracted for testability. No Clack calls.
 */
export async function copyFilesToProject(
  projectPath: string,
  tools: Tool[],
  options: CopyOptions,
): Promise<FileResult[]> {
  const results: FileResult[] = [];

  for (const tool of tools) {
    const relativePath = getTargetPath(tool);
    const targetPath = join(projectPath, relativePath);
    const exists = await fileExists(targetPath);
    const status: 'new' | 'overwrite' = exists ? 'overwrite' : 'new';

    if (exists) {
      const confirmed = await options.confirmOverwrite(targetPath);
      if (!confirmed) {
        results.push({ tool, targetPath, status, result: 'skipped' });
        continue;
      }
    }

    try {
      await writeTemplate(getTemplateContent(tool), targetPath);
      results.push({ tool, targetPath, status, result: 'copied' });
    } catch (err) {
      results.push({
        tool,
        targetPath,
        status,
        result: 'failed',
        error: (err as Error).message,
      });
    }
  }

  return results;
}

export function showResults(results: FileResult[]): void {
  const hasFailure = results.some((r) => r.result === 'failed');

  if (hasFailure) {
    p.log.warn('Scaffold completed with errors');
  }

  for (const r of results) {
    const icon =
      r.result === 'copied' ? pc.green('✓') :
      r.result === 'skipped' ? pc.dim('–') :
      pc.red('✗');

    const label =
      r.result === 'copied' && r.status === 'new' ? pc.dim('(new)') :
      r.result === 'copied' && r.status === 'overwrite' ? pc.dim('(overwritten)') :
      r.result === 'skipped' ? pc.dim('(skipped)') :
      pc.red(`(failed: ${r.error})`);

    p.log.message(`  ${icon} ${r.targetPath} ${label}`);
  }
}

function showNextSteps(tools: Tool[]): void {
  const steps: Record<Tool, string> = {
    cursor: 'Mở Cursor → Chat panel → Gõ /interview',
    claude: 'Chạy `claude` → Gõ /interview',
    copilot: 'VS Code → Copilot Chat → Gõ /interview',
    codex: 'Chạy `codex` → Gõ $interview hoặc /interview',
  };

  p.log.message('\n' + pc.dim('Next steps:'));
  for (const tool of tools) {
    p.log.message(`  ${pc.bold(TOOL_LABELS[tool])}: ${steps[tool]}`);
  }
}

export async function stepCopy(projectPath: string, tools: Tool[]): Promise<void> {
  // Scan existing files
  const fileInfos = await Promise.all(
    tools.map(async (tool) => ({
      tool,
      targetPath: join(projectPath, getTargetPath(tool)),
      exists: await fileExists(join(projectPath, getTargetPath(tool))),
    })),
  );

  p.log.info(
    `/interview will be scaffolded for: ${tools.map((t) => TOOL_LABELS[t]).join(', ')}`,
  );

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'preview', label: 'Preview files first' },
      { value: 'copy', label: 'Copy now' },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel('Cancelled — no files were modified');
    process.exit(1);
  }

  if (action === 'preview') {
    p.log.message(pc.dim('\nFile preview:'));
    for (const f of fileInfos) {
      const label = f.exists ? pc.yellow('(overwrite)') : pc.green('(new)');
      p.log.message(`  ${f.targetPath} ${label}`);
    }

    const proceed = await p.confirm({ message: 'Proceed to copy?' });
    if (p.isCancel(proceed) || !proceed) {
      p.outro('No files were copied.');
      process.exit(0);
    }
  }

  const copiedPaths: string[] = [];

  const results = await copyFilesToProject(projectPath, tools, {
    confirmOverwrite: async (targetPath) => {
      const answer = await p.confirm({
        message: `${targetPath} already exists. Overwrite?`,
      });

      if (p.isCancel(answer)) {
        const copiedList =
          copiedPaths.length > 0
            ? `\nFiles already copied:\n${copiedPaths.map((p) => `  ${p}`).join('\n')}`
            : '';
        p.cancel(`Cancelled.${copiedList}\nRemaining files were not copied.`);
        process.exit(1);
      }

      if (answer) copiedPaths.push(targetPath);
      return answer as boolean;
    },
  });

  showResults(results);
  showNextSteps(tools);

  const hasFailure = results.some((r) => r.result === 'failed');
  if (hasFailure) {
    const failCount = results.filter((r) => r.result === 'failed').length;
    const okCount = results.filter((r) => r.result === 'copied').length;
    p.outro(`${okCount} file(s) created, ${failCount} failed. Fix permissions and run again.`);
    process.exit(1);
  }

  p.outro(pc.green('✓ Scaffold complete!'));
}
