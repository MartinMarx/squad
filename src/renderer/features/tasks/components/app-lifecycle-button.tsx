import { Loader2, Play, Square, Wrench } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import type {
  LifecycleScriptStore,
  ScriptType,
} from '@renderer/features/tasks/stores/lifecycle-scripts';
import { useWorkspace, useWorkspaceId } from '@renderer/features/tasks/task-view-context';
import { rpc } from '@renderer/lib/ipc';
import { Button } from '@renderer/lib/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/lib/ui/tooltip';

function findScript(
  scripts: Iterable<LifecycleScriptStore>,
  type: ScriptType
): LifecycleScriptStore | undefined {
  for (const script of scripts) {
    if (script.data.type === type) return script;
  }
  return undefined;
}

export const AppLifecycleButton = observer(function AppLifecycleButton({
  projectId,
}: {
  projectId: string;
}) {
  const workspace = useWorkspace();
  const workspaceId = useWorkspaceId();
  const lifecycle = workspace.lifecycleScripts;

  // Touch tabs to trigger lazy load of the scripts map.
  void lifecycle.tabs;

  const setupScript = findScript(lifecycle.scripts.values(), 'setup');
  const runScript = findScript(lifecycle.scripts.values(), 'run');

  if (!setupScript && !runScript) return null;

  const runScriptId = runScript?.data.id;
  const setupScriptId = setupScript?.data.id;

  const handleRunScript = (script: LifecycleScriptStore) => {
    if (script.isRunning) return;
    script.markRunning();
    void rpc.terminals
      .runLifecycleScript({
        projectId,
        workspaceId,
        type: script.data.type,
      })
      .catch(() => {
        script.markExited();
      });
  };

  const handleStopScript = (script: LifecycleScriptStore) => {
    if (!script.isRunning) return;
    script.markExited();
    void rpc.pty.kill(script.session.sessionId);
  };

  // Setup currently running → disabled spinner
  if (setupScript?.isRunning) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Button variant="outline" size="xs" disabled>
            <Loader2 className="size-3 animate-spin" />
            Setting up…
          </Button>
        </TooltipTrigger>
        <TooltipContent>Running setup script…</TooltipContent>
      </Tooltip>
    );
  }

  // Run script running → Stop
  if (runScript?.isRunning && runScriptId) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => handleStopScript(runScript)}
            data-app-lifecycle-state="stop"
          >
            <Square className="size-3" fill="currentColor" />
            Stop
          </Button>
        </TooltipTrigger>
        <TooltipContent>Stop app (sends Ctrl-C)</TooltipContent>
      </Tooltip>
    );
  }

  // Setup defined and not yet run → Setup
  if (setupScript && !setupScript.hasRun && setupScriptId) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleRunScript(setupScript)}
            data-app-lifecycle-state="setup"
          >
            <Wrench className="size-3" />
            Setup
          </Button>
        </TooltipTrigger>
        <TooltipContent>Run setup script</TooltipContent>
      </Tooltip>
    );
  }

  // Run defined → Start
  if (runScript && runScriptId) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleRunScript(runScript)}
            data-app-lifecycle-state="start"
          >
            <Play className="size-3" fill="currentColor" />
            Start
          </Button>
        </TooltipTrigger>
        <TooltipContent>Start app (run script)</TooltipContent>
      </Tooltip>
    );
  }

  // Only setup, already run → offer to re-run
  if (setupScript) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleRunScript(setupScript)}
            data-app-lifecycle-state="rerun-setup"
          >
            <Wrench className="size-3" />
            Setup
          </Button>
        </TooltipTrigger>
        <TooltipContent>Re-run setup script</TooltipContent>
      </Tooltip>
    );
  }

  return null;
});
