import { useHotkey } from '@tanstack/react-hotkeys';
import { useObserver } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useAppSettingsKey } from '@renderer/features/settings/use-app-settings-key';
import { getRegisteredTaskData } from '@renderer/features/tasks/stores/task-selectors';
import {
  getEffectiveHotkey,
  getHotkeyRegistration,
} from '@renderer/lib/hooks/useKeyboardShortcuts';
import { useWorkspaceLayoutContext } from '@renderer/lib/layout/layout-provider';
import {
  useNavigate,
  useParams,
  useWorkspaceSlots,
} from '@renderer/lib/layout/navigation-provider';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { modalStore } from '@renderer/lib/modal/modal-store';
import { sidebarStore } from '@renderer/lib/stores/app-state';

const SIDEBAR_JUMP_HOTKEYS = [
  'Alt+Shift+1',
  'Alt+Shift+2',
  'Alt+Shift+3',
  'Alt+Shift+4',
  'Alt+Shift+5',
  'Alt+Shift+6',
  'Alt+Shift+7',
  'Alt+Shift+8',
  'Alt+Shift+9',
] as const;

export function AppKeyboardShortcuts() {
  const { value: keyboard } = useAppSettingsKey('keyboard');
  const showCommandPalette = useShowModal('commandPaletteModal');
  const { toggleLeft } = useWorkspaceLayoutContext();
  const { navigate } = useNavigate();

  const commandPaletteHotkey = getEffectiveHotkey('commandPalette', keyboard);
  const closeModalHotkey = getEffectiveHotkey('closeModal', keyboard);
  const toggleLeftSidebarHotkey = getEffectiveHotkey('toggleLeftSidebar', keyboard);

  const { currentView, lastNonSettingsView } = useWorkspaceSlots();
  const { params: taskParams } = useParams('task');
  const { params: projectParams } = useParams('project');

  const currentProjectId =
    currentView === 'task'
      ? taskParams.projectId
      : currentView === 'project'
        ? projectParams.projectId
        : undefined;
  const currentTaskId = currentView === 'task' ? taskParams.taskId : undefined;

  const currentWorkspaceId = useObserver(() => {
    if (!currentProjectId || !currentTaskId) return undefined;
    return getRegisteredTaskData(currentProjectId, currentTaskId)?.workspaceId ?? undefined;
  });

  useHotkey(
    getHotkeyRegistration('commandPalette', keyboard),
    () =>
      showCommandPalette({
        projectId: currentProjectId,
        taskId: currentTaskId,
        workspaceId: currentWorkspaceId,
      }),
    { enabled: commandPaletteHotkey !== null }
  );

  useHotkey(
    getHotkeyRegistration('closeModal', keyboard),
    () => {
      if (currentView === 'settings' && !modalStore.isOpen) {
        (navigate as (viewId: typeof lastNonSettingsView) => void)(lastNonSettingsView);
      }
    },
    { enabled: currentView === 'settings' && closeModalHotkey !== null }
  );

  useHotkey(getHotkeyRegistration('toggleLeftSidebar', keyboard), () => toggleLeft(), {
    enabled: toggleLeftSidebarHotkey !== null,
  });

  function jumpToSidebarIndex(idx: number, e: KeyboardEvent) {
    const target = sidebarStore.flatVisibleTasks[idx];
    if (!target) return;
    e.preventDefault();
    navigate('task', { projectId: target.projectId, taskId: target.taskId });
  }
  useHotkey(SIDEBAR_JUMP_HOTKEYS[0], (e) => jumpToSidebarIndex(0, e), {
    conflictBehavior: 'allow',
    ignoreInputs: false,
  });
  useHotkey(SIDEBAR_JUMP_HOTKEYS[1], (e) => jumpToSidebarIndex(1, e), {
    conflictBehavior: 'allow',
    ignoreInputs: false,
  });
  useHotkey(SIDEBAR_JUMP_HOTKEYS[2], (e) => jumpToSidebarIndex(2, e), {
    conflictBehavior: 'allow',
    ignoreInputs: false,
  });
  useHotkey(SIDEBAR_JUMP_HOTKEYS[3], (e) => jumpToSidebarIndex(3, e), {
    conflictBehavior: 'allow',
    ignoreInputs: false,
  });
  useHotkey(SIDEBAR_JUMP_HOTKEYS[4], (e) => jumpToSidebarIndex(4, e), {
    conflictBehavior: 'allow',
    ignoreInputs: false,
  });
  useHotkey(SIDEBAR_JUMP_HOTKEYS[5], (e) => jumpToSidebarIndex(5, e), {
    conflictBehavior: 'allow',
    ignoreInputs: false,
  });
  useHotkey(SIDEBAR_JUMP_HOTKEYS[6], (e) => jumpToSidebarIndex(6, e), {
    conflictBehavior: 'allow',
    ignoreInputs: false,
  });
  useHotkey(SIDEBAR_JUMP_HOTKEYS[7], (e) => jumpToSidebarIndex(7, e), {
    conflictBehavior: 'allow',
    ignoreInputs: false,
  });
  useHotkey(SIDEBAR_JUMP_HOTKEYS[8], (e) => jumpToSidebarIndex(8, e), {
    conflictBehavior: 'allow',
  });

  useEffect(() => {
    // Show the sidebar Option+Shift+N indicator only when both modifiers are
    // held, matching the actual shortcut.
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.shiftKey) sidebarStore.setJumpIndicatorVisible(true);
      else sidebarStore.setJumpIndicatorVisible(false);
    }
    function onKeyUp(e: KeyboardEvent) {
      if (!e.altKey || !e.shiftKey) sidebarStore.setJumpIndicatorVisible(false);
    }
    function onBlur() {
      sidebarStore.setJumpIndicatorVisible(false);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return null;
}
