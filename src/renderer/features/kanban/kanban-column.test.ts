import { describe, expect, it } from 'vitest';
import type { PullRequest } from '@shared/pull-requests';
import {
  deriveKanbanColumn,
  getKanbanCardPrimaryAction,
  type KanbanColumnId,
} from './kanban-column';

function pr(overrides: Partial<PullRequest> & Pick<PullRequest, 'status'>): PullRequest {
  return {
    url: 'https://github.com/o/r/pull/1',
    provider: 'github',
    identifier: '#1',
    title: 'PR',
    repositoryUrl: 'https://github.com/o/r',
    baseRefName: 'main',
    baseRefOid: 'base',
    headRepositoryUrl: 'https://github.com/o/r',
    headRefName: 'feature',
    headRefOid: 'abc',
    description: null,
    isDraft: false,
    additions: null,
    deletions: null,
    changedFiles: null,
    commitCount: null,
    mergeableStatus: null,
    mergeStateStatus: null,
    reviewDecision: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    author: null,
    labels: [],
    assignees: [],
    checks: [],
    ...overrides,
  };
}

describe('deriveKanbanColumn', () => {
  it('places open PRs in review', () => {
    expect(
      deriveKanbanColumn({
        status: 'in_progress',
        prs: [pr({ status: 'open' })],
        agentStatus: 'working',
      })
    ).toBe('in_review');
  });

  it('places merged PRs in done', () => {
    expect(
      deriveKanbanColumn({
        status: 'in_progress',
        prs: [pr({ status: 'merged' })],
        agentStatus: null,
      })
    ).toBe('done');
  });

  it('places completed agents without open PR in ready for review', () => {
    expect(
      deriveKanbanColumn({
        status: 'in_progress',
        prs: [],
        agentStatus: 'completed',
      })
    ).toBe('ready_for_review');
  });

  it('prefers open PR over completed agent status', () => {
    expect(
      deriveKanbanColumn({
        status: 'in_progress',
        prs: [pr({ status: 'open' })],
        agentStatus: 'completed',
      })
    ).toBe('in_review');
  });

  it('maps lifecycle done and cancelled to done', () => {
    for (const status of ['done', 'cancelled'] as const) {
      expect(
        deriveKanbanColumn({
          status,
          prs: [],
          agentStatus: 'working',
        })
      ).toBe('done');
    }
  });

  it('defaults active work to in progress', () => {
    expect(
      deriveKanbanColumn({
        status: 'in_progress',
        prs: [],
        agentStatus: 'working',
      })
    ).toBe('in_progress');
  });
});

describe('getKanbanCardPrimaryAction', () => {
  const column: KanbanColumnId = 'ready_for_review';

  it('prioritizes continue session over create PR', () => {
    expect(
      getKanbanCardPrimaryAction({
        column,
        agentStatus: 'awaiting-input',
        canCreatePr: true,
      })
    ).toEqual({ kind: 'continue-session' });
  });

  it('offers create PR in ready for review when allowed', () => {
    expect(
      getKanbanCardPrimaryAction({
        column,
        agentStatus: 'completed',
        canCreatePr: true,
      })
    ).toEqual({ kind: 'create-pr' });
  });

  it('offers open PR when one exists and no higher-priority action applies', () => {
    expect(
      getKanbanCardPrimaryAction({
        column: 'in_review',
        agentStatus: null,
        openPrUrl: 'https://github.com/o/r/pull/2',
        canCreatePr: false,
      })
    ).toEqual({ kind: 'open-pr', url: 'https://github.com/o/r/pull/2' });
  });
});
