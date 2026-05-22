import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LinearMcpOAuthProvider } from './linear-mcp-oauth-provider';

const mockGetSecret = vi.fn();
const mockSetSecret = vi.fn();
const mockDeleteSecret = vi.fn();
const mockKvGet = vi.fn();
const mockKvSet = vi.fn();
const mockKvDel = vi.fn();

vi.mock('@main/core/secrets/encrypted-app-secrets-store', () => ({
  encryptedAppSecretsStore: {
    getSecret: (...args: unknown[]) => mockGetSecret(...args),
    setSecret: (...args: unknown[]) => mockSetSecret(...args),
    deleteSecret: (...args: unknown[]) => mockDeleteSecret(...args),
  },
}));

vi.mock('@main/db/kv', () => ({
  KV: class {
    get(...args: unknown[]) {
      return mockKvGet(...args);
    }
    set(...args: unknown[]) {
      return mockKvSet(...args);
    }
    del(...args: unknown[]) {
      return mockKvDel(...args);
    }
  },
}));

describe('LinearMcpOAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores OAuth tokens and client registration metadata', async () => {
    const provider = new LinearMcpOAuthProvider(new URL('http://127.0.0.1:8765/callback'));

    await provider.saveTokens({
      access_token: 'access-token',
      token_type: 'Bearer',
      refresh_token: 'refresh-token',
    });
    await provider.saveClientInformation({ client_id: 'client-id' });

    expect(mockSetSecret).toHaveBeenCalledWith(
      'squad-linear-oauth-tokens',
      JSON.stringify({
        access_token: 'access-token',
        token_type: 'Bearer',
        refresh_token: 'refresh-token',
      })
    );
    expect(mockKvSet).toHaveBeenCalledWith('clientInformation', { client_id: 'client-id' });
    expect(mockKvSet).toHaveBeenCalledWith('oauthRedirectUrl', 'http://127.0.0.1:8765/callback');
  });

  it('clears all stored credentials when invalidated', async () => {
    const provider = new LinearMcpOAuthProvider(new URL('http://127.0.0.1:8765/callback'));

    await provider.invalidateCredentials('all');

    expect(mockDeleteSecret).toHaveBeenCalledWith('squad-linear-oauth-tokens');
    expect(mockDeleteSecret).toHaveBeenCalledWith('squad-linear-token');
    expect(mockKvDel).toHaveBeenCalledWith('clientInformation');
    expect(mockKvDel).toHaveBeenCalledWith('oauthRedirectUrl');
    expect(mockKvDel).toHaveBeenCalledWith('discoveryState');
  });
});
