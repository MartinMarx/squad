/**
 * Deterministic project chip color derived from the project id.
 *
 * Uses a stable string hash → HSL pair. Returns three CSS color strings so the
 * chip can render a background/border/foreground without depending on Tailwind
 * design tokens (which can't be parameterised at runtime).
 *
 * Chosen so chips look distinct across ~12 simultaneously visible projects;
 * collisions are tolerated past that.
 */

export type ProjectChipColor = {
  background: string;
  foreground: string;
  border: string;
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function projectChipColor(projectId: string): ProjectChipColor {
  const h = hashString(projectId);
  const hue = h % 360;
  return {
    background: `hsl(${hue} 70% 92% / 0.6)`,
    foreground: `hsl(${hue} 55% 28%)`,
    border: `hsl(${hue} 55% 65% / 0.45)`,
  };
}

export function projectChipColorDark(projectId: string): ProjectChipColor {
  const h = hashString(projectId);
  const hue = h % 360;
  return {
    background: `hsl(${hue} 35% 24% / 0.55)`,
    foreground: `hsl(${hue} 75% 82%)`,
    border: `hsl(${hue} 35% 45% / 0.4)`,
  };
}
