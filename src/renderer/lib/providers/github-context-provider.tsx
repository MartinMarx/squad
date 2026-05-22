import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { events, rpc } from '@renderer/lib/ipc';
import { log } from '@renderer/utils/logger';
import {
  githubAuthErrorChannel,
  githubAuthSuccessChannel,
  githubAuthUserUpdatedChannel,
} from '@shared/events/githubEvents';
import type {
  GitHubAuthResponse,
  GitHubStatusOptions,
  GitHubStatusResponse,
  GitHubTokenSource,
  GitHubUser,
} from '@shared/github';
import { useToast } from '../hooks/use-toast';
import { useModalContext } from '../modal/modal-provider';

type GithubContextValue = {
  authenticated: boolean;
  user: GitHubUser | null;
  tokenSource: GitHubTokenSource;
  isLoading: boolean;
  isInitialized: boolean;
  githubLoading: boolean;
  needsGhAuth: boolean;
  handleGithubConnect: () => Promise<void>;
  cancelGithubConnect: () => void;
  login: () => Promise<GitHubAuthResponse>;
  logout: () => Promise<void>;
  checkStatus: (options?: GitHubStatusOptions) => Promise<GitHubStatusResponse>;
};

const GITHUB_STATUS_KEY = ['github:status'] as const;
const GITHUB_STATUS_REFRESH_KEY = [...GITHUB_STATUS_KEY, 'refresh'] as const;
const ISSUE_CONNECTION_STATUS_QUERY_KEY = ['issues:connection-status'] as const;

const GithubContext = createContext<GithubContextValue | null>(null);

export function GithubContextProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { showModal } = useModalContext();

  const [githubLoading, setGithubLoading] = useState(false);

  const {
    data: statusData,
    isFetching,
    isSuccess,
  } = useQuery<GitHubStatusResponse>({
    queryKey: GITHUB_STATUS_KEY,
    queryFn: () => rpc.github.getStatus(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const authenticated = statusData?.authenticated ?? false;
  const user: GitHubUser | null = statusData?.user ?? null;
  const tokenSource: GitHubTokenSource = statusData?.tokenSource ?? null;
  const isInitialized = isSuccess;

  const needsGhAuth = isInitialized && !authenticated;

  const prevAuthenticatedRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (!isInitialized) return;
    if (prevAuthenticatedRef.current === authenticated) return;
    prevAuthenticatedRef.current = authenticated;
    log.info('[GithubContext] auth state changed', {
      authenticated,
      user: user?.login ?? null,
      tokenSource,
    });
  }, [authenticated, isInitialized, tokenSource, user]);

  const loginMutation = useMutation({
    mutationFn: () => rpc.github.auth(),
  });

  const logoutMutation = useMutation({
    mutationFn: () => rpc.github.logout(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: GITHUB_STATUS_KEY });
      void queryClient.invalidateQueries({ queryKey: ISSUE_CONNECTION_STATUS_QUERY_KEY });
    },
  });

  const isLoading = isFetching || loginMutation.isPending || logoutMutation.isPending;

  const checkStatus = useCallback(
    async (options?: GitHubStatusOptions) => {
      if (options?.refresh) {
        const result = await queryClient.fetchQuery<GitHubStatusResponse>({
          queryKey: GITHUB_STATUS_REFRESH_KEY,
          queryFn: () => rpc.github.getStatus(options),
          staleTime: 0,
        });
        queryClient.setQueryData(GITHUB_STATUS_KEY, result);
        return result;
      }

      return queryClient.fetchQuery<GitHubStatusResponse>({
        queryKey: GITHUB_STATUS_KEY,
        queryFn: () => rpc.github.getStatus(),
        staleTime: 0,
      });
    },
    [queryClient]
  );

  const login = useCallback(() => loginMutation.mutateAsync(), [loginMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const handleDeviceFlowSuccess = useCallback(
    async (flowUser: GitHubUser) => {
      log.info('[GithubContext] auth success via device flow', { user: flowUser?.login });
      void checkStatus();
      setTimeout(() => void checkStatus(), 500);
      void queryClient.invalidateQueries({ queryKey: ISSUE_CONNECTION_STATUS_QUERY_KEY });
      toast({
        title: 'Connected to GitHub',
        description: `Signed in as ${flowUser?.login || flowUser?.name || 'user'}`,
      });
    },
    [checkStatus, queryClient, toast]
  );

  const handleDeviceFlowError = useCallback(
    (error: string) => {
      toast({
        title: 'Authentication Failed',
        description: error,
        variant: 'destructive',
      });
    },
    [toast]
  );

  // Subscribe to GitHub auth IPC events from the main process
  useEffect(() => {
    const cleanupSuccess = events.on(githubAuthSuccessChannel, (data) => {
      log.info('[GithubContext] received githubAuthSuccessChannel event', {
        user: data.user?.login,
      });
      void handleDeviceFlowSuccess(data.user);
    });
    const cleanupError = events.on(githubAuthErrorChannel, (data) => {
      log.info('[GithubContext] received githubAuthErrorChannel event', {
        message: data.message || data.error,
      });
      handleDeviceFlowError(data.message || data.error);
    });
    const cleanupUserUpdated = events.on(githubAuthUserUpdatedChannel, () => {
      log.info('[GithubContext] received githubAuthUserUpdatedChannel event');
      void checkStatus();
    });

    return () => {
      cleanupSuccess();
      cleanupError();
      cleanupUserUpdated();
    };
  }, [handleDeviceFlowSuccess, handleDeviceFlowError, checkStatus]);

  const handleGithubConnect = useCallback(async () => {
    setGithubLoading(true);

    try {
      const freshStatus = await checkStatus();
      if (freshStatus?.authenticated) {
        setGithubLoading(false);
        return;
      }

      setGithubLoading(false);

      showModal('githubDeviceFlowModal', {
        onError: handleDeviceFlowError,
      });
      void login();
    } catch (error) {
      log.error('GitHub connection error:', error);
      setGithubLoading(false);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to GitHub. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast, checkStatus, login, showModal, handleDeviceFlowError]);

  const cancelGithubConnect = useCallback(() => {
    setGithubLoading(false);
    void rpc.github.authCancel();
    toast({
      title: 'GitHub connection unsuccessful',
      description: 'Device flow was canceled',
    });
  }, [toast]);

  const value: GithubContextValue = {
    authenticated,
    user,
    tokenSource,
    isLoading,
    isInitialized,
    githubLoading,
    needsGhAuth,
    handleGithubConnect,
    cancelGithubConnect,
    login,
    logout,
    checkStatus,
  };

  return <GithubContext.Provider value={value}>{children}</GithubContext.Provider>;
}

export function useGithubContext() {
  const ctx = useContext(GithubContext);
  if (!ctx) {
    throw new Error('useGithubContext must be used inside GithubContextProvider');
  }
  return ctx;
}
