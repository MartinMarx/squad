export type KeyEventLike = {
  type: string;
  key: string;
  code?: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
};

// Ctrl+J sends line feed (LF) to the PTY, which CLI agents interpret as a newline
export const CTRL_J_ASCII = '\x0A';

// Ctrl+U (unix-line-discard) kills from cursor to beginning of line
export const CTRL_U_ASCII = '\x15';

export function shouldMapShiftEnterToCtrlJ(event: KeyEventLike): boolean {
  return (
    event.type === 'keydown' &&
    event.key === 'Enter' &&
    event.shiftKey === true &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
}

export function shouldHandleInterruptFromTerminal(event: KeyEventLike): boolean {
  return (
    event.type === 'keydown' &&
    event.key === 'Escape' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
}

export function shouldCopySelectionFromTerminal(
  event: KeyEventLike,
  isMacPlatform: boolean,
  hasSelection: boolean
): boolean {
  if (!hasSelection) return false;
  if (event.type !== 'keydown') return false;
  if (event.key.toLowerCase() !== 'c') return false;

  const ctrl = event.ctrlKey === true;
  const meta = event.metaKey === true;
  const alt = event.altKey === true;
  const shift = event.shiftKey === true;

  // Ctrl+Shift+C should copy on all platforms
  if (ctrl && shift && !meta && !alt) return true;

  // Platform-specific default copy shortcuts
  if (isMacPlatform) {
    return meta && !ctrl && !shift && !alt;
  }

  return ctrl && !meta && !shift && !alt;
}

/**
 * Detect Cmd+Backspace on macOS for "kill to beginning of line".
 * We send Ctrl+U (\x15) to the PTY, which readline-compatible shells
 * and most CLI agents interpret as unix-line-discard.
 *
 * Only intercepted on macOS — on Linux/Windows, Ctrl+U already reaches
 * the PTY natively for the same effect.
 */
export function shouldKillLineFromTerminal(event: KeyEventLike, isMacPlatform: boolean): boolean {
  if (!isMacPlatform) return false;
  if (event.type !== 'keydown') return false;
  if (event.key !== 'Backspace') return false;

  return event.metaKey === true && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * Detect Ctrl+Shift+V paste shortcut on Linux.
 * Linux terminals use Ctrl+Shift+V as the standard paste shortcut,
 * unlike Windows/macOS which use Ctrl+V/Cmd+V.
 */
export function shouldPasteToTerminal(event: KeyEventLike, isMacPlatform: boolean): boolean {
  if (event.type !== 'keydown') return false;
  if (event.key.toLowerCase() !== 'v') return false;

  const ctrl = event.ctrlKey === true;
  const meta = event.metaKey === true;
  const alt = event.altKey === true;
  const shift = event.shiftKey === true;

  // Ctrl+Shift+V is the standard paste shortcut in Linux terminals
  // Only apply on non-Mac platforms (Linux/Windows with Linux-style terminals)
  if (!isMacPlatform && ctrl && shift && !meta && !alt) {
    return true;
  }

  return false;
}

/**
 * Detect key combos that the app uses as global shortcuts (tab navigation,
 * new conversation, sidebar quick-jump, etc). When `attachCustomKeyEventHandler`
 * returns false for these, xterm leaves the event alone so it bubbles up to
 * the window-level hotkey listeners.
 *
 * Anything matched here is intentionally taken away from the running CLI agent
 * inside the terminal. Add new shortcut combos here whenever a new app-level
 * binding overlaps with terminal-reachable keys.
 */
export function shouldReleaseEventToApp(event: KeyEventLike): boolean {
  if (event.type !== 'keydown') return false;

  const ctrl = event.ctrlKey === true;
  const meta = event.metaKey === true;
  const alt = event.altKey === true;
  const shift = event.shiftKey === true;
  const key = event.key;

  // Tab navigation: Ctrl+Tab / Ctrl+Shift+Tab
  if (ctrl && !meta && !alt && key === 'Tab') return true;

  // Alt+Shift+1..9 — sidebar worktree quick-jump.
  // On macOS Alt+Shift+digit produces special characters (⁄™£¢∞§¶•ª), so we
  // match by event.code (Digit1..Digit9) rather than event.key. Plain Alt+digit
  // and Alt+letter combos stay with the terminal (word nav, etc.).
  if (alt && shift && !ctrl && !meta) {
    if (event.code && /^Digit[1-9]$/.test(event.code)) return true;
    if (/^[1-9]$/.test(key)) return true;
  }

  // Any Cmd/Meta-modified key on macOS, or Ctrl+Shift combos commonly used as
  // app shortcuts on Linux/Windows. The terminal rarely needs these.
  if (meta) {
    // Cmd+ArrowLeft/Right are already mapped to readline Ctrl+A/E elsewhere —
    // let that handler run.
    if (!ctrl && !alt && !shift && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      return false;
    }
    // Cmd+Backspace is mapped to Ctrl+U elsewhere — let that handler run.
    if (!ctrl && !alt && !shift && key === 'Backspace') return false;
    // Cmd+C copy / Cmd+V paste — let the existing copy/paste handlers run.
    if (!ctrl && !alt && !shift && (key === 'c' || key === 'C' || key === 'v' || key === 'V')) {
      return false;
    }
    return true;
  }

  return false;
}
