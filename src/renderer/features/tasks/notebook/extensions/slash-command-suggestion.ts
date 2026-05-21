import type { Editor } from '@tiptap/react';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import type { SlashCommandItem } from './slash-command';
import { SlashCommandList, type SlashCommandListRef } from './slash-command-list';

function updateSlashMenuPosition(
  element: HTMLElement,
  clientRect?: (() => DOMRect | null) | DOMRect | null,
  editor?: Editor
) {
  let rect = typeof clientRect === 'function' ? clientRect() : clientRect;
  if (!rect && editor) {
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    rect = new DOMRect(
      coords.left,
      coords.top,
      coords.right - coords.left,
      coords.bottom - coords.top
    );
  }
  if (!rect) return;

  element.style.position = 'fixed';
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.bottom + 6}px`;
  element.style.zIndex = '9999';
}

export function createSlashCommandSuggestion() {
  let component: ReactRenderer<SlashCommandListRef> | null = null;

  return {
    render: () => ({
      onStart: (props: SuggestionProps<SlashCommandItem>) => {
        component = new ReactRenderer(SlashCommandList, {
          editor: props.editor,
          props: {
            items: props.items,
            command: (item: SlashCommandItem) => props.command(item),
          },
          className: 'notebook-slash-menu-host',
        });
        document.body.appendChild(component.element);
        updateSlashMenuPosition(component.element, props.clientRect, props.editor);
      },
      onUpdate: (props: SuggestionProps<SlashCommandItem>) => {
        component?.updateProps({
          items: props.items,
          command: (item: SlashCommandItem) => props.command(item),
        });
        if (component) {
          updateSlashMenuPosition(component.element, props.clientRect, props.editor);
        }
      },
      onKeyDown: (props: SuggestionKeyDownProps) => component?.ref?.onKeyDown(props.event) ?? false,
      onExit: () => {
        component?.destroy();
        component = null;
      },
    }),
  };
}
