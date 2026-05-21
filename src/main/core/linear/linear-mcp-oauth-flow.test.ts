import * as http from 'node:http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeLinearMcpOAuthFlow, LINEAR_MCP_SERVER_URL } from './linear-mcp-oauth-flow';

const mockAuth = vi.fn();
const savedCodeVerifiers: string[] = [];
const secretStore = new Map<string, string>();

vi.mock('@modelcontextprotocol/sdk/client/auth.js', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('electron', () => ({
  shell: {
    openExternal: vi.fn(),
  },
}));

vi.mock('@main/core/secrets/encrypted-app-secrets-store', () => ({
  encryptedAppSecretsStore: {
    getSecret: (key: string) => Promise.resolve(secretStore.get(key) ?? null),
    setSecret: (key: string, value: string) => {
      secretStore.set(key, value);
      return Promise.resolve();
    },
    deleteSecret: (key: string) => {
      secretStore.delete(key);
      return Promise.resolve();
    },
  },
}));

vi.mock('@main/db/kv', () => ({
  KV: class {
    private store = new Map<string, unknown>();
    get(key: string) {
      return Promise.resolve(this.store.get(key) ?? null);
    }
    set(key: string, value: unknown) {
      this.store.set(key, value);
      return Promise.resolve();
    }
    del(key: string) {
      this.store.delete(key);
      return Promise.resolve();
    }
  },
}));

vi.mock('./linear-mcp-oauth-provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./linear-mcp-oauth-provider')>();
  return {
    ...actual,
    LinearMcpOAuthProvider: class extends actual.LinearMcpOAuthProvider {
      async saveCodeVerifier(codeVerifier: string): Promise<void> {
        savedCodeVerifiers.push(codeVerifier);
        await super.saveCodeVerifier(codeVerifier);
      }
    },
  };
});

describe('executeLinearMcpOAuthFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedCodeVerifiers.length = 0;
    secretStore.clear();
  });

  it('reuses the same OAuth provider when exchanging the authorization code', async () => {
    let capturedProvider: {
      redirectUrl: URL;
      saveCodeVerifier: (codeVerifier: string) => Promise<void>;
      codeVerifier: () => Promise<string>;
      saveTokens: (tokens: { access_token: string; token_type: string }) => Promise<void>;
    } | null = null;

    mockAuth.mockImplementation(async (provider, options: { authorizationCode?: string }) => {
      capturedProvider ??= provider;

      if (!options.authorizationCode) {
        await provider.saveCodeVerifier('test-code-verifier');
        return 'REDIRECT';
      }

      expect(provider).toBe(capturedProvider);
      expect(await provider.codeVerifier()).toBe('test-code-verifier');
      await provider.saveTokens({
        access_token: 'linear-access-token',
        token_type: 'Bearer',
      });
      return 'AUTHORIZED';
    });

    const flowPromise = executeLinearMcpOAuthFlow();

    await vi.waitFor(() => {
      expect(capturedProvider).toBeTruthy();
    });

    const callbackUrl = new URL(capturedProvider!.redirectUrl);
    callbackUrl.searchParams.set('code', 'auth-code');

    await new Promise<void>((resolve, reject) => {
      const request = http.request(
        {
          hostname: callbackUrl.hostname,
          port: callbackUrl.port,
          path: `${callbackUrl.pathname}${callbackUrl.search}`,
          method: 'GET',
        },
        () => resolve()
      );
      request.on('error', reject);
      request.end();
    });

    const tokens = await flowPromise;

    expect(mockAuth).toHaveBeenCalledTimes(2);
    expect(mockAuth).toHaveBeenNthCalledWith(1, capturedProvider, {
      serverUrl: LINEAR_MCP_SERVER_URL,
    });
    expect(mockAuth).toHaveBeenNthCalledWith(2, capturedProvider, {
      serverUrl: LINEAR_MCP_SERVER_URL,
      authorizationCode: 'auth-code',
    });
    expect(savedCodeVerifiers).toEqual(['test-code-verifier']);
    expect(tokens).toEqual({
      access_token: 'linear-access-token',
      token_type: 'Bearer',
    });
  });
});
