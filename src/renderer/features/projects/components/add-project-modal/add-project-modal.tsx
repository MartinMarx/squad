import { useQuery } from '@tanstack/react-query';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import {
  getProjectManagerStore,
  getProjectSettingsStore,
} from '@renderer/features/projects/stores/project-selectors';
import { useAppSettingsKey } from '@renderer/features/settings/use-app-settings-key';
import { toast } from '@renderer/lib/hooks/use-toast';
import { rpc } from '@renderer/lib/ipc';
import { useNavigate } from '@renderer/lib/layout/navigation-provider';
import { useShowModal, type BaseModalProps } from '@renderer/lib/modal/modal-provider';
import { useGithubContext } from '@renderer/lib/providers/github-context-provider';
import { ConfirmButton } from '@renderer/lib/ui/confirm-button';
import {
  DialogContentArea,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/lib/ui/dialog';
import { ModalLayout } from '@renderer/lib/ui/modal-layout';
import { ToggleGroup, ToggleGroupItem } from '@renderer/lib/ui/toggle-group';
import { log } from '@renderer/utils/logger';
import { ClonePanel, CreateNewPanel, PickExistingPanel } from './content';
import { useCloneMode, useNewMode, usePickMode } from './modes';

export type Mode = 'pick' | 'new' | 'clone';

export interface BaseModeData {
  name: string;
  path: string;
  initGitRepository?: boolean;
}

export interface NewModeData extends BaseModeData {
  repositoryName: string;
  repositoryOwner: string;
  repositoryVisibility: 'public' | 'private';
}

export interface CloneModeData extends BaseModeData {
  repositoryUrl: string;
}

export type ModeData = BaseModeData | NewModeData | CloneModeData;

export interface AddProjectModalProps extends BaseModalProps<void> {
  mode?: Mode;
}

export const AddProjectModal = observer(function AddProjectModal({
  mode: modeProp,
  onClose,
}: AddProjectModalProps) {
  const [mode, setMode] = useState<Mode>(modeProp ?? 'pick');

  const { navigate } = useNavigate();
  const { isInitialized, needsGhAuth } = useGithubContext();

  const showProjectConfigImportModal = useShowModal('projectConfigImportModal');

  const maybeShowProjectConfigImportPrompt = async (projectId: string) => {
    const projectManager = getProjectManagerStore();
    await projectManager.mountProject(projectId).catch((error) => {
      log.error(error);
    });

    const settingsStore = getProjectSettingsStore(projectId);
    if (!settingsStore) return;

    await settingsStore.load();
    if (!settingsStore.shouldPromptConfigMigration) return;

    const migrations = settingsStore.configMigrations ?? [];
    if (migrations.length === 0) return;

    showProjectConfigImportModal({
      migrations,
      migrateProjectConfig: (request) => settingsStore.migrateProjectConfig(request),
      onSuccess: ({ migration }) => {
        toast({
          title: `${migration.label} config imported`,
          description: `${migration.files.join(', ')} was imported successfully.`,
        });
      },
    });
  };

  const { value: localProjectSettings } = useAppSettingsKey('localProject');
  const defaultPath = localProjectSettings?.defaultProjectsDirectory ?? '';

  const pickState = usePickMode();
  const newState = useNewMode(defaultPath);
  const cloneState = useCloneMode(defaultPath);
  const showGithubAuthDisclaimer = mode === 'new' && isInitialized && needsGhAuth;

  const activeMode = { pick: pickState, new: newState, clone: cloneState }[mode];
  const shouldCheckPickPathStatus = mode === 'pick' && pickState.path.trim().length > 0;
  const pickPathStatusQuery = useQuery({
    queryKey: ['projectPathStatus', pickState.path],
    queryFn: () => rpc.projects.inspectProjectPath({ type: 'local', path: pickState.path }),
    enabled: shouldCheckPickPathStatus,
  });
  const requiresGitInitialization =
    mode === 'pick' &&
    pickPathStatusQuery.data?.isDirectory === true &&
    pickPathStatusQuery.data.isGitRepo === false;
  const isCheckingPickPathStatus = shouldCheckPickPathStatus && pickPathStatusQuery.isPending;

  const canCreate =
    activeMode.isValid &&
    !isCheckingPickPathStatus &&
    (!requiresGitInitialization || pickState.initGitRepository);

  const handleSubmit = async () => {
    try {
      const inspection = await rpc.projects.inspectProjectPath({
        type: 'local',
        path: pickState.path,
      });
      if (inspection.existingProject) {
        navigate('project', { projectId: inspection.existingProject.id });
        onClose();
        return;
      }
    } catch (e) {
      log.error(e);
    }

    const id = crypto.randomUUID();

    let createPromise: Promise<string | undefined>;
    switch (mode) {
      case 'pick':
        createPromise = getProjectManagerStore().createProject(
          {
            mode: 'pick',
            name: pickState.name,
            path: pickState.path,
            initGitRepository: pickState.initGitRepository,
          },
          id
        );
        break;
      case 'new':
        createPromise = getProjectManagerStore().createProject(
          {
            mode: 'new',
            name: newState.name,
            path: newState.path,
            repositoryName: newState.repositoryName,
            repositoryOwner: newState.repositoryOwner?.value ?? '',
            repositoryVisibility: newState.repositoryVisibility,
          },
          id
        );
        break;
      case 'clone':
        createPromise = getProjectManagerStore().createProject(
          {
            mode: 'clone',
            name: cloneState.name,
            path: cloneState.path,
            repositoryUrl: cloneState.repositoryUrl,
          },
          id
        );
        break;
    }
    void createPromise
      .then((createdProjectId) => {
        if (createdProjectId === id) void maybeShowProjectConfigImportPrompt(createdProjectId);
      })
      .catch((error) => {
        log.error(error);
      });
    onClose();
    navigate('project', { projectId: id });
  };

  return (
    <ModalLayout
      header={
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
        </DialogHeader>
      }
      footer={
        <DialogFooter>
          <ConfirmButton type="button" onClick={() => void handleSubmit()} disabled={!canCreate}>
            Create
          </ConfirmButton>
        </DialogFooter>
      }
    >
      <DialogContentArea data-autofocus tabIndex={-1} className="gap-4">
        <ToggleGroup
          className="w-full"
          value={[mode]}
          onValueChange={([value]) => {
            if (value) setMode(value as Mode);
          }}
        >
          <ToggleGroupItem value="pick" className="flex-1">
            Pick
          </ToggleGroupItem>
          <ToggleGroupItem value="new" className="flex-1">
            New
          </ToggleGroupItem>
          <ToggleGroupItem value="clone" className="flex-1">
            Clone
          </ToggleGroupItem>
        </ToggleGroup>
        {mode === 'pick' && (
          <PickExistingPanel
            state={pickState}
            showInitializeGitPrompt={requiresGitInitialization}
          />
        )}
        {mode === 'new' && (
          <CreateNewPanel
            state={newState}
            showGithubAuthDisclaimer={showGithubAuthDisclaimer}
            onOpenAccountSettings={() => navigate('settings', { tab: 'account' })}
          />
        )}
        {mode === 'clone' && <ClonePanel state={cloneState} />}
      </DialogContentArea>
    </ModalLayout>
  );
});
