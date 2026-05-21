import { resolveConversationProviderSelection } from '@renderer/features/tasks/conversations/provider-selection';
import { appState } from '@renderer/lib/stores/app-state';
import { AGENT_PROVIDER_IDS, isValidProviderId } from '@shared/agent-provider-registry';

export function resolveDefaultProviderForConversation(defaultAgentValue: string) {
  const defaultProviderId = isValidProviderId(defaultAgentValue) ? defaultAgentValue : 'claude';
  const dependencyResource = appState.dependencies.local;
  const installedProviderIds = AGENT_PROVIDER_IDS.filter(
    (id) => dependencyResource.data?.[id]?.status === 'available'
  );

  return resolveConversationProviderSelection({
    defaultProviderId,
    providerOverride: null,
    installedProviderIds,
    availabilityKnown: dependencyResource.data !== null,
  });
}
