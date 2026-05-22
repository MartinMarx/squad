import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  CircleX,
  GitMerge,
  GitPullRequest,
  Plus,
  XOctagon,
  type LucideIcon,
} from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from '@renderer/lib/layout/navigation-provider';
import { RelativeTime } from '@renderer/lib/ui/relative-time';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/lib/ui/tooltip';
import { cn } from '@renderer/utils/utils';
import {
  getHomeActivityStore,
  type HomeActivityEntry,
  type HomeActivityKind,
} from '../../stores/home-activity-store';
import { ProjectChip } from '../project-chip';

type ActivityFeedProps = {
  hideProjectChips?: boolean;
};

const KIND_META: Record<HomeActivityKind, { Icon: LucideIcon; color: string; verb: string }> = {
  'agent-finished': {
    Icon: CheckCircle2,
    color: 'text-foreground-success',
    verb: 'Agent finished',
  },
  'agent-errored': { Icon: XOctagon, color: 'text-foreground-destructive', verb: 'Agent errored' },
  'agent-awaiting-input': {
    Icon: Bell,
    color: 'text-foreground-warning',
    verb: 'Awaiting input',
  },
  'pr-opened': { Icon: GitPullRequest, color: 'text-foreground-info', verb: 'PR opened' },
  'pr-approved': { Icon: CheckCircle2, color: 'text-foreground-success', verb: 'PR approved' },
  'pr-changes-requested': {
    Icon: AlertTriangle,
    color: 'text-foreground-warning',
    verb: 'Changes requested',
  },
  'pr-merged': { Icon: GitMerge, color: 'text-foreground-merged', verb: 'PR merged' },
  'pr-ci-failed': { Icon: CircleX, color: 'text-foreground-destructive', verb: 'CI failing' },
  'task-status-changed': {
    Icon: ArrowRight,
    color: 'text-foreground-muted',
    verb: 'Status changed',
  },
  'task-created': { Icon: Plus, color: 'text-foreground-info', verb: 'Task created' },
};

export const ActivityFeed = observer(function ActivityFeed({
  hideProjectChips,
}: ActivityFeedProps) {
  const store = getHomeActivityStore();
  const entries = store.visibleEntries;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">
          Recent activity
        </h2>
        <span className="text-[10px] font-medium text-foreground-passive">{entries.length}</span>
      </header>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {entries.length === 0 ? (
          <div className="px-1 pb-3 text-[11px] text-foreground-passive">
            No activity yet. Events from the last 24h appear here.
          </div>
        ) : (
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} hideProjectChip={hideProjectChips} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
});

function ActivityRow({
  entry,
  hideProjectChip,
}: {
  entry: HomeActivityEntry;
  hideProjectChip?: boolean;
}) {
  const { navigate } = useNavigate();
  const meta = KIND_META[entry.kind];
  const Icon = meta.Icon;

  const onClick = () => {
    navigate('task', { projectId: entry.projectId, taskId: entry.taskId });
  };

  const tooltipBody = (
    <div className="flex flex-col gap-0.5 text-left">
      <div>{meta.verb}</div>
      <div className="text-foreground-passive">{entry.taskName}</div>
      {describeEntry(entry) && (
        <div className="text-foreground-passive">{describeEntry(entry)}</div>
      )}
      <div className="text-foreground-passive">
        <RelativeTime value={entry.at} />
      </div>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <motion.li
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }}
            className="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2 text-[12px] transition hover:bg-background-1"
          />
        }
      >
        <Icon className={cn('size-3.5 shrink-0', meta.color)} />
        <span className="truncate text-foreground-muted">{meta.verb}</span>
        <span className="text-foreground-passive">·</span>
        <span className="min-w-0 flex-1 truncate text-foreground">{entry.taskName}</span>
        {!hideProjectChip && (
          <ProjectChip
            projectId={entry.projectId}
            projectName={entry.projectName}
            iconOnly
            className="shrink-0"
          />
        )}
        <RelativeTime
          value={entry.at}
          compact
          className="shrink-0 text-[10px] text-foreground-passive tabular-nums"
        />
      </TooltipTrigger>
      <TooltipContent side="left" showArrow={false}>
        {tooltipBody}
      </TooltipContent>
    </Tooltip>
  );
}

function describeEntry(entry: HomeActivityEntry): string | undefined {
  if (entry.kind === 'task-status-changed' && entry.details) {
    const { fromStatus, toStatus } = entry.details;
    if (fromStatus && toStatus) return `${labelFor(fromStatus)} → ${labelFor(toStatus)}`;
  }
  return undefined;
}

function labelFor(status: string): string {
  switch (status) {
    case 'todo':
      return 'Backlog';
    case 'in_progress':
      return 'In Progress';
    case 'review':
      return 'In Review';
    case 'done':
      return 'Done';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}
