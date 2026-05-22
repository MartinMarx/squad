import { useAppSettingsKey } from '@renderer/features/settings/use-app-settings-key';

export interface TaskSettingsModel {
  autoGenerateName: boolean;
  autoTrustWorktrees: boolean;
  autoRunSetupScript: boolean;
  createBranchAndWorktree: boolean;
  loading: boolean;
  saving: boolean;
  isFieldOverridden: (
    field:
      | 'autoGenerateName'
      | 'autoTrustWorktrees'
      | 'autoRunSetupScript'
      | 'createBranchAndWorktree'
  ) => boolean;
  updateAutoGenerateName: (next: boolean) => void;
  updateAutoTrustWorktrees: (next: boolean) => void;
  updateAutoRunSetupScript: (next: boolean) => void;
  updateCreateBranchAndWorktree: (next: boolean) => void;
  resetAutoGenerateName: () => void;
  resetAutoTrustWorktrees: () => void;
  resetAutoRunSetupScript: () => void;
  resetCreateBranchAndWorktree: () => void;
}

export function useTaskSettings(): TaskSettingsModel {
  const {
    value: tasks,
    isLoading: loading,
    isSaving: saving,
    isFieldOverridden,
    update,
    resetField,
  } = useAppSettingsKey('tasks');

  return {
    autoGenerateName: tasks?.autoGenerateName ?? false,
    autoTrustWorktrees: tasks?.autoTrustWorktrees ?? false,
    autoRunSetupScript: tasks?.autoRunSetupScript ?? true,
    createBranchAndWorktree: tasks?.createBranchAndWorktree ?? true,
    loading,
    saving,
    isFieldOverridden,
    updateAutoGenerateName: (next) => update({ autoGenerateName: next }),
    updateAutoTrustWorktrees: (next) => update({ autoTrustWorktrees: next }),
    updateAutoRunSetupScript: (next) => update({ autoRunSetupScript: next }),
    updateCreateBranchAndWorktree: (next) => update({ createBranchAndWorktree: next }),
    resetAutoGenerateName: () => resetField('autoGenerateName'),
    resetAutoTrustWorktrees: () => resetField('autoTrustWorktrees'),
    resetAutoRunSetupScript: () => resetField('autoRunSetupScript'),
    resetCreateBranchAndWorktree: () => resetField('createBranchAndWorktree'),
  };
}
