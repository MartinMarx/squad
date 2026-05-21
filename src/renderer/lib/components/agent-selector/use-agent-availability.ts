import { useMemo } from 'react';
import { useToast } from '@renderer/lib/hooks/use-toast';
import { appState } from '@renderer/lib/stores/app-state';
import { agentConfig } from '@renderer/utils/agentConfig';
import type { AgentProviderId } from '@shared/agent-provider-registry';
import { getAgentInstallErrorMessage } from './agent-install';
import { buildAgentGroups, getAssumedInstalledAgents } from './agent-selector-options';

export function useAgentAvailability({ value }: { value: AgentProviderId | null }) {
  const dependencyData = appState.dependencies.local.data;
  const { toast } = useToast();

  const installedAgents = useMemo(
    () =>
      dependencyData
        ? Object.entries(dependencyData)
            .filter(([, state]) => state.category === 'agent' && state.status === 'available')
            .map(([id]) => id)
        : [],
    [dependencyData]
  );

  const assumedInstalledAgents = useMemo(
    () => getAssumedInstalledAgents(value, dependencyData),
    [value, dependencyData]
  );

  const installingAgents = new Set<AgentProviderId>();
  for (const id of Object.keys(agentConfig) as AgentProviderId[]) {
    if (appState.dependencies.isInstalling(id)) {
      installingAgents.add(id);
    }
  }
  const groups = buildAgentGroups(installedAgents, assumedInstalledAgents, installingAgents);

  async function installAgent(agentId: AgentProviderId): Promise<void> {
    if (appState.dependencies.isInstalling(agentId)) return;
    const result = await appState.dependencies.install(agentId);
    if (!result.success) {
      toast({
        title: 'Install failed',
        description: getAgentInstallErrorMessage(result.error),
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Agent installed', description: `${agentConfig[agentId].name} is ready.` });
  }

  return {
    groups,
    dependencyData,
    installingAgents,
    installAgent,
  };
}
