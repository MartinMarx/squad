/**
 * @vitest-environment jsdom
 */
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { describe, expect, it, vi } from 'vitest';
import {
  runSlashCommandItem,
  SLASH_COMMAND_ITEMS,
  SlashCommand,
  slashCommandPluginKey,
} from '@renderer/features/tasks/notebook/extensions/slash-command';
import { createSlashCommandSuggestion } from '@renderer/features/tasks/notebook/extensions/slash-command-suggestion';

describe('SlashCommand suggestion', () => {
  it('activates and calls onStart when typing /', async () => {
    const onStart = vi.fn();
    const suggestion = createSlashCommandSuggestion();
    const originalRender = suggestion.render;

    suggestion.render = () => {
      const handlers = originalRender();
      return {
        ...handlers,
        onStart: (props) => {
          onStart(props);
          handlers.onStart?.(props);
        },
      };
    };

    const editor = new Editor({
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        SlashCommand.configure({ suggestion }),
      ],
      content: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
    });

    editor.chain().focus().insertContent({ type: 'text', text: '/' }).run();
    await Promise.resolve();
    await Promise.resolve();

    const state = slashCommandPluginKey.getState(editor.state);
    expect(state?.active).toBe(true);
    expect(onStart).toHaveBeenCalled();
    expect(onStart.mock.calls[0]?.[0]?.items.length).toBeGreaterThan(0);

    editor.destroy();
  });

  it('removes the slash query when selecting a list command', () => {
    const editor = new Editor({
      extensions: [StarterKit.configure({ codeBlock: false }), SlashCommand],
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: '/' }] }],
      },
    });

    const item = SLASH_COMMAND_ITEMS.find((entry) => entry.title === 'Numbered list');
    expect(item).toBeDefined();

    runSlashCommandItem(editor, { from: 1, to: 2 }, item!);

    expect(editor.getText()).not.toContain('/');
    expect(editor.getJSON().content?.[0]?.type).toBe('orderedList');

    editor.destroy();
  });
});
