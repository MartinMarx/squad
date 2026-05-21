import { describe, expect, it, vi } from 'vitest';
import { getAgentMcpMeta, getAllMcpAgentIds } from './config-paths';

vi.mock('os', () => ({
  default: { homedir: () => '/home/testuser' },
  homedir: () => '/home/testuser',
}));

describe('getAgentMcpMeta', () => {
  it('returns correct meta for claude', () => {
    const meta = getAgentMcpMeta('claude');
    expect(meta).toBeDefined();
    expect(meta!.configPath).toBe('/home/testuser/.claude.json');
    expect(meta!.serversPath).toEqual(['mcpServers']);
    expect(meta!.adapter).toBe('passthrough');
    expect(meta!.isToml).toBe(false);
  });

  it('returns correct meta for cursor', () => {
    const meta = getAgentMcpMeta('cursor');
    expect(meta).toBeDefined();
    expect(meta!.configPath).toBe('/home/testuser/.cursor/mcp.json');
    expect(meta!.adapter).toBe('cursor');
  });

  it('returns correct meta for codex (toml)', () => {
    const meta = getAgentMcpMeta('codex');
    expect(meta).toBeDefined();
    expect(meta!.configPath).toContain('config.toml');
    expect(meta!.isToml).toBe(true);
    expect(meta!.adapter).toBe('codex');
  });

  it('returns undefined for unknown agent', () => {
    const meta = getAgentMcpMeta('unknown-agent');
    expect(meta).toBeUndefined();
  });

  it('getAllMcpAgentIds returns all supported agents', () => {
    const ids = getAllMcpAgentIds();
    expect(ids).toEqual(['claude', 'cursor', 'codex']);
  });
});
