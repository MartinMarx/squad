import * as http from 'node:http';
import { auth } from '@modelcontextprotocol/sdk/client/auth.js';
import type { OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js';
import { log } from '@main/lib/logger';
import { LinearMcpOAuthProvider } from './linear-mcp-oauth-provider';

export const LINEAR_MCP_SERVER_URL = 'https://mcp.linear.app/mcp';

const OAUTH_TIMEOUT_MS = 300_000;

type PendingOAuthFlow = {
  abort: () => void;
};

let pendingFlow: PendingOAuthFlow | null = null;

export function cancelLinearMcpOAuthFlow(): void {
  pendingFlow?.abort();
  pendingFlow = null;
}

export async function executeLinearMcpOAuthFlow(): Promise<OAuthTokens> {
  cancelLinearMcpOAuthFlow();

  return new Promise<OAuthTokens>((resolve, reject) => {
    const server = http.createServer();
    let settled = false;
    let oauthProvider: LinearMcpOAuthProvider | null = null;

    const finish = (handler: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      pendingFlow = null;
      server.close();
      handler();
    };

    const fail = (error: Error) => {
      finish(() => reject(error));
    };

    const succeed = (tokens: OAuthTokens) => {
      finish(() => resolve(tokens));
    };

    pendingFlow = {
      abort: () => fail(new Error('Linear OAuth authentication was cancelled.')),
    };

    const timeoutId = setTimeout(() => {
      fail(new Error('Linear OAuth authentication timed out.'));
    }, OAUTH_TIMEOUT_MS);

    server.on('error', (error) => {
      fail(error instanceof Error ? error : new Error(String(error)));
    });

    server.listen(0, '127.0.0.1', () => {
      void (async () => {
        try {
          const address = server.address();
          if (!address || typeof address === 'string') {
            fail(new Error('Unable to start Linear OAuth callback server.'));
            return;
          }

          const redirectUri = new URL(`http://127.0.0.1:${address.port}/callback`);
          oauthProvider = new LinearMcpOAuthProvider(redirectUri);
          await oauthProvider.invalidateCredentials('client');

          const initialResult = await auth(oauthProvider, { serverUrl: LINEAR_MCP_SERVER_URL });
          if (initialResult === 'AUTHORIZED') {
            const tokens = await oauthProvider.tokens();
            if (!tokens?.access_token) {
              fail(new Error('Linear OAuth completed without access token.'));
              return;
            }
            succeed(tokens);
            return;
          }

          if (initialResult !== 'REDIRECT') {
            fail(new Error('Unexpected Linear OAuth result.'));
          }
        } catch (error) {
          fail(error instanceof Error ? error : new Error(String(error)));
        }
      })();
    });

    server.on('request', (req, res) => {
      void (async () => {
        if (!req.url) {
          res.writeHead(400).end();
          return;
        }

        const requestUrl = new URL(req.url, `http://${req.headers.host ?? '127.0.0.1'}`);
        if (requestUrl.pathname !== '/callback') {
          res.writeHead(404).end();
          return;
        }

        const oauthError = requestUrl.searchParams.get('error');
        if (oauthError) {
          res.writeHead(400).end('Authorization failed');
          fail(
            new Error(
              requestUrl.searchParams.get('error_description') ??
                `Linear OAuth failed: ${oauthError}`
            )
          );
          return;
        }

        const authorizationCode = requestUrl.searchParams.get('code');
        if (!authorizationCode) {
          res.writeHead(400).end('Missing authorization code');
          fail(new Error('Linear OAuth callback did not include an authorization code.'));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          '<!doctype html><html><body><p>Linear connected. You can close this window and return to Emdash.</p></body></html>'
        );

        try {
          if (!oauthProvider) {
            fail(new Error('Linear OAuth flow has not started.'));
            return;
          }

          const result = await auth(oauthProvider, {
            serverUrl: LINEAR_MCP_SERVER_URL,
            authorizationCode,
          });

          if (result !== 'AUTHORIZED') {
            fail(new Error('Linear OAuth authorization did not complete.'));
            return;
          }

          const tokens = await oauthProvider.tokens();
          if (!tokens?.access_token) {
            fail(new Error('Linear OAuth completed without access token.'));
            return;
          }

          succeed(tokens);
        } catch (error) {
          log.error('[Linear] OAuth callback failed:', error);
          fail(error instanceof Error ? error : new Error(String(error)));
        }
      })();
    });
  });
}
