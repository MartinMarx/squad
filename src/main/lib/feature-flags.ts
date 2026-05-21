export function getFeatureFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('FLAG_')) continue;
    const flagName = key.slice(5).toLowerCase().replace(/_/g, '-');
    flags[flagName] = value === 'true' || value === '1';
  }
  return flags;
}
