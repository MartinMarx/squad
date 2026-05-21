import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { cn } from '@renderer/utils/utils';
import { useTabGroupContext } from '../../tabs/tab-group-context';
import { useWorkspaceViewModel } from '../../task-view-context';

const TITLE_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

export const TabTitle = observer(function TabTitle({
  isActive,
  isPreview,
  hasError,
  maxWidth = 'max-w-[200px]',
  className,
  children,
}: {
  isActive: boolean;
  isPreview?: boolean;
  hasError?: boolean;
  maxWidth?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { groupId } = useTabGroupContext();
  const { focusedRegion, tabGroupManager } = useWorkspaceViewModel();
  const isFocused = focusedRegion === 'main' && tabGroupManager.activeGroupId === groupId;
  const shouldReduceMotion = useReducedMotion();
  const label = String(children);

  const textClassName = cn(
    'block truncate text-sm',
    isPreview && 'italic',
    hasError && 'text-foreground-destructive',
    className
  );

  return (
    <span
      className={cn(
        'relative inline-flex min-w-0 overflow-hidden p-1 text-sm transition-opacity group-hover:opacity-100',
        maxWidth,
        isActive && isFocused ? 'opacity-100' : 'opacity-85'
      )}
    >
      {shouldReduceMotion ? (
        <span className={textClassName}>{label}</span>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={TITLE_TRANSITION}
            className={textClassName}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
});
