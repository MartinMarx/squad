import { createRPCRouter } from '../shared/ipc/rpc';
import { accountController } from './core/account/controller';
import { appController } from './core/app/controller';
import { conversationController } from './core/conversations/controller';
import { dependenciesController } from './core/dependencies/controller';
import { editorBufferController } from './core/editor/controller';
import { filesController } from './core/fs/controller';
import { gitController } from './core/git/controller';
import { githubController } from './core/github/controller';
import { issueController } from './core/issues/controller';
import { linearController } from './core/linear/controller';
import { mcpController } from './core/mcp/controller';
import { notebookController } from './core/notebooks/controller';
import { projectController } from './core/projects/controller';
import { promptLibraryController } from './core/prompt-library/controller';
import { ptyController } from './core/pty/controller';
import { pullRequestController } from './core/pull-requests/controller';
import { repositoryController } from './core/repository/controller';
import { resourceMonitorController } from './core/resource-monitor/controller';
import { searchController } from './core/search/controller';
import { appSettingsController } from './core/settings/controller';
import { providerSettingsController } from './core/settings/provider-settings-controller';
import { skillsController } from './core/skills/controller';
import { taskController } from './core/tasks/controller';
import { terminalsController } from './core/terminals/controller';
import { viewStateController } from './core/view-state/controller';
import { workspaceController } from './core/workspaces/controller';
import { projectSettingsController } from './core/workspaces/project-settings-controller';
import { legacyPortController } from './db/legacy-port/controller';

export const rpcRouter = createRPCRouter({
  account: accountController,
  legacyPort: legacyPortController,
  app: appController,
  appSettings: appSettingsController,
  providerSettings: providerSettingsController,
  repository: repositoryController,
  fs: filesController,
  pty: ptyController,
  resourceMonitor: resourceMonitorController,
  github: githubController,
  issues: issueController,
  linear: linearController,
  promptLibrary: promptLibraryController,
  skills: skillsController,
  projects: projectController,
  tasks: taskController,
  conversations: conversationController,
  terminals: terminalsController,
  git: gitController,
  dependencies: dependenciesController,
  mcp: mcpController,
  notebooks: notebookController,
  editorBuffer: editorBufferController,
  pullRequests: pullRequestController,
  viewState: viewStateController,
  search: searchController,
  workspaces: workspaceController,
  projectSettings: projectSettingsController,
});

export type RpcRouter = typeof rpcRouter;
