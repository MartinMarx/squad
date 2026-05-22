import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import { useCallback, useEffect } from 'react';
import { Titlebar } from '@renderer/lib/components/titlebar/Titlebar';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { NoTasksHint, ZeroProjectsEmptyState } from './components/home-empty-state';
import { HomeHeader } from './components/home-header';
import { KanbanBoard } from './components/kanban/kanban-board';
import { HomeRail } from './components/right-rail/home-rail';
import {
  collectHomeProjects,
  countMountedProjects,
  countRegisteredProjects,
  hasAnyVisibleTask,
} from './stores/home-aggregator';
import { getHomeStore } from './stores/home-store';
import { getHomeSubscriptionManager } from './stores/home-subscriptions';

function HomeTitlebar() {
  return <Titlebar />;
}

/**
 * Root dashboard panel.
 *
 * Branching:
 * - Zero registered projects → cold-start welcome (preserves the legacy home).
 * - At least one project mounted but no visible tasks → kanban frame with an
 *   inline "Create your first task" hint, plus the rail with placeholders.
 * - Otherwise → full dashboard.
 *
 * Subscriptions: acquired on mount, released on unmount via
 * {@link getHomeSubscriptionManager}.
 */
const HomeMainPanel = observer(function HomeMainPanel() {
  useEffect(() => {
    const mgr = getHomeSubscriptionManager();
    mgr.acquire();
    return () => mgr.release();
  }, []);

  const totalRegistered = countRegisteredProjects();
  if (totalRegistered === 0) {
    return <ZeroProjectsEmptyState />;
  }

  return <HomeDashboard />;
});

const HomeDashboard = observer(function HomeDashboard() {
  const store = getHomeStore();
  const entries = store.filteredEntries;
  const mountedCount = countMountedProjects();
  const projects = collectHomeProjects();
  const hideProjectChips = projects.length <= 1;
  const noVisibleTasks = !hasAnyVisibleTask();
  const showCreateTaskModal = useShowModal('taskModal');

  const onCreateTask = useCallback(() => {
    // Pick a sensible default project: respect an active filter, otherwise
    // first mounted project. The taskModal lets the user re-pick if needed.
    const projectId = Array.from(store.filteredProjectIds)[0] ?? projects[0]?.id;
    if (!projectId) return;
    showCreateTaskModal({ projectId });
  }, [showCreateTaskModal, store.filteredProjectIds, projects]);

  return (
    <motion.div
      className="flex h-full flex-col overflow-hidden bg-background-secondary text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <HomeHeader onCreateTask={onCreateTask} />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {noVisibleTasks && mountedCount > 0 ? <NoTasksHint onCreateTask={onCreateTask} /> : null}
          <KanbanBoard entries={entries} hideProjectChips={hideProjectChips} />
        </div>
        <HomeRail entries={entries} hideProjectChips={hideProjectChips} />
      </div>
    </motion.div>
  );
});

export const homeView = {
  TitlebarSlot: HomeTitlebar,
  MainPanel: HomeMainPanel,
};
