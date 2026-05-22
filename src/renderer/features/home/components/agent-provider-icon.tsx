import { agentMeta } from '@renderer/lib/providers/meta';
import { cn } from '@renderer/utils/utils';
import type { AgentProviderId } from '@shared/agent-provider-registry';

type AgentProviderIconProps = {
  providerId: string;
  className?: string;
};

/**
 * Renders the agent provider's logo at micro size. Some logos are raw SVG
 * strings (Cursor, OpenAI), others are PNG URLs (Claude); we handle both.
 */
export function AgentProviderIcon({ providerId, className }: AgentProviderIconProps) {
  const meta = agentMeta[providerId as AgentProviderId];
  if (!meta?.icon) return null;

  const cls = cn(
    'inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-sm [&>svg]:size-full [&_svg]:max-h-full [&_svg]:max-w-full',
    meta.invertInDark && 'dark:invert',
    className
  );

  if (meta.isSvg) {
    return (
      <span
        className={cls}
        dangerouslySetInnerHTML={{ __html: meta.icon }}
        title={meta.label}
        aria-label={meta.label}
      />
    );
  }

  return (
    <img
      src={meta.icon}
      alt={meta.alt ?? meta.label}
      className={cn('inline-block size-3.5 shrink-0 rounded-sm object-contain', className)}
    />
  );
}
