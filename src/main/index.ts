import { join } from 'node:path';
import { config as dotenvConfig } from 'dotenv';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import dockIcon from '@/assets/images/squad/icon-dock.png?asset';
import { PRODUCT_NAME } from '@shared/app-identity';
import { registerRPCRouter } from '@shared/ipc/rpc';
import { setupApplicationMenu } from './app/menu';
import { registerAppScheme, setupAppProtocol } from './app/protocol';
import { createMainWindow } from './app/window';
import { agentHookService } from './core/agent-hooks/agent-hook-service';
import { appService } from './core/app/service';
import { localDependencyManager } from './core/dependencies/dependency-manager';
import { editorBufferService } from './core/editor/editor-buffer-service';
import { gitWatcherRegistry } from './core/git/git-watcher-registry';
import { projectManager } from './core/projects/project-manager';
import { projectSettingsService } from './core/projects/settings/project-settings-service';
import { promptLibraryService } from './core/prompt-library/service';
import { prSyncScheduler } from './core/pull-requests/pr-sync-scheduler';
import {
  reconcileResourceSampler,
  stopResourceSampler,
} from './core/resource-monitor/resource-sampler';
import { searchService } from './core/search/search-service';
import { workspaceFileIndexService } from './core/search/workspace-file-index-service';
import { appSettingsService } from './core/settings/settings-service';
import { viewStateService } from './core/view-state/view-state-service';
import { initializeDatabase } from './db/initialize';
import { log } from './lib/logger';
import { rpcRouter } from './rpc';
import { resolveUserEnv } from './utils/userEnv';

if (import.meta.env.DEV) {
  dotenvConfig({ path: '.env.local', override: false });
}

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
}

registerAppScheme();

app.setName(PRODUCT_NAME);
app.setPath('userData', join(app.getPath('appData'), 'squad'));

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win?.isMinimized()) win.restore();
  win?.focus();
});

if (!import.meta.env.DEV && !app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

if (import.meta.env.DEV) {
  try {
    app.dock?.setIcon(dockIcon);
  } catch (err) {
    log.warn('Failed to set dock icon:', err);
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

void app.whenReady().then(async () => {
  await resolveUserEnv();

  try {
    await initializeDatabase();
    searchService.initialize();
    workspaceFileIndexService.initialize();
    void editorBufferService.pruneStale();
    try {
      viewStateService.pruneOrphans();
    } catch (e: unknown) {
      log.warn('view-state: failed to prune orphaned entries', { error: e });
    }
  } catch (error) {
    log.error('Failed to initialize database:', error);
    dialog.showErrorBox(
      'Database Initialization Failed',
      `${PRODUCT_NAME} could not start because the database failed to initialize.\n\n${error instanceof Error ? error.message : String(error)}`
    );
    app.quit();
    return;
  }

  gitWatcherRegistry.initialize();
  projectSettingsService.initialize();
  prSyncScheduler.initialize();
  appService.initialize();
  await appSettingsService.initialize();
  await promptLibraryService.initialize();

  agentHookService.initialize().catch((e) => {
    log.error('Failed to start agent event service:', e);
  });

  registerRPCRouter(rpcRouter, ipcMain);

  void reconcileResourceSampler();

  localDependencyManager.probeAll().catch((e) => {
    log.error('Failed to probe dependencies:', e);
  });

  setupAppProtocol(join(app.getAppPath(), 'out', 'renderer'));
  setupApplicationMenu();
  createMainWindow();
});

app.on('before-quit', (event) => {
  event.preventDefault();
  agentHookService.dispose();
  stopResourceSampler();
  prSyncScheduler.dispose();
  void gitWatcherRegistry.dispose();
  void projectManager.dispose().catch((e) => {
    log.error('Failed to shutdown project manager:', e);
  });
  app.exit(0);
});
