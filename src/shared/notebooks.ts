import type { JSONContent } from '@tiptap/core';

export type { JSONContent };

export const EMPTY_NOTEBOOK_DOC: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export type Notebook = {
  taskId: string;
  title: string;
  content: JSONContent;
  updatedAt: string;
};

export type SaveNotebookParams = {
  projectId: string;
  taskId: string;
  title: string;
  content: JSONContent;
};
