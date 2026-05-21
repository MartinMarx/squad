import type { IssueProviderType } from '@shared/issue-providers';

export const ISSUE_PROVIDER_ORDER: IssueProviderType[] = ['linear', 'github'];

export const ISSUE_PROVIDER_META: Record<
  IssueProviderType,
  {
    displayName: string;
  }
> = {
  linear: { displayName: 'Linear' },
  github: { displayName: 'GitHub' },
};
