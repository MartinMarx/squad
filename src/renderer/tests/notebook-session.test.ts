import { describe, expect, it } from 'vitest';
import { isActiveLinkedConversationStatus } from '@renderer/features/tasks/notebook/notebook-session';

describe('isActiveLinkedConversationStatus', () => {
  it('treats idle or missing status as inactive', () => {
    expect(isActiveLinkedConversationStatus(undefined)).toBe(false);
    expect(isActiveLinkedConversationStatus('idle')).toBe(false);
  });

  it('treats running and terminal agent states as active', () => {
    expect(isActiveLinkedConversationStatus('working')).toBe(true);
    expect(isActiveLinkedConversationStatus('awaiting-input')).toBe(true);
    expect(isActiveLinkedConversationStatus('error')).toBe(true);
    expect(isActiveLinkedConversationStatus('completed')).toBe(true);
  });
});
