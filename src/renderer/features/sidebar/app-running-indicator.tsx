import { cn } from '@renderer/utils/utils';

const BAR_BASE =
  'inline-block w-[2px] rounded-full bg-current origin-bottom animate-app-running-bar';

/**
 * Small animated 3-bar audio-waveform indicator. Marks that an app/run script
 * is currently alive for a worktree. Styles are scoped via Tailwind utilities
 * defined alongside the renderer global styles.
 */
export function AppRunningIndicator({ label, className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn('flex items-center gap-1.5 pr-1 text-xs font-medium text-primary', className)}
      aria-label={label ? `${label} running` : 'App running'}
    >
      <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
        <span className={cn(BAR_BASE, 'h-1.5 [animation-delay:-0.2s]')} />
        <span className={cn(BAR_BASE, 'h-3 [animation-delay:-0.1s]')} />
        <span className={cn(BAR_BASE, 'h-2')} />
      </span>
      {label ? <span className="truncate">{label}</span> : null}
    </span>
  );
}
