const OPENERS: Record<string, string> = { '{': '}', '[': ']', '(': ')' };

export type CodeBlockEnterEdit = {
  text: string;
  cursorOffset: number;
};

export function getCodeBlockLineIndent(textBeforeCursor: string) {
  const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
  return textBeforeCursor.slice(lineStart).match(/^[\t ]*/)?.[0] ?? '';
}

export function getCodeBlockEnterEdit(
  textBeforeCursor: string,
  textAfterCursor: string,
  tabSize = 2
): CodeBlockEnterEdit {
  const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
  const currentLineToCursor = textBeforeCursor.slice(lineStart);
  const baseIndent = getCodeBlockLineIndent(textBeforeCursor);
  const indentUnit = ' '.repeat(tabSize);
  const innerIndent = baseIndent + indentUnit;

  const trimmedLine = currentLineToCursor.trimEnd();
  const lastChar = trimmedLine.at(-1);

  if (lastChar && lastChar in OPENERS) {
    const close = OPENERS[lastChar];
    const afterTrimmed = textAfterCursor.replace(/^[ \t]*/, '');
    if (afterTrimmed.startsWith(close)) {
      const text = `\n${innerIndent}\n${baseIndent}`;
      return { text, cursorOffset: 1 + innerIndent.length };
    }
    const text = `\n${innerIndent}\n${baseIndent}${close}`;
    return { text, cursorOffset: 1 + innerIndent.length };
  }

  if (currentLineToCursor.trim() === '' && /^[ \t]*[}\])]/.test(textAfterCursor)) {
    const dedented = baseIndent.slice(0, Math.max(0, baseIndent.length - tabSize));
    const text = `\n${dedented}`;
    return { text, cursorOffset: 1 + dedented.length };
  }

  const text = `\n${baseIndent}`;
  return { text, cursorOffset: 1 + baseIndent.length };
}
