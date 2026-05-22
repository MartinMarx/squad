import { observer } from 'mobx-react-lite';
import { TaskSidebarAgentStatus } from '@renderer/features/sidebar/task-sidebar-agent-status';
import { TaskContextMenu } from '@renderer/features/tasks/components/task-context-menu';
import { TaskGitDiffStats } from '@renderer/features/tasks/components/task-git-diff-stats';
import {
  getTaskGitStore,
  getTaskManagerStore,
  getTaskStore,
} from '@renderer/features/tasks/stores/task-selectors';
import { type TaskStore } from '@renderer/features/tasks/stores/task-store';
import {
  useNavigate,
  useParams,
  useWorkspaceSlots,
} from '@renderer/lib/layout/navigation-provider';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { sidebarStore } from '@renderer/lib/stores/app-state';
import { cn } from '@renderer/utils/utils';
import { selectCurrentPr } from '@shared/pull-requests';
import { PrBadge } from '../../lib/components/pr-badge';
import { SidebarMenuRow } from './sidebar-primitives';

interface SidebarTaskItemProps {
  taskId: string;
  projectId: string;
  /** Pinned strip uses tighter padding than tasks nested under a project. */
  rowVariant?: 'underProject' | 'pinned';
}

export const SidebarTaskItem = observer(function SidebarTaskItem({
  taskId,
  projectId,
  rowVariant = 'underProject',
}: SidebarTaskItemProps) {
  const { navigate } = useNavigate();
  const showRename = useShowModal('renameTaskModal');
  const showDeleteTask = useShowModal('deleteTaskModal');

  const { currentView } = useWorkspaceSlots();
  const { params } = useParams('task');
  const isActive =
    currentView === 'task' && params.taskId === taskId && params.projectId === projectId;

  const task = getTaskStore(projectId, taskId)!;
  const taskManager = getTaskManagerStore(projectId);

  const isBootstrapping =
    task.state === 'unregistered' ||
    (task.state === 'unprovisioned' &&
      (task.phase === 'provision' || task.phase === 'provision-error'));

  const taskName = task.data.name;

  const handleProvision = () => {
    if (task.state !== 'unprovisioned' || task.phase !== 'idle') return;
    void taskManager?.provisionTask(taskId);
  };

  const handleArchive = () => {
    if (isActive) navigate('project', { projectId });
    void taskManager?.archiveTask(taskId);
  };

  const handleRename = () => showRename({ projectId, taskId, currentName: taskName });

  const handleDelete = () =>
    showDeleteTask({
      projectId,
      tasks: [{ taskId, taskName }],
      onSuccess: ({ deleteWorktree, deleteBranch }) => {
        void taskManager?.deleteTasks([taskId], { deleteWorktree, deleteBranch });
        if (isActive) navigate('project', { projectId });
      },
    });

  const canPin = task.state !== 'unregistered';
  const git = getTaskGitStore(projectId, taskId);
  const branchName =
    git?.branchName ?? ('taskBranch' in task.data ? task.data.taskBranch : undefined);
  const handleReconnect = undefined;

  return (
    <TaskContextMenu
      isPinned={task.data.isPinned}
      canPin={canPin}
      isArchived={false}
      branchName={branchName}
      onPin={() => void task.setPinned(true)}
      onUnpin={() => void task.setPinned(false)}
      onRename={handleRename}
      onArchive={handleArchive}
      onReconnect={handleReconnect}
      onDelete={handleDelete}
    >
      <SidebarMenuRow
        className={cn(
          'group/row relative flex items-center justify-between px-1 h-8 gap-1',
          rowVariant === 'pinned' ? 'pl-2' : 'pl-8'
        )}
        isActive={isActive}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          handleProvision();
          navigate('task', { projectId, taskId });
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 self-stretch overflow-hidden">
          <span
            className={cn(
              'min-w-0 truncate text-left transition-colors',
              isBootstrapping && 'text-foreground/40'
            )}
          >
            {taskName}
          </span>
          <TaskGitDiffStats task={task} className="flex h-full shrink-0 items-center pr-1 pl-1" />
          <RenderPrBadge task={task} />
        </div>
        <TaskSidebarAgentStatus task={task} />
        <SidebarJumpIndicator projectId={projectId} taskId={taskId} rowVariant={rowVariant} />
      </SidebarMenuRow>
    </TaskContextMenu>
  );
});

const SidebarJumpIndicator = observer(function SidebarJumpIndicator({
  projectId,
  taskId,
  rowVariant,
}: {
  projectId: string;
  taskId: string;
  rowVariant: 'underProject' | 'pinned';
}) {
  const index = sidebarStore.jumpIndexFor(projectId, taskId);
  if (index === null) return null;
  // Visible when the user is holding Option+Shift (any row in range gets a
  // badge), or when hovering this specific row. CSS handles the per-row hover
  // via the `group/row` class on the parent SidebarMenuRow.
  const modifierHeld = sidebarStore.jumpIndicatorVisible;
  return (
    <kbd
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 rounded bg-background-tertiary-2 px-1 text-[10px] font-medium text-foreground-muted ring-1 ring-foreground/10',
        rowVariant === 'pinned' ? 'left-0.5' : 'left-2',
        modifierHeld ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
      )}
    >
      {index}
    </kbd>
  );
});

const RenderPrBadge = observer(function RenderPrBadge({ task }: { task: TaskStore }) {
  if (!('prs' in task.data)) return null;
  const pr = selectCurrentPr(task.data.prs);
  return pr ? <PrBadge variant="compact" pr={pr} hoverDelay={100} /> : null;
});
