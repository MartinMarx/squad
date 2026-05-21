import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolveCommandPath } from '@main/core/dependencies/probe';
import { LocalExecutionContext } from '@main/core/execution-context/local-execution-context';
import { buildAgentEnv } from '@main/core/pty/pty-env';
import { providerOverrideSettings } from '@main/core/settings/provider-settings-service';
import { log } from '@main/lib/logger';
import { getProvider, type AgentProviderId } from '@shared/agent-provider-registry';
import {
  buildProviderTitleArgs,
  buildTitlePrompt,
  parseAgentTitleOutput,
} from './agent-title-utils';

const REQUEST_TIMEOUT_MS = 30_000;

function resolveCliBinary(
  providerConfig: Awaited<ReturnType<typeof providerOverrideSettings.getItem>>,
  providerId: AgentProviderId
): string | null {
  const configured = providerConfig?.cli?.trim();
  const fallback = getProvider(providerId)?.cli;
  const cli = configured || fallback;
  if (!cli) return null;
  return cli.split(/\s+/)[0] ?? null;
}

async function runProviderCli(
  command: string,
  args: string[],
  cwd: string | undefined
): Promise<string> {
  const execFileAsync = promisify(execFile);
  const env = { ...process.env, ...buildAgentEnv({ agentApiVars: true }) };
  const { stdout } = await execFileAsync(command, args, {
    cwd,
    env,
    timeout: REQUEST_TIMEOUT_MS,
    maxBuffer: 1024 * 1024,
  });
  return stdout;
}

export async function generateTitleWithAgentCli(args: {
  providerId: AgentProviderId;
  prompt: string;
  cwd?: string;
}): Promise<string | null> {
  const trimmed = args.prompt.trim();
  if (!trimmed) return null;

  const providerConfig = await providerOverrideSettings.getItem(args.providerId);
  const cliBinary = resolveCliBinary(providerConfig, args.providerId);
  if (!cliBinary) return null;

  const ctx = new LocalExecutionContext({ root: args.cwd ?? '' });
  const resolvedPath = await resolveCommandPath(cliBinary, ctx);
  if (!resolvedPath) return null;

  const titlePrompt = buildTitlePrompt(trimmed);
  const providerArgs = buildProviderTitleArgs(args.providerId, titlePrompt);
  if (providerArgs.length === 0) return null;

  try {
    const stdout = await runProviderCli(resolvedPath, providerArgs, args.cwd);
    return parseAgentTitleOutput(args.providerId, stdout);
  } catch (error) {
    log.warn('generateTitleWithAgentCli: agent CLI failed', {
      providerId: args.providerId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
