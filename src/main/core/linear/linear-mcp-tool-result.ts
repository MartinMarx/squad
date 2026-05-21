import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function parseLinearMcpToolResult<T>(result: CallToolResult): T {
  if (result.isError) {
    const message =
      result.content
        ?.map((entry) => (entry.type === 'text' ? entry.text : ''))
        .filter(Boolean)
        .join('\n') || 'Linear MCP tool failed';
    throw new Error(message);
  }

  if (result.structuredContent) {
    return result.structuredContent as T;
  }

  const text =
    result.content
      ?.filter((entry) => entry.type === 'text')
      .map((entry) => entry.text)
      .join('\n')
      .trim() ?? '';

  if (!text) {
    throw new Error('Linear MCP tool returned empty content.');
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text);
  }
}
