import type {
  CreateProjectParams,
  InspectProjectPathParams,
  LocalProject,
  ProjectPathInspection,
} from '@shared/projects';
import { createLocalProject, getLocalProjectPathStatus } from './create-local-project';
import { getLocalProjectByPath } from './getProjects';

export async function createProject(params: CreateProjectParams): Promise<LocalProject> {
  const { type: _type, ...localParams } = params;
  return createLocalProject(localParams);
}

export async function inspectProjectPath(
  params: InspectProjectPathParams
): Promise<ProjectPathInspection> {
  const [status, existingProject] = await Promise.all([
    getLocalProjectPathStatus(params.path),
    getLocalProjectByPath(params.path),
  ]);
  return { ...status, existingProject };
}
