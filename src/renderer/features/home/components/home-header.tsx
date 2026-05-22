import { FolderOpen, Github, ListFilter, Plus, X } from 'lucide-react';
import { observer, useObserver } from 'mobx-react-lite';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { Button } from '@renderer/lib/ui/button';
import { Checkbox } from '@renderer/lib/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/lib/ui/popover';
import { cn } from '@renderer/utils/utils';
import type { TaskLifecycleStatus } from '@shared/tasks';
import { getHomeStore } from '../stores/home-store';
import { ProjectChip } from './project-chip';

const STATUS_OPTIONS: { value: TaskLifecycleStatus; label: string }[] = [
  { value: 'todo', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Top header for the home dashboard.
 *
 * Left: project filter (multi-select, persisted) + status filter (multi-select,
 * session-only). Each filter shows the active count when narrowed.
 *
 * Right: quick actions to open / create / clone projects, plus "New Task" is
 * routed through the AddProject modal because home is project-agnostic
 * (a task always belongs to a project — let the user pick first).
 */
type HomeHeaderProps = {
  onCreateTask?: () => void;
};

export const HomeHeader = observer(function HomeHeader({ onCreateTask }: HomeHeaderProps) {
  const showAddProjectModal = useShowModal('addProjectModal');

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <h1 className="text-sm font-semibold text-foreground">Home</h1>
      <span className="ml-1 text-xs text-foreground-muted">Everything at a glance</span>

      <div className="ml-4 flex items-center gap-1.5">
        <ProjectFilterChip />
        <StatusFilterChip />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => showAddProjectModal({ mode: 'pick' })}>
          <FolderOpen className="size-3.5" />
          Open project
        </Button>
        <Button variant="outline" size="sm" onClick={() => showAddProjectModal({ mode: 'clone' })}>
          <Github className="size-3.5" />
          Clone
        </Button>
        {onCreateTask && (
          <Button variant="default" size="sm" onClick={onCreateTask}>
            <Plus className="size-3.5" />
            New task
          </Button>
        )}
      </div>
    </header>
  );
});

const ProjectFilterChip = observer(function ProjectFilterChip() {
  const store = getHomeStore();
  const projects = useObserver(() => store.projects());
  const selectedCount = store.activeProjectFilterCount;
  const isFiltered = selectedCount > 0;

  if (projects.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition',
          isFiltered
            ? 'border-border-primary bg-background-info text-foreground-info'
            : 'border-border bg-background text-foreground-muted hover:bg-background-1 hover:text-foreground'
        )}
      >
        <ListFilter className="size-3" />
        Projects
        {isFiltered && (
          <span className="rounded-full bg-foreground-info/20 px-1.5 py-0.5 text-[10px] font-semibold">
            {selectedCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="text-xs font-medium text-foreground-muted">Filter projects</span>
          {isFiltered && (
            <button
              type="button"
              onClick={() => store.clearProjectFilter()}
              className="inline-flex items-center gap-1 text-[11px] text-foreground-muted hover:text-foreground"
            >
              <X className="size-3" />
              Clear
            </button>
          )}
        </div>
        <div className="flex max-h-72 flex-col overflow-y-auto">
          {projects.map((project) => {
            const checked = store.filteredProjectIds.has(project.id);
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => store.toggleProjectFilter(project.id)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-background-1"
              >
                <Checkbox checked={checked} tabIndex={-1} />
                <ProjectChip projectId={project.id} projectName={project.name} />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});

const StatusFilterChip = observer(function StatusFilterChip() {
  const store = getHomeStore();
  const selectedCount = store.activeStatusFilterCount;
  const isFiltered = selectedCount > 0;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition',
          isFiltered
            ? 'border-border-primary bg-background-info text-foreground-info'
            : 'border-border bg-background text-foreground-muted hover:bg-background-1 hover:text-foreground'
        )}
      >
        <ListFilter className="size-3" />
        Status
        {isFiltered && (
          <span className="rounded-full bg-foreground-info/20 px-1.5 py-0.5 text-[10px] font-semibold">
            {selectedCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="text-xs font-medium text-foreground-muted">Filter status</span>
          {isFiltered && (
            <button
              type="button"
              onClick={() => store.clearStatusFilter()}
              className="inline-flex items-center gap-1 text-[11px] text-foreground-muted hover:text-foreground"
            >
              <X className="size-3" />
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col">
          {STATUS_OPTIONS.map((opt) => {
            const checked = store.filteredStatuses.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => store.toggleStatusFilter(opt.value)}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-background-1"
              >
                <Checkbox checked={checked} tabIndex={-1} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});
