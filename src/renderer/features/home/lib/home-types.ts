import type { PullRequest } from '@shared/pull-requests';
import type { Task, TaskLifecycleStatus } from '@shared/tasks';

export type HomeAgentStatus = 'idle' | 'working' | 'awaiting-input' | 'error' | 'completed';

/**
 * Cross-project task entry surfaced on the home dashboard.
 *
 * Aggregates per-task data already present in stores into one snapshot for
 * the kanban + right-rail consumers. Built fresh per MobX re-derivation; not
 * cached.
 */
export type HomeTaskEntry = {
  taskId: string;
  projectId: string;
  projectName: string;
  /** Snapshot of `Task` when registered; null when still unregistered. */
  task: Task | null;
  /** Always present, even when unregistered. */
  name: string;
  status: TaskLifecycleStatus;
  /** ISO timestamps. `statusChangedAt` is used for Done/Cancelled recency sort. */
  statusChangedAt: string;
  createdAt: string;
  lastInteractedAt: string | undefined;
  /** `null` when the task has no worktree provisioned (metadata-only). */
  workspaceId: string | null;
  isPinned: boolean;
  isProvisioned: boolean;
  /** Aggregate of conversation counts by provider. */
  conversations: Record<string, number>;
  /** PR(s) attached to the task. Empty array when none. */
  prs: PullRequest[];
  /** Linked GitHub/Linear issue, if any. */
  linkedIssue: Task['linkedIssue'];
  /** {linesAdded, linesDeleted} when workspace git diff is known. */
  workspaceGit: Task['workspaceGit'];
  /** Live agent status if a conversation manager is acquired for this task. */
  agentStatus: HomeAgentStatus | null;
  /** Sum of unread conversation indicator counts (notification-grade signal). */
  unreadCount: number;
};

export type HomeProjectMeta = {
  id: string;
  name: string;
};

/** Persistent filter set: project ids only (status filter is session-only). */
export type HomeFiltersPersisted = {
  projectIds: string[];
};
