import { describe, expect, it } from 'vitest';
import { isClosedLinearIssue, mergeLinearIssueBatches } from './linear-issue-sort';

describe('mergeLinearIssueBatches', () => {
  it('prioritizes my current-cycle issues, then my issues, then the rest', () => {
    const merged = mergeLinearIssueBatches(
      [
        {
          priority: 3,
          issues: [{ identifier: 'LIN-3', updatedAt: '2026-05-01T00:00:00.000Z' }],
        },
        {
          priority: 2,
          issues: [{ identifier: 'LIN-2', updatedAt: '2026-05-02T00:00:00.000Z' }],
        },
        {
          priority: 1,
          issues: [{ identifier: 'LIN-1', updatedAt: '2026-05-03T00:00:00.000Z' }],
        },
      ],
      10
    );

    expect(merged.map((issue) => issue.identifier)).toEqual(['LIN-3', 'LIN-2', 'LIN-1']);
  });

  it('deduplicates issues and drops closed items', () => {
    const merged = mergeLinearIssueBatches(
      [
        {
          priority: 2,
          issues: [{ identifier: 'LIN-1', updatedAt: '2026-05-01T00:00:00.000Z' }],
        },
        {
          priority: 1,
          issues: [
            { identifier: 'LIN-1', updatedAt: '2026-05-02T00:00:00.000Z' },
            { identifier: 'LIN-2', state: { type: 'completed', name: 'Done' } },
            { identifier: 'LIN-3', updatedAt: '2026-05-03T00:00:00.000Z' },
          ],
        },
      ],
      10
    );

    expect(merged.map((issue) => issue.identifier)).toEqual(['LIN-1', 'LIN-3']);
    expect(isClosedLinearIssue({ state: { type: 'completed', name: 'Done' } })).toBe(true);
  });
});
