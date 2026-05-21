import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { insertBlockContent } from './slash-block-insert';

export const slashCommandPluginKey = new PluginKey('slashCommand');

export type SlashCommandIconKey =
  | 'text'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'list'
  | 'list-ordered'
  | 'list-todo'
  | 'quote'
  | 'code'
  | 'minus'
  | 'chevron-right';

export type SlashCommandItem = {
  title: string;
  description: string;
  icon: SlashCommandIconKey;
  searchTerms: string[];
  command: (editor: Editor) => void;
};

export function runSlashCommandItem(
  editor: Editor,
  range: { from: number; to: number },
  item: SlashCommandItem
) {
  editor.chain().focus().deleteRange(range).run();
  item.command(editor);
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    title: 'Text',
    description: 'Plain paragraph',
    icon: 'text',
    searchTerms: ['text', 'paragraph'],
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'heading-1',
    searchTerms: ['h1', 'heading'],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'heading-2',
    searchTerms: ['h2', 'heading'],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'heading-3',
    searchTerms: ['h3', 'heading'],
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet list',
    description: 'Unordered list',
    icon: 'list',
    searchTerms: ['bullet', 'list', 'ul'],
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    description: 'Ordered list',
    icon: 'list-ordered',
    searchTerms: ['numbered', 'ordered', 'ol'],
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'To-do list',
    description: 'Track tasks with checkboxes',
    icon: 'list-todo',
    searchTerms: ['task', 'todo', 'checklist'],
    command: (editor) => {
      const { $from } = editor.state.selection;
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        if ($from.node(depth).type.name === 'taskList') {
          return editor.chain().focus().run();
        }
      }
      return editor
        .chain()
        .focus()
        .insertContent({
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph' }],
            },
          ],
        })
        .run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote',
    icon: 'quote',
    searchTerms: ['quote', 'blockquote'],
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code',
    description: 'Syntax highlighted snippet',
    icon: 'code',
    searchTerms: ['code', 'snippet'],
    command: (editor) =>
      insertBlockContent(editor, {
        type: 'codeBlock',
        attrs: { language: 'plaintext' },
      }),
  },
  {
    title: 'Divider',
    description: 'Visual break',
    icon: 'minus',
    searchTerms: ['divider', 'hr', 'line'],
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Toggle list',
    description: 'Collapsible section',
    icon: 'chevron-right',
    searchTerms: ['toggle', 'collapse', 'details'],
    command: (editor) =>
      insertBlockContent(editor, {
        type: 'details',
        attrs: { open: true },
        content: [
          { type: 'detailsSummary', content: [{ type: 'text', text: 'Toggle' }] },
          { type: 'detailsContent', content: [{ type: 'paragraph' }] },
        ],
      }),
  },
];

export type SlashCommandStorage = {
  items: SlashCommandItem[];
};

export const SlashCommand = Extension.create<
  { suggestion: Omit<SuggestionOptions<SlashCommandItem>, 'editor'> },
  SlashCommandStorage
>({
  name: 'slashCommand',

  addStorage() {
    return {
      items: SLASH_COMMAND_ITEMS,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: slashCommandPluginKey,
        ...this.options.suggestion,
        char: '/',
        startOfLine: false,
        allowedPrefixes: null,
        command: ({ editor, range, props }) => {
          runSlashCommandItem(editor, range, props);
        },
        items: ({ query }) => {
          const q = query.toLowerCase();
          return this.storage.items.filter((item) => {
            if (!q) return true;
            return (
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.searchTerms.some((term) => term.includes(q))
            );
          });
        },
      }),
    ];
  },
});
