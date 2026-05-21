import { describe, expect, it } from 'vitest';
import type { ServerMap } from '@shared/mcp/types';
import { adaptForward, adaptReverse } from './adapters';

describe('adaptForward (canonical → agent)', () => {
  const stdioServer = { command: 'npx', args: ['-y', 'foo'] };
  const httpServer = { type: 'http', url: 'https://example.com/mcp', headers: { 'X-Key': 'abc' } };

  describe('passthrough', () => {
    it('returns servers unchanged', () => {
      const servers: ServerMap = { s1: stdioServer, s2: httpServer };
      expect(adaptForward('passthrough', servers)).toEqual(servers);
    });
  });

  describe('cursor', () => {
    it('keeps only url and headers for HTTP servers', () => {
      const result = adaptForward('cursor', { s1: httpServer });
      expect(result.s1).toEqual({ url: 'https://example.com/mcp', headers: { 'X-Key': 'abc' } });
      expect(result.s1).not.toHaveProperty('type');
    });

    it('leaves stdio servers unchanged', () => {
      const result = adaptForward('cursor', { s1: stdioServer });
      expect(result.s1).toEqual(stdioServer);
    });
  });

  describe('codex', () => {
    it('drops HTTP servers', () => {
      const result = adaptForward('codex', { s1: stdioServer, s2: httpServer });
      expect(result.s1).toEqual(stdioServer);
      expect(result.s2).toBeUndefined();
    });
  });
});

describe('adaptReverse (agent → canonical)', () => {
  describe('passthrough', () => {
    it('returns servers unchanged', () => {
      const servers: ServerMap = { s1: { command: 'npx', args: ['-y', 'foo'] } };
      expect(adaptReverse('passthrough', servers)).toEqual(servers);
    });
  });

  describe('cursor', () => {
    it('adds type: http when url is present and no command', () => {
      const servers: ServerMap = { s1: { url: 'https://example.com', headers: {} } };
      const result = adaptReverse('cursor', servers);
      expect(result.s1).toHaveProperty('type', 'http');
    });

    it('leaves stdio servers unchanged', () => {
      const servers: ServerMap = { s1: { command: 'npx', args: ['foo'] } };
      const result = adaptReverse('cursor', servers);
      expect(result.s1).toEqual({ command: 'npx', args: ['foo'] });
    });
  });

  describe('codex', () => {
    it('returns servers as-is (all are stdio)', () => {
      const servers: ServerMap = { s1: { command: 'npx', args: ['foo'] } };
      expect(adaptReverse('codex', servers)).toEqual(servers);
    });
  });
});
