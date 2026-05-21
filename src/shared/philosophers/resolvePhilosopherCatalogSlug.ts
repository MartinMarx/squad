import { isPhilosopherSlug } from './catalog';

/** Returns the catalog slug for a task/branch slug, including suffixed variants like `plato-2`. */
export function resolvePhilosopherCatalogSlug(slug: string): string | undefined {
  if (isPhilosopherSlug(slug)) return slug;
  const match = slug.match(/^([a-z]{5,8})-\d+$/);
  if (!match) return undefined;
  const base = match[1];
  return base && isPhilosopherSlug(base) ? base : undefined;
}
