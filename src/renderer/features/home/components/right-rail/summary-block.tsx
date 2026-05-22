import { Bell, Cpu, GitPullRequest, Sparkles } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { appState } from '@renderer/lib/stores/app-state';
import { cn } from '@renderer/utils/utils';
import type { TaskLifecycleStatus } from '@shared/tasks';
import { deriveActiveAgentsCount, deriveAttentionCount } from '../../lib/attention-queue';
import type { HomeTaskEntry } from '../../lib/home-types';
import { groupHomePrs } from '../../lib/pr-grouping';
import { getHomeResourceHistory } from '../../stores/home-resource-history';
import { getHomeStore } from '../../stores/home-store';
import { Sparkline } from './sparkline';

type SummaryBlockProps = {
  entries: HomeTaskEntry[];
};

/**
 * Compact summary row at the top of the right rail.
 *
 * Three numeric tiles + one resource sparkline. Clicking attention / active
 * narrows the kanban by setting status filters.
 */
export const SummaryBlock = observer(function SummaryBlock({ entries }: SummaryBlockProps) {
  const store = getHomeStore();
  const history = getHomeResourceHistory();
  const attention = useMemo(() => deriveAttentionCount(entries), [entries]);
  const active = useMemo(() => deriveActiveAgentsCount(entries), [entries]);
  const prs = useMemo(() => {
    const g = groupHomePrs(entries);
    return g.needsAction.length + g.readyToMerge.length;
  }, [entries]);

  const cpuPercent = Math.round(appState.resourceMonitor.totalCpuPercent);
  const memMb = Math.round(appState.resourceMonitor.totalMemoryBytes / (1024 * 1024));
  const cpuHistory = history.cpu.slice();

  const focusStatuses = (statuses: TaskLifecycleStatus[]) => {
    store.setStatusFilter(statuses);
  };

  return (
    <section className="grid grid-cols-2 gap-2 p-3">
      <SummaryTile
        Icon={Bell}
        label="Attention"
        value={attention}
        tone={attention > 0 ? 'warning' : 'neutral'}
        onClick={attention > 0 ? () => focusStatuses(['in_progress', 'review']) : undefined}
      />
      <SummaryTile
        Icon={Sparkles}
        label="Working"
        value={active}
        tone={active > 0 ? 'info' : 'neutral'}
        onClick={active > 0 ? () => focusStatuses(['in_progress']) : undefined}
      />
      <SummaryTile
        Icon={GitPullRequest}
        label="PRs"
        value={prs}
        tone={prs > 0 ? 'success' : 'neutral'}
      />
      <SummaryTile
        Icon={Cpu}
        label="Resources"
        value={`${cpuPercent}%`}
        secondary={`${memMb} MB`}
        tone="neutral"
        chart={<Sparkline values={cpuHistory} className="text-foreground-info" />}
      />
    </section>
  );
});

type SummaryTileProps = {
  Icon: typeof Bell;
  label: string;
  value: number | string;
  secondary?: string;
  tone: 'neutral' | 'warning' | 'info' | 'success';
  onClick?: () => void;
  chart?: React.ReactNode;
};

function SummaryTile({ Icon, label, value, secondary, tone, onClick, chart }: SummaryTileProps) {
  const isClickable = Boolean(onClick);
  const toneClass =
    tone === 'warning'
      ? 'text-foreground-warning'
      : tone === 'info'
        ? 'text-foreground-info'
        : tone === 'success'
          ? 'text-foreground-success'
          : 'text-foreground-muted';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'relative flex flex-col items-start gap-1 overflow-hidden rounded-lg border border-border bg-background p-2 text-left transition',
        isClickable && 'cursor-pointer hover:border-border-1 hover:bg-background-1',
        !isClickable && 'cursor-default'
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide',
          toneClass
        )}
      >
        <Icon className="size-3" />
        {label}
      </span>
      <span className="text-base font-semibold text-foreground tabular-nums">{value}</span>
      {secondary && (
        <span className="text-[10px] text-foreground-muted tabular-nums">{secondary}</span>
      )}
      {chart && (
        <div className="pointer-events-none absolute right-1.5 bottom-1.5 opacity-80">{chart}</div>
      )}
    </button>
  );
}
