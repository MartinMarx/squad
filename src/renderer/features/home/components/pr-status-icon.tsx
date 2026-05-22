import {
  CheckCircle2,
  CircleDashed,
  CircleDot,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  XCircle,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/lib/ui/tooltip';
import { cn } from '@renderer/utils/utils';
import type { PullRequest } from '@shared/pull-requests';

type PrStatusIconProps = {
  pr: PullRequest;
  className?: string;
};

type Resolved = {
  Icon: typeof CheckCircle2;
  color: string;
  label: string;
};

function resolve(pr: PullRequest): Resolved {
  if (pr.status === 'merged') {
    return { Icon: GitMerge, color: 'text-foreground-merged', label: 'Merged' };
  }
  if (pr.status === 'closed') {
    return { Icon: GitPullRequestClosed, color: 'text-foreground-destructive', label: 'Closed' };
  }
  if (pr.isDraft) {
    return { Icon: CircleDashed, color: 'text-foreground-muted', label: 'Draft PR' };
  }
  const decision = (pr.reviewDecision ?? '').toUpperCase();
  if (decision === 'CHANGES_REQUESTED') {
    return { Icon: XCircle, color: 'text-foreground-destructive', label: 'Changes requested' };
  }
  if (decision === 'APPROVED') {
    return { Icon: CheckCircle2, color: 'text-foreground-success', label: 'Approved' };
  }
  if (decision === 'REVIEW_REQUIRED') {
    return { Icon: CircleDot, color: 'text-foreground-warning', label: 'Review requested' };
  }
  return { Icon: GitPullRequest, color: 'text-foreground-success', label: 'Open PR' };
}

export function PrStatusIcon({ pr, className }: PrStatusIconProps) {
  const { Icon, color, label } = resolve(pr);
  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn('inline-flex shrink-0', color, className)} />}>
        <Icon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent side="top" showArrow={false}>
        {label}
        {pr.identifier ? ` · ${pr.identifier}` : ''}
      </TooltipContent>
    </Tooltip>
  );
}

type CiStateDotProps = {
  state: 'success' | 'failure' | 'pending' | null;
  className?: string;
};

export function CiStateDot({ state, className }: CiStateDotProps) {
  if (!state) return null;
  const colorClass =
    state === 'success'
      ? 'bg-foreground-success'
      : state === 'failure'
        ? 'bg-foreground-destructive'
        : 'bg-foreground-warning';
  const label =
    state === 'success' ? 'CI passing' : state === 'failure' ? 'CI failing' : 'CI running';
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn('inline-block size-1.5 rounded-full', colorClass, className)}
            aria-label={label}
          />
        }
      />
      <TooltipContent side="top" showArrow={false}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
