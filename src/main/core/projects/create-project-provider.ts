import fs from 'node:fs';
import path from 'node:path';
import { GitHubAuthExecutionContext } from '@main/core/execution-context/github-auth-execution-context';
import { LocalExecutionContext } from '@main/core/execution-context/local-execution-context';
import { LocalFileSystem } from '@main/core/fs/impl/local-fs';
import type { FileSystemProvider } from '@main/core/fs/types';
import { GitFetchService } from '@main/core/git/git-fetch-service';
import { GitService } from '@main/core/git/impl/git-service';
import { GitRepositoryService } from '@main/core/git/repository-service';
import { githubConnectionService } from '@main/core/github/services/github-connection-service';
import { safePathSegment } from '@shared/path-name';
import type { LocalProject } from '@shared/projects';
import { ProjectProvider, type ProjectProviderTransport } from './project-provider';
import type { ProjectSettingsProvider } from './settings/provider';
import { LocalProjectSettingsProvider } from './settings/providers/local-project-settings-provider';
import { LocalWorktreeHost } from './worktrees/hosts/local-worktree-host';
import type { WorktreeHost } from './worktrees/hosts/worktree-host';
import { WorktreeService } from './worktrees/worktree-service';

const hasGitHubToken = async (): Promise<boolean> =>
  (await githubConnectionService.getToken()) !== null;

export async function createProvider(project: LocalProject): Promise<ProjectProvider> {
  const localFs = new LocalFileSystem(project.path);
  const baseCtx = new LocalExecutionContext({ root: project.path });
  const authCtx = new GitHubAuthExecutionContext(baseCtx, () => githubConnectionService.getToken());
  const ctx = baseCtx;
  const repoGit = new GitService(ctx, authCtx, localFs);

  const settings = new LocalProjectSettingsProvider(project.id, project.path, project.baseRef, {
    git: repoGit,
  });
  const worktreeDirectory = await settings.getWorktreeDirectory();
  await fs.promises.mkdir(worktreeDirectory, { recursive: true });
  const worktreePoolPath = path.join(worktreeDirectory, safePathSegment(project.name, project.id));
  const worktreeHost = await LocalWorktreeHost.create({
    allowedRoots: [project.path, worktreeDirectory],
  });

  return buildProvider(
    project.id,
    project.path,
    { kind: 'local', defaultWorkspaceType: { kind: 'local' }, ctx, authCtx },
    localFs,
    repoGit,
    settings,
    worktreeHost,
    worktreePoolPath,
    () => {}
  );
}

function buildProvider(
  projectId: string,
  repoPath: string,
  transportMeta: Pick<
    ProjectProviderTransport,
    'kind' | 'defaultWorkspaceType' | 'ctx' | 'authCtx'
  >,
  projectFs: FileSystemProvider,
  repoGit: GitService,
  settings: ProjectSettingsProvider,
  worktreeHost: WorktreeHost,
  worktreePoolPath: string,
  dispose: () => void
): ProjectProvider {
  const { ctx } = transportMeta;

  const transport: ProjectProviderTransport = {
    ...transportMeta,
    fs: projectFs,
    settings,
    worktreeHost,
    worktreePoolPath,
  };

  const repository = new GitRepositoryService(repoGit, settings);
  const worktreeService = new WorktreeService({
    worktreePoolPath,
    repoPath,
    projectSettings: settings,
    ctx,
    host: worktreeHost,
  });
  const gitFetchService = new GitFetchService(repoGit, hasGitHubToken, () =>
    repository.getBaseRemote()
  );
  gitFetchService.start();

  return new ProjectProvider(
    projectId,
    repoPath,
    transport,
    repository,
    worktreeService,
    gitFetchService,
    dispose
  );
}
