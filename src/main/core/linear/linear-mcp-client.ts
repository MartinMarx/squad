import { auth } from '@modelcontextprotocol/sdk/client/auth.js';
import { Client, type Client as LinearMcpClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { LINEAR_MCP_SERVER_URL } from './linear-mcp-oauth-flow';
import {
  createLinearMcpOAuthProviderFromStorage,
  type LinearMcpOAuthProvider,
} from './linear-mcp-oauth-provider';
import { parseLinearMcpToolResult } from './linear-mcp-tool-result';

export { parseLinearMcpToolResult } from './linear-mcp-tool-result';

const SESSION_IDLE_MS = 45_000;

type PooledSession = {
  client: LinearMcpClient;
  transport: StreamableHTTPClientTransport;
  provider: LinearMcpOAuthProvider;
  idleTimer: ReturnType<typeof setTimeout> | undefined;
};

let pooledSession: PooledSession | null = null;
let sessionQueue: Promise<void> = Promise.resolve();

function scheduleSessionClose(session: PooledSession): void {
  if (session.idleTimer) {
    clearTimeout(session.idleTimer);
  }

  session.idleTimer = setTimeout(() => {
    void closePooledSession();
  }, SESSION_IDLE_MS);
}

async function closePooledSession(): Promise<void> {
  const session = pooledSession;
  pooledSession = null;

  if (!session) {
    return;
  }

  if (session.idleTimer) {
    clearTimeout(session.idleTimer);
  }

  try {
    await session.client.close();
  } catch {
    // Ignore close errors during idle cleanup.
  }
}

async function createPooledSession(): Promise<PooledSession> {
  const provider = await createLinearMcpOAuthProviderFromStorage();
  if (!provider) {
    throw new Error('Linear is not connected.');
  }

  const authResult = await auth(provider, { serverUrl: LINEAR_MCP_SERVER_URL });
  if (authResult !== 'AUTHORIZED') {
    throw new Error('Linear OAuth session is not authorized.');
  }

  const transport = new StreamableHTTPClientTransport(new URL(LINEAR_MCP_SERVER_URL), {
    authProvider: provider,
  });
  const client = new Client({ name: 'emdash', version: '1.0.0' });
  await client.connect(transport);

  const session: PooledSession = {
    client,
    transport,
    provider,
    idleTimer: undefined,
  };
  scheduleSessionClose(session);
  return session;
}

async function getPooledSession(): Promise<PooledSession> {
  if (pooledSession) {
    scheduleSessionClose(pooledSession);
    return pooledSession;
  }

  const session = await createPooledSession();
  pooledSession = session;
  return session;
}

async function withSessionLock<T>(fn: () => Promise<T>): Promise<T> {
  const previous = sessionQueue;
  let release = () => {};
  sessionQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;

  try {
    return await fn();
  } finally {
    release();
  }
}

export async function invalidateLinearMcpSession(): Promise<void> {
  await withSessionLock(async () => {
    await closePooledSession();
  });
}

export async function callToolOnLinearMcpClient<T>(
  client: LinearMcpClient,
  toolName: string,
  args: Record<string, unknown>
): Promise<T> {
  const result = (await client.callTool({
    name: toolName,
    arguments: args,
  })) as CallToolResult;
  return parseLinearMcpToolResult<T>(result);
}

export async function withLinearMcpClient<T>(
  fn: (client: LinearMcpClient) => Promise<T>
): Promise<T> {
  return withSessionLock(async () => {
    try {
      const session = await getPooledSession();
      return await fn(session.client);
    } catch (error) {
      await closePooledSession();
      throw error;
    }
  });
}

export async function callLinearMcpTool<T>(
  toolName: string,
  args: Record<string, unknown>
): Promise<T> {
  return withLinearMcpClient((client) => callToolOnLinearMcpClient<T>(client, toolName, args));
}
