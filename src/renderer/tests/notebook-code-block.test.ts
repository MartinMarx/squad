import { describe, expect, it } from 'vitest';
import {
  getCodeBlockEnterEdit,
  getCodeBlockLineIndent,
} from '@renderer/features/tasks/notebook/extensions/code-block-enter';

describe('getCodeBlockLineIndent', () => {
  it('returns leading whitespace from the current line', () => {
    expect(getCodeBlockLineIndent('  foo  ')).toBe('  ');
    expect(getCodeBlockLineIndent('function test() {\n    return 1')).toBe('    ');
  });

  it('returns empty string when the current line has no indent', () => {
    expect(getCodeBlockLineIndent('hello')).toBe('');
    expect(getCodeBlockLineIndent('first\nsecond')).toBe('');
  });
});

describe('getCodeBlockEnterEdit', () => {
  it('inserts an indented body and closing brace after an opening brace', () => {
    expect(getCodeBlockEnterEdit('if (true) {', '', 2)).toEqual({
      text: '\n  \n}',
      cursorOffset: 3,
    });
  });

  it('keeps an existing closing brace on the same line', () => {
    expect(getCodeBlockEnterEdit('if (true) {', '}', 2)).toEqual({
      text: '\n  \n',
      cursorOffset: 3,
    });
  });

  it('preserves the current line indent for normal breaks', () => {
    expect(getCodeBlockEnterEdit('function test() {\n    return 1', '', 2)).toEqual({
      text: '\n    ',
      cursorOffset: 5,
    });
  });

  it('dedents when pressing enter on an empty line before a closing brace', () => {
    expect(getCodeBlockEnterEdit('if (true) {\n  ', '}', 2)).toEqual({
      text: '\n',
      cursorOffset: 1,
    });
  });
});
