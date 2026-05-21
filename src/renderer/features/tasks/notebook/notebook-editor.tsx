import { offset } from '@floating-ui/dom';
import Details, { DetailsContent, DetailsSummary } from '@tiptap/extension-details';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import { TextStyle } from '@tiptap/extension-text-style';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { GripVertical } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { JSONContent as NotebookJSONContent } from '@shared/notebooks';
import { NotebookCodeBlock } from './extensions/notebook-code-block';
import { SlashCommand } from './extensions/slash-command';
import { createSlashCommandSuggestion } from './extensions/slash-command-suggestion';
import { TaskItemWithSession } from './extensions/task-item-with-session';
import './notebook-editor.css';

const lowlight = createLowlight(common);
const slashCommandSuggestion = createSlashCommandSuggestion();

const notebookExtensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: {
      levels: [1, 2, 3],
    },
  }),
  TextStyle,
  DetailsSummary,
  DetailsContent,
  Details.configure({
    persist: true,
    openClassName: 'is-open',
    HTMLAttributes: {
      class: 'notebook-details',
    },
    renderToggleButton: ({ element, isOpen }) => {
      element.className = 'notebook-details-toggle';
      element.textContent = isOpen ? '▾' : '▸';
      element.setAttribute('aria-label', isOpen ? 'Collapse toggle' : 'Expand toggle');
      element.setAttribute('aria-expanded', String(isOpen));
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: 'notebook-task-list',
    },
  }),
  TaskItemWithSession.configure({
    nested: true,
    HTMLAttributes: {
      class: 'notebook-task-item',
    },
  }),
  NotebookCodeBlock.configure({
    lowlight,
    defaultLanguage: 'plaintext',
    enableTabIndentation: true,
    tabSize: 2,
    HTMLAttributes: {
      class: 'notebook-code-block',
    },
  }),
  Placeholder.configure({
    placeholder: "Type '/' for commands…",
  }),
  SlashCommand.configure({
    suggestion: slashCommandSuggestion,
  }),
];

const dragHandleNested = { edgeDetection: 'none' } as const;
const dragHandleOffset = offset({ mainAxis: 12, crossAxis: 0 });
const dragHandlePositionConfig = {
  placement: 'left-start' as const,
  strategy: 'absolute' as const,
  middleware: [dragHandleOffset],
};

export function NotebookEditor({
  content,
  onUpdate,
  onEditorReady,
}: {
  content: NotebookJSONContent;
  onUpdate: (content: NotebookJSONContent) => void;
  onEditorReady?: (editor: Editor) => void;
}) {
  const extensions = useMemo(() => notebookExtensions, []);

  const editor = useEditor({
    extensions,
    content,
    editorProps: {
      attributes: {
        class: 'notebook-editor-content outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onUpdate(currentEditor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  if (!editor) return null;

  return (
    <div className="notebook-editor relative">
      <DragHandle
        editor={editor}
        className="notebook-drag-handle-host"
        nested={dragHandleNested}
        computePositionConfig={dragHandlePositionConfig}
      >
        <button
          type="button"
          tabIndex={-1}
          className="notebook-drag-handle pointer-events-none flex size-6 items-center justify-center rounded text-foreground/45"
          aria-label="Drag to reorder block"
        >
          <GripVertical className="size-4" />
        </button>
      </DragHandle>
      <EditorContent editor={editor} />
    </div>
  );
}
