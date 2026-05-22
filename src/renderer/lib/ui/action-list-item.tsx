import { type LucideIcon } from 'lucide-react';
import { Kbd } from '@renderer/lib/ui/kbd';
import { cn } from '@renderer/utils/utils';

export function ActionListItem({
  label,
  description,
  icon: Icon,
  isSelected,
  disabled,
  disabledReason,
  onClick,
  onMouseEnter,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  isSelected?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
  onMouseEnter?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      className={cn(
        'group flex w-full items-center justify-between rounded-lg bg-background p-4 text-left transition-all duration-fast ease-out',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background-1',
        !disabled && isSelected && 'bg-accent'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            'size-7 text-foreground-passive transition-colors duration-fast ease-out',
            !disabled && isSelected && 'text-accent-foreground'
          )}
          strokeWidth={1}
        />
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              'whitespace-nowrap leading-none tracking-normal text-sm text-foreground-muted transition-colors duration-fast ease-out',
              !disabled && isSelected && 'text-accent-foreground font-medium'
            )}
          >
            {label}
          </span>
          <span className="text-xs text-foreground-passive">
            {disabled && disabledReason ? disabledReason : description}
          </span>
        </div>
      </div>
      {!disabled && isSelected && (
        <Kbd className="size-6 bg-background-2 pt-1 text-accent-foreground group-hover:text-accent-foreground">
          ⏎
        </Kbd>
      )}
    </button>
  );
}
