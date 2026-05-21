import { describe, expect, it } from 'vitest';
import { generateTaskName } from './generateTaskName';

describe('generateTaskName', () => {
  describe('heuristic generation (with title)', () => {
    it('generates a branch-style name from a title', () => {
      const result = generateTaskName({ title: 'Fix the login page crash on mobile' });
      expect(result).toBeTruthy();
      expect(result).not.toContain('/');
      expect(result).toMatch(/^[a-z0-9-]+$/);
    });

    it('generates from title and description', () => {
      const result = generateTaskName({
        title: 'Add OAuth2 support',
        description: 'We need SSO integration for enterprise customers',
      });
      expect(result).toBeTruthy();
      expect(result).toMatch(/^[a-z0-9-]+$/);
    });

    it('respects max task name length of 64', () => {
      const result = generateTaskName({
        title:
          'Implement a comprehensive authentication and authorization system with OAuth2 PKCE flow and SAML support',
      });
      expect(result.length).toBeLessThanOrEqual(64);
    });

    it('handles issue identifiers in title', () => {
      const result = generateTaskName({ title: 'Fix login bug #891' });
      expect(result).toBeTruthy();
      expect(result).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('without title', () => {
    it('requires pickPhilosopherName instead of generating a random slug', () => {
      expect(() => generateTaskName({})).toThrow(/pickPhilosopherName/i);
    });
  });
});
