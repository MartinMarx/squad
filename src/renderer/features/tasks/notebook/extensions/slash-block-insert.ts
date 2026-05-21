import { Node } from '@tiptap/pm/model';
import type { ResolvedPos } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@shared/notebooks';

function blockDepth($from: ResolvedPos) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (!node.isBlock) continue;
    const parent = $from.node(depth - 1);
    if (parent.type.name === 'doc' || parent.type.name === 'detailsContent') {
      return depth;
    }
  }
  return $from.depth;
}

/** Replaces the block containing the selection with a new block node. */
export function insertBlockContent(
  editor: Editor,
  block: JSONContent,
  deleteRange?: { from: number; to: number }
) {
  return editor
    .chain()
    .focus()
    .command(({ tr, state, dispatch }) => {
      if (deleteRange) {
        tr.delete(deleteRange.from, deleteRange.to);
      }

      const $from = tr.selection.$from;
      const depth = blockDepth($from);
      if (depth <= 0) return false;

      const from = $from.before(depth);
      const to = $from.after(depth);
      const node = Node.fromJSON(state.schema, block);
      tr.replaceWith(from, to, node);

      const focusPos = Math.min(from + 1, tr.doc.content.size - 1);
      tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(1, focusPos)), 1));

      if (dispatch) dispatch(tr);
      return true;
    })
    .run();
}
