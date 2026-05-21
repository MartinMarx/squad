import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Issue } from '@shared/tasks';
import { mergeLinearIssueBatches } from './linear-issue-sort';
import {
  callLinearMcpTool,
  callToolOnLinearMcpClient,
  withLinearMcpClient,
} from './linear-mcp-client';

type LinearMcpIssueRecord = {
  id?: string;
  identifier?: string;
  title?: string;
  description?: string | null;
  url?: string;
  branchName?: string | null;
  status?: string | null;
  state?: { name?: string | null; type?: string | null } | string | null;
  team?: { name?: string | null; key?: string | null } | string | null;
  project?: { name?: string | null } | string | null;
  assignee?: { name?: string | null; displayName?: string | null } | string | null;
  updatedAt?: string | null;
  cycle?: { id?: string; name?: string; number?: number; isActive?: boolean } | null;
};

type LinearMcpCommentRecord = {
  body?: string;
  createdAt?: string;
  user?: { name?: string | null; displayName?: string | null } | string | null;
};

type LinearCycleRecord = {
  id?: string;
  name?: string;
  number?: number;
  isActive?: boolean;
  active?: boolean;
  status?: string;
};

function readName(
  value: { name?: string | null; displayName?: string | null } | string | null | undefined
): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.name ?? value.displayName ?? undefined;
}

function extractArray(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function toIssue(raw: LinearMcpIssueRecord, context?: string): Issue {
  const status =
    typeof raw.state === 'string' ? raw.state : (raw.state?.name ?? raw.status ?? undefined);

  const assigneeName = readName(raw.assignee);

  return {
    provider: 'linear',
    identifier: raw.identifier ?? raw.id ?? '',
    title: raw.title ?? raw.identifier ?? 'Untitled issue',
    url: raw.url ?? '',
    description: raw.description ?? undefined,
    context,
    branchName: raw.branchName ?? undefined,
    status: status ?? undefined,
    assignees: assigneeName ? [assigneeName] : undefined,
    project: readName(raw.project),
    updatedAt: raw.updatedAt ?? undefined,
    fetchedAt: new Date().toISOString(),
  };
}

function formatCommentsContext(comments: LinearMcpCommentRecord[]): string | undefined {
  if (comments.length === 0) {
    return undefined;
  }

  const lines = comments.map((comment) => {
    const author = readName(comment.user) ?? 'Unknown';
    const body = comment.body?.trim() ?? '';
    return `- ${comment.createdAt ?? 'unknown time'} by ${author}: ${body}`;
  });

  return ['Linear issue activity', '', 'Comments:', ...lines].join('\n');
}

async function listIssuesRawOnClient(
  client: Client,
  limit: number,
  args: Record<string, unknown> = {}
): Promise<LinearMcpIssueRecord[]> {
  const payload = await callToolOnLinearMcpClient<unknown>(client, 'list_issues', {
    limit,
    orderBy: 'updatedAt',
    ...args,
  });

  return extractArray(payload, ['issues', 'results', 'nodes', 'data']).map(
    (entry) => entry as LinearMcpIssueRecord
  );
}

async function listIssuesRaw(limit: number, query?: string): Promise<LinearMcpIssueRecord[]> {
  return withLinearMcpClient((client) =>
    listIssuesRawOnClient(client, limit, query ? { query } : {})
  );
}

function isIssueInActiveCycle(
  issue: LinearMcpIssueRecord,
  activeCycle: LinearCycleRecord
): boolean {
  if (!issue.cycle) {
    return false;
  }

  if (issue.cycle.isActive === true) {
    return true;
  }

  if (activeCycle.id && issue.cycle.id === activeCycle.id) {
    return true;
  }

  if (activeCycle.number != null && issue.cycle.number === activeCycle.number) {
    return true;
  }

  if (activeCycle.name && issue.cycle.name === activeCycle.name) {
    return true;
  }

  return false;
}

async function getActiveCycle(client: Client): Promise<LinearCycleRecord | null> {
  try {
    const payload = await callToolOnLinearMcpClient<unknown>(client, 'list_cycles', {
      isActive: true,
      limit: 5,
    });
    const cycles = extractArray(payload, ['cycles', 'results', 'nodes', 'data']).map(
      (entry) => entry as LinearCycleRecord
    );

    return (
      cycles.find(
        (cycle) =>
          cycle.isActive === true ||
          cycle.active === true ||
          cycle.status?.toLowerCase() === 'active'
      ) ??
      cycles[0] ??
      null
    );
  } catch {
    return null;
  }
}

async function listMyIssues(client: Client, limit: number): Promise<LinearMcpIssueRecord[]> {
  for (const args of [
    { assignee: 'me', limit },
    { assignedToMe: true, limit },
  ]) {
    try {
      const issues = await listIssuesRawOnClient(client, limit, args);
      if (issues.length > 0) {
        return issues;
      }
    } catch {
      continue;
    }
  }

  return [];
}

async function getIssueRaw(identifier: string): Promise<LinearMcpIssueRecord | null> {
  try {
    const payload = await callLinearMcpTool<unknown>('get_issue', {
      id: identifier,
    });

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const record = payload as Record<string, unknown>;
      if (record.issue && typeof record.issue === 'object') {
        return record.issue as LinearMcpIssueRecord;
      }
      if (record.id || record.identifier) {
        return record as LinearMcpIssueRecord;
      }
    }
  } catch {
    // Fall back to search below.
  }

  const matches = await listIssuesRaw(5, identifier);
  return (
    matches.find((issue) => issue.identifier?.toLowerCase() === identifier.toLowerCase()) ??
    matches[0] ??
    null
  );
}

