import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentProviderId } from '@shared/agent-provider-registry';
import type { DependencyState } from '@shared/dependencies';
import { err, ok } from '@shared/result';
import { DependenciesStore } from './dependencies-store';

vi.mock('../../lib/ipc', () => ({
  events: {
    on: vi.fn(() => () => {}),
  },
  rpc: {
    dependencies: {
      getAll: vi.fn(async () => ({})),
      install: vi.fn(),
      probeAll: vi.fn(async () => {}),
      probeCategory: vi.fn(async () => {}),
    },
  },
}));

const { rpc } = await import('../../lib/ipc');

function availableAgent(id: AgentProviderId): DependencyState {
  return {
    id,
    category: 'agent' as const,
    status: 'available' as const,
    version: '1.0.0',
    path: `/bin/${id}`,
    checkedAt: 1,
  };
}

describe('DependenciesStore install', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates local dependency state after a local install', async () => {
    vi.mocked(rpc.dependencies.install).mockResolvedValueOnce(ok(availableAgent('codex')));
    vi.mocked(rpc.dependencies.getAll).mockResolvedValueOnce({ codex: availableAgent('codex') });
    const store = new DependenciesStore();

    const result = await store.install('codex');

    expect(result.success).toBe(true);
    expect(rpc.dependencies.install).toHaveBeenCalledWith('codex');
    expect(rpc.dependencies.probeCategory).toHaveBeenCalledWith('agent');
    expect(store.local.data?.codex?.status).toBe('available');
  });

  it('does not update local dependency state after a failed install result', async () => {
    vi.mocked(rpc.dependencies.install).mockResolvedValueOnce(
      err({
        type: 'permission-denied' as const,
        message: 'User does not have sufficient permissions.',
        output: 'permission denied',
        exitCode: 243,
      })
    );
    const store = new DependenciesStore();

    const result = await store.install('codex');

    expect(result.success).toBe(false);
    expect(store.local.data?.codex).toBeUndefined();
  });

  it('tracks in-flight installs by dependency id', async () => {
    let resolveInstall: (value: Awaited<ReturnType<typeof rpc.dependencies.install>>) => void;
    vi.mocked(rpc.dependencies.install).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveInstall = resolve;
      })
    );
    vi.mocked(rpc.dependencies.getAll).mockResolvedValueOnce({ codex: availableAgent('codex') });
    const store = new DependenciesStore();

    const install = store.install('codex');

    expect(store.isInstalling('codex')).toBe(true);

    resolveInstall!(ok(availableAgent('codex')));
    await install;

    expect(store.isInstalling('codex')).toBe(false);
  });
});
