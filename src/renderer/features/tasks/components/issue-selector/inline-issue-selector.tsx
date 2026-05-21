import { Check, Loader2 } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ISSUE_PROVIDER_META } from '@renderer/features/integrations/issue-provider-meta';
import { useNavigate } from '@renderer/lib/layout/navigation-provider';
import { Button } from '@renderer/lib/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@renderer/lib/ui/input-group';
import { Kbd } from '@renderer/lib/ui/kbd';
import { cn } from '@renderer/utils/utils';
import type { Issue } from '@shared/tasks';
import { ConnectIssueIntegrationPlaceholder, IssueRow, ProviderLogo } from './issue-selector';
import { getLinkedIssueMap } from './use-linked-issue-urls';
import { useIssueSearch } from './useIssueSearch';

export interface InlineIssueSelectorProps {
  value: Issue | null;
  onValueChange: (issue: Issue | null) => void;
  projectId?: string;
  repositoryUrl?: string;
  projectPath?: string;
  disabled?: boolean;
  fixedProvider?: Issue['provider'];
  /** Skip "already linked" indicator for this task — useful when re-selecting the same task's issue. */
  excludeTaskId?: string;
}

function IssueListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-muted/60 h-7 w-full animate-pulse rounded-sm" />
      ))}
    </div>
  );
}

function LinearIntegrationPlaceholder() {
  const { navigate } = useNavigate();

  return (
    <div className="flex w-full flex-col items-center justify-center gap-5 rounded-md border border-dashed border-border p-8">
      <ProviderLogo provider="linear" className="size-8" />
      <p className="text-center text-sm text-foreground-muted">
        Connect Linear to pick an issue for this worktree.
      </p>
      <Button
        variant="outline"
        size="xs"
        className="w-fit"
        onClick={() => navigate('settings', { tab: 'integrations' })}
      >
        Connect Linear
      </Button>
    </div>
  );
}

export const InlineIssueSelector = observer(function InlineIssueSelector({
  value,
  onValueChange,
  projectId,
  repositoryUrl = '',
  projectPath = '',
  disabled,
  fixedProvider,
  excludeTaskId,
}: InlineIssueSelectorProps) {
  const linkedIssueMap = getLinkedIssueMap(projectId, excludeTaskId);
  const { issues, issueProvider, hasAnyIntegration, isProviderLoading, handleSetSearchTerm } =
    useIssueSearch(repositoryUrl, projectPath, projectId, { fixedProvider });

  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      handleSetSearchTerm(val);
      setHighlightedIndex(0);
    },
    [handleSetSearchTerm]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (issues.length === 0) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => Math.min(prev + 1, issues.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter': {
          e.preventDefault();
          const issue = issues[highlightedIndex];
          if (!issue) break;
          onValueChange(issue === value ? null : issue);
          break;
        }
        case 'Escape':
          e.preventDefault();
          if (query) {
            setQuery('');
            handleSetSearchTerm('');
            setHighlightedIndex(0);
          }
          break;
      }
    },
    [issues, highlightedIndex, value, query, onValueChange, handleSetSearchTerm]
  );

  const providerLabel = issueProvider ? ISSUE_PROVIDER_META[issueProvider].displayName : 'issues';
  const showInitialLoading = isProviderLoading && issues.length === 0 && !query;

  if (!hasAnyIntegration) {
    return fixedProvider === 'linear' ? (
      <LinearIntegrationPlaceholder />
    ) : (
      <ConnectIssueIntegrationPlaceholder />
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col min-w-0 rounded-md border border-input overflow-hidden',
        disabled && 'pointer-events-none'
      )}
    >
      <InputGroup className="border-input has-[[data-slot=input-group-control]:focus-visible]:border-input rounded-none border-0 border-b shadow-none has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        {issueProvider ? (
          <InputGroupAddon align="inline-start">
            {isProviderLoading ? (
              <Loader2 className="mx-1.5 h-3.5 w-3.5 animate-spin text-foreground/60" />
            ) : (
              <span className="mx-1.5 flex items-center">
                <ProviderLogo provider={issueProvider} className="h-3.5 w-3.5" />
              </span>
            )}
          </InputGroupAddon>
        ) : null}
        <InputGroupInput
          ref={inputRef}
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${providerLabel} issues…`}
          autoFocus
        />
      </InputGroup>

      <div ref={listRef} className="h-52 overflow-x-hidden overflow-y-auto p-1">
        {showInitialLoading ? (
          <IssueListSkeleton />
        ) : issues.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-foreground-passive">
            {query ? 'No issues found' : `No ${providerLabel} issues to show`}
          </div>
        ) : (
          issues.map((issue, index) => {
            const isSelected = value?.identifier === issue.identifier;
            const isHighlighted = index === highlightedIndex;
            const linkedTo = linkedIssueMap.get(issue.url);
            return (
              <button
                key={issue.identifier}
                type="button"
                className={cn(
                  'relative flex min-w-0 w-full cursor-default items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none select-none',
                  isHighlighted && !isSelected && 'bg-background-2',
                  isSelected && 'bg-background-2'
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => onValueChange(isSelected ? null : issue)}
              >
                <IssueRow issue={issue} linkedTo={linkedTo} />
                {isSelected ? (
                  <Check className="absolute right-2 size-3.5 shrink-0 text-foreground-muted" />
                ) : null}
              </button>
            );
          })
        )}
      </div>
      <div className="flex h-6 items-center justify-between border-t border-border bg-background-1 px-2 text-xs">
        <div className="text-foreground-muted">Navigate with arrow keys</div>
        <div className="text-foreground-muted">
          <button className="flex items-center gap-2">
            Select Issue <Kbd>⏎</Kbd>
          </button>{' '}
        </div>
      </div>
    </div>
  );
});
