import { useState } from 'react';
import { useAppSettingsKey } from '@renderer/features/settings/use-app-settings-key';
import { appState } from '@renderer/lib/stores/app-state';
import {
  AGENT_PROVIDER_IDS,
  isValidProviderId,
  type AgentProviderId,
} from '@shared/agent-provider-registry';
import { resolveConversationProviderSelection } from './provider-selection';

export type EffectiveProvider = {
  providerId: AgentProviderId | null;
  setProviderOverride: (id: AgentProviderId | null) => void;
  createDisabled: boolean;
};

export function useEffectiveProvider(): EffectiveProvider {
  const [providerOverride, setProviderOverride] = useState<AgentProviderId | null>(null);

  const { value: defaultAgentValue } = useAppSettingsKey('defaultAgent');
  const { value: lastUsedValue } = useAppSettingsKey('lastNewConversationDefaults');
  const lastUsedProvider = lastUsedValue?.provider ?? null;
  const fallbackAgentId: AgentProviderId = isValidProviderId(defaultAgentValue)
    ? defaultAgentValue
    : 'claude';
  const defaultProviderId: AgentProviderId = lastUsedProvider ?? fallbackAgentId;

  const dependencyResource = appState.dependencies.local;
  const availabilityKnown = dependencyResource.data !== null;
  const installedProviderIds = AGENT_PROVIDER_IDS.filter(
    (id) => dependencyResource.data?.[id]?.status === 'available'
  );

  const { providerId, createDisabled } = resolveConversationProviderSelection({
    defaultProviderId,
    providerOverride,
    installedProviderIds,
    availabilityKnown,
  });

  return { providerId, setProviderOverride, createDisabled };
}
