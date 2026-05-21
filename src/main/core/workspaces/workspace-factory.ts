import { eq } from 'drizzle-orm';
import { LocalConversationProvider } from '@main/core/conversations/impl/local-conversation';
import type { ConversationProvider } from '@main/core/conversations/types';
import { GitHubAuthExecutionContext } from '@main/core/execution-context/github-auth-execution-context';
import { LocalExecutionContext } from '@main/core/execution-context/local-execution-context';
import { LocalFileSystem } from '@main/core/fs/impl/local-fs';
import { GitFetchService } from '@main/core/git/git-fetch-service';
import { GitService } from '@main/core/git/impl/git-service';
import { GitRepositoryService } from '@main/core/git/repository-service';
import { githubConnectionService } from '@main/core/github/services/github-connection-service';
import { workspaceFileIndexService } from '@main/core/search/workspace-file-index-service';
import { LocalTerminalProvider } from '@main/core/terminals/impl/local-terminal-provider';
import type { TerminalProvider } from '@main/core/terminals/terminal-provider';
import type { Workspace } from '@main/core/workspaces/workspace';
import { LifecycleScriptService } from '@main/core/workspaces/workspace-lifecycle-service';
import { type WorkspaceFactoryResult } from '@main/core/workspaces/workspace-registry';
import { db } from '@main/db/client';
import { workspaces as workspacesTable } from '@main/db/schema';
import { log } from '@main/lib/logger';
import { getTaskEnvVars } from '@shared/task/envVars';
import type { Task } from '@shared/tasks';
import { getEffectiveTaskSettings } from '../projects/settings/effective-task-settings';
import type { ProjectSettingsProvider } from '../projects/settings/provider';
import { TimeoutSignal, withTimeout } from '../projects/utils';
import { TEARDOWN_SCRIPT_WAIT_MS } from '../tasks/provision-task-error';

export type WorkspaceType = { kind: 'local' };

type WorkspaceFactoryContext = {
  task: Pick<Task, 'id' | 'name'>;
  workDir: string;
  projectId: string;
  projectPath: string;
  settings: ProjectSettingsProvider;
  logPrefix: string;
  /** Inject an existing repository service (e.g. the project-level singleton).
   *  When absent, the factory creates a fresh instance from the workspace's GitService. */
  repository?: GitRepositoryService;
  /** Inject an existing fetch service. When absent, the factory creates and manages one.
   *  Lifecycle (start/stop) is only managed by the factory when it creates the instance. */
  fetchService?: GitFetchService;
  extraHooks?: {
    onCreate?: (ws: Workspace) => Promise<void>;
    onDestroy?: (ws: Workspace) => Promise<void>;
    onDetach?: (ws: Workspace) => Promise<void>;
  };
};

/**
 * Returns a factory function suitable for passing to `WorkspaceRegistry.acquire`.
 * Handles workspace construction and wires lifecycle script hooks.
 * Provider-specific hooks (e.g. git watcher) are passed via `extraHooks`.
 */
