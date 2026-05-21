import { ProjectManagerStore } from '@renderer/features/projects/stores/project-manager';
import { SidebarStore } from '@renderer/features/sidebar/sidebar-store';
import { DependenciesStore } from './dependencies-store';
import { NavigationHistoryStore } from './navigation-history-store';
import { NavigationStore } from './navigation-store';
import { ResourceMonitorStore } from './resource-monitor-store';
import { snapshotRegistry, type SnapshotRegistry } from './snapshot-registry';
import { UpdateStore } from './update-store';

class AppState {
  readonly update: UpdateStore;
  readonly projects: ProjectManagerStore;
  readonly sidebar: SidebarStore;
  readonly snapshots: SnapshotRegistry;
  readonly history: NavigationHistoryStore;
  readonly navigation: NavigationStore;
  readonly dependencies: DependenciesStore;
  readonly resourceMonitor: ResourceMonitorStore;

  constructor() {
    this.snapshots = snapshotRegistry;
    this.update = new UpdateStore();
    this.projects = new ProjectManagerStore();
    this.sidebar = new SidebarStore(this.projects);
    this.history = new NavigationHistoryStore();
    this.navigation = new NavigationStore();
    this.dependencies = new DependenciesStore();
    this.resourceMonitor = new ResourceMonitorStore();
    snapshotRegistry.register('navigation', () => this.navigation.snapshot);
    snapshotRegistry.register('sidebar', () => this.sidebar.snapshot);
    this.dependencies.start();
  }
}

export const appState = new AppState();

export const sidebarStore = appState.sidebar;
