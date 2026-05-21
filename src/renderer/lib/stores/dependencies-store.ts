import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import type {
  DependencyId,
  DependencyInstallResult,
  DependencyState,
  DependencyStatusMap,
  DependencyStatusUpdatedEvent,
} from '@shared/dependencies';
import { dependencyStatusUpdatedChannel } from '@shared/events/appEvents';
import { events, rpc } from '../../lib/ipc';
import { Resource } from './resource';

export class DependenciesStore {
  readonly local: Resource<DependencyStatusMap, DependencyStatusUpdatedEvent>;

  private readonly _installingDependencyKeys = observable.set<string>();
  private readonly _inFlightInstalls = new Map<string, Promise<DependencyInstallResult>>();

  constructor() {
    makeObservable<this, '_installingDependencyKeys'>(this, {
      _installingDependencyKeys: observable,
      allStatuses: computed,
      agentStatuses: computed,
      localInstalledAgents: computed,
      install: action,
      probeAll: action,
    });

    this.local = new Resource<DependencyStatusMap, DependencyStatusUpdatedEvent>(async () => {
      const result = await rpc.dependencies.getAll();
      return (result ?? {}) as DependencyStatusMap;
    }, [
      {
        kind: 'event',
        subscribe: (handler) => events.on(dependencyStatusUpdatedChannel, handler),
        onEvent: ({ id, state }, ctx) => {
          ctx.set({ ...(ctx.data ?? {}), [id]: state as DependencyState });
        },
      },
    ]);
  }

  get allStatuses(): DependencyStatusMap {
    return this.local.data ?? {};
  }

  get agentStatuses(): DependencyStatusMap {
    return Object.fromEntries(
      Object.entries(this.allStatuses).filter(([, s]) => s.category === 'agent')
    );
  }

  get localInstalledAgents(): string[] {
    return Object.entries(this.agentStatuses)
      .filter(([, s]) => s.status === 'available')
      .map(([id]) => id);
  }

  isInstalling(id: DependencyId): boolean {
    return this._installingDependencyKeys.has(id);
  }

  async install(id: DependencyId): Promise<DependencyInstallResult> {
    const existing = this._inFlightInstalls.get(id);
    if (existing) return existing;

    const install = this.runInstall(id);
    this._inFlightInstalls.set(id, install);
    return install;
  }

  private async runInstall(id: DependencyId): Promise<DependencyInstallResult> {
    runInAction(() => {
      this._installingDependencyKeys.add(id);
    });

    try {
      const result = (await rpc.dependencies.install(id)) as DependencyInstallResult;
      if (!result.success) return result;

      await this.refreshAgents();
      return result;
    } finally {
      this._inFlightInstalls.delete(id);
      runInAction(() => {
        this._installingDependencyKeys.delete(id);
      });
    }
  }

  async probeAll(): Promise<void> {
    await rpc.dependencies.probeAll();
    this.local.invalidate();
  }

  async refreshAgents(): Promise<void> {
    await rpc.dependencies.probeCategory('agent');
    const all = await rpc.dependencies.getAll();
    this.local.setValue((all ?? {}) as DependencyStatusMap);
  }

  start(): void {
    this.local.start();
  }

  dispose(): void {
    this.local.dispose();
  }
}
