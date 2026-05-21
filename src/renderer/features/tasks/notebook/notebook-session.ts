import type { Editor } from '@tiptap/react';
import type {
  AgentStatus,
  ConversationManagerStore,
} from '@renderer/features/tasks/conversations/conversation-manager';
import type { TabGroupManagerStore } from '@renderer/features/tasks/tabs/tab-group-manager-store';
import type { AgentProviderId } from '@shared/agent-provider-registry';
import { buildTaskAssignmentPrompt, truncateConversationTitle } from './build-task-prompt';
import {
  getTaskItemBreadcrumb,
  getTaskItemText,
  resolveTaskItemFromPosition,
} from './task-item-utils';

/** Re-open an existing linked session unless it was cancelled or is otherwise idle. */
export function shouldReuseLinkedConversation(
  conversationMgr: ConversationManagerStore,
  conversationId: string
) {
  const store = conversationMgr.conversations.get(conversationId);
  if (!store) return false;
  return isActiveLinkedConversationStatus(store.status);
}

export function isActiveLinkedConversationStatus(status: AgentStatus | undefined) {
  return Boolean(status && status !== 'idle');
}

export async function startNotebookTaskSession({
  editor,
  pos,
  projectId,
  taskId,
  conversationMgr,
  tabGroupManager,
  providerId,
  autoApprove,
}: {
  editor: Editor;
  pos: number;
  projectId: string;
  taskId: string;
  conversationMgr: ConversationManagerStore;
  tabGroupManager: TabGroupManagerStore;
  providerId: AgentProviderId;
  autoApprove: boolean;
}) {
  const resolved = resolveTaskItemFromPosition(editor, pos);
  if (!resolved) return;

  const { node, pos: itemPos } = resolved;
  const linkedConversationId = node.attrs.conversationId as string | null;
  if (
    linkedConversationId &&
    shouldReuseLinkedConversation(conversationMgr, linkedConversationId)
  ) {
    tabGroupManager.openConversation(linkedConversationId);
    return;
  }

  const breadcrumb = getTaskItemBreadcrumb(editor, itemPos);
  const taskText = getTaskItemText(editor, itemPos);
  if (!breadcrumb.trim() && !taskText.trim()) return;

  const prompt = buildTaskAssignmentPrompt(breadcrumb || taskText);
  const title = truncateConversationTitle(taskText || breadcrumb);
  const id = crypto.randomUUID();

  await conversationMgr.createConversation({
    projectId,
    taskId,
    id,
    provider: providerId,
    title,
    autoApprove,
    initialPrompt: prompt,
  });

  editor
    .chain()
    .command(({ tr }) => {
      tr.setNodeMarkup(itemPos, undefined, { ...node.attrs, conversationId: id });
      return true;
    })
    .run();

  tabGroupManager.openConversation(id);
}
