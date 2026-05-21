import type { AgentProviderId } from '@shared/agent-provider-registry';
import { generateTitleWithAgentCli } from './agent-title-cli';

export async function generateConversationTitle(
  providerId: AgentProviderId,
  prompt: string,
  options: { cwd?: string } = {}
): Promise<string | null> {
  return generateTitleWithAgentCli({ providerId, prompt, cwd: options.cwd });
}
