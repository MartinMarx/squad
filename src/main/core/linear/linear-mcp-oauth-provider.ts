import type {
  OAuthClientProvider,
  OAuthDiscoveryState,
} from '@modelcontextprotocol/sdk/client/auth.js';
import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import { encryptedAppSecretsStore } from '@main/core/secrets/encrypted-app-secrets-store';
import { KV } from '@main/db/kv';

const LINEAR_OAUTH_TOKENS_SECRET_KEY = 'squad-linear-oauth-tokens';
const LEGACY_LINEAR_TOKEN_SECRET_KEY = 'squad-linear-token';

interface LinearOAuthKVSchema extends Record<string, unknown> {
  clientInformation: OAuthClientInformationMixed;
  discoveryState: OAuthDiscoveryState;
  oauthRedirectUrl: string;
  workspaceDisplayName: string;
}

const linearOAuthKV = new KV<LinearOAuthKVSchema>('linear-oauth');

export class LinearMcpOAuthProvider implements OAuthClientProvider {
  private codeVerifierValue: string | undefined;

  constructor(private readonly redirectUri: URL) {}

  get redirectUrl(): URL {
    return this.redirectUri;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      redirect_uris: [this.redirectUri.toString()],
      client_name: 'Squad',
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    };
  }

  async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
    return (await linearOAuthKV.get('clientInformation')) ?? undefined;
  }

  async saveClientInformation(clientInformation: OAuthClientInformationMixed): Promise<void> {
    await linearOAuthKV.set('clientInformation', clientInformation);
    await linearOAuthKV.set('oauthRedirectUrl', this.redirectUri.toString());
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    const raw = await encryptedAppSecretsStore.getSecret(LINEAR_OAUTH_TOKENS_SECRET_KEY);
    if (!raw) {
      return undefined;
    }

    try {
      return JSON.parse(raw) as OAuthTokens;
    } catch {
      return undefined;
    }
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    await encryptedAppSecretsStore.setSecret(
      LINEAR_OAUTH_TOKENS_SECRET_KEY,
      JSON.stringify(tokens)
    );
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    const { shell } = await import('electron');
    await shell.openExternal(authorizationUrl.toString());
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    this.codeVerifierValue = codeVerifier;
  }

  async codeVerifier(): Promise<string> {
    if (!this.codeVerifierValue) {
      throw new Error('Linear OAuth code verifier is missing.');
    }
    return this.codeVerifierValue;
  }

  async saveDiscoveryState(state: OAuthDiscoveryState): Promise<void> {
    await linearOAuthKV.set('discoveryState', state);
  }

  async discoveryState(): Promise<OAuthDiscoveryState | undefined> {
    return (await linearOAuthKV.get('discoveryState')) ?? undefined;
  }

  async invalidateCredentials(
    scope: 'all' | 'client' | 'tokens' | 'verifier' | 'discovery'
  ): Promise<void> {
    if (scope === 'all' || scope === 'tokens') {
      await Promise.all([
        encryptedAppSecretsStore.deleteSecret(LINEAR_OAUTH_TOKENS_SECRET_KEY),
        encryptedAppSecretsStore.deleteSecret(LEGACY_LINEAR_TOKEN_SECRET_KEY),
      ]);
    }

    if (scope === 'all' || scope === 'client') {
      await linearOAuthKV.del('clientInformation');
      await linearOAuthKV.del('oauthRedirectUrl');
    }

    if (scope === 'all' || scope === 'discovery') {
      await linearOAuthKV.del('discoveryState');
    }

    if (scope === 'all' || scope === 'verifier') {
      this.codeVerifierValue = undefined;
    }
  }
}

export async function createLinearMcpOAuthProviderFromStorage(): Promise<LinearMcpOAuthProvider | null> {
  const redirectUrl = await linearOAuthKV.get('oauthRedirectUrl');
  if (!redirectUrl) {
    return null;
  }

  try {
    return new LinearMcpOAuthProvider(new URL(redirectUrl));
  } catch {
    return null;
  }
}

export async function hasLinearMcpCredentials(): Promise<boolean> {
  const provider = await createLinearMcpOAuthProviderFromStorage();
  if (!provider) {
    return false;
  }

  const tokens = await provider.tokens();
  return !!tokens?.access_token;
}

export async function getStoredLinearWorkspaceName(): Promise<string | undefined> {
  const name = await linearOAuthKV.get('workspaceDisplayName');
  if (typeof name !== 'string') {
    return undefined;
  }

  const trimmed = name.trim();
  return trimmed || undefined;
}

export async function setStoredLinearWorkspaceName(name: string | undefined): Promise<void> {
  if (!name?.trim()) {
    await linearOAuthKV.del('workspaceDisplayName');
    return;
  }

  await linearOAuthKV.set('workspaceDisplayName', name.trim());
}

export async function clearLinearMcpOAuthCredentials(): Promise<void> {
  const { invalidateLinearMcpSession } = await import('./linear-mcp-client');
  await invalidateLinearMcpSession();

  const provider = await createLinearMcpOAuthProviderFromStorage();
  if (provider) {
    await provider.invalidateCredentials('all');
    await linearOAuthKV.del('workspaceDisplayName');
    return;
  }

  await Promise.all([
    encryptedAppSecretsStore.deleteSecret(LINEAR_OAUTH_TOKENS_SECRET_KEY),
    encryptedAppSecretsStore.deleteSecret(LEGACY_LINEAR_TOKEN_SECRET_KEY),
    linearOAuthKV.del('clientInformation'),
    linearOAuthKV.del('discoveryState'),
    linearOAuthKV.del('oauthRedirectUrl'),
    linearOAuthKV.del('workspaceDisplayName'),
  ]);
}
