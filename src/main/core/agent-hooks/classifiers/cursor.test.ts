import { describe, expect, it } from 'vitest';
import { createCursorClassifier } from './cursor';

describe('createCursorClassifier', () => {
  it('does not emit idle_prompt while cursor is composing', () => {
    // The buffer contains a "ctrl+c to stop" suffix on the input prompt line,
    // which is the marker that cursor-agent is still composing a response.
    const classifier = createCursorClassifier();
    const buffer = [
      '  Done. Here is a summary.',
      ' ⠘⠆ Composing  50 tokens',
      '    Tip: Use /auto-run to skip all approvals.',
      '',
      '  → Add a follow-up                                          ctrl+c to stop ',
      '  Composer 2.5 Fast                                          Auto-run',
      '  ~/project',
    ].join('\n');

    expect(classifier.classify(buffer)).toBeUndefined();
  });

  it('emits idle_prompt when input prompt no longer says "ctrl+c to stop"', () => {
    // After cursor finishes, the input line is redrawn without "ctrl+c to stop".
    // Critically, the bottom status bar (the actual tail of the stream) does
    // not contain "Add a follow-up" — that line is higher up in the buffer.
    const classifier = createCursorClassifier();
    const buffer = [
      '  Done. Here is a summary.',
      '',
      '  → Add a follow-up                                                       ',
      '  Composer 2.5 Fast                                          Auto-run',
      '  ~/project',
    ].join('\n');

    expect(classifier.classify(buffer)).toEqual({
      type: 'notification',
      notificationType: 'idle_prompt',
    });
  });

  it('emits idle_prompt even when "ctrl+c to stop" is stale earlier in the buffer', () => {
    // Cursor's TUI uses cursor positioning to overwrite lines, so the byte
    // stream contains both the old composing-state line AND the new idle line.
    // The lastIndexOf check ensures we look at the most recent input prompt.
    const classifier = createCursorClassifier();
    const buffer = [
      ' ⠘⠆ Composing  50 tokens',
      '  → Add a follow-up                                          ctrl+c to stop ',
      '  Composer 2.5 Fast                                          Auto-run',
      '  ~/project',
      '',
      '  → Add a follow-up                                                       ',
      '  Composer 2.5 Fast · 6.6%                                   Auto-run',
      '  ~/project',
    ].join('\n');

    expect(classifier.classify(buffer)).toEqual({
      type: 'notification',
      notificationType: 'idle_prompt',
    });
  });

  it('does not emit idle_prompt on the welcome screen (no "Add a follow-up" yet)', () => {
    const classifier = createCursorClassifier();
    const buffer = [
      '  Cursor Agent',
      '  v2026.05.20',
      '  Plan, search, build anything',
      '  Composer 2.5 Fast                                          Auto-run',
      '  ~/project',
    ].join('\n');

    expect(classifier.classify(buffer)).toBeUndefined();
  });
});
