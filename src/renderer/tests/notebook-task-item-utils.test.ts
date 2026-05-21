import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Text from '@tiptap/extension-text';
import { describe, expect, it } from 'vitest';
import {
  getTaskItemBreadcrumb,
  getTaskItemText,
  resolveTaskItemFromPosition,
} from '@renderer/features/tasks/notebook/task-item-utils';

describe('task item text extraction', () => {
  it('reads task item text and breadcrumb from nested lists', () => {
    const editor = new Editor({
      extensions: [Document, Paragraph, Text, TaskList, TaskItem.configure({ nested: true })],
      content: {
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  { type: 'paragraph', content: [{ type: 'text', text: 'Parent task' }] },
                  {
                    type: 'taskList',
                    content: [
                      {
                        type: 'taskItem',
                        attrs: { checked: false },
                        content: [
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Child task' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    let childPos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'taskItem' && node.textContent.includes('Child task')) {
        childPos = pos;
      }
    });

    expect(childPos).not.toBeNull();
    expect(resolveTaskItemFromPosition(editor, childPos!)).not.toBeNull();
    expect(getTaskItemText(editor, childPos!)).toBe('Child task');
    expect(getTaskItemBreadcrumb(editor, childPos!)).toBe('Parent task > Child task');

    editor.destroy();
  });
});
