import type { ProjectManagerStore } from '@renderer/features/projects/stores/project-manager';
import {
  asMounted,
  projectDisplayName,
} from '@renderer/features/projects/stores/project-selectors';
import type { AgentStatus } from '@renderer/features/tasks/conversations/conversation-manager';
import { getTaskGitStore, taskAgentStatus } from '@renderer/features/tasks/stores/task-selectors';
import {
  isRegistered,
  registeredTaskData,
  type TaskStore,
} from '@renderer/features/tasks/stores/task-store';
import { deriveKanbanColumn, type KanbanColumnId } from './kanban-column';

export type KanbanEntry = {
  projectId: string;
  projectName: string;
  task: TaskStore;
  column: KanbanColumnId;
  agentStatus: AgentStatus | null;
};

export function collectKanbanEntries(projectManager: ProjectManagerStore): KanbanEntry[] {
  const entries: KanbanEntry[] = [];

  for (const [projectId, project] of projectManager.projects) {
    const mounted = asMounted(project);
    const taskManager = mounted?.taskManager;
    if (!taskManager) continue;

    const projectName = projectDisplayName(project) ?? 'Project';

    for (const task of taskManager.tasks.values()) {
      if (!isRegistered(task)) continue;
      const data = registeredTaskData(task);
      if (!data || data.archivedAt) continue;

      const agentStatus = taskAgentStatus(task);
      entries.push({
        projectId,
        projectName,
        task,
        agentStatus,
        column: deriveKanbanColumn({
          status: data.status,
          prs: data.prs,
          agentStatus,
        }),
      });
    }
  }

  return entries;
}

export function filterKanbanEntries(
  entries: KanbanEntry[],
  args: { projectId?: string; searchQuery?: string }
): KanbanEntry[] {
  const query = args.searchQuery?.trim().toLowerCase();
  return entries.filter((entry) => {
    if (args.projectId && entry.projectId !== args.projectId) return false;
    if (!query) return true;

    const data = registeredTaskData(entry.task);
    if (!data) return false;

    const branchName =
      getTaskGitStore(entry.projectId, data.id)?.branchName ?? data.taskBranch ?? '';

    return (
      data.name.toLowerCase().includes(query) ||
      entry.projectName.toLowerCase().includes(query) ||
      branchName.toLowerCase().includes(query)
    );
  });
}

export function groupKanbanEntriesByColumn(
  entries: KanbanEntry[]
): Record<KanbanColumnId, KanbanEntry[]> {
  const grouped: Record<KanbanColumnId, KanbanEntry[]> = {
    in_progress: [],
    ready_for_review: [],
    in_review: [],
    done: [],
  };

  for (const entry of entries) {
    grouped[entry.column].push(entry);
  }

  for (const column of Object.keys(grouped) as KanbanColumnId[]) {
    grouped[column].sort((a, b) => {
      const aData = registeredTaskData(a.task);
      const bData = registeredTaskData(b.task);
      const aTime = aData?.statusChangedAt ?? aData?.updatedAt ?? '';
      const bTime = bData?.statusChangedAt ?? bData?.updatedAt ?? '';
      return bTime.localeCompare(aTime);
    });
  }

  return grouped;
}
