import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpToLine,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileDiff,
  Files,
  FolderOpen,
  FolderPlus,
  GitPullRequest,
  MessageSquare,
  MessageSquarePlus,
  Palette,
  PanelBottom,
  PanelRight,
  Pin,
  Settings,
  SquarePlus,
  SquareTerminal,
  Terminal,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps the string iconKey tokens defined in src/shared/commands.ts to their
 * LucideIcon components. The shared layer stays free of renderer imports — it
 * stores only the string key, and the renderer resolves it here.
 */
export const COMMAND_ICONS = {
  settings: Settings,
  'folder-plus': FolderPlus,
  'folder-open': FolderOpen,
  'square-plus': SquarePlus,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'message-square-plus': MessageSquarePlus,
  'book-open': BookOpen,
  'file-diff': FileDiff,
  'message-square': MessageSquare,
  palette: Palette,
  files: Files,
  terminal: Terminal,
  'panel-bottom': PanelBottom,
  'panel-right': PanelRight,
  'square-terminal': SquareTerminal,
  'git-pull-request': GitPullRequest,
  'arrow-down-to-line': ArrowDownToLine,
  'arrow-up-to-line': ArrowUpToLine,
  pin: Pin,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
} satisfies Record<string, LucideIcon>;

export type CommandIconKey = keyof typeof COMMAND_ICONS;

export function getCommandIcon(iconKey: string | undefined): LucideIcon | undefined {
  if (!iconKey) return undefined;
  return (COMMAND_ICONS as Record<string, LucideIcon>)[iconKey];
}