export function createWorkspaceFactory(
  workspaceId: string,
  type: WorkspaceType,
  context: WorkspaceFactoryContext
): () => Promise<WorkspaceFactoryResult> {
  return async () => {
    const workDir = context.workDir;

    const workspaceFs = new LocalFileSystem(workDir);
    const ctx = new LocalExecutionContext();

    const projectSettings = await context.settings.get();
    const defaultBranch = await context.settings.getDefaultBranch();
    const bootstrapTaskEnvVars = getTaskEnvVars({
      taskId: context.task.id,
      taskName: context.task.name,
      taskPath: workDir,
      projectPath: context.projectPath,
      defaultBranch,
      portSeed: workDir,
    });
    const tmuxEnabled = projectSettings.tmux ?? false;
    const taskLevelSettings = await getEffectiveTaskSettings({
      projectSettings: context.settings,
      taskFs: workspaceFs,
    });
    const shellSetup = taskLevelSettings.shellSetup ?? projectSettings.shellSetup;
    const scripts = taskLevelSettings.scripts;

    const workspaceTerminals = new LocalTerminalProvider({
      projectId: context.projectId,
      scopeId: workspaceId,
      taskPath: workDir,
      tmux: tmuxEnabled,
      shellSetup,
      ctx,
      taskEnvVars: bootstrapTaskEnvVars,
    });

    const lifecycleService = new LifecycleScriptService({
      projectId: context.projectId,
      workspaceId,
      terminals: workspaceTerminals,
    });

    const baseGitCtx = new LocalExecutionContext({ root: workDir });
    const authGitCtx = new GitHubAuthExecutionContext(baseGitCtx, () =>
      githubConnectionService.getToken()
    );
    const gitService = new GitService(baseGitCtx, authGitCtx, workspaceFs);

    const repository = context.repository ?? new GitRepositoryService(gitService, context.settings);

    const ownsFetchService = !context.fetchService;
    const fetchService =
      context.fetchService ??
      new GitFetchService(
        gitService,
        async () => (await githubConnectionService.getToken()) !== null,
        () => repository.getBaseRemote()
      );

    const workspace: Workspace = {
      id: workspaceId,
      path: workDir,
      fs: workspaceFs,
      git: gitService,
      settings: context.settings,
      lifecycleService,
      repository,
      fetchService,
    };

    const { logPrefix } = context;

    return {
      workspace,

      onCreateSideEffect: (ws) => {
        ws.git.on('status:updated', async (status) => {
          let unstagedAdded = 0;
          let unstagedDeleted = 0;
          for (const c of status.unstaged) {
            unstagedAdded += c.additions;
            unstagedDeleted += c.deletions;
          }
          try {
            await db
              .update(workspacesTable)
              .set({
                linesAdded: status.totalAdded + unstagedAdded,
                linesDeleted: status.totalDeleted + unstagedDeleted,
              })
              .where(eq(workspacesTable.id, workspaceId));
          } catch (e) {
            log.warn('Failed to cache workspace git stats', { workspaceId, error: String(e) });
          }
        });

        if (ownsFetchService) {
          fetchService.start();
        }
        void workspaceFileIndexService.onWorkspaceCreated(workspaceId, ws);
        if (scripts?.setup) {
          void ws.lifecycleService.prepareAndRunLifecycleScript({
            type: 'setup',
            script: scripts.setup,
            shellSetup,
          });
        }
        if (scripts?.run) {
          void ws.lifecycleService.prepareLifecycleScript({
            type: 'run',
            script: scripts.run,
            shellSetup,
          });
        }
        if (scripts?.teardown) {
          void ws.lifecycleService.prepareLifecycleScript({
            type: 'teardown',
            script: scripts.teardown,
            shellSetup,
          });
        }
      },

      onCreate: context.extraHooks?.onCreate,

      onDestroy: async (ws) => {
        if (ownsFetchService) {
          fetchService.stop();
        }
        workspaceFileIndexService.onWorkspaceDestroyed(workspaceId);
        const latestTaskSettings = await getEffectiveTaskSettings({
          projectSettings: context.settings,
          taskFs: ws.fs,
        });
        const latestProjectSettings = await context.settings.get();
        const latestShellSetup = latestTaskSettings.shellSetup ?? latestProjectSettings.shellSetup;
        const teardownScript = latestTaskSettings.scripts?.teardown;

        if (teardownScript) {
          try {
            await withTimeout(
              ws.lifecycleService.runLifecycleScript(
                { type: 'teardown', script: teardownScript, shellSetup: latestShellSetup },
                { waitForExit: true, exit: true }
              ),
              TEARDOWN_SCRIPT_WAIT_MS
            );
          } catch (error) {
            if (error instanceof TimeoutSignal) {
              log.debug(`${logPrefix}: teardown script wait timed out`, {
                workspaceId,
                timeoutMs: TEARDOWN_SCRIPT_WAIT_MS,
              });
            } else {
              log.warn(`${logPrefix}: teardown script failed (continuing cleanup)`, {
                workspaceId,
                error: String(error),
              });
            }
          }
        }
        await context.extraHooks?.onDestroy?.(ws);
      },

      onDetach: async (ws) => {
        await context.extraHooks?.onDetach?.(ws);
      },
    };
  };
}

type TaskProviderOpts = {
  projectId: string;
  taskId: string;
  taskPath: string;
  tmuxEnabled: boolean;
  shellSetup?: string;
  taskEnvVars: Record<string, string>;
};

/**
 * Creates task-scoped conversation and terminal providers.
 */
export function buildTaskProviders(
  _type: WorkspaceType,
  opts: TaskProviderOpts
): { conversations: ConversationProvider; terminals: TerminalProvider } {
  const ctx = new LocalExecutionContext();
  return {
    conversations: new LocalConversationProvider({
      projectId: opts.projectId,
      taskPath: opts.taskPath,
      taskId: opts.taskId,
      tmux: opts.tmuxEnabled,
      shellSetup: opts.shellSetup,
      ctx,
      taskEnvVars: opts.taskEnvVars,
    }),
    terminals: new LocalTerminalProvider({
      projectId: opts.projectId,
      scopeId: opts.taskId,
      taskPath: opts.taskPath,
      tmux: opts.tmuxEnabled,
      shellSetup: opts.shellSetup,
      ctx,
      taskEnvVars: opts.taskEnvVars,
    }),
  };
}

/**
 * Resolves the task-level environment variables and settings from an already-acquired workspace.
 * Used by providers after `workspaceRegistry.acquire` to avoid duplicating settings reads.
 */
export async function resolveTaskEnv(
  task: Pick<Task, 'id' | 'name'>,
  workspace: Pick<Workspace, 'path' | 'fs'>,
  projectPath: string,
  settings: ProjectSettingsProvider
): Promise<{
  taskEnvVars: Record<string, string>;
  tmuxEnabled: boolean;
  shellSetup?: string;
}> {
  const projectSettings = await settings.get();
  const defaultBranch = await settings.getDefaultBranch();
  const taskLevelSettings = await getEffectiveTaskSettings({
    projectSettings: settings,
    taskFs: workspace.fs,
  });
  return {
    taskEnvVars: getTaskEnvVars({
      taskId: task.id,
      taskName: task.name,
      taskPath: workspace.path,
      projectPath,
      defaultBranch,
      portSeed: workspace.path,
    }),
    tmuxEnabled: projectSettings.tmux ?? false,
    shellSetup: taskLevelSettings.shellSetup ?? projectSettings.shellSetup,
  };
}
