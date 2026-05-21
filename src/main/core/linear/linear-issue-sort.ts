type LinearIssueSortRecord = {
  id?: string;
  identifier?: string;
  updatedAt?: string | null;
  cycle?: { id?: string; name?: string; number?: number; isActive?: boolean } | null;
  state?: { name?: string | null; type?: string | null } | string | null;
  status?: string | null;
};

export type LinearIssueListBatch = {
  issues: LinearIssueSortRecord[];
  priority: number;
};

export function isClosedLinearIssue(issue: LinearIssueSortRecord): boolean {
  const stateType = typeof issue.state === 'object' ? issue.state?.type : undefined;
  const stateName =
    typeof issue.state === 'string' ? issue.state : (issue.state?.name ?? issue.status);

  if (stateType && ['completed', 'cancelled', 'canceled'].includes(stateType.toLowerCase())) {
    return true;
  }

  if (!stateName) {
    return false;
  }

  return ['done', 'completed', 'cancelled', 'canceled', 'closed', 'resolved'].includes(
    stateName.toLowerCase()
  );
}

function updatedAtMs(issue: LinearIssueSortRecord): number {
  if (!issue.updatedAt) {
    return 0;
  }

  const parsed = Date.parse(issue.updatedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function mergeLinearIssueBatches(
  batches: LinearIssueListBatch[],
  limit: number
): LinearIssueSortRecord[] {
  const seen = new Set<string>();
  const merged: Array<{ issue: LinearIssueSortRecord; priority: number; updatedAt: number }> = [];

  for (const batch of batches) {
    for (const issue of batch.issues) {
      const key = issue.identifier ?? issue.id;
      if (!key || seen.has(key) || isClosedLinearIssue(issue)) {
        continue;
      }

      seen.add(key);
      merged.push({
        issue,
        priority: batch.priority,
        updatedAt: updatedAtMs(issue),
      });
    }
  }

  merged.sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return right.updatedAt - left.updatedAt;
  });

  return merged.slice(0, limit).map(({ issue }) => issue);
}
