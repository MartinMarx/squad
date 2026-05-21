import { projectManager } from '@main/core/projects/project-manager';
import { appSettingsService } from '@main/core/settings/settings-service';
import { PHILOSOPHER_CATALOG } from '@shared/philosophers/catalog';
import { pickPhilosopher, shufflePhilosophers } from '@shared/philosophers/pickPhilosopher';
import type { PickedPhilosopher } from '@shared/philosophers/types';

export type PickPhilosopherNameError =
  | { type: 'project-not-found' }
  | { type: 'no-philosopher-available' };

export async function pickPhilosopherName(params: {
  projectId: string;
}): Promise<PickedPhilosopher | PickPhilosopherNameError> {
  const project = projectManager.getProject(params.projectId);
  if (!project) {
    return { type: 'project-not-found' };
  }

  const [localBranchesPayload, projectSettings] = await Promise.all([
    project.repository.getLocalBranchesPayload(),
    appSettingsService.get('project'),
  ]);

  const takenBranchNames = new Set(
    localBranchesPayload.localBranches.map((branch) => branch.branch)
  );
  const branchPrefix = projectSettings.branchPrefix ?? '';
  const order = shufflePhilosophers(PHILOSOPHER_CATALOG);

  const result = pickPhilosopher({
    catalog: PHILOSOPHER_CATALOG,
    takenBranchNames,
    branchPrefix,
    order,
  });

  if ('type' in result) {
    return result;
  }

  return result;
}
