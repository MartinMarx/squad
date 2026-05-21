import { isBrokenPortraitUrl, PHILOSOPHER_PORTRAIT_PLACEHOLDER } from './portraitPlaceholder';
import { PHILOSOPHER_PORTRAITS } from './portraits';

export function getPhilosopherPortraitUrl(slug: string): string {
  const url = PHILOSOPHER_PORTRAITS[slug];
  if (isBrokenPortraitUrl(url)) return PHILOSOPHER_PORTRAIT_PLACEHOLDER;
  return url;
}

export { PHILOSOPHER_PORTRAIT_PLACEHOLDER };
