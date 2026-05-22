import {
  asMounted,
  getProjectManagerStore,
} from '@renderer/features/projects/stores/project-selectors';
import { getHomeActivityStore } from './home-activity-store';
import { getHomeResourceHistory } from './home-resource-history';

/**
 * Lifecycle glue for the home dashboard.
 *
 * On mount: ensures every registered project is mounted (so its task manager
 * runs and starts surfacing agent + PR signals to the renderer's MobX layer)
 * and starts the activity store.
 *
 * On unmount: stops the activity store. Project mounts are left alone —
 * unmounting a project would tear down active task sessions, which is
 * expensive and would defeat the user navigating back to a task.
 */
export class HomeSubscriptionManager {
  private _refCount = 0;

  acquire(): void {
    this._refCount += 1;
    if (this._refCount > 1) return;
    void this._mountAllProjects();
    getHomeActivityStore().start();
    getHomeResourceHistory().start();
  }

  release(): void {
    this._refCount = Math.max(0, this._refCount - 1);
    if (this._refCount > 0) return;
    getHomeActivityStore().stop();
    getHomeResourceHistory().stop();
  }

  private async _mountAllProjects(): Promise<void> {
    const manager = getProjectManagerStore();
    await manager.load();
    const pending: Promise<void>[] = [];
    for (const projectStore of manager.projects.values()) {
      if (!asMounted(projectStore) && projectStore.state === 'unmounted') {
        pending.push(manager.mountProject(projectStore.id));
      }
    }
    await Promise.allSettled(pending);
  }
}

let _manager: HomeSubscriptionManager | null = null;

export function getHomeSubscriptionManager(): HomeSubscriptionManager {
  if (!_manager) _manager = new HomeSubscriptionManager();
  return _manager;
}
