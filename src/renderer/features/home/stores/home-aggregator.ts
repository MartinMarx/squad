import {
  asMounted,
  getProjectManagerStore,
} from '@renderer/features/projects/stores/project-selectors';
import { conversationRegistry } from '@renderer/features/tasks/stores/conversation-registry';
import {
  isProvisioned,
  isRegistered,
  registeredTaskData,
  type TaskStore,
} from '@renderer/features/tasks/stores/task-store';
import type { Task } from '@shared/tasks';
import type { HomeAgentStatus, HomeProjectMeta, HomeTaskEntry } from '../lib/home-types';

/**
 * Aggregate every visible task across every mounted project into a single
 * flat list of `HomeTaskEntry`. Skips archived tasks. Unregistered tasks are
 * included so newly-created (still creating) tasks appear immediately.
 *
 * Call inside an `observer` component or other MobX reaction — this reads
 * deeply observable maps and would otherwise not track.
 */
export function collectHomeEntries(): HomeTaskEntry[] {
  const entries: HomeTaskEntry[] = [];
  for (const projectStore of getProjectManagerStore().projects.values()) {
    const mounted = asMounted(projectStore);
    if (!mounted) continue;
    const projectId = mounted.data.id;
    const projectName = mounted.data.name;

    for (const taskStore of mounted.taskManager.tasks.values()) {
      const entry = buildEntry(projectId, projectName, taskStore);
      if (entry) entries.push(entry);
    }
  }
  return entries;
}

function buildEntry(
  projectId: string,
  projectName: string,
  store: TaskStore
): HomeTaskEntry | null {
  const registered = registeredTaskData(store);
  if (registered?.archivedAt) return null;

  const taskId = store.data.id;
  const unread = computeUnread(taskId);
  const agentStatus = computeAgentStatus(taskId);

  if (!registered) {
    return {
      taskId,
      projectId,
      projectName,
      task: null,
      name: store.data.name,
      status: store.data.status,
      statusChangedAt: store.data.statusChangedAt,
      createdAt: store.data.createdAt,
      lastInteractedAt: store.data.lastInteractedAt,
      workspaceId: null,
      isPinned: store.data.isPinned,
      isProvisioned: false,
      conversations: {},
      prs: [],
      linkedIssue: undefined,
      workspaceGit: undefined,
      agentStatus,
      unreadCount: unread,
    };
  }

  const task = registered as Task;
  return {
    taskId,
    projectId,
    projectName,
    task,
    name: task.name,
    status: task.status,
    statusChangedAt: task.statusChangedAt,
    createdAt: task.createdAt,
    lastInteractedAt: task.lastInteractedAt,
    workspaceId: task.workspaceId ?? null,
    isPinned: task.isPinned,
    isProvisioned: isProvisioned(store),
    conversations: store.conversationStats,
    prs: task.prs,
    linkedIssue: task.linkedIssue,
    workspaceGit: task.workspaceGit,
    agentStatus,
    unreadCount: unread,
  };
}

function computeUnread(taskId: string): number {
  const mgr = conversationRegistry.get(taskId);
  if (!mgr) return 0;
  // Align with the palette notification semantics: only conversations that
  // are awaiting input / errored / completed AND not seen count as unread.
  // A currently-working agent is conveyed by the activity dot, not by an
  // unread counter — surfacing it here would persist after the user opens
  // the task because `setStatus('working')` auto-flips `seen` true.
  let count = 0;
  for (const conv of mgr.conversations.values()) {
    if (conv.seen) continue;
    if (
      conv.status === 'awaiting-input' ||
      conv.status === 'error' ||
      conv.status === 'completed'
    ) {
      count += 1;
    }
  }
  return count;
}

function computeAgentStatus(taskId: string): HomeAgentStatus | null {
  const mgr = conversationRegistry.get(taskId);
  return (mgr?.taskStatus ?? null) as HomeAgentStatus | null;
}

/** Discover every mounted project — used by the project filter dropdown. */
export function collectHomeProjects(): HomeProjectMeta[] {
  const out: HomeProjectMeta[] = [];
  for (const projectStore of getProjectManagerStore().projects.values()) {
    const mounted = asMounted(projectStore);
    if (!mounted) continue;
    out.push({ id: mounted.data.id, name: mounted.data.name });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** Total mounted-project count. Used to gate empty-state branches. */
export function countMountedProjects(): number {
  let n = 0;
  for (const projectStore of getProjectManagerStore().projects.values()) {
    if (asMounted(projectStore)) n += 1;
  }
  return n;
}

/** Registered project count (mounted + unmounted + unregistered) — for zero-projects empty state. */
export function countRegisteredProjects(): number {
  return getProjectManagerStore().projects.size;
}

/** Cheap check: are *any* registered tasks visible across all mounted projects? */
export function hasAnyVisibleTask(): boolean {
  for (const projectStore of getProjectManagerStore().projects.values()) {
    const mounted = asMounted(projectStore);
    if (!mounted) continue;
    for (const t of mounted.taskManager.tasks.values()) {
      if (!isRegistered(t)) return true;
      if (!t.data.archivedAt) return true;
    }
  }
  return false;
}
