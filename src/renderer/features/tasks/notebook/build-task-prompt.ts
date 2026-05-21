/** Builds the initial agent prompt for a notebook task item session. */
export function buildTaskAssignmentPrompt(breadcrumb: string): string {
  const taskPath = breadcrumb.trim();
  return `You have been assigned the following task:

${taskPath}

Please work on this task. Let me know if you need any clarification before proceeding.`;
}

/** Truncates text for use as a conversation title. */
export function truncateConversationTitle(text: string, maxLength = 60): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Notebook task';
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
