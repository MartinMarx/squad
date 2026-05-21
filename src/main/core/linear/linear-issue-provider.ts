import { clampIssueLimit, normalizeSearchTerm } from '@main/core/issues/helpers/provider-inputs';
import type { IssueProvider } from '@main/core/issues/issue-provider';
import { log } from '@main/lib/logger';
import {
  ISSUE_PROVIDER_CAPABILITIES,
  type IssueContextResult,
  type IssueListResult,
} from '@shared/issue-providers';
import { linearConnectionService } from './linear-connection-service';
import {
  getLinearIssueContext,
  listLinearIssues,
  searchLinearIssues,
} from './linear-mcp-issue-service';

async function ensureConnected(): Promise<boolean> {
  return linearConnectionService.isConnected();
}

export const linearIssueProvider: IssueProvider = {
  type: 'linear',
  capabilities: ISSUE_PROVIDER_CAPABILITIES.linear,

  checkConnection: () => linearConnectionService.checkConnection(),

  listIssues: async (opts) => listIssues(opts.limit ?? 50),

  searchIssues: async (opts) => searchIssues(opts.searchTerm, opts.limit ?? 20),

  getIssueContext: async (opts) => getIssueContext(opts.identifier),
};

async function listIssues(limit = 50): Promise<IssueListResult> {
  if (!(await ensureConnected())) {
    return { success: false, error: 'Linear is not connected. Connect Linear in settings first.' };
  }

  const sanitizedLimit = clampIssueLimit(limit, 50, 200);

  try {
    return {
      success: true,
      issues: await listLinearIssues(sanitizedLimit),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch Linear issues.';
    return { success: false, error: message };
  }
}

async function searchIssues(searchTerm: string, limit = 20): Promise<IssueListResult> {
  const term = normalizeSearchTerm(searchTerm);
  if (!term) {
    return { success: true, issues: [] };
  }

  if (!(await ensureConnected())) {
    return { success: false, error: 'Linear is not connected. Connect Linear in settings first.' };
  }

  const sanitizedLimit = clampIssueLimit(limit, 20, 200);

  try {
    return {
      success: true,
      issues: await searchLinearIssues(term, sanitizedLimit),
    };
  } catch (error) {
    log.error('[Linear] searchIssues error:', error);
    const message = error instanceof Error ? error.message : 'Unable to search Linear issues.';
    return { success: false, error: message };
  }
}

async function getIssueContext(identifier: string): Promise<IssueContextResult> {
  const term = normalizeSearchTerm(identifier);
  if (!term) {
    return { success: false, error: 'Linear issue identifier is required.' };
  }

  if (!(await ensureConnected())) {
    return { success: false, error: 'Linear is not connected. Connect Linear in settings first.' };
  }

  try {
    const issue = await getLinearIssueContext(term);
    if (!issue) {
      return { success: false, error: `Linear issue not found: ${term}` };
    }

    return { success: true, issue };
  } catch (error) {
    log.error('[Linear] getIssueContext error:', error);
    const message =
      error instanceof Error ? error.message : 'Unable to fetch Linear issue context.';
    return { success: false, error: message };
  }
}