async function listCommentsRaw(issueId: string): Promise<LinearMcpCommentRecord[]> {
  const payloads = [{ issueId }, { id: issueId }, { issue: issueId }];

  for (const args of payloads) {
    try {
      const payload = await callLinearMcpTool<unknown>('list_comments', args);
      const comments = extractArray(payload, ['comments', 'results', 'nodes', 'data']).map(
        (entry) => entry as LinearMcpCommentRecord
      );
      if (comments.length > 0) {
        return comments;
      }
    } catch {
      continue;
    }
  }

  return [];
}

function readOrganizationName(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const organization = record.organization;
  if (organization && typeof organization === 'object') {
    const name = (organization as { name?: string }).name;
    if (typeof name === 'string' && name.trim()) {
      return name.trim();
    }
  }

  for (const key of ['user', 'viewer', 'data', 'team']) {
    const nested = record[key];
    const name = readOrganizationName(nested);
    if (name) {
      return name;
    }
  }

  return undefined;
}

export async function getLinearWorkspaceName(): Promise<string | undefined> {
  return withLinearMcpClient(async (client) => {
    const lookups = [
      async () => {
        const payload = await callToolOnLinearMcpClient<unknown>(client, 'get_user', { id: 'me' });
        return readOrganizationName(payload);
      },
      async () => {
        const payload = await callToolOnLinearMcpClient<unknown>(client, 'list_users', {
          limit: 1,
        });
        for (const user of extractArray(payload, ['users', 'results', 'nodes', 'data'])) {
          const name = readOrganizationName(user);
          if (name) {
            return name;
          }
        }
        return undefined;
      },
      async () => {
        const payload = await callToolOnLinearMcpClient<unknown>(client, 'list_teams', {
          limit: 50,
        });
        for (const team of extractArray(payload, ['teams', 'results', 'nodes', 'data'])) {
          const name = readOrganizationName(team);
          if (name) {
            return name;
          }
        }
        return undefined;
      },
    ];

    for (const lookup of lookups) {
      try {
        const name = await lookup();
        if (name) {
          return name;
        }
      } catch {
        continue;
      }
    }

    return undefined;
  });
}

export async function verifyLinearMcpConnection(): Promise<void> {
  await withLinearMcpClient((client) => listIssuesRawOnClient(client, 1));
}

const ISSUE_LIST_CACHE_TTL_MS = 60_000;

let cachedIssueList: { key: string; issues: Issue[]; fetchedAt: number } | undefined;

export function invalidateLinearIssueListCache(): void {
  cachedIssueList = undefined;
}

function readCachedIssueList(limit: number): Issue[] | undefined {
  if (!cachedIssueList) {
    return undefined;
  }

  if (Date.now() - cachedIssueList.fetchedAt > ISSUE_LIST_CACHE_TTL_MS) {
    cachedIssueList = undefined;
    return undefined;
  }

  if (cachedIssueList.key !== String(limit)) {
    return undefined;
  }

  return cachedIssueList.issues;
}

function writeCachedIssueList(limit: number, issues: Issue[]): void {
  cachedIssueList = {
    key: String(limit),
    issues,
    fetchedAt: Date.now(),
  };
}

export async function listLinearIssues(limit: number): Promise<Issue[]> {
  const cached = readCachedIssueList(limit);
  if (cached) {
    return cached;
  }

  const issues = await withLinearMcpClient(async (client) => {
    const perBatchLimit = Math.max(limit, 50);

    const [activeCycle, myIssues, workspaceIssues] = await Promise.all([
      getActiveCycle(client),
      listMyIssues(client, perBatchLimit),
      listIssuesRawOnClient(client, perBatchLimit),
    ]);

    const myCycleIssues = activeCycle
      ? myIssues.filter((issue) => isIssueInActiveCycle(issue, activeCycle))
      : [];
    const myCycleKeys = new Set(
      myCycleIssues.map((issue) => issue.identifier ?? issue.id).filter(Boolean)
    );
    const myOtherIssues = myIssues.filter(
      (issue) => !myCycleKeys.has(issue.identifier ?? issue.id ?? '')
    );

    const merged = mergeLinearIssueBatches(
      [
        { issues: myCycleIssues, priority: 3 },
        { issues: myOtherIssues, priority: 2 },
        { issues: workspaceIssues, priority: 1 },
      ],
      limit
    );

    return merged.map((issue) => toIssue(issue));
  });

  writeCachedIssueList(limit, issues);
  return issues;
}

export async function searchLinearIssues(searchTerm: string, limit: number): Promise<Issue[]> {
  return withLinearMcpClient(async (client) => {
    const [searchResults, myMatches] = await Promise.all([
      listIssuesRawOnClient(client, limit, { query: searchTerm }),
      listIssuesRawOnClient(client, limit, { query: searchTerm, assignee: 'me' }),
    ]);

    const merged = mergeLinearIssueBatches(
      [
        { issues: myMatches, priority: 2 },
        { issues: searchResults, priority: 1 },
      ],
      limit
    );

    return merged.map((issue) => toIssue(issue));
  });
}

export async function getLinearIssueContext(identifier: string): Promise<Issue | null> {
  const issue = await getIssueRaw(identifier);
  if (!issue) {
    return null;
  }

  const issueId = issue.id ?? identifier;
  let context: string | undefined;
  try {
    const comments = await listCommentsRaw(issueId);
    context = formatCommentsContext(comments);
  } catch {
    context = undefined;
  }

  return toIssue(issue, context);
}
