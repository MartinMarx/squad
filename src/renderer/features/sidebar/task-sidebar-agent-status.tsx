import { observer } from 'mobx-react-lite';
import { AgentStatusIndicator } from '@renderer/features/tasks/components/agent-status-indicator';
import { CLISpinner } from '@renderer/features/tasks/components/cliSpinner';
import { asProvisioned, taskAgentStatus } from '@renderer/features/tasks/stores/task-selectors';
import {
  isUnprovisioned,
  isUnregistered,
  type TaskStore,
} from '@renderer/features/tasks/stores/task-store';
import { workspaceRegistry } from '@renderer/features/tasks/stores/workspace-registry';
import { useDelayedBoolean } from '@renderer/lib/hooks/use-delay-boolean';
import { sidebarStore } from '@renderer/lib/stores/app-state';
import { RelativeTime } from '@renderer/lib/ui/relative-time';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/lib/ui/tooltip';
import type { Task } from '@shared/tasks';
import { AppRunningIndicator } from './app-running-indicator';
import { getSortInstant } from './sidebar-store';

function isRunScriptRunning(task: TaskStore): boolean {
  const provisioned = asProvisioned(task);
  if (!provisioned || !provisioned.workspaceId) return false;
  const taskData = provisioned.data as Task;
  const workspace = workspaceRegistry.get(taskData.projectId, provisioned.workspaceId);
  if (!workspace) return false;
  // Touch tabOrder to trigger lazy load of the scripts map.
  void workspace.lifecycleScripts.tabs;
  for (const script of workspace.lifecycleScripts.scripts.values()) {
    if (script.data.type === 'run' && script.isRunning) return true;
  }
  return false;
}

/**
 * Sidebar tail: spinner while bootstrapping, otherwise aggregate agent status indicator.
 */
export const TaskSidebarAgentStatus = observer(function TaskSidebarAgentStatus({
  task,
}: {
  task: TaskStore;
}) {
  const isBootstrapping =
    isUnregistered(task) ||
    (isUnprovisioned(task) && (task.phase === 'provision' || task.phase === 'provision-error'));

  const delayedIsBootstrapping = useDelayedBoolean(isBootstrapping, 500);
  const status = taskAgentStatus(task);
  const appRunning = isRunScriptRunning(task);

  if (delayedIsBootstrapping) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="flex size-6 items-center justify-center">
            <CLISpinner variant="2" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Creating task workspace...</TooltipContent>
      </Tooltip>
    );
  }

  if (appRunning) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <AppRunningIndicator label={task.data.name.toLowerCase()} />
        </TooltipTrigger>
        <TooltipContent>App running</TooltipContent>
      </Tooltip>
    );
  }

  if (status) {
    return <AgentStatusIndicator status={status} />;
  }

  const sortKind = sidebarStore.taskSortBy === 'created-at' ? 'created' : 'updated';

  return (
    <RelativeTime
      value={getSortInstant(task, sortKind)}
      className="flex h-full items-center pr-1 font-mono text-xs text-foreground-passive"
      compact
    />
  );
});
