import { describe, expect, it } from 'vitest';
import {
  buildTaskAssignmentPrompt,
  truncateConversationTitle,
} from '@renderer/features/tasks/notebook/build-task-prompt';

describe('buildTaskAssignmentPrompt', () => {
  it('wraps the breadcrumb with assignment framing', () => {
    expect(buildTaskAssignmentPrompt('Auth refactor > Add retry logic')).toBe(
      `You have been assigned the following task:

Auth refactor > Add retry logic

Please work on this task. Let me know if you need any clarification before proceeding.`
    );
  });
});

describe('truncateConversationTitle', () => {
  it('returns a fallback for empty text', () => {
    expect(truncateConversationTitle('   ')).toBe('Notebook task');
  });

  it('truncates long titles', () => {
    const title = truncateConversationTitle('a'.repeat(80), 20);
    expect(title.length).toBeLessThanOrEqual(20);
    expect(title.endsWith('…')).toBe(true);
  });
});
