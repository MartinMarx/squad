import { ExternalLink, GitPullRequest, MessageSquare } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import {
  getKanbanCardPrimaryAction,
  type KanbanCardAction,
} from '@renderer/features/kanban/kanban-column';
import { getRepositoryStore } from '@renderer/features/projects/stores/project-selectors';
import { AgentStatusIndicator } from '@renderer/features/tasks/components/agent-status-indicator';
import { TaskGitDiffStats } from '@renderer/features/tasks/components/task-git-diff-stats';
import {
  getTaskGitStore,
  getTaskManagerStore,
  getTaskStore,
} from '@renderer/features/tasks/stores/task-selectors';
import { isProvisioned, registeredTaskData } from '@renderer/features/tasks/stores/task-store';
import AgentLogo from '@renderer/lib/components/agent-logo';
import { PrBadge } from '@renderer/lib/components/pr-badge';
import { rpc } from '@renderer/lib/ipc';
import { useNavigate } from '@renderer/lib/layout/navigation-provider';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { Button } from '@renderer/lib/ui/button';
import { RelativeTime } from '@renderer/lib/ui/relative-time';
import { agentConfig } from '@renderer/utils/agentConfig';
import { selectCurrentPr } from '@shared/pull-requests';
import type { KanbanEntry } from './kanban-selectors';

function KanbanCardActionButton({
  action,
  onCreatePr,
  onContinue,
}: {
  action: KanbanCardAction;
  onCreatePr: () => void;
  onContinue: () => void;
}) {
  switch (action.kind) {
    case 'create-pr':
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-full justify-start gap-1.5 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            onCreatePr();
          }}
        >
          <GitPullRequest className="size-3.5 shrink-0" />
          Create PR
        </Button>
      );
    case 'open-pr':
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-full justify-start gap-1.5 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            void rpc.app.openExternal(action.url);
          }}
        >
          <ExternalLink className="size-3.5 shrink-0" />
          Open PR
        </Button>
      );
    case 'continue-session':
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-full justify-start gap-1.5 text-xs"
          onClick={(event) => {
            event.stopPropagation();
            onContinue();
          }}
        >
          <MessageSquare className="size-3.5 shrink-0" />
          Continue session
        </Button>
      );
  }
}

export const KanbanCard = observer(function KanbanCard({ entry }: { entry: KanbanEntry }) {
  const { navigate } = useNavigate();
  const showCreatePrModal = useShowModal('createPrModal');
  const { projectId, task, column, agentStatus } = entry;
  const data = registeredTaskData(task);
  if (!data) return null;

  const taskManager = getTaskManagerStore(projectId);
  const branchName = getTaskGitStore(projectId, data.id)?.branchName ?? data.taskBranch;
  const currentPr = data.prs.length > 0 ? selectCurrentPr(data.prs) : undefined;
  const openPr = data.prs.find((pr) => pr.status === 'open');
  const repositoryUrl = getRepositoryStore(projectId)?.repositoryUrl ?? '';
  const canCreatePr = Boolean(
    isProvisioned(task) && data.taskBranch && repositoryUrl && task.workspaceId
  );

  const primaryAction = getKanbanCardPrimaryAction({
    column,
    agentStatus,
    openPrUrl: openPr?.url,
    canCreatePr,
  });

  const handleOpen = () => {
    if (task.state === 'unprovisioned' && task.phase === 'idle') {
      void taskManager?.provisionTask(data.id);
    }
    navigate('task', { projectId, taskId: data.id });
  };

  const handleCreatePr = () => {
    if (!isProvisioned(task) || !data.taskBranch || !task.workspaceId) return;
    showCreatePrModal({
      projectId,
      taskId: data.id,
      repositoryUrl,
      branchName: data.taskBranch,
      draft: false,
      workspaceId: task.workspaceId,
      onSuccess: () => {
        void getTaskStore(projectId, data.id)?.updateStatus('review');
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-background-1"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{data.name}</div>
          <div className="truncate text-xs text-foreground-muted">{entry.projectName}</div>
        </div>
        {agentStatus ? (
          <AgentStatusIndicator status={agentStatus} />
        ) : (
          <RelativeTime
            value={data.statusChangedAt}
            className="shrink-0 font-mono text-[10px] text-foreground-passive"
            compact
          />
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {branchName ? (
          <span className="truncate font-mono text-[11px] text-foreground-passive">
            {branchName}
          </span>
        ) : null}
        <TaskGitDiffStats task={task} className="text-[11px]" />
        {currentPr ? <PrBadge variant="compact" pr={currentPr} hoverDelay={100} /> : null}
        {data.linkedIssue ? (
          <span className="truncate text-[11px] text-foreground-muted">
            {data.linkedIssue.identifier}
          </span>
        ) : null}
      </div>

      {Object.keys(task.conversationStats).length > 0 ? (
        <div className="flex items-center [&>span]:ring-2 [&>span]:ring-background [&>span:not(:first-child)]:-ml-1.5">
          {Object.entries(task.conversationStats).map(([providerId, count]) => {
            const config = agentConfig[providerId as keyof typeof agentConfig];
            if (!config) return null;
            return (
              <span
                key={providerId}
                className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-sm bg-background-2"
                title={`${config.name}: ${String(count)}`}
              >
                <AgentLogo
                  logo={config.logo}
                  alt={config.alt}
                  isSvg={config.isSvg}
                  invertInDark={config.invertInDark}
                  className="h-3.5 w-3.5"
                />
                {count > 1 ? (
                  <span className="absolute -right-px -bottom-px rounded-tl bg-background px-px text-[8px] leading-none font-semibold text-foreground-passive">
                    {count}
                  </span>
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}

      {primaryAction ? (
        <div className="pt-0.5">
          <KanbanCardActionButton
            action={primaryAction}
            onCreatePr={handleCreatePr}
            onContinue={handleOpen}
          />
        </div>
      ) : null}
    </button>
  );
});
