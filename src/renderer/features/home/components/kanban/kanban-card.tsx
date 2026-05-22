import { ExternalLink, GitBranch, Pin, PinOff, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import { conversationRegistry } from '@renderer/features/tasks/stores/conversation-registry';
import { getTaskStore } from '@renderer/features/tasks/stores/task-selectors';
import { rpc } from '@renderer/lib/ipc';
import { useNavigate } from '@renderer/lib/layout/navigation-provider';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@renderer/lib/ui/context-menu';
import { RelativeTime } from '@renderer/lib/ui/relative-time';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/lib/ui/tooltip';
import { log } from '@renderer/utils/logger';
import { cn } from '@renderer/utils/utils';
import { selectCurrentPr } from '@shared/pull-requests';
import type { HomeTaskEntry } from '../../lib/home-types';
import { AgentActivityDot, UnreadBadge } from '../agent-activity-dot';
import { AgentProviderIcon } from '../agent-provider-icon';
import { PrStatusIcon } from '../pr-status-icon';
import { ProjectChip } from '../project-chip';

type KanbanCardProps = {
  entry: HomeTaskEntry;
  /** When true, project chip is suppressed (single-project mode). */
  hideProjectChip?: boolean;
};

/**
 * Comfortable-density task card. Three lines:
 *   1. activity dot · project chip · issue id · task name · pin star
 *   2. branch name (mono, muted) when present
 *   3. agent icons · PR icon · diff stats · last-interacted age
 *
 * Click → navigate to the task. Right-click → context menu. Hover → tooltip
 * with branch + linked issue title + full PR list.
 */
export function KanbanCard({ entry, hideProjectChip }: KanbanCardProps) {
  const { navigate } = useNavigate();

  const onClick = useCallback(() => {
    navigate('task', { projectId: entry.projectId, taskId: entry.taskId });
  }, [navigate, entry.projectId, entry.taskId]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const issueId = entry.linkedIssue?.identifier;
  const currentPr = selectCurrentPr(entry.prs);
  const providerIds = Object.keys(entry.conversations);
  const diff = entry.workspaceGit;
  const branch = entry.task?.taskBranch;
  const isUnprovisioned = !entry.isProvisioned;
  const hasFooter =
    Boolean(currentPr) ||
    providerIds.length > 0 ||
    Boolean(diff && (diff.linesAdded > 0 || diff.linesDeleted > 0)) ||
    Boolean(entry.lastInteractedAt);

  const togglePin = () => {
    const store = getTaskStore(entry.projectId, entry.taskId);
    if (!store) return;
    void store.setPinned(!entry.isPinned);
  };

  const toggleUnread = () => {
    const conversations = conversationRegistry.get(entry.taskId);
    if (!conversations) return;
    if (entry.unreadCount > 0 || entry.agentStatus) {
      conversations.markAllSeen();
    } else {
      conversations.markAllUnseen();
    }
  };

  const openPrInBrowser = async () => {
    if (!currentPr) return;
    try {
      await rpc.app.openExternal(currentPr.url);
    } catch (err) {
      log.error('KanbanCard: failed to open PR URL', err);
    }
  };

  const openIssueInBrowser = async () => {
    const url = entry.linkedIssue?.url;
    if (!url) return;
    try {
      await rpc.app.openExternal(url);
    } catch (err) {
      log.error('KanbanCard: failed to open issue URL', err);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Tooltip>
          <TooltipTrigger
            render={
              <motion.div
                layout="position"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={onKeyDown}
                className={cn(
                  'group/card relative flex flex-col gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 text-left shadow-[0_1px_0_0_rgba(0,0,0,0.04)]',
                  'cursor-pointer outline-none transition-[border-color,box-shadow] duration-150',
                  'hover:border-border-1 hover:shadow-[0_4px_12px_-6px_rgba(0,0,0,0.12),0_2px_4px_-2px_rgba(0,0,0,0.06)]',
                  'focus-visible:border-border-primary focus-visible:ring-2 focus-visible:ring-ring/30',
                  isUnprovisioned && 'opacity-70'
                )}
                data-task-id={entry.taskId}
                data-project-id={entry.projectId}
              />
            }
          >
            <div className="flex items-center gap-2">
              <AgentActivityDot status={entry.agentStatus} />
              {!hideProjectChip && (
                <ProjectChip projectId={entry.projectId} projectName={entry.projectName} />
              )}
              {issueId && (
                <span className="shrink-0 font-mono text-[10px] tracking-tight text-foreground-muted">
                  {issueId}
                </span>
              )}
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-[13px] leading-snug font-medium text-foreground',
                  isUnprovisioned && 'italic'
                )}
              >
                {entry.name}
              </span>
              <UnreadBadge count={entry.unreadCount} />
              {entry.isPinned && (
                <Star className="size-3 shrink-0 fill-foreground-warning text-foreground-warning" />
              )}
            </div>

            {branch && (
              <div className="flex items-center gap-1 pl-[18px] text-[11px] text-foreground-passive">
                <GitBranch className="size-3 shrink-0" />
                <span className="truncate font-mono">{branch}</span>
              </div>
            )}

            {hasFooter && (
              <div className="flex items-center gap-2 pl-[18px] text-[11px] text-foreground-muted">
                {providerIds.length > 0 && (
                  <div className="flex items-center gap-1">
                    {providerIds.slice(0, 3).map((pid) => (
                      <AgentProviderIcon key={pid} providerId={pid} />
                    ))}
                  </div>
                )}
                {currentPr && <PrStatusIcon pr={currentPr} />}
                {diff && (diff.linesAdded > 0 || diff.linesDeleted > 0) && (
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <span className="text-foreground-diff-added">+{diff.linesAdded}</span>
                    <span className="text-foreground-diff-deleted">-{diff.linesDeleted}</span>
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {entry.lastInteractedAt && (
                    <RelativeTime
                      value={entry.lastInteractedAt}
                      compact
                      className="text-foreground-passive"
                    />
                  )}
                </div>
              </div>
            )}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8} showArrow={false} className="max-w-sm">
            <CardTooltipBody entry={entry} />
          </TooltipContent>
        </Tooltip>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={togglePin}>
          {entry.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          {entry.isPinned ? 'Unpin task' : 'Pin task'}
        </ContextMenuItem>
        <ContextMenuItem onClick={toggleUnread}>
          {entry.unreadCount > 0 || entry.agentStatus ? 'Mark as read' : 'Mark as unread'}
        </ContextMenuItem>
        {(currentPr || entry.linkedIssue) && <ContextMenuSeparator />}
        {currentPr && (
          <ContextMenuItem onClick={() => void openPrInBrowser()}>
            <ExternalLink className="size-4" />
            Open PR in browser
          </ContextMenuItem>
        )}
        {entry.linkedIssue && (
          <ContextMenuItem onClick={() => void openIssueInBrowser()}>
            <ExternalLink className="size-4" />
            Open {entry.linkedIssue.provider === 'linear' ? 'Linear' : 'GitHub'} issue
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function CardTooltipBody({ entry }: { entry: HomeTaskEntry }) {
  const branch = entry.task?.taskBranch;
  return (
    <div className="flex flex-col gap-1 text-left">
      <div className="font-medium">{entry.name}</div>
      {entry.linkedIssue?.title && (
        <div className="text-foreground-passive">
          <span className="font-mono">{entry.linkedIssue.identifier}</span> ·{' '}
          {entry.linkedIssue.title}
        </div>
      )}
      {branch && (
        <div className="text-foreground-passive">
          <span className="font-mono">{branch}</span>
        </div>
      )}
      {entry.prs.length > 0 && (
        <ul className="mt-1 flex flex-col gap-0.5 text-foreground-passive">
          {entry.prs.map((pr) => (
            <li key={pr.url} className="truncate">
              {pr.identifier ?? '#?'} · {pr.title}
            </li>
          ))}
        </ul>
      )}
      {entry.lastInteractedAt && (
        <div className="mt-1 text-foreground-passive">
          Last activity: <RelativeTime value={entry.lastInteractedAt} />
        </div>
      )}
    </div>
  );
}
