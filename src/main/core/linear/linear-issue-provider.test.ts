import { describe, expect, it, vi } from 'vitest';
import { linearIssueProvider } from './linear-issue-provider';

const mockIsConnected = vi.fn();
const mockListLinearIssues = vi.fn();
const mockSearchLinearIssues = vi.fn();
const mockGetLinearIssueContext = vi.fn();

vi.mock('./linear-connection-service', () => ({
  linearConnectionService: {
    isConnected: (...args: unknown[]) => mockIsConnected(...args),
    checkConnection: vi.fn(),
  },
}));

vi.mock('./linear-mcp-issue-service', () => ({
  listLinearIssues: (...args: unknown[]) => mockListLinearIssues(...args),
  searchLinearIssues: (...args: unknown[]) => mockSearchLinearIssues(...args),
  getLinearIssueContext: (...args: unknown[]) => mockGetLinearIssueContext(...args),
}));

describe('linearIssueProvider', () => {
  it('maps branchName from listed Linear issues', async () => {
    mockIsConnected.mockResolvedValue(true);
    mockListLinearIssues.mockResolvedValue([
      {
        provider: 'linear',
        identifier: 'GEN-626',
        title: 'Linear issue branch name creation',
        url: 'https://linear.app/general-action/issue/GEN-626',
        branchName: 'jona/gen-626-linear-issue-branch-name-creation',
      },
    ]);

    const result = await linearIssueProvider.listIssues({ limit: 10 });

    expect(mockListLinearIssues).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      success: true,
      issues: [
        expect.objectContaining({
          provider: 'linear',
          identifier: 'GEN-626',
          branchName: 'jona/gen-626-linear-issue-branch-name-creation',
        }),
      ],
    });
  });

  it('searches Linear issues through MCP', async () => {
    mockIsConnected.mockResolvedValue(true);
    mockSearchLinearIssues.mockResolvedValue([
      {
        provider: 'linear',
        identifier: 'GEN-626',
        title: 'Linear issue branch name creation',
        url: 'https://linear.app/general-action/issue/GEN-626',
        branchName: 'jona/gen-626-linear-issue-branch-name-creation',
      },
    ]);

    const result = await linearIssueProvider.searchIssues({
      searchTerm: 'GEN-626',
      limit: 5,
    });

    expect(mockSearchLinearIssues).toHaveBeenCalledWith('GEN-626', 5);
    expect(result.success).toBe(true);
  });

  it('returns issue context from MCP', async () => {
    mockIsConnected.mockResolvedValue(true);
    mockGetLinearIssueContext.mockResolvedValue({
      provider: 'linear',
      identifier: 'GEN-626',
      title: 'Linear issue branch name creation',
      url: 'https://linear.app/general-action/issue/GEN-626',
      context: 'Linear issue activity\n\nComments:\n- note',
    });

    const result = await linearIssueProvider.getIssueContext?.({ identifier: 'GEN-626' });

    expect(mockGetLinearIssueContext).toHaveBeenCalledWith('GEN-626');
    expect(result).toEqual({
      success: true,
      issue: expect.objectContaining({
        identifier: 'GEN-626',
        context: 'Linear issue activity\n\nComments:\n- note',
      }),
    });
  });
});
