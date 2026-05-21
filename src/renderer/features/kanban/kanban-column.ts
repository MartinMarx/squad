import type { AgentStatus } from '@renderer/features/tasks/conversations/conversation-manager';
import { selectCurrentPr, type PullRequest } from '@shared/pull-requests';
import type { TaskLifecycleStatus } from '@shared/tasks';

export type KanbanColumnId = 'in_progress' | 'ready_for_review' | 'in_review' | 'done';

export const KANBAN_COLUMNS: Array<{ id: KanbanColumnId; label: string }> = [
  { id: 'in_progress', label: 'In Progress' },
  { id: 'ready_for_review', label: 'Ready for Review' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

export type KanbanCardAction =
  | { kind: 'create-pr' }
  | { kind: 'open-pr'; url: string }
  | { kind: 'continue-session' };

export function deriveKanbanColumn(args: {
  status: TaskLifecycleStatus;
  prs: PullRequest[];
  agentStatus: AgentStatus | null;
}): KanbanColumnId {
  const currentPr = selectCurrentPr(args.prs);

  if (args.status === 'done' || args.status === 'cancelled') {
    return 'done';
  }

  if (currentPr?.status === 'merged' || currentPr?.status === 'closed') {
    return 'done';
  }

  if (currentPr?.status === 'open') {
    return 'in_review';
  }

  if (args.agentStatus === 'completed') {
    return 'ready_for_review';
  }

  return 'in_progress';
}

export function getKanbanCardPrimaryAction(args: {
  column: KanbanColumnId;
  agentStatus: AgentStatus | null;
  openPrUrl?: string;
  canCreatePr: boolean;
}): KanbanCardAction | null {
  if (args.agentStatus === 'awaiting-input' || args.agentStatus === 'error') {
    return { kind: 'continue-session' };
  }

  if (args.column === 'ready_for_review' && args.canCreatePr) {
    return { kind: 'create-pr' };
  }

  if (args.openPrUrl) {
    return { kind: 'open-pr', url: args.openPrUrl };
  }

  return null;
}
