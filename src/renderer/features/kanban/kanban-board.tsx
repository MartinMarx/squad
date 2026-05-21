import { observer } from 'mobx-react-lite';
import { KANBAN_COLUMNS } from '@renderer/features/kanban/kanban-column';
import { getProjectManagerStore } from '@renderer/features/projects/stores/project-selectors';
import { EmptyState } from '@renderer/lib/ui/empty-state';
import { KanbanCard } from './kanban-card';
import {
  collectKanbanEntries,
  filterKanbanEntries,
  groupKanbanEntriesByColumn,
} from './kanban-selectors';

export const KanbanBoard = observer(function KanbanBoard({
  projectId,
  searchQuery,
}: {
  projectId?: string;
  searchQuery?: string;
}) {
  const entries = collectKanbanEntries(getProjectManagerStore());
  const filtered = filterKanbanEntries(entries, { projectId, searchQuery });
  const grouped = groupKanbanEntriesByColumn(filtered);

  const totalCount = KANBAN_COLUMNS.reduce((sum, column) => sum + grouped[column.id].length, 0);

  if (totalCount === 0) {
    return (
      <EmptyState
        label="No worktrees"
        description={
          projectId || searchQuery?.trim()
            ? 'No active worktrees match your filters.'
            : 'Create a task to see it on the board.'
        }
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((column) => {
        const cards = grouped[column.id];
        return (
          <section
            key={column.id}
            className="flex w-72 min-w-72 shrink-0 flex-col rounded-lg bg-background-tertiary/40"
          >
            <header className="flex items-center justify-between px-3 py-2.5">
              <h2 className="text-xs font-medium tracking-wide text-foreground-muted uppercase">
                {column.label}
              </h2>
              <span className="rounded-full bg-background-2 px-2 py-0.5 text-[11px] text-foreground-passive tabular-nums">
                {cards.length}
              </span>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {cards.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-foreground-passive">
                  No worktrees
                </p>
              ) : (
                cards.map((entry) => (
                  <KanbanCard key={`${entry.projectId}:${registeredTaskId(entry)}`} entry={entry} />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
});

function registeredTaskId(entry: { task: { data: { id: string } } }) {
  return entry.task.data.id;
}
