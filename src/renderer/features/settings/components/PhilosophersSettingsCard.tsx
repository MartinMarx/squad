import { Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppSettingsKey } from '@renderer/features/settings/use-app-settings-key';
import { SearchInput } from '@renderer/lib/ui/search-input';
import { cn } from '@renderer/utils/utils';
import { PHILOSOPHER_CATALOG } from '@shared/philosophers/catalog';
import {
  getPhilosopherPortraitUrl,
  PHILOSOPHER_PORTRAIT_PLACEHOLDER,
} from '@shared/philosophers/getPhilosopherPortraitUrl';

function PhilosopherCard({
  slug,
  displayName,
  isUnlocked,
}: {
  slug: string;
  displayName: string;
  isUnlocked: boolean;
}) {
  const [portraitFailed, setPortraitFailed] = useState(false);
  const portraitUrl = portraitFailed
    ? PHILOSOPHER_PORTRAIT_PLACEHOLDER
    : getPhilosopherPortraitUrl(slug);

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border text-sm',
        isUnlocked ? 'border-border bg-background-1' : 'border-border/60 bg-muted/10'
      )}
    >
      <div className="bg-muted/20 relative aspect-[3/4] overflow-hidden">
        <img
          src={portraitUrl}
          alt={isUnlocked ? displayName : 'Locked philosopher'}
          loading="lazy"
          onError={() => setPortraitFailed(true)}
          className={cn(
            'size-full object-cover object-top transition-[filter,opacity]',
            isUnlocked ? 'grayscale-0 opacity-100' : 'grayscale opacity-70'
          )}
        />
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20">
            <Lock className="size-5 text-foreground-muted" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-2 py-2">
        {isUnlocked ? (
          <span className="truncate font-medium text-foreground">{displayName}</span>
        ) : (
          <span className="truncate font-mono text-xs text-foreground-muted">{slug}</span>
        )}
      </div>
    </div>
  );
}

export function PhilosophersSettingsCard() {
  const { value: philosophers, isLoading } = useAppSettingsKey('philosophers');
  const [search, setSearch] = useState('');
  const unlocked = useMemo(() => new Set(philosophers?.unlocked ?? []), [philosophers?.unlocked]);
  const unlockedCount = unlocked.size;
  const totalCount = PHILOSOPHER_CATALOG.length;

  const filteredPhilosophers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return PHILOSOPHER_CATALOG;
    return PHILOSOPHER_CATALOG.filter(
      (philosopher) =>
        philosopher.slug.includes(query) || philosopher.displayName.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        {unlockedCount} / {totalCount} philosophers unlocked by creating worktree tasks.
      </p>
      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search philosophers…"
        aria-label="Search philosophers"
      />
      {filteredPhilosophers.length === 0 ? (
        <p className="text-muted-foreground text-sm">No philosophers match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredPhilosophers.map((philosopher) => (
            <PhilosopherCard
              key={philosopher.slug}
              slug={philosopher.slug}
              displayName={philosopher.displayName}
              isUnlocked={unlocked.has(philosopher.slug)}
            />
          ))}
        </div>
      )}
      {isLoading && <p className="text-muted-foreground text-xs">Loading unlocked philosophers…</p>}
    </div>
  );
}
