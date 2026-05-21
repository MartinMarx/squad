import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCallToolOnLinearMcpClient = vi.fn();
const mockWithLinearMcpClient = vi.fn();

vi.mock('./linear-mcp-client', () => ({
  withLinearMcpClient: (...args: unknown[]) => mockWithLinearMcpClient(...args),
  callLinearMcpTool: vi.fn(),
  callToolOnLinearMcpClient: (...args: unknown[]) => mockCallToolOnLinearMcpClient(...args),
}));

describe('getLinearWorkspaceName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWithLinearMcpClient.mockImplementation(async (fn: (client: unknown) => Promise<unknown>) =>
      fn({})
    );
  });

  it('returns the organization name from get_user', async () => {
    mockCallToolOnLinearMcpClient.mockResolvedValueOnce({
      user: {
        organization: { name: 'General Action' },
      },
    });

    const { getLinearWorkspaceName } = await import('./linear-mcp-issue-service');
    await expect(getLinearWorkspaceName()).resolves.toBe('General Action');
    expect(mockCallToolOnLinearMcpClient).toHaveBeenCalledWith({}, 'get_user', { id: 'me' });
  });

  it('does not fall back to team names', async () => {
    mockCallToolOnLinearMcpClient
      .mockRejectedValueOnce(new Error('get_user unavailable'))
      .mockRejectedValueOnce(new Error('list_users unavailable'))
      .mockResolvedValueOnce({
        teams: [{ name: 'Security - Cyber Tools' }],
      });

    const { getLinearWorkspaceName } = await import('./linear-mcp-issue-service');
    await expect(getLinearWorkspaceName()).resolves.toBeUndefined();
  });
});
