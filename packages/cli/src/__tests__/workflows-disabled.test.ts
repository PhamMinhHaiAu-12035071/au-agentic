import { describe, it, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

describe('GitHub Actions workflows are manual-trigger only', () => {
  const workflowsDir = join(import.meta.dir, '../../../../.github/workflows');
  const workflowFiles = readdirSync(workflowsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

  it('finds at least four workflow files', () => {
    expect(workflowFiles.length).toBeGreaterThanOrEqual(4);
  });

  for (const file of workflowFiles) {
    it(`${file} declares only workflow_dispatch`, () => {
      const yaml = parseYaml(readFileSync(join(workflowsDir, file), 'utf-8')) as { on?: unknown };
      const on = yaml.on;
      const triggerKeys =
        typeof on === 'string' ? [on]
        : Array.isArray(on) ? on
        : on && typeof on === 'object' ? Object.keys(on as Record<string, unknown>)
        : [];

      expect(triggerKeys).toEqual(['workflow_dispatch']);
    });
  }
});
