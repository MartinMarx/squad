import type { AgentIndicatorStatus } from '@renderer/features/tasks/components/agent-status-indicator';

export type NotebookSessionBridge = {
  getConversationStatus: (conversationId: string) => AgentIndicatorStatus;
  onStartSession: (pos: number) => void;
};

let bridge: NotebookSessionBridge | null = null;

export function setNotebookSessionBridge(next: NotebookSessionBridge | null) {
  bridge = next;
}

export function getNotebookSessionBridge() {
  return bridge;
}
