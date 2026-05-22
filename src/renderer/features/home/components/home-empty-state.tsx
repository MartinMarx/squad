import { FolderOpen, Github, Plus, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { EmdashShimmerLogo } from '@renderer/lib/emdash-shimmer-logo';
import { useArrowKeyNavigation } from '@renderer/lib/hooks/use-arrow-key-navigation';
import { useTheme } from '@renderer/lib/hooks/useTheme';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { ActionListItem } from '@renderer/lib/ui/action-list-item';

const PROJECT_ACTIONS = [
  {
    label: 'Open project',
    description: 'Create a project from an existing local directory',
    icon: FolderOpen,
    modalArgs: { mode: 'pick' as const },
  },
  {
    label: 'Create repository',
    description: 'Create a project by creating a new repository on GitHub',
    icon: Plus,
    modalArgs: { mode: 'new' as const },
  },
  {
    label: 'Clone from GitHub',
    description: 'Clone a GitHub repository to work on locally',
    icon: Github,
    modalArgs: { mode: 'clone' as const },
  },
] as const;

/**
 * Cold-start welcome view shown when the user has zero registered projects.
 * Preserves the original three-action layout from the legacy home view.
 */
export function ZeroProjectsEmptyState() {
  const showAddProjectModal = useShowModal('addProjectModal');
  const { selectedIndex, setSelectedIndex } = useArrowKeyNavigation(
    PROJECT_ACTIONS.length,
    (index) => showAddProjectModal(PROJECT_ACTIONS[index].modalArgs)
  );
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'emdark';

  return (
    <motion.div
      className="flex h-full flex-col overflow-y-auto bg-background text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="container mx-auto flex min-h-full max-w-6xl flex-1 flex-col justify-center px-8 py-8">
        <div className="mb-3 text-center">
          <div className="mb-3 flex items-center justify-center">
            <EmdashShimmerLogo
              height={32}
              color={isDark ? 'var(--color-background-2)' : 'var(--color-foreground)'}
              shimmerColor={isDark ? 'white' : 'var(--color-foreground-passive)'}
            />
          </div>
          <p className="text-sm text-foreground-muted">
            Welcome — add a project to see everything at a glance.
          </p>
        </div>
        <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-1">
          {PROJECT_ACTIONS.map((action, i) => (
            <HomeEmptyAction
              key={action.label}
              label={action.label}
              description={action.description}
              icon={action.icon}
              isSelected={i === selectedIndex}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => showAddProjectModal(action.modalArgs)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function HomeEmptyAction({
  label,
  description,
  icon,
  isSelected,
  onClick,
  onMouseEnter,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <ActionListItem
      label={label}
      description={description}
      icon={icon}
      isSelected={isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    />
  );
}

/**
 * Mid-state empty: at least one project exists but no tasks. Renders an
 * inline CTA over the kanban frame.
 */
export function NoTasksHint({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <div className="m-2 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background-1/40 px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">No tasks yet.</p>
      <p className="text-xs text-foreground-muted">
        Tasks are work units in your projects — branches, conversations, and worktrees.
      </p>
      <button
        type="button"
        onClick={onCreateTask}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary-button-background px-3 py-1.5 text-xs font-medium text-primary-button-foreground transition hover:bg-primary-button-background-hover"
      >
        <Plus className="size-3.5" />
        Create your first task
      </button>
    </div>
  );
}
