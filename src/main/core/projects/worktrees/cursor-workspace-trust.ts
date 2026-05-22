import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { log } from '@main/lib/logger';

function workspaceSlug(absoluteWorktreePath: string): string {
  return absoluteWorktreePath.replace(/^\//, '').replaceAll('/', '-');
}

export interface CursorWorkspaceTrustDeps {
  getTaskSettings: () => Promise<{ autoTrustWorktrees: boolean }>;
}

/**
 * `cursor-agent` prompts on first launch in an unfamiliar workspace and remembers
 * trust via `~/.cursor/projects/<slug>/.workspace-trusted`. Each squad worktree
 * gets a fresh path, so without this every new task hits the prompt.
 *
 * Gated on the `tasks.autoTrustWorktrees` setting. No-op when `~/.cursor` is
 * absent (user doesn't have Cursor installed).
 */
export async function markWorktreeAsCursorTrusted(
  absoluteWorktreePath: string,
  deps: CursorWorkspaceTrustDeps,
  cursorDir: string = path.join(os.homedir(), '.cursor')
): Promise<void> {
  if (!path.isAbsolute(absoluteWorktreePath)) return;

  const { autoTrustWorktrees } = await deps.getTaskSettings();
  if (!autoTrustWorktrees) return;

  try {
    await fs.access(cursorDir);
  } catch {
    return;
  }

  const projectDir = path.join(cursorDir, 'projects', workspaceSlug(absoluteWorktreePath));
  try {
    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(path.join(projectDir, '.workspace-trusted'), '');
  } catch (cause) {
    log.warn('Failed to mark worktree as trusted for Cursor', {
      worktreePath: absoluteWorktreePath,
      error: String(cause),
    });
  }
}
