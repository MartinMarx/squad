import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/react';

function getDirectTaskItemLabel(node: ProseMirrorNode) {
  if (node.childCount === 0) return '';
  const first = node.child(0);
  if (first.type.name === 'paragraph') {
    return first.textContent.trim();
  }
  return node.textContent.trim();
}

export function resolveTaskItemFromPosition(editor: Editor, pos: number) {
  const doc = editor.state.doc;
  if (pos < 0 || pos > doc.content.size) return null;

  const direct = doc.nodeAt(pos);
  if (direct?.type.name === 'taskItem') {
    return { node: direct, pos };
  }

  const $pos = doc.resolve(Math.min(pos + 1, doc.content.size));
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.name !== 'taskItem') continue;
    const itemPos = $pos.before(depth);
    const resolved = doc.nodeAt(itemPos);
    if (resolved?.type.name === 'taskItem') {
      return { node: resolved, pos: itemPos };
    }
  }

  return null;
}

export function getTaskItemText(editor: Editor, pos: number) {
  const resolved = resolveTaskItemFromPosition(editor, pos);
  if (!resolved) return '';
  return getDirectTaskItemLabel(resolved.node);
}

export function getTaskItemBreadcrumb(editor: Editor, pos: number) {
  const resolved = resolveTaskItemFromPosition(editor, pos);
  if (!resolved) return '';

  const segments: string[] = [];
  const $pos = editor.state.doc.resolve(resolved.pos + 1);

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.name !== 'taskItem') continue;
    const label = getDirectTaskItemLabel(node);
    if (label) segments.unshift(label);
  }

  return segments.join(' > ');
}

export function autoCheckCompletedTaskItems(editor: Editor, conversationId: string) {
  const { state } = editor;
  let tr = state.tr;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (node.type.name !== 'taskItem') return;
    if (node.attrs.conversationId !== conversationId) return;
    if (node.attrs.checked) return;
    tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, checked: true });
    changed = true;
  });

  if (changed) {
    editor.view.dispatch(tr);
  }
}
