import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pty } from '@main/core/pty/pty';
import { classifyInstallCommandFailure, runLocalInstallCommand } from './install-runner';

const mocks = vi.hoisted(() => ({
  spawnLocalPty: vi.fn(),
  ensureUserBinDirsInPath: vi.fn(),
}));

vi.mock('@main/core/pty/local-pty', () => ({
  spawnLocalPty: mocks.spawnLocalPty,
}));

vi.mock('@main/utils/userEnv', () => ({
  ensureUserBinDirsInPath: mocks.ensureUserBinDirsInPath,
}));

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
const originalEnv = { ...process.env };

function createSuccessfulPty(): Pty {
  const handlers: Record<string, Array<(payload: unknown) => void>> = {};
  return {
    onData: (handler: (payload: unknown) => void) => {
      handlers.data = handlers.data ?? [];
      handlers.data.push(handler);
      return { dispose: () => {} };
    },
    onExit: (handler: (payload: { exitCode: number; signal: undefined }) => void) => {
      queueMicrotask(() => handler({ exitCode: 0, signal: undefined }));
      return { dispose: () => {} };
    },
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
  } as unknown as Pty;
}

describe('runLocalInstallCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.spawnLocalPty.mockReturnValue(createSuccessfulPty());
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    if (originalPlatform) Object.defineProperty(process, 'platform', originalPlatform);
    process.env = originalEnv;
  });

  it('runs a local install command through a PTY', async () => {
    const result = await runLocalInstallCommand('brew install gh');
    expect(result.success).toBe(true);
    expect(mocks.spawnLocalPty).toHaveBeenCalled();
    expect(mocks.ensureUserBinDirsInPath).toHaveBeenCalled();
  });
});

describe('classifyInstallCommandFailure', () => {
  it('classifies permission denied output', () => {
    expect(
      classifyInstallCommandFailure({
        exitCode: 243,
        output: 'Error: EACCES permission denied',
      }).type
    ).toBe('permission-denied');
  });
});
