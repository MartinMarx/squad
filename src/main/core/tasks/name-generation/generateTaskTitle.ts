import { generateTitleWithAgentCli } from '@main/core/conversations/name-generation/agent-title-cli';
import type { AgentProviderId } from '@shared/agent-provider-registry';

export async function generateTaskTitle(
  providerId: AgentProviderId,
  prompt: string,
  options: { cwd?: string } = {}
): Promise<string | null> {
  return generateTitleWithAgentCli({ providerId, prompt, cwd: options.cwd });
}
