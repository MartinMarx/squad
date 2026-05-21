import { useQuery } from '@tanstack/react-query';
import { useTaskSettings } from '@renderer/features/tasks/hooks/useTaskSettings';
import { rpc } from '@renderer/lib/ipc';
import { type Branch } from '@shared/git';
import { useBranchName } from './use-branch-name';
import { useBranchSelection } from './use-branch-selection';
import { useTaskName } from './use-task-name';

export type FromBranchModeState = ReturnType<typeof useFromBranchMode>;

export function useFromBranchMode(
  selectedProjectId: string | undefined,
  defaultBranch: Branch | undefined,
  isUnborn: boolean,
  currentBranchName?: string | null
) {
  const { createBranchAndWorktree: createBranchAndWorktreeByDefault } = useTaskSettings();
  const branchSelection = useBranchSelection(
    selectedProjectId,
    defaultBranch,
    isUnborn,
    currentBranchName,
    createBranchAndWorktreeByDefault
  );
  const { createBranchAndWorktree } = branchSelection;

  const {
    data: pickedPhilosopher,
    isPending: isPickingPhilosopher,
    isError: pickPhilosopherFailed,
  } = useQuery({
    queryKey: ['pickPhilosopherName', selectedProjectId, createBranchAndWorktree],
    queryFn: async () => {
      const result = await rpc.tasks.pickPhilosopherName({ projectId: selectedProjectId! });
      if ('type' in result) {
        throw new Error(
          result.type === 'project-not-found'
            ? 'Project not found'
            : 'No philosopher names are available for this repository'
        );
      }
      return result;
    },
    enabled: createBranchAndWorktree && !!selectedProjectId,
    refetchOnWindowFocus: false,
  });

  const taskName = useTaskName({
    generatedName: createBranchAndWorktree ? pickedPhilosopher?.slug : undefined,
    isPending: createBranchAndWorktree && isPickingPhilosopher,
    resetKey: `${selectedProjectId}:${createBranchAndWorktree}`,
  });

  const branchNameState = useBranchName({
    taskName: taskName.taskName,
    fixedBranchName: createBranchAndWorktree ? pickedPhilosopher?.branchName : undefined,
    projectId: selectedProjectId,
    resetKey: `${selectedProjectId}:${createBranchAndWorktree}:${pickedPhilosopher?.slug ?? ''}`,
  });

  const isValid =
    taskName.taskName.trim().length > 0 &&
    branchNameState.branchName.trim().length > 0 &&
    branchSelection.selectedBranch !== undefined &&
    !taskName.isPending &&
    !(createBranchAndWorktree && pickPhilosopherFailed);

  return {
    ...branchSelection,
    ...taskName,
    ...branchNameState,
    isValid,
    usesAutoAssignedName: createBranchAndWorktree,
  };
}
