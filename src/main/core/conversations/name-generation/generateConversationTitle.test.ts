import { execFile } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

vi.mock('@main/core/dependencies/probe', () => ({
  resolveCommandPath: vi.fn(async (command: string) => `/usr/local/bin/${command}`),
}));

vi.mock('@main/core/settings/provider-settings-service', () => ({
  providerOverrideSettings: {
    getItem: vi.fn(async () => undefined),
  },
}));

const { generateConversationTitle } = await import('./generateConversationTitle');

describe('generateConversationTitle', () => {
  const invokeExecFile = (stdout: string) => {
    vi.mocked(execFile).mockImplementation(((
      _cmd: string,
      _args: string[],
      optsOrCallback: unknown,
      maybeCallback?: unknown
    ) => {
      const callback =
        typeof optsOrCallback === 'function'
          ? optsOrCallback
          : (maybeCallback as
              | ((err: null, result: { stdout: string; stderr: string }) => void)
              | undefined);
      callback?.(null, { stdout, stderr: '' });
      return undefined as never;
    }) as unknown as typeof execFile);
  };

  beforeEach(() => {
    invokeExecFile('Mobile Safari Login Fix');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for empty prompts', async () => {
    await expect(generateConversationTitle('cursor', '   ')).resolves.toBeNull();
  });

  it('invokes the conversation provider CLI in print mode', async () => {
    await expect(
      generateConversationTitle('cursor', 'Fix the login page crash on mobile Safari')
    ).resolves.toBe('Mobile Safari Login Fix');

    expect(execFile).toHaveBeenCalledOnce();
    const [, args] = vi.mocked(execFile).mock.calls[0]!;
    expect(args).toContain('-p');
    expect(args).toContain('--trust');
    expect(args).toContain('--model');
  });

  it('uses claude structured output when available', async () => {
    invokeExecFile(
      JSON.stringify({
        structured_output: { title: 'Mobile Login Crash Fix' },
      })
    );

    await expect(generateConversationTitle('claude', 'Fix mobile login crash')).resolves.toBe(
      'Mobile Login Crash Fix'
    );

    const [, args] = vi.mocked(execFile).mock.calls[0]!;
    expect(args).toContain('-p');
    expect(args).toContain('--json-schema');
    expect(args).toContain('--model');
    expect(args).toContain('--effort');
    expect(args).toContain('low');
  });
});
