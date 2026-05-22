import {
  fetchAppSettingsMeta,
  updateAppSettingsRequest,
} from '@renderer/features/settings/app-settings-client';
import { conversationRegistry } from '@renderer/features/tasks/stores/conversation-registry';
import { appState } from '@renderer/lib/stores/app-state';
import { getAgentAutoApproveDefault } from '@shared/agent-auto-approve-defaults';
import {
  AGENT_PROVIDER_IDS,
  isValidProviderId,
  type AgentProviderId,
} from '@shared/agent-provider-registry';
import { nextDefaultConversationTitle } from './conversation-title-utils';
import { resolveConversationProviderSelection } from './provider-selection';

interface QuickCreateResult {
  conversationId: string;
  provider: AgentProviderId;
  autoApprove: boolean;
}

/**
 * Creates a new conversation using the user's last-used selection (or sensible
 * defaults if none) without opening the modal. Returns the new conversation id
 * so callers can open the resulting tab.
 */
export async function quickCreateConversation(
  projectId: string,
  taskId: string
): Promise<QuickCreateResult | null> {
  const [lastMeta, defaultAgentMeta, autoApproveMeta] = await Promise.all([
    fetchAppSettingsMeta('lastNewConversationDefaults'),
    fetchAppSettingsMeta('defaultAgent'),
    fetchAppSettingsMeta('agentAutoApproveDefaults'),
  ]);

  const lastProvider = lastMeta.value.provider;
  const defaultProvider: AgentProviderId = isValidProviderId(defaultAgentMeta.value)
    ? defaultAgentMeta.value
    : 'claude';

  const dependencyResource = appState.dependencies.local;
  const availabilityKnown = dependencyResource.data !== null;
  const installedProviderIds = AGENT_PROVIDER_IDS.filter(
    (id) => dependencyResource.data?.[id]?.status === 'available'
  );

  const { providerId, createDisabled } = resolveConversationProviderSelection({
    defaultProviderId: lastProvider ?? defaultProvider,
    providerOverride: null,
    installedProviderIds,
    availabilityKnown,
  });

  if (createDisabled || !providerId) return null;

  const autoApprove =
    lastMeta.value.provider === providerId
      ? lastMeta.value.autoApprove
      : getAgentAutoApproveDefault(autoApproveMeta.value ?? {}, providerId);

  const conversationMgr = conversationRegistry.get(taskId);
  if (!conversationMgr) return null;

  const id = crypto.randomUUID();
  const title = nextDefaultConversationTitle(
    providerId,
    Array.from(conversationMgr.conversations.values(), (c) => c.data)
  );

  await conversationMgr.createConversation({
    projectId,
    taskId,
    id,
    autoApprove,
    provider: providerId,
    title,
  });

  // Persist this selection as the new "last used".
  await updateAppSettingsRequest('lastNewConversationDefaults', {
    provider: providerId,
    autoApprove,
  });

  return { conversationId: id, provider: providerId, autoApprove };
}

export async function rememberNewConversationDefaults(
  provider: AgentProviderId,
  autoApprove: boolean
): Promise<void> {
  await updateAppSettingsRequest('lastNewConversationDefaults', { provider, autoApprove });
}
