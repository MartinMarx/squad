import { createProviderClassifier, type ClassificationResult } from './base';

export function createCursorClassifier() {
  return createProviderClassifier((text: string): ClassificationResult => {
    const tail = text.slice(-500);

    // Permission/approval prompts
    if (/approve|reject|permission|allow|confirm/i.test(tail)) {
      return {
        type: 'notification',
        notificationType: 'permission_prompt',
      };
    }

    // Idle/ready prompts. Cursor's TUI uses cursor positioning to redraw lines,
    // so old "ctrl+c to stop" content and the bottom status bar both linger in
    // the buffer's byte stream. The input prompt line ("→ Add a follow-up") is
    // rarely in the last 500 chars (the bottom status bar gets redrawn more
    // often), so we look in the full buffer for the *last* occurrence and
    // check whether that line still carries "ctrl+c to stop" (= still working).
    const followupIdx = text.lastIndexOf('Add a follow-up');
    if (followupIdx !== -1) {
      const endOfLine = text.indexOf('\n', followupIdx);
      const restOfLine =
        endOfLine === -1 ? text.slice(followupIdx) : text.slice(followupIdx, endOfLine);
      if (!/ctrl\+c to stop/i.test(restOfLine)) {
        return {
          type: 'notification',
          notificationType: 'idle_prompt',
        };
      }
    }

    // Auth success
    if (/Successfully authenticated|Login successful/i.test(text)) {
      return {
        type: 'notification',
        notificationType: 'auth_success',
      };
    }

    // Questions/elicitation
    if (/What.*\?|How.*\?|Which.*\?|Please (provide|specify|clarify)/i.test(tail)) {
      return {
        type: 'notification',
        notificationType: 'elicitation_dialog',
      };
    }

    // Error detection
    if (/error:|fatal:|exception|failed/i.test(text)) {
      return {
        type: 'error',
      };
    }

    return undefined;
  });
}
