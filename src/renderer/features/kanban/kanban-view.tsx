import { observer } from 'mobx-react-lite';
import { createContext, useCallback, useContext, type ReactNode } from 'react';
import {
  getProjectManagerStore,
  projectDisplayName,
} from '@renderer/features/projects/stores/project-selectors';
import { Titlebar } from '@renderer/lib/components/titlebar/Titlebar';
import { useParams } from '@renderer/lib/layout/navigation-provider';
import { SearchInput } from '@renderer/lib/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/lib/ui/select';
import { KanbanBoard } from './kanban-board';

export type KanbanViewParams = {
  projectId?: string;
  searchQuery?: string;
};

const KanbanViewContext = createContext<{
  projectId?: string;
  searchQuery: string;
  onProjectChange: (projectId: string | undefined) => void;
  onSearchChange: (searchQuery: string) => void;
}>({
  searchQuery: '',
  onProjectChange: () => {},
  onSearchChange: () => {},
});

export function KanbanViewWrapper({
  children,
  projectId,
  searchQuery = '',
}: {
  children: ReactNode;
} & KanbanViewParams) {
  const { setParams } = useParams('kanban');

  const onProjectChange = useCallback(
    (nextProjectId: string | undefined) => {
      setParams({ projectId: nextProjectId, searchQuery });
    },
    [searchQuery, setParams]
  );

  const onSearchChange = useCallback(
    (nextSearchQuery: string) => {
      setParams({ projectId, searchQuery: nextSearchQuery });
    },
    [projectId, setParams]
  );

  return (
    <KanbanViewContext.Provider value={{ projectId, searchQuery, onProjectChange, onSearchChange }}>
      {children}
    </KanbanViewContext.Provider>
  );
}

function useKanbanViewContext() {
  const context = useContext(KanbanViewContext);
  if (!context) {
    throw new Error('useKanbanViewContext must be used within KanbanViewWrapper');
  }
  return context;
}

const KanbanProjectFilter = observer(function KanbanProjectFilter({
  projectId,
  onProjectChange,
}: {
  projectId?: string;
  onProjectChange: (projectId: string | undefined) => void;
}) {
  const projects = Array.from(getProjectManagerStore().projects.values())
    .map((project) => ({
      id: project.id,
      name: projectDisplayName(project) ?? 'Project',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Select
      value={projectId ?? 'all'}
      onValueChange={(value) => onProjectChange(!value || value === 'all' ? undefined : value)}
    >
      <SelectTrigger size="sm" className="w-44">
        <SelectValue placeholder="All projects" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All projects</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

export function KanbanTitlebar() {
  return (
    <Titlebar
      leftSlot={
        <div className="flex items-center px-2">
          <span className="text-sm text-foreground-muted">Kanban</span>
        </div>
      }
    />
  );
}

export function KanbanMainPanel() {
  const { projectId, searchQuery, onProjectChange, onSearchChange } = useKanbanViewContext();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background px-6 py-4">
      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
        <KanbanProjectFilter projectId={projectId} onProjectChange={onProjectChange} />
        <SearchInput
          placeholder="Search worktrees…"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="max-w-sm flex-1"
        />
      </div>
      <KanbanBoard projectId={projectId} searchQuery={searchQuery} />
    </div>
  );
}

export const kanbanView = {
  WrapView: KanbanViewWrapper,
  TitlebarSlot: KanbanTitlebar,
  MainPanel: KanbanMainPanel,
};
