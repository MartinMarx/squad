import { defineEvent } from '@shared/ipc/events';

// 'pty:data' matches the channel name consumed by TerminalSessionManager.
export const ptyDataChannel = defineEvent<string>('pty:data');

export const ptyExitChannel = defineEvent<{
  exitCode: number;
  signal?: number;
}>('pty:exit');

export const ptyInputChannel = defineEvent<string>('pty:input');

/**
 * Emitted when a lifecycle script command is written to its PTY (i.e. the
 * setup/run/teardown script has actually been started). Scoped by the
 * lifecycle script session id.
 */
export const lifecycleScriptStartedChannel = defineEvent<{ type: 'setup' | 'run' | 'teardown' }>(
  'lifecycle-script:started'
);
