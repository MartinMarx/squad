import { BookOpen } from 'lucide-react';
import type { ResolvedNotebookTab } from '../../tabs/tab-manager-store';
import { TabCloseButton } from './tab-close-button';
import { TabDragPreviewShell, TabItemShell } from './tab-item-shell';
import { TabTitle } from './tab-title';

export function NotebookTabItem({
  tab,
  onSelect,
  onClose,
}: {
  tab: ResolvedNotebookTab;
  onSelect: () => void;
  onClose: () => void;
}) {
  return (
    <TabItemShell
      tabId={tab.tabId}
      isActive={tab.isActive}
      title="Notebook"
      onSelect={onSelect}
      onPin={onSelect}
      onClose={onClose}
    >
      <BookOpen className="size-3 shrink-0" />
      <TabTitle isActive={tab.isActive} isPreview={tab.isPreview}>
        Notebook
      </TabTitle>
      <TabCloseButton onClose={onClose} ariaLabel="Close notebook" />
    </TabItemShell>
  );
}

export function NotebookTabDragPreview(_props: { tab: ResolvedNotebookTab }) {
  return (
    <TabDragPreviewShell>
      <BookOpen className="size-3 shrink-0" />
      <span className="truncate text-sm">Notebook</span>
    </TabDragPreviewShell>
  );
}
