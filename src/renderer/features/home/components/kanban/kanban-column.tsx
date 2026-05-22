import { ChevronRight } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@renderer/lib/ui/button';
import { cn } from '@renderer/utils/utils';
import type { TaskLifecycleStatus } from '@shared/tasks';
import type { HomeTaskEntry } from '../../lib/home-types';
import { getHomeStore } from '../../stores/home-store';
import { KanbanCard } from './kanban-card';

type KanbanColumnProps = {
  status: TaskLifecycleStatus;
  label: string;
  entries: HomeTaskEntry[];
  /** When true, render as a collapsed-by-default narrow strip (Done / Cancelled). */
  collapsible?: boolean;
  hideProjectChips?: boolean;
};

const INITIAL_COLLAPSED_LIMIT = 10;

export const KanbanColumn = observer(function KanbanColumn({
  status,
  label,
  entries,
  collapsible,
  hideProjectChips,
}: KanbanColumnProps) {
  const store = getHomeStore();
  const expanded = !collapsible || store.isColumnExpanded(status);
  const [showAll, setShowAll] = useState(false);

  if (collapsible && !expanded) {
    return (
      <button
        type="button"
        onClick={() => store.toggleColumnExpanded(status)}
        className={cn(
          'group/strip flex h-full w-10 shrink-0 flex-col items-center justify-start gap-3 rounded-lg border border-border bg-background-1/40 py-3 px-1.5',
          'text-xs text-foreground-muted transition hover:bg-background-1 hover:text-foreground'
        )}
        aria-label={`Expand ${label} column (${entries.length})`}
      >
        <span className="rotate-180 font-medium tracking-wide [writing-mode:vertical-rl]">
          {label} · {entries.length}
        </span>
        <ChevronRight className="size-3 -rotate-90 transition group-hover/strip:translate-y-0.5" />
      </button>
    );
  }

  const visible = !collapsible || showAll ? entries : entries.slice(0, INITIAL_COLLAPSED_LIMIT);
  const overflow = entries.length - visible.length;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-lg border border-border bg-background-1/40">
      <header className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-foreground">{label}</span>
          <span className="rounded-full bg-background-2 px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted">
            {entries.length}
          </span>
        </div>
        {collapsible && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => store.toggleColumnExpanded(status)}
            aria-label={`Collapse ${label} column`}
          >
            <ChevronRight className="rotate-90" />
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {visible.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-md text-[11px] text-foreground-passive">
            Empty
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {visible.map((entry) => (
                <KanbanCard key={entry.taskId} entry={entry} hideProjectChip={hideProjectChips} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {collapsible && overflow > 0 && (
          <motion.button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-2 w-full rounded-md border border-dashed border-border bg-transparent px-2 py-1.5 text-[11px] text-foreground-muted transition hover:bg-background-1 hover:text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Show all {entries.length}
          </motion.button>
        )}
      </div>
    </div>
  );
});
