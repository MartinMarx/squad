import { ChevronRight, ExternalLink } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { rpc } from '@renderer/lib/ipc';
import { useNavigate } from '@renderer/lib/layout/navigation-provider';
import { RelativeTime } from '@renderer/lib/ui/relative-time';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/lib/ui/tooltip';
import { log } from '@renderer/utils/logger';
import { cn } from '@renderer/utils/utils';
import type { HomeTaskEntry } from '../../lib/home-types';
import { groupHomePrs, type HomePrRow } from '../../lib/pr-grouping';
import { CiStateDot, PrStatusIcon } from '../pr-status-icon';
import { ProjectChip } from '../project-chip';

type PrOverviewProps = {
  entries: HomeTaskEntry[];
  hideProjectChips?: boolean;
};

export const PrOverview = observer(function PrOverview({
  entries,
  hideProjectChips,
}: PrOverviewProps) {
  const groups = groupHomePrs(entries);
  const total = groups.needsAction.length + groups.readyToMerge.length + groups.inFlight.length;

  return (
    <section className="flex min-h-0 flex-col">
      <header className="flex items-center justify-between px-3 pt-3 pb-2">
        <h2 className="text-[11px] font-semibold tracking-wide text-foreground-muted uppercase">
          Pull requests
        </h2>
        <span className="text-[10px] font-medium text-foreground-passive">{total}</span>
      </header>

      <div className="flex flex-col gap-2 px-2 pb-2">
        <PrGroup
          label="Needs action"
          tone="warning"
          rows={groups.needsAction}
          hideProjectChips={hideProjectChips}
          defaultExpanded
        />
        <PrGroup
          label="Ready to merge"
          tone="success"
          rows={groups.readyToMerge}
          hideProjectChips={hideProjectChips}
          defaultExpanded
        />
        <PrGroup
          label="In flight"
          tone="neutral"
          rows={groups.inFlight}
          hideProjectChips={hideProjectChips}
          defaultExpanded={false}
        />
      </div>

      {total === 0 && (
        <div className="px-3 pb-3 text-[11px] text-foreground-passive">No open pull requests.</div>
      )}
    </section>
  );
});

type PrGroupProps = {
  label: string;
  tone: 'warning' | 'success' | 'neutral';
  rows: HomePrRow[];
  hideProjectChips?: boolean;
  defaultExpanded: boolean;
};

function PrGroup({ label, tone, rows, hideProjectChips, defaultExpanded }: PrGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const empty = rows.length === 0;
  if (empty && tone === 'neutral') return null;

  const toneClass =
    tone === 'warning'
      ? 'text-foreground-warning'
      : tone === 'success'
        ? 'text-foreground-success'
        : 'text-foreground-muted';

  return (
    <div className="rounded-md border border-border bg-background">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left"
      >
        <span className={cn('text-[11px] font-medium uppercase tracking-wide', toneClass)}>
          {label}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
          {rows.length}
          <ChevronRight className={cn('size-3 transition', expanded && 'rotate-90')} />
        </span>
      </button>
      {expanded && !empty && (
        <ul className="border-t border-border">
          {rows.map((row) => (
            <PrRow key={row.pr.url} row={row} hideProjectChip={hideProjectChips} />
          ))}
        </ul>
      )}
      {expanded && empty && (
        <div className="border-t border-border px-2.5 py-1.5 text-[11px] text-foreground-passive">
          Nothing here.
        </div>
      )}
    </div>
  );
}

function PrRow({ row, hideProjectChip }: { row: HomePrRow; hideProjectChip?: boolean }) {
  const { navigate } = useNavigate();
  const { pr, entry } = row;

  const navigateToTask = () => {
    navigate('task', { projectId: entry.projectId, taskId: entry.taskId });
  };

  const openExternal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await rpc.app.openExternal(pr.url);
    } catch (err) {
      log.error('PrOverview: failed to open PR URL', err);
    }
  };

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={navigateToTask}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateToTask();
        }
      }}
      className="group/pr-row flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-xs text-foreground transition hover:bg-background-1"
    >
      <PrStatusIcon pr={pr} />
      <Tooltip>
        <TooltipTrigger render={<span className="min-w-0 flex-1 truncate" />}>
          {pr.title}
        </TooltipTrigger>
        <TooltipContent side="left" showArrow={false}>
          {pr.title}
        </TooltipContent>
      </Tooltip>
      {!hideProjectChip && (
        <ProjectChip projectId={entry.projectId} projectName={entry.projectName} iconOnly />
      )}
      <CiStateDot state={row.ciState} />
      <RelativeTime value={pr.updatedAt} compact className="text-[10px] text-foreground-passive" />
      <button
        type="button"
        onClick={openExternal}
        className="rounded p-0.5 text-foreground-passive opacity-0 transition group-hover/pr-row:opacity-100 hover:bg-background-2 hover:text-foreground"
        aria-label="Open in browser"
      >
        <ExternalLink className="size-3" />
      </button>
    </li>
  );
}
