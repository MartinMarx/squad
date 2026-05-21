const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" fill="none">
  <rect width="120" height="160" fill="#d4d4d4"/>
  <ellipse cx="60" cy="50" rx="26" ry="32" fill="#a3a3a3"/>
  <path d="M28 88 Q60 72 92 88 L92 160 L28 160 Z" fill="#a3a3a3"/>
</svg>`;

export const PHILOSOPHER_PORTRAIT_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;

export function isBrokenPortraitUrl(url: string | undefined): boolean {
  if (!url) return true;
  return url.includes('No_image_available');
}
