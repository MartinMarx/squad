import { describe, expect, it } from 'vitest';
import {
  getPhilosopherPortraitUrl,
  PHILOSOPHER_PORTRAIT_PLACEHOLDER,
} from './getPhilosopherPortraitUrl';
import { isBrokenPortraitUrl } from './portraitPlaceholder';

describe('getPhilosopherPortraitUrl', () => {
  it('returns a local placeholder for unknown slugs', () => {
    expect(getPhilosopherPortraitUrl('unknown-slug')).toBe(PHILOSOPHER_PORTRAIT_PLACEHOLDER);
    expect(PHILOSOPHER_PORTRAIT_PLACEHOLDER.startsWith('data:image/svg+xml,')).toBe(true);
  });

  it('returns a local placeholder for broken Wikimedia placeholder URLs', () => {
    expect(
      isBrokenPortraitUrl(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/240px-No_image_available.svg.png'
      )
    ).toBe(true);
  });

  it('returns a portrait URL for known philosophers', () => {
    const url = getPhilosopherPortraitUrl('plato');
    expect(url).toMatch(/^https:\/\//);
  });
});
