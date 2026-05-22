import type { HomeTaskEntry } from './home-types';

export type HomeSummaryCounts = {
  /** Tasks where the agent is awaiting input or errored — most actionable signal. */
  attention: number;
  /** Tasks where an agent is currently working. */
  activeAgents: number;
  /** PRs requiring action (changes requested, CI failing) + PRs ready to merge. */
  prsNeedingAction: number;
};

export function deriveAttentionCount(entries: HomeTaskEntry[]): number {
  let n = 0;
  for (const e of entries) {
    if (e.agentStatus === 'awaiting-input' || e.agentStatus === 'error') n += 1;
  }
  return n;
}

export function deriveActiveAgentsCount(entries: HomeTaskEntry[]): number {
  let n = 0;
  for (const e of entries) if (e.agentStatus === 'working') n += 1;
  return n;
}

export function deriveSummaryCounts(
  entries: HomeTaskEntry[],
  prsNeedingAction: number
): HomeSummaryCounts {
  return {
    attention: deriveAttentionCount(entries),
    activeAgents: deriveActiveAgentsCount(entries),
    prsNeedingAction,
  };
}
