import { Bell, GitPullRequest, PanelRight, Sparkles } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Button } from '@renderer/lib/ui/button';
import { cn } from '@renderer/utils/utils';
import { deriveActiveAgentsCount, deriveAttentionCount } from '../../lib/attention-queue';
import type { HomeTaskEntry } from '../../lib/home-types';
import { groupHomePrs } from '../../lib/pr-grouping';
import { ActivityFeed } from './activity-feed';
import { PrOverview } from './pr-overview';
import { SummaryBlock } from './summary-block';

type HomeRailProps = {
  entries: HomeTaskEntry[];
  hideProjectChips?: boolean;
};

const COLLAPSE_BREAKPOINT = 1280;

/**
 * Right rail composition: summary tiles · PR overview · activity feed.
 *
 * Below {@link COLLAPSE_BREAKPOINT} viewport width, the rail collapses to a
 * vertical icon strip showing the four key counts. Clicking the strip expands
 * the rail again.
 */
export const HomeRail = observer(function HomeRail({ entries, hideProjectChips }: HomeRailProps) {
  const [autoCollapsed, setAutoCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < COLLAPSE_BREAKPOINT : false
  );
  const [userOverride, setUserOverride] = useState<'collapsed' | 'expanded' | null>(null);

  useEffect(() => {
    const onResize = () => {
      setAutoCollapsed(window.innerWidth < COLLAPSE_BREAKPOINT);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isCollapsed =
    userOverride === 'collapsed' ? true : userOverride === 'expanded' ? false : autoCollapsed;

  if (isCollapsed) {
    return <CollapsedRail entries={entries} onExpand={() => setUserOverride('expanded')} />;
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <span className="px-1 text-[10px] font-semibold tracking-wider text-foreground-muted uppercase">
          Summary
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setUserOverride('collapsed')}
          aria-label="Collapse rail"
        >
          <PanelRight />
        </Button>
      </div>
      <SummaryBlock entries={entries} />
      <div className="border-t border-border" />
      <PrOverview entries={entries} hideProjectChips={hideProjectChips} />
      <div className="border-t border-border" />
      <ActivityFeed hideProjectChips={hideProjectChips} />
    </aside>
  );
});

function CollapsedRail({ entries, onExpand }: { entries: HomeTaskEntry[]; onExpand: () => void }) {
  const attention = deriveAttentionCount(entries);
  const active = deriveActiveAgentsCount(entries);
  const groups = groupHomePrs(entries);
  const prs = groups.needsAction.length + groups.readyToMerge.length;

  return (
    <aside className="flex h-full w-10 shrink-0 flex-col items-center gap-2 border-l border-border bg-background py-2">
      <Button variant="ghost" size="icon-xs" onClick={onExpand} aria-label="Expand rail">
        <PanelRight className="rotate-180" />
      </Button>
      <CollapsedTile Icon={Bell} count={attention} label="Attention" />
      <CollapsedTile Icon={Sparkles} count={active} label="Working" />
      <CollapsedTile Icon={GitPullRequest} count={prs} label="PRs" />
    </aside>
  );
}

function CollapsedTile({
  Icon,
  count,
  label,
}: {
  Icon: typeof Bell;
  count: number;
  label: string;
}) {
  return (
    <div
      className={cn(
        'relative flex size-7 items-center justify-center rounded-md text-foreground-muted',
        count > 0 && 'text-foreground'
      )}
      title={`${label}: ${count}`}
    >
      <Icon className="size-3.5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-foreground px-1 text-[8px] leading-none font-semibold text-background">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
}
