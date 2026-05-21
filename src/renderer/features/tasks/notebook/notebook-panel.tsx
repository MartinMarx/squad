import type { Editor } from '@tiptap/react';
import { Loader2 } from 'lucide-react';
import { autorun } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSettingsKey } from '@renderer/features/settings/use-app-settings-key';
import { useAgentAutoApproveDefaults } from '@renderer/features/tasks/hooks/useAgentAutoApproveDefaults';
import { useDebounce } from '@renderer/lib/hooks/useDebounce';
import { rpc } from '@renderer/lib/ipc';
import type { JSONContent } from '@shared/notebooks';
import { EMPTY_NOTEBOOK_DOC } from '@shared/notebooks';
import { useConversations, useTaskViewContext, useWorkspaceViewModel } from '../task-view-context';
import { NotebookEditor } from './notebook-editor';
import { startNotebookTaskSession } from './notebook-session';
import { setNotebookSessionBridge } from './notebook-session-bridge';
import { resolveDefaultProviderForConversation } from './resolve-default-provider';
import { autoCheckCompletedTaskItems } from './task-item-utils';

export const NotebookPanel = observer(function NotebookPanel() {
  const { projectId, taskId } = useTaskViewContext();
  const taskView = useWorkspaceViewModel();
  const conversations = useConversations();
  const { value: defaultAgent } = useAppSettingsKey('defaultAgent');
  const autoApproveDefaults = useAgentAutoApproveDefaults();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent>(EMPTY_NOTEBOOK_DOC);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void rpc.notebooks
      .getNotebook(projectId, taskId)
      .then((notebook) => {
        if (cancelled) return;
        setTitle(notebook.title);
        setContent(notebook.content);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to load notebook');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, taskId]);

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    if (loading) return;
    void rpc.notebooks
      .saveNotebook({
        projectId,
        taskId,
        title: debouncedTitle,
        content: debouncedContent,
      })
      .catch(() => {
        setError('Failed to save notebook');
      });
  }, [debouncedContent, debouncedTitle, loading, projectId, taskId]);

  const onStartSession = useCallback(
    (pos: number) => {
      const editor = editorRef.current;
      if (!editor) return;
      const { providerId, createDisabled } = resolveDefaultProviderForConversation(
        defaultAgent ?? 'claude'
      );
      if (createDisabled || !providerId) return;

      void startNotebookTaskSession({
        editor,
        pos,
        projectId,
        taskId,
        conversationMgr: conversations,
        tabGroupManager: taskView.tabGroupManager,
        providerId,
        autoApprove: autoApproveDefaults.getDefault(providerId),
      });
    },
    [autoApproveDefaults, conversations, defaultAgent, projectId, taskId, taskView.tabGroupManager]
  );

  useEffect(() => {
    setNotebookSessionBridge({
      getConversationStatus: (conversationId) =>
        conversations.conversations.get(conversationId)?.indicatorStatus ?? null,
      onStartSession,
    });
    return () => setNotebookSessionBridge(null);
  }, [conversations, onStartSession]);

  useEffect(() => {
    return autorun(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const statuses = Array.from(
        conversations.conversations.values(),
        (store) => store.indicatorStatus
      );

      for (const [conversationId, store] of conversations.conversations) {
        if (store.indicatorStatus === 'completed') {
          autoCheckCompletedTaskItems(editor, conversationId);
        }
      }

      if (statuses.some((status) => status && status !== 'idle')) {
        editor.view.dispatch(editor.state.tr);
      }
    });
  }, [conversations]);

  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-foreground/50" />
      </div>
    );
  }

  return (
    <div className="notebook-page h-full overflow-y-auto bg-background">
      {error ? <div className="px-14 py-2 text-sm text-foreground-error">{error}</div> : null}
      <div className="notebook-page-inner mx-auto w-full max-w-[720px] px-14 pt-12 pb-24">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Untitled"
          aria-label="Notebook title"
          className="notebook-page-title w-full border-0 bg-transparent text-4xl leading-tight font-bold outline-none placeholder:text-foreground/30"
        />
        <div className="mt-6 border-t border-transparent">
          <NotebookEditor
            key={taskId}
            content={content}
            onUpdate={setContent}
            onEditorReady={handleEditorReady}
          />
        </div>
      </div>
    </div>
  );
});
