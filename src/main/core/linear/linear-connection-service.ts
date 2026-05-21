import { log } from '@main/lib/logger';
import { telemetryService } from '@main/lib/telemetry';
import { ISSUE_PROVIDER_CAPABILITIES, type ConnectionStatus } from '@shared/issue-providers';
import {
  getLinearWorkspaceName,
  invalidateLinearIssueListCache,
  verifyLinearMcpConnection,
} from './linear-mcp-issue-service';
import { cancelLinearMcpOAuthFlow, executeLinearMcpOAuthFlow } from './linear-mcp-oauth-flow';
import {
  clearLinearMcpOAuthCredentials,
  getStoredLinearWorkspaceName,
  hasLinearMcpCredentials,
  setStoredLinearWorkspaceName,
} from './linear-mcp-oauth-provider';

export class LinearConnectionService {
  async connectOAuth(): Promise<{ success: boolean; workspaceName?: string; error?: string }> {
    try {
      await clearLinearMcpOAuthCredentials();

      await executeLinearMcpOAuthFlow();
      await verifyLinearMcpConnection();
      const workspaceName = await getLinearWorkspaceName().catch(() => undefined);
      await setStoredLinearWorkspaceName(workspaceName);

      telemetryService.capture('integration_connected', { provider: 'linear' });

      return {
        success: true,
        workspaceName,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to connect Linear via OAuth.';
      return { success: false, error: message };
    }
  }

  cancelOAuth(): void {
    cancelLinearMcpOAuthFlow();
  }

  async clearToken(): Promise<{ success: boolean; error?: string }> {
    try {
      this.cancelOAuth();
      invalidateLinearIssueListCache();
      await clearLinearMcpOAuthCredentials();
      telemetryService.capture('integration_disconnected', { provider: 'linear' });
      return { success: true };
    } catch (error) {
      log.error('Failed to clear Linear OAuth credentials:', error);
      return {
        success: false,
        error: 'Unable to remove Linear credentials from secure storage.',
      };
    }
  }

  async checkConnection(): Promise<ConnectionStatus> {
    try {
      if (!(await hasLinearMcpCredentials())) {
        return {
          connected: false,
          capabilities: ISSUE_PROVIDER_CAPABILITIES.linear,
        };
      }

      const displayName = await getStoredLinearWorkspaceName();

      return {
        connected: true,
        displayName,
        capabilities: ISSUE_PROVIDER_CAPABILITIES.linear,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to verify Linear connection.';
      return {
        connected: false,
        error: message,
        capabilities: ISSUE_PROVIDER_CAPABILITIES.linear,
      };
    }
  }

  async isConnected(): Promise<boolean> {
    return hasLinearMcpCredentials();
  }
}

export const linearConnectionService = new LinearConnectionService();
