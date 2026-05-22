import { useMemo } from 'react';
import { useTheme } from '@renderer/lib/hooks/useTheme';
import { cn } from '@renderer/utils/utils';
import { projectChipColor, projectChipColorDark } from '../lib/project-color';

type ProjectChipProps = {
  projectId: string;
  projectName: string;
  className?: string;
  /** When true, render only the colored square (no text). */
  iconOnly?: boolean;
};

/**
 * Tiny project identity chip — deterministic color from project ID hash.
 *
 * Used on kanban cards, PR rows, and activity rows. Colors are produced via
 * inline styles because Tailwind can't generate colors at runtime, and we
 * have ~unbounded distinct projects.
 */
export function ProjectChip({ projectId, projectName, className, iconOnly }: ProjectChipProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'emdark';
  const c = useMemo(
    () => (isDark ? projectChipColorDark(projectId) : projectChipColor(projectId)),
    [projectId, isDark]
  );

  if (iconOnly) {
    return (
      <span
        className={cn('inline-block size-2.5 rounded-sm shrink-0', className)}
        style={{ backgroundColor: c.foreground }}
        title={projectName}
        aria-label={projectName}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap max-w-[140px]',
        className
      )}
      style={{ backgroundColor: c.background, color: c.foreground, borderColor: c.border }}
      title={projectName}
    >
      <span
        className="inline-block size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: c.foreground }}
      />
      <span className="truncate">{projectName}</span>
    </span>
  );
}
