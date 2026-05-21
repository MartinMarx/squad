import { useFeatureFlags } from '@renderer/lib/providers/feature-flag-override-context';

/**
 * Returns true when the named feature flag is enabled for this client.
 * In dev builds, FLAG_<name> env vars (hyphens → underscores) in .env.local
 * take effect. Example: FLAG_workspace_provider=true enables "workspace-provider".
 */
export function useFeatureFlag(flag: string): boolean {
  const flags = useFeatureFlags();
  return flags[flag] ?? false;
}
