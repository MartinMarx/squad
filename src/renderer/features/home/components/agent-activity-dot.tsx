import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/lib/ui/tooltip';
import { cn } from '@renderer/utils/utils';
import type { HomeAgentStatus } from '../lib/home-types';

type AgentActivityDotProps = {
  status: HomeAgentStatus | null;
  className?: string;
};

const STATUS_LABEL: Record<HomeAgentStatus, string> = {
  working: 'Agent working',
  'awaiting-input': 'Agent awaiting input',
  error: 'Agent errored',
  completed: 'Agent finished',
  idle: 'Idle',
};

/**
 * Compact status dot. Color crossfades on transitions; pulses when the agent
 * is working or awaiting input. Unread counts are surfaced separately by
 * {@link UnreadBadge} so this dot keeps a fixed size and the card row height
 * never shifts.
 */
export function AgentActivityDot({ status, className }: AgentActivityDotProps) {
  const color = colorForStatus(status);
  const label = status ? STATUS_LABEL[status] : 'No agent attached';
  const isPulsing = status === 'working' || status === 'awaiting-input';

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              'relative inline-flex size-2 shrink-0 items-center justify-center',
              className
            )}
            aria-label={label}
          />
        }
      >
        <motion.span
          layout
          animate={{ backgroundColor: color }}
          transition={{ duration: 0.2 }}
          className={cn(
            'inline-block size-2 rounded-full',
            isPulsing && 'shadow-[0_0_0_3px_var(--ring-color)]'
          )}
          style={
            isPulsing
              ? ({ ['--ring-color' as never]: `${color}33` } as React.CSSProperties)
              : undefined
          }
        />
      </TooltipTrigger>
      <TooltipContent side="top" showArrow={false}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

type UnreadBadgeProps = {
  count: number;
  className?: string;
};

/**
 * Tiny tone-neutral badge for unread conversation counts. Renders as a
 * subtle gray pill, leaving the agent activity dot to carry color.
 */
export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (count <= 0) return null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              'inline-flex h-3.5 min-w-3.5 shrink-0 items-center justify-center rounded-full bg-foreground px-1 text-[9px] leading-none font-semibold text-background tabular-nums',
              className
            )}
            aria-label={`${count} unread`}
          />
        }
      >
        {count > 9 ? '9+' : count}
      </TooltipTrigger>
      <TooltipContent side="top" showArrow={false}>
        {count} unread
      </TooltipContent>
    </Tooltip>
  );
}

function colorForStatus(status: HomeAgentStatus | null): string {
  switch (status) {
    case 'working':
      return 'var(--color-status-in-progress)';
    case 'awaiting-input':
      return 'var(--color-foreground-warning)';
    case 'error':
      return 'var(--color-foreground-destructive)';
    case 'completed':
      return 'var(--color-foreground-success)';
    case 'idle':
    case null:
    default:
      return 'var(--color-foreground-passive)';
  }
}
