import { mergeAttributes } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { getCodeBlockEnterEdit } from './code-block-enter';
import { createCodeBlockLanguagePicker } from './code-block-language-picker';

function languageClass(language: string | null | undefined, prefix: string | null | undefined) {
  if (!language || !prefix) return null;
  return `${prefix}${language}`;
}

export const NotebookCodeBlock = CodeBlockLowlight.extend({
  addKeyboardShortcuts() {
    const parentShortcuts = this.parent?.() ?? {};

    return {
      ...parentShortcuts,
      Enter: ({ editor }) => {
        if (this.options.exitOnTripleEnter) {
          const { state } = editor;
          const { $from, empty } = state.selection;
          if (empty && $from.parent.type === this.type) {
            const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
            const endsWithDoubleNewline = $from.parent.textContent.endsWith('\n\n');
            if (isAtEnd && endsWithDoubleNewline) {
              return editor
                .chain()
                .command(({ tr }) => {
                  tr.delete($from.pos - 2, $from.pos);
                  return true;
                })
                .exitCode()
                .run();
            }
          }
        }

        const { $from, empty } = editor.state.selection;
        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const textBeforeCursor = $from.parent.textContent.slice(0, $from.parentOffset);
        const textAfterCursor = $from.parent.textContent.slice($from.parentOffset);
        const tabSize = this.options.tabSize ?? 2;
        const { text, cursorOffset } = getCodeBlockEnterEdit(
          textBeforeCursor,
          textAfterCursor,
          tabSize
        );

        return editor.commands.command(({ tr }) => {
          tr.insertText(text, $from.pos);
          tr.setSelection(TextSelection.create(tr.doc, $from.pos + cursorOffset));
          return true;
        });
      },
    };
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.className = 'notebook-code-block-wrapper';

      const language = (node.attrs.language as string | null | undefined) || 'plaintext';
      const picker = createCodeBlockLanguagePicker({
        language,
        onChange: (nextLanguage) => {
          if (!editor.isEditable || typeof getPos !== 'function') return;
          const pos = getPos();
          if (typeof pos !== 'number') return;

          editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .command(({ tr }) => {
              const current = tr.doc.nodeAt(pos);
              if (!current || current.type !== this.type) return false;
              tr.setNodeMarkup(pos, undefined, { ...current.attrs, language: nextLanguage });
              return true;
            })
            .run();
        },
      });

      const pre = document.createElement('pre');
      const preAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'notebook-code-block',
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      });
      Object.entries(preAttributes).forEach(([key, value]) => {
        if (value != null) pre.setAttribute(key, String(value));
      });

      const code = document.createElement('code');
      const codeClass = languageClass(language, this.options.languageClassPrefix);
      if (codeClass) code.className = codeClass;
      code.setAttribute('spellcheck', 'false');
      code.setAttribute('autocorrect', 'off');
      code.setAttribute('autocapitalize', 'off');

      pre.append(code);
      dom.append(picker.toolbar, pre);

      const syncLanguage = (currentNode: ProseMirrorNode) => {
        const nextLanguage =
          (currentNode.attrs.language as string | null | undefined) || 'plaintext';
        picker.setLanguage(nextLanguage);
        code.className = languageClass(nextLanguage, this.options.languageClassPrefix) ?? '';
      };

      return {
        dom,
        contentDOM: code,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false;
          syncLanguage(updatedNode);
          return true;
        },
        ignoreMutation(mutation) {
          return !dom.contains(mutation.target) || picker.toolbar.contains(mutation.target);
        },
        destroy() {
          picker.destroy();
        },
      };
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const language = node.attrs.language;
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      }),
      [
        'code',
        {
          class: languageClass(language, this.options.languageClassPrefix),
          spellcheck: 'false',
          autocorrect: 'off',
          autocapitalize: 'off',
        },
        0,
      ],
    ];
  },
});
