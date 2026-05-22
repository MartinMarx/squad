import { Plus } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { quickCreateConversation } from '@renderer/features/tasks/conversations/quick-new-conversation';
import { useShowModal } from '@renderer/lib/modal/modal-provider';
import { Button } from '@renderer/lib/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/lib/ui/dropdown-menu';
import { BoundShortcut } from '@renderer/lib/ui/shortcut';
import { useTabGroupContext } from '../../tabs/tab-group-context';
import { useTaskViewContext } from '../../task-view-context';

/**
 * Trailing "+" button that sits after the last tab in the tab strip. Hovering
 * (or focusing/clicking) opens a small menu with the two new-conversation
 * paths: fast (use last-used settings) and "with options" (open the modal).
 */
export const TabBarNewMenu = observer(function TabBarNewMenu() {
  const { projectId, taskId } = useTaskViewContext();
  const { tabManager } = useTabGroupContext();
  const showCreateConversationModal = useShowModal('createConversationModal');
  const [open, setOpen] = useState(false);

  const openModal = () => {
    showCreateConversationModal({
      projectId,
      taskId,
      onSuccess: ({ conversationId }) => tabManager.openConversation(conversationId),
    });
  };

  const openQuick = () => {
    void quickCreateConversation(projectId, taskId).then((result) => {
      if (result) {
        tabManager.openConversation(result.conversationId);
      } else {
        openModal();
      }
    });
  };

  return (
    <div
      className="flex h-full shrink-0 items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="New conversation"
              onClick={openQuick}
            >
              <Plus className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" sideOffset={2} className="min-w-56">
          <DropdownMenuItem
            onClick={(event) => {
              event.preventDefault();
              setOpen(false);
              openQuick();
            }}
          >
            <span className="flex-1">New conversation</span>
            <BoundShortcut settingsKey="newConversation" variant="badge" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(event) => {
              event.preventDefault();
              setOpen(false);
              openModal();
            }}
          >
            <span className="flex-1">New conversation…</span>
            <BoundShortcut settingsKey="newConversationWithOptions" variant="badge" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
