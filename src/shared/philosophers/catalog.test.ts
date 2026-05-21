import { describe, expect, it } from 'vitest';
import { PHILOSOPHER_CATALOG, PHILOSOPHER_SLUGS } from './catalog';

describe('PHILOSOPHER_CATALOG', () => {
  it('contains at least 250 philosophers', () => {
    expect(PHILOSOPHER_CATALOG.length).toBeGreaterThanOrEqual(250);
  });

  it('uses unique slugs matching length and charset constraints', () => {
    expect(PHILOSOPHER_SLUGS.size).toBe(PHILOSOPHER_CATALOG.length);
    for (const { slug, displayName } of PHILOSOPHER_CATALOG) {
      expect(slug).toMatch(/^[a-z]{5,8}$/);
      expect(displayName.trim().length).toBeGreaterThan(0);
    }
  });
});
