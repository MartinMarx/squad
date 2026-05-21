import { describe, expect, it } from 'vitest';
import { resolvePhilosopherCatalogSlug } from './resolvePhilosopherCatalogSlug';

describe('resolvePhilosopherCatalogSlug', () => {
  it('returns the slug when it is in the catalog', () => {
    expect(resolvePhilosopherCatalogSlug('plato')).toBe('plato');
  });

  it('returns the base slug for suffixed variants', () => {
    expect(resolvePhilosopherCatalogSlug('plato-2')).toBe('plato');
  });

  it('returns undefined for unrelated slugs', () => {
    expect(resolvePhilosopherCatalogSlug('fix-login-bug')).toBeUndefined();
  });
});
