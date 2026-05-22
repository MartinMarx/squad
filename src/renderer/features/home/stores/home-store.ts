import { computed, makeObservable, observable, runInAction } from 'mobx';
import { log } from '@renderer/utils/logger';
import type { TaskLifecycleStatus } from '@shared/tasks';
import type { HomeFiltersPersisted, HomeTaskEntry } from '../lib/home-types';
import { collectHomeEntries, collectHomeProjects } from './home-aggregator';

const FILTER_STORAGE_KEY = 'emdash:home:filters:v1';

/**
 * UI state for the home dashboard.
 *
 * - Project filter persists across launches (localStorage).
 * - Status filter is session-only (resets on app restart).
 * - Expanded state for Done/Cancelled columns is session-only.
 *
 * Read `entries`/`filteredEntries` from observer components — they re-derive
 * over the underlying project/task MobX stores.
 */
export class HomeStore {
  /** Project ids to include; empty set = show all. */
  filteredProjectIds = observable.set<string>();
  /** Status filter; empty set = show all. */
  filteredStatuses = observable.set<TaskLifecycleStatus>();
  /** Columns explicitly expanded this session (Done/Cancelled start collapsed). */
  expandedColumns = observable.set<TaskLifecycleStatus>();

  constructor() {
    makeObservable(this, {
      filteredProjectIds: observable,
      filteredStatuses: observable,
      expandedColumns: observable,
      entries: computed,
      filteredEntries: computed,
      activeProjectFilterCount: computed,
      activeStatusFilterCount: computed,
    });
    this.restoreFromStorage();
  }

  /** All cross-project entries (no filters applied). */
  get entries(): HomeTaskEntry[] {
    return collectHomeEntries();
  }

  /** Project + status filtered entries. */
  get filteredEntries(): HomeTaskEntry[] {
    const ids = this.filteredProjectIds;
    const statuses = this.filteredStatuses;
    return this.entries.filter((e) => {
      if (ids.size > 0 && !ids.has(e.projectId)) return false;
      if (statuses.size > 0 && !statuses.has(e.status)) return false;
      return true;
    });
  }

  get activeProjectFilterCount(): number {
    return this.filteredProjectIds.size;
  }

  get activeStatusFilterCount(): number {
    return this.filteredStatuses.size;
  }

  projects() {
    return collectHomeProjects();
  }

  toggleProjectFilter(projectId: string): void {
    runInAction(() => {
      if (this.filteredProjectIds.has(projectId)) {
        this.filteredProjectIds.delete(projectId);
      } else {
        this.filteredProjectIds.add(projectId);
      }
    });
    this.persistToStorage();
  }

  clearProjectFilter(): void {
    runInAction(() => this.filteredProjectIds.clear());
    this.persistToStorage();
  }

  setProjectFilter(ids: Iterable<string>): void {
    runInAction(() => this.filteredProjectIds.replace(Array.from(ids)));
    this.persistToStorage();
  }

  toggleStatusFilter(status: TaskLifecycleStatus): void {
    runInAction(() => {
      if (this.filteredStatuses.has(status)) {
        this.filteredStatuses.delete(status);
      } else {
        this.filteredStatuses.add(status);
      }
    });
  }

  clearStatusFilter(): void {
    runInAction(() => this.filteredStatuses.clear());
  }

  setStatusFilter(statuses: Iterable<TaskLifecycleStatus>): void {
    runInAction(() => this.filteredStatuses.replace(Array.from(statuses)));
  }

  isColumnExpanded(status: TaskLifecycleStatus): boolean {
    return this.expandedColumns.has(status);
  }

  toggleColumnExpanded(status: TaskLifecycleStatus): void {
    runInAction(() => {
      if (this.expandedColumns.has(status)) {
        this.expandedColumns.delete(status);
      } else {
        this.expandedColumns.add(status);
      }
    });
  }

  private restoreFromStorage(): void {
    try {
      const raw = localStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HomeFiltersPersisted | null;
      if (parsed && Array.isArray(parsed.projectIds)) {
        runInAction(() => this.filteredProjectIds.replace([...parsed.projectIds]));
      }
    } catch (e) {
      log.warn('HomeStore: failed to restore filters from storage', e);
    }
  }

  private persistToStorage(): void {
    try {
      const data: HomeFiltersPersisted = {
        projectIds: Array.from(this.filteredProjectIds),
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      log.warn('HomeStore: failed to persist filters', e);
    }
  }
}

let _store: HomeStore | null = null;

export function getHomeStore(): HomeStore {
  if (!_store) _store = new HomeStore();
  return _store;
}
