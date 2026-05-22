import type { PullRequest } from '@shared/pull-requests';
import type { HomeTaskEntry } from './home-types';

export type HomePrGroup = 'needs-action' | 'ready-to-merge' | 'in-flight';

export type HomePrRow = {
  pr: PullRequest;
  entry: HomeTaskEntry;
  group: HomePrGroup;
  /**
   * Roll-up CI conclusion: 'success' when every completed check passed,
   * 'failure' when any failed, 'pending' when at least one is still running.
   * `null` when there are no checks recorded.
   */
  ciState: 'success' | 'failure' | 'pending' | null;
  hasReviewChangesRequested: boolean;
  isMergeable: boolean;
};

export type GroupedHomePrs = {
  needsAction: HomePrRow[];
  readyToMerge: HomePrRow[];
  inFlight: HomePrRow[];
};

function rollUpCiState(pr: PullRequest): HomePrRow['ciState'] {
  if (pr.checks.length === 0) return null;
  let anyFailure = false;
  let anyPending = false;
  for (const c of pr.checks) {
    const conclusion = (c.conclusion ?? '').toUpperCase();
    if (conclusion === 'FAILURE' || conclusion === 'TIMED_OUT' || conclusion === 'CANCELLED') {
      anyFailure = true;
    } else if (!c.conclusion) {
      anyPending = true;
    }
  }
  if (anyFailure) return 'failure';
  if (anyPending) return 'pending';
  return 'success';
}

function classify(
  pr: PullRequest,
  ciState: HomePrRow['ciState']
): {
  group: HomePrGroup;
  hasReviewChangesRequested: boolean;
  isMergeable: boolean;
} {
  const hasReviewChangesRequested = (pr.reviewDecision ?? '').toUpperCase() === 'CHANGES_REQUESTED';
  const isApproved = (pr.reviewDecision ?? '').toUpperCase() === 'APPROVED';
  const isMergeable = pr.mergeableStatus === 'MERGEABLE';

  if (pr.status === 'open' && !pr.isDraft) {
    if (hasReviewChangesRequested || ciState === 'failure') {
      return { group: 'needs-action', hasReviewChangesRequested, isMergeable };
    }
    if (isApproved && isMergeable && (ciState === 'success' || ciState === null)) {
      return { group: 'ready-to-merge', hasReviewChangesRequested, isMergeable };
    }
  }
  return { group: 'in-flight', hasReviewChangesRequested, isMergeable };
}

/**
 * Build the three review-role groupings from the home entries.
 *
 * Scope: open + draft PRs attached to any visible task. Closed/merged PRs are
 * excluded — they have no actionable signal. When a task carries multiple PRs,
 * each PR is surfaced as its own row.
 */
export function groupHomePrs(entries: HomeTaskEntry[]): GroupedHomePrs {
  const out: GroupedHomePrs = { needsAction: [], readyToMerge: [], inFlight: [] };
  for (const entry of entries) {
    for (const pr of entry.prs) {
      if (pr.status !== 'open') continue;
      const ciState = rollUpCiState(pr);
      const { group, hasReviewChangesRequested, isMergeable } = classify(pr, ciState);
      const row: HomePrRow = { pr, entry, group, ciState, hasReviewChangesRequested, isMergeable };
      if (group === 'needs-action') out.needsAction.push(row);
      else if (group === 'ready-to-merge') out.readyToMerge.push(row);
      else out.inFlight.push(row);
    }
  }
  const sortByUpdated = (a: HomePrRow, b: HomePrRow) =>
    b.pr.updatedAt.localeCompare(a.pr.updatedAt);
  out.needsAction.sort(sortByUpdated);
  out.readyToMerge.sort(sortByUpdated);
  out.inFlight.sort(sortByUpdated);
  return out;
}
