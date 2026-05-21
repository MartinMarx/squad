import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LinearConnectionService } from './linear-connection-service';

const mockExecuteLinearMcpOAuthFlow = vi.fn();
const mockCancelLinearMcpOAuthFlow = vi.fn();
const mockClearLinearMcpOAuthCredentials = vi.fn();
const mockVerifyLinearMcpConnection = vi.fn();
const mockGetLinearWorkspaceName = vi.fn();
const mockHasLinearMcpCredentials = vi.fn();
const mockGetStoredLinearWorkspaceName = vi.fn();
const mockSetStoredLinearWorkspaceName = vi.fn();
const mockInvalidateLinearIssueListCache = vi.fn();

vi.mock('./linear-mcp-oauth-flow', () => ({
  executeLinearMcpOAuthFlow: (...args: unknown[]) => mockExecuteLinearMcpOAuthFlow(...args),
  cancelLinearMcpOAuthFlow: (...args: unknown[]) => mockCancelLinearMcpOAuthFlow(...args),
}));

vi.mock('./linear-mcp-oauth-provider', () => ({
  clearLinearMcpOAuthCredentials: (...args: unknown[]) =>
    mockClearLinearMcpOAuthCredentials(...args),
  hasLinearMcpCredentials: (...args: unknown[]) => mockHasLinearMcpCredentials(...args),
  getStoredLinearWorkspaceName: (...args: unknown[]) => mockGetStoredLinearWorkspaceName(...args),
  setStoredLinearWorkspaceName: (...args: unknown[]) => mockSetStoredLinearWorkspaceName(...args),
}));

vi.mock('./linear-mcp-issue-service', () => ({
  verifyLinearMcpConnection: (...args: unknown[]) => mockVerifyLinearMcpConnection(...args),
  getLinearWorkspaceName: (...args: unknown[]) => mockGetLinearWorkspaceName(...args),
  invalidateLinearIssueListCache: (...args: unknown[]) =>
    mockInvalidateLinearIssueListCache(...args),
}));

vi.mock('@main/lib/telemetry', () => ({
  telemetryService: { capture: vi.fn() },
}));

describe('LinearConnectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClearLinearMcpOAuthCredentials.mockResolvedValue(undefined);
    mockExecuteLinearMcpOAuthFlow.mockResolvedValue({
      access_token: 'oauth-token',
      token_type: 'Bearer',
    });
    mockVerifyLinearMcpConnection.mockResolvedValue(undefined);
    mockGetLinearWorkspaceName.mockResolvedValue('General Action');
    mockHasLinearMcpCredentials.mockResolvedValue(true);
    mockGetStoredLinearWorkspaceName.mockResolvedValue('General Action');
    mockSetStoredLinearWorkspaceName.mockResolvedValue(undefined);
  });

  it('connects via MCP OAuth and validates through the MCP server', async () => {
    const service = new LinearConnectionService();
    const result = await service.connectOAuth();

    expect(mockClearLinearMcpOAuthCredentials).toHaveBeenCalled();
    expect(mockExecuteLinearMcpOAuthFlow).toHaveBeenCalled();
    expect(mockVerifyLinearMcpConnection).toHaveBeenCalled();
    expect(mockSetStoredLinearWorkspaceName).toHaveBeenCalledWith('General Action');
    expect(result).toEqual({
      success: true,
      workspaceName: 'General Action',
    });
  });

  it('returns an error when MCP OAuth fails', async () => {
    mockExecuteLinearMcpOAuthFlow.mockRejectedValue(new Error('OAuth timed out'));

    const service = new LinearConnectionService();
    const result = await service.connectOAuth();

    expect(result).toEqual({
      success: false,
      error: 'OAuth timed out',
    });
  });

  it('checks connection from stored credentials without hitting MCP', async () => {
    const service = new LinearConnectionService();
    const result = await service.checkConnection();

    expect(mockHasLinearMcpCredentials).toHaveBeenCalled();
    expect(mockVerifyLinearMcpConnection).not.toHaveBeenCalled();
    expect(mockGetStoredLinearWorkspaceName).toHaveBeenCalled();
    expect(result).toEqual({
      connected: true,
      displayName: 'General Action',
      capabilities: {
        requiresProjectPath: false,
        requiresRepositoryUrl: false,
      },
    });
  });

  it('clears OAuth credentials on disconnect', async () => {
    const service = new LinearConnectionService();
    const result = await service.clearToken();

    expect(mockCancelLinearMcpOAuthFlow).toHaveBeenCalled();
    expect(mockInvalidateLinearIssueListCache).toHaveBeenCalled();
    expect(mockClearLinearMcpOAuthCredentials).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
