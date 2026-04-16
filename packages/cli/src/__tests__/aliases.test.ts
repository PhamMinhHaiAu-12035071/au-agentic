import { describe, it, expect } from 'bun:test';
import { writeFile } from '#utils/files';
import { copyFilesToProject } from '#steps/copy';

describe('package.json imports field aliases', () => {
  it('resolves #utils/* to packages/cli/src/utils/*', () => {
    expect(typeof writeFile).toBe('function');
  });

  it('resolves #steps/* to packages/cli/src/steps/*', () => {
    expect(typeof copyFilesToProject).toBe('function');
  });
});
