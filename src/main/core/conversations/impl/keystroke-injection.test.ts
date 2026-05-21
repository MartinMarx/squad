import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pty, PtyExitInfo } from '@main/core/pty/pty';
import type { Conversation } from '@shared/conversations';
import { scheduleInitialPromptInjection } from './keystroke-injection';

function makeConversation(providerId: Conversation['providerId']): Conversation {
  return {
    id: 'conv-1',
    projectId: 'proj-1',
    taskId: 'task-1',
    providerId,
    title: '',
    autoApprove: false,
    lastInteractedAt: null,
    isInitialConversation: false,
  };
}

function makePty(): {
  pty: Pty;
  write: ReturnType<typeof vi.fn>;
  emitData: (chunk: string) => void;
  emitExit: (info?: PtyExitInfo) => void;
} {
  const write = vi.fn();
  let dataHandler: ((data: string) => void) | undefined;
  let exitHandler: ((info: PtyExitInfo) => void) | undefined;
  const pty: Pty = {
    write,
    resize: vi.fn(),
    kill: vi.fn(),
    onData: (handler: (data: string) => void) => {
      dataHandler = handler;
    },
    onExit: (handler: (info: PtyExitInfo) => void) => {
      exitHandler = handler;
    },
  } as unknown as Pty;
  return {
    pty,
    write,
    emitData: (chunk) => dataHandler?.(chunk),
    emitExit: (info = { exitCode: 0, signal: undefined }) => exitHandler?.(info),
  };
}

describe('scheduleInitialPromptInjection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing for providers without keystroke injection', () => {
    const { pty, write, emitData } = makePty();
    scheduleInitialPromptInjection({
      pty,
      conversation: makeConversation('claude'),
      initialPrompt: 'Fix the bug',
      isResuming: false,
    });

    emitData('ready');
    vi.advanceTimersByTime(20_000);
    expect(write).not.toHaveBeenCalled();
  });

  it('skips when resuming an existing session', () => {
    const { pty, write, emitData } = makePty();
    scheduleInitialPromptInjection({
      pty,
      conversation: makeConversation('claude'),
      initialPrompt: 'Fix the bug',
      isResuming: true,
    });

    emitData('ready');
    vi.advanceTimersByTime(20_000);
    expect(write).not.toHaveBeenCalled();
  });

  it('skips when the prompt is empty or whitespace', () => {
    const { pty, write, emitData } = makePty();
    scheduleInitialPromptInjection({
      pty,
      conversation: makeConversation('claude'),
      initialPrompt: '   ',
      isResuming: false,
    });

    emitData('ready');
    vi.advanceTimersByTime(20_000);
    expect(write).not.toHaveBeenCalled();
  });

  it('cancels injection when the PTY exits before idle', () => {
    const { pty, write, emitData, emitExit } = makePty();
    scheduleInitialPromptInjection({
      pty,
      conversation: makeConversation('claude'),
      initialPrompt: 'Fix the bug',
      isResuming: false,
    });

    emitData('starting');
    emitExit();
    vi.advanceTimersByTime(20_000);
    expect(write).not.toHaveBeenCalled();
  });
});
