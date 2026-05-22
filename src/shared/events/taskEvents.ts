import { defineEvent } from '@shared/ipc/events';
import type { PullRequest } from '@shared/pull-requests';
import type { Task } from '@shared/tasks';

export const taskStatusUpdatedChannel = defineEvent<{
  taskId: string;
  projectId: string;
  status: string;
}>('task:status-updated');

export const taskUpdatedChannel = defineEvent<{
  projectId: string;
  taskId: string;
  patch: Partial<Task>;
}>('task:updated');

export const taskPrUpdatedChannel = defineEvent<{
  taskId: string;
  projectId: string;
  workspaceId: string;
  prs: PullRequest[];
}>('task:pr-updated');

export type ProvisionStep =
  | 'resolving-worktree'
  | 'initialising-workspace'
  | 'running-provision-script'
  | 'connecting'
  | 'setting-up-workspace'
  | 'starting-sessions';

export const taskProvisionProgressChannel = defineEvent<{
  taskId: string;
  projectId: string;
  step: ProvisionStep;
  message: string;
}>('task:provision-progress');
