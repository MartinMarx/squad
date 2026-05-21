import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext } from 'react';
import { rpc } from '@renderer/lib/ipc';
import {
  ISSUE_PROVIDER_CAPABILITIES,
  type ConnectionStatusMap,
  type IssueProviderType,
} from '@shared/issue-providers';
import { useProviderConnection } from './use-provider-connection';

export const ISSUE_CONNECTION_STATUS_QUERY_KEY = ['issues:connection-status'] as const;

const DEFAULT_CONNECTION_STATUS: ConnectionStatusMap = Object.fromEntries(
  Object.entries(ISSUE_PROVIDER_CAPABILITIES).map(([provider, capabilities]) => [
    provider,
    { connected: false, capabilities },
  ])
) as ConnectionStatusMap;

const DEFAULT_CONNECT_ERROR = 'Failed to connect.';

const PROVIDER_CONNECTION_CONFIG = {
  linear: {
    connectMutationFn: () => rpc.linear.connectOAuth(),
    disconnectMutationFn: () => rpc.linear.clearToken(),
    fallbackError: DEFAULT_CONNECT_ERROR,
  },
} as const;

type IntegrationsContextValue = {
  connectionStatus: ConnectionStatusMap;
  isCheckingConnections: boolean;
  isLinearConnected: boolean | null;
  isLinearLoading: boolean;
  connectLinear: () => Promise<void>;
  disconnectLinear: () => Promise<void>;
};

const IntegrationsContext = createContext<IntegrationsContextValue | null>(null);

function isConnected(
  statusData: ConnectionStatusMap | undefined,
  provider: IssueProviderType
): boolean | null {
  if (!statusData) {
    return null;
  }

  return !!statusData[provider]?.connected;
}

export function IntegrationsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: statusData,
    isFetching: isCheckingConnections,
    isLoading: isInitialConnectionCheck,
  } = useQuery({
    queryKey: ISSUE_CONNECTION_STATUS_QUERY_KEY,
    queryFn: () => rpc.issues.checkAllConnections(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const invalidateStatuses = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ISSUE_CONNECTION_STATUS_QUERY_KEY });
  }, [queryClient]);

  const linearConnection = useProviderConnection<void>({
    ...PROVIDER_CONNECTION_CONFIG.linear,
    invalidate: invalidateStatuses,
  });

  const connectionStatus = statusData ?? DEFAULT_CONNECTION_STATUS;

  return (
    <IntegrationsContext.Provider
      value={{
        connectionStatus,
        isCheckingConnections,
        isLinearConnected: isConnected(statusData, 'linear'),
        isLinearLoading: isInitialConnectionCheck || linearConnection.isLoading,
        connectLinear: () => linearConnection.connect(),
        disconnectLinear: linearConnection.disconnect,
      }}
    >
      {children}
    </IntegrationsContext.Provider>
  );
}

export function useIntegrationsContext() {
  const ctx = useContext(IntegrationsContext);
  if (!ctx) throw new Error('useIntegrationsContext must be used inside IntegrationsProvider');
  return ctx;
}
