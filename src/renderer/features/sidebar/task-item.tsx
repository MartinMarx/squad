import { observer } from 'mobx-react-lite';
import { TaskSidebarAgentStatus } from '@renderer/features/sidebar/task-sidebar-agent-status';
import { TaskContextMenu } from '@renderer/features/tasks/components/task-context-menu';
import { TaskGitDiffStats } from '@renderer/features/tasks/components/task-git-diff-stats';
import { conversationRegistry } from '@renderer/features/tasks/stores/conversation-registry';
import {
  getTaskGitStore,
  getTaskManagerStore,
  getTaskStore,
} from '@renderer/features/tasks/stores/task-selectors';
import {
  useNavigate,
  useParams,
  useWorkspaceSlots,
} from '@renderer/lib/layout/navigation-provider';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { cn } from '@renderer/utils/utils';
import { selectCurrentPr } from '@shared/pull-requests';
import { StatusIcon } from '../../lib/components/pr-status-icon';
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

  const taskName = task.displayName;

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
  const showBranch = branchName != null && branchName !== taskName;
  const pr = 'prs' in task.data ? selectCurrentPr(task.data.prs) : undefined;
  const handleReconnect = undefined;

  const conversations = conversationRegistry.get(taskId);
  const canToggleUnread = task.state !== 'unregistered' && !!conversations;
  const isUnread = canToggleUnread ? conversations.taskStatus !== null : false;

  return (
    <TaskContextMenu
      isPinned={task.data.isPinned}
      canPin={canPin}
      isArchived={false}
      branchName={branchName}
      isUnread={isUnread}
      canToggleUnread={canToggleUnread}
      onPin={() => void task.setPinned(true)}
      onUnpin={() => void task.setPinned(false)}
      onRename={handleRename}
      onArchive={handleArchive}
      onReconnect={handleReconnect}
      onDelete={handleDelete}
      onMarkUnread={() => conversations?.markAllUnseen()}
      onMarkRead={() => conversations?.markAllSeen()}
    >
      <SidebarMenuRow
        className={cn(
          'group/row flex h-12 items-center justify-between gap-1 px-1 py-0',
          rowVariant === 'pinned' ? 'pl-2' : 'pl-8'
        )}
        isActive={isActive}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          handleProvision();
          navigate('task', { projectId, taskId });
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
          <div className="flex min-w-0 items-center gap-1 overflow-hidden leading-tight">
            <span
              className={cn(
                'min-w-0 truncate text-left transition-colors',
                isBootstrapping && 'text-foreground/40'
              )}
            >
              {taskName}
            </span>
            <TaskGitDiffStats task={task} className="flex shrink-0 items-center pr-1 pl-1" />
          </div>
          {showBranch && (
            <div className="flex min-w-0 items-center gap-1 overflow-hidden leading-tight text-foreground-passive">
              {pr && <StatusIcon pr={pr} className="size-3 shrink-0" disableTooltip />}
              <span className="min-w-0 truncate text-left text-xs">{branchName}</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center self-center">
          <TaskSidebarAgentStatus task={task} />
        </div>
      </SidebarMenuRow>
    </TaskContextMenu>
  );
});
