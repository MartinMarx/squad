import { Editor } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Details, { DetailsContent, DetailsSummary } from '@tiptap/extension-details';
import { TextStyle } from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { describe, expect, it } from 'vitest';
import { insertBlockContent } from '@renderer/features/tasks/notebook/extensions/slash-block-insert';

const lowlight = createLowlight(common);

function makeEditor(text = 'hello') {
  return new Editor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      TextStyle,
      DetailsSummary,
      DetailsContent,
      Details.configure({ persist: true, openClassName: 'is-open' }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext' }),
    ],
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    },
  });
}

describe('insertBlockContent', () => {
  it('replaces the current paragraph with a code block', () => {
    const editor = makeEditor();
    insertBlockContent(editor, { type: 'codeBlock', attrs: { language: 'plaintext' } });
    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'codeBlock', attrs: { language: 'plaintext' } }],
    });
    editor.destroy();
  });

  it('replaces the current paragraph with an open toggle', () => {
    const editor = makeEditor();
    insertBlockContent(editor, {
      type: 'details',
      attrs: { open: true },
      content: [
        { type: 'detailsSummary', content: [{ type: 'text', text: 'Toggle' }] },
        { type: 'detailsContent', content: [{ type: 'paragraph' }] },
      ],
    });
    expect(editor.getJSON().content?.[0]?.type).toBe('details');
    expect(editor.getJSON().content?.[0]?.attrs?.open).toBe(true);
    editor.destroy();
  });

  it('deletes the slash query and inserts a code block in one transaction', () => {
    const editor = makeEditor('/code');
    const end = editor.state.doc.content.size - 1;
    const range = { from: end - 4, to: end };
    insertBlockContent(editor, { type: 'codeBlock', attrs: { language: 'plaintext' } }, range);
    expect(editor.getJSON()).toEqual({
      type: 'doc',
      content: [{ type: 'codeBlock', attrs: { language: 'plaintext' } }],
    });
    expect(editor.state.selection.$head.parent.type.name).toBe('codeBlock');
    editor.destroy();
  });
});
