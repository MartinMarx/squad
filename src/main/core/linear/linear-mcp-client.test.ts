import { describe, expect, it } from 'vitest';
import { parseLinearMcpToolResult } from './linear-mcp-tool-result';

describe('parseLinearMcpToolResult', () => {
  it('returns structured content when present', () => {
    const result = parseLinearMcpToolResult<{ issues: Array<{ id: string }> }>({
      content: [],
      structuredContent: { issues: [{ id: 'issue-1' }] },
    });

    expect(result).toEqual({ issues: [{ id: 'issue-1' }] });
  });

  it('parses JSON text content', () => {
    const result = parseLinearMcpToolResult<{ issues: Array<{ id: string }> }>({
      content: [{ type: 'text', text: '{"issues":[{"id":"issue-1"}]}' }],
    });

    expect(result).toEqual({ issues: [{ id: 'issue-1' }] });
  });

  it('throws tool errors from MCP responses', () => {
    expect(() =>
      parseLinearMcpToolResult({
        content: [{ type: 'text', text: 'Authentication required, not authenticated' }],
        isError: true,
      })
    ).toThrow('Authentication required, not authenticated');
  });
});
