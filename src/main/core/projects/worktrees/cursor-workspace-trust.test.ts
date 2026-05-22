import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { markWorktreeAsCursorTrusted } from './cursor-workspace-trust';

describe('markWorktreeAsCursorTrusted', () => {
  let tmpHome: string;

  beforeEach(() => {
    tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-trust-'));
  });

  afterEach(() => {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  it('writes the .workspace-trusted marker using slash-to-dash slug encoding', async () => {
    const cursorDir = path.join(tmpHome, '.cursor');
    fs.mkdirSync(cursorDir, { recursive: true });

    await markWorktreeAsCursorTrusted('/Users/me/squad/worktrees/foo/bar-baz', cursorDir);

    const slug = 'Users-me-squad-worktrees-foo-bar-baz';
    const marker = path.join(cursorDir, 'projects', slug, '.workspace-trusted');
    expect(fs.existsSync(marker)).toBe(true);
  });

  it('no-ops when ~/.cursor is absent', async () => {
    const cursorDir = path.join(tmpHome, '.cursor');

    await markWorktreeAsCursorTrusted('/Users/me/x', cursorDir);

    expect(fs.existsSync(cursorDir)).toBe(false);
  });

  it('ignores non-absolute paths', async () => {
    const cursorDir = path.join(tmpHome, '.cursor');
    fs.mkdirSync(cursorDir, { recursive: true });

    await markWorktreeAsCursorTrusted('relative/path', cursorDir);

    expect(fs.existsSync(path.join(cursorDir, 'projects'))).toBe(false);
  });
});
