import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import type { TaskLifecycleStatus } from '@shared/tasks';
import type { HomeTaskEntry } from '../../lib/home-types';
import { getHomeStore } from '../../stores/home-store';
import { KanbanColumn } from './kanban-column';

type KanbanBoardProps = {
  entries: HomeTaskEntry[];
  /** Hide project chips on cards (e.g. single-project mode). */
  hideProjectChips?: boolean;
  /** When provided, used by the "all done/cancelled" empty hint to expand Done. */
  onExpandDone?: () => void;
};

type ColumnDef = {
  status: TaskLifecycleStatus;
  label: string;
  collapsible: boolean;
};

const COLUMNS: ColumnDef[] = [
  { status: 'todo', label: 'Backlog', collapsible: false },
  { status: 'in_progress', label: 'In Progress', collapsible: false },
  { status: 'review', label: 'In Review', collapsible: false },
  { status: 'done', label: 'Done', collapsible: true },
  { status: 'cancelled', label: 'Cancelled', collapsible: true },
];

function bucket(entries: HomeTaskEntry[]) {
  const result: Record<TaskLifecycleStatus, HomeTaskEntry[]> = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
    cancelled: [],
  };
  for (const e of entries) {
    if (e.status in result) result[e.status].push(e);
  }
  // Sort: active columns by lastInteractedAt desc then createdAt; terminal columns by statusChangedAt desc.
  const byActivity = (a: HomeTaskEntry, b: HomeTaskEntry) => {
    const aKey = a.lastInteractedAt ?? a.createdAt;
    const bKey = b.lastInteractedAt ?? b.createdAt;
    return bKey.localeCompare(aKey);
  };
  const byStatusChanged = (a: HomeTaskEntry, b: HomeTaskEntry) =>
    b.statusChangedAt.localeCompare(a.statusChangedAt);
  result.todo.sort(byActivity);
  result.in_progress.sort(byActivity);
  result.review.sort(byActivity);
  result.done.sort(byStatusChanged);
  result.cancelled.sort(byStatusChanged);
  return result;
}

export const KanbanBoard = observer(function KanbanBoard({
  entries,
  hideProjectChips,
  onExpandDone,
}: KanbanBoardProps) {
  const buckets = useMemo(() => bucket(entries), [entries]);
  const store = getHomeStore();

  const activeEntries = buckets.todo.length + buckets.in_progress.length + buckets.review.length;
  const archivedEntries = buckets.done.length + buckets.cancelled.length;
  const showAllDoneHint = activeEntries === 0 && archivedEntries > 0;

  return (
    <div className="flex h-full flex-col">
      {showAllDoneHint && (
        <button
          type="button"
          onClick={() => {
            store.toggleColumnExpanded('done');
            onExpandDone?.();
          }}
          className="mx-2 mt-2 rounded-md border border-dashed border-border bg-background-1/40 px-3 py-1.5 text-left text-xs text-foreground-muted transition hover:bg-background-1 hover:text-foreground"
        >
          Nothing in progress. Show finished work →
        </button>
      )}
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-2">
        {COLUMNS.filter(
          (col) => store.filteredStatuses.size === 0 || store.filteredStatuses.has(col.status)
        ).map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            entries={buckets[col.status]}
            collapsible={col.collapsible}
            hideProjectChips={hideProjectChips}
          />
        ))}
      </div>
    </div>
  );
});
