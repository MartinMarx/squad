import { getRenderedAttributes } from '@tiptap/core';
import TaskItem from '@tiptap/extension-task-item';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { getNotebookSessionBridge } from '../notebook-session-bridge';

const STATUS_CLASS: Record<string, string> = {
  working: 'notebook-task-status-working',
  'awaiting-input': 'notebook-task-status-awaiting',
  error: 'notebook-task-status-error',
  completed: 'notebook-task-status-completed',
};

function renderStatusIndicator(container: HTMLElement, conversationId: string | null) {
  container.replaceChildren();
  if (!conversationId) return;

  const bridge = getNotebookSessionBridge();
  const status = bridge?.getConversationStatus(conversationId) ?? null;
  if (!status || status === 'idle') return;

  const dot = document.createElement('span');
  dot.className = `notebook-task-status ${STATUS_CLASS[status] ?? ''}`;
  dot.title = status;
  container.append(dot);
}

function mergeClassName(element: HTMLElement, className: string) {
  for (const name of className.split(/\s+/)) {
    if (name) element.classList.add(name);
  }
}

export const TaskItemWithSession = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      conversationId: {
        default: null,
        keepOnSplit: false,
        parseHTML: (element) => element.getAttribute('data-conversation-id'),
        renderHTML: (attributes) => {
          if (!attributes.conversationId) return {};
          return { 'data-conversation-id': attributes.conversationId };
        },
      },
    };
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement('li');
      const checkboxWrapper = document.createElement('label');
      const checkboxStyler = document.createElement('span');
      const checkbox = document.createElement('input');
      const content = document.createElement('div');
      const actions = document.createElement('div');
      const statusSlot = document.createElement('span');
      const playButton = document.createElement('button');

      mergeClassName(listItem, 'notebook-task-item-row');
      content.className = 'notebook-task-item-content';
      actions.className = 'notebook-task-actions';
      actions.contentEditable = 'false';
      statusSlot.className = 'notebook-task-status-slot';
      playButton.type = 'button';
      playButton.className = 'notebook-task-play';
      playButton.setAttribute('aria-label', 'Start session for this task');
      playButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="8,5 19,12 8,19"/></svg>';

      const updateA11Y = (currentNode: ProseMirrorNode) => {
        checkbox.ariaLabel = `Task item checkbox for ${currentNode.textContent || 'empty task item'}`;
      };

      updateA11Y(node);

      checkboxWrapper.contentEditable = 'false';
      checkboxWrapper.className = 'notebook-task-item-checkbox';
      checkbox.type = 'checkbox';
      checkbox.addEventListener('mousedown', (event) => event.preventDefault());
      checkbox.addEventListener('change', (event) => {
        if (!editor.isEditable) {
          checkbox.checked = !checkbox.checked;
          return;
        }

        const { checked } = event.target as HTMLInputElement;
        if (typeof getPos !== 'function') return;

        editor
          .chain()
          .focus(undefined, { scrollIntoView: false })
          .command(({ tr }) => {
            const position = getPos();
            if (typeof position !== 'number') return false;
            const currentNode = tr.doc.nodeAt(position);
            tr.setNodeMarkup(position, undefined, {
              ...currentNode?.attrs,
              checked,
            });
            return true;
          })
          .run();
      });

      playButton.addEventListener('mousedown', (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      playButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof getPos !== 'function') return;
        const position = getPos();
        if (typeof position !== 'number') return;
        getNotebookSessionBridge()?.onStartSession(position);
      });

      Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
        if (key === 'class') {
          mergeClassName(listItem, String(value));
          return;
        }
        listItem.setAttribute(key, String(value));
      });

      listItem.dataset.checked = String(node.attrs.checked);
      listItem.dataset.type = this.name;
      checkbox.checked = Boolean(node.attrs.checked);

      checkboxWrapper.append(checkbox, checkboxStyler);
      actions.append(statusSlot, playButton);
      listItem.append(checkboxWrapper, content, actions);

      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (key === 'class') {
          mergeClassName(listItem, String(value));
          return;
        }
        if (value !== null && value !== undefined) {
          listItem.setAttribute(key, String(value));
        }
      });

      renderStatusIndicator(statusSlot, node.attrs.conversationId as string | null);

      let prevRenderedAttributeKeys = new Set(Object.keys(HTMLAttributes));

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false;

          listItem.dataset.checked = String(updatedNode.attrs.checked);
          checkbox.checked = Boolean(updatedNode.attrs.checked);
          updateA11Y(updatedNode);

          const conversationId = updatedNode.attrs.conversationId as string | null;
          playButton.setAttribute(
            'aria-label',
            conversationId ? 'Open linked session' : 'Start session for this task'
          );
          renderStatusIndicator(statusSlot, conversationId);

          const extensionAttributes = editor.extensionManager.attributes;
          const newHTMLAttributes = getRenderedAttributes(updatedNode, extensionAttributes);
          const newKeys = new Set(Object.keys(newHTMLAttributes));
          const staticAttrs = this.options.HTMLAttributes;

          prevRenderedAttributeKeys.forEach((key) => {
            if (!newKeys.has(key)) {
              if (key in staticAttrs) {
                listItem.setAttribute(key, staticAttrs[key]);
              } else {
                listItem.removeAttribute(key);
              }
            }
          });

          Object.entries(newHTMLAttributes).forEach(([key, value]) => {
            if (key === 'class') {
              if (value === null || value === undefined) return;
              mergeClassName(listItem, String(value));
              return;
            }
            if (value === null || value === undefined) {
              if (key in staticAttrs) {
                listItem.setAttribute(key, staticAttrs[key]);
              } else {
                listItem.removeAttribute(key);
              }
            } else {
              listItem.setAttribute(key, String(value));
            }
          });

          prevRenderedAttributeKeys = newKeys;
          return true;
        },
      };
    };
  },
});
