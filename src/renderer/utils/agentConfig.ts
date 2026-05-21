import { type AgentProviderId } from '@shared/agent-provider-registry';
import claudeLogo from '../../assets/images/claude.png';
import cursorLogoSvg from '../../assets/images/cursor.svg?raw';
import openaiLogoSvg from '../../assets/images/openai.svg?raw';

export type AgentInfo = {
  name: string;
  logo: string;
  alt: string;
  invertInDark?: boolean;
  isSvg?: boolean;
};

export const agentConfig: Record<AgentProviderId, AgentInfo> = {
  claude: { name: 'Claude Code', logo: claudeLogo, alt: 'Claude Code' },
  codex: { name: 'Codex', logo: openaiLogoSvg, alt: 'Codex', isSvg: true },
  cursor: { name: 'Cursor', logo: cursorLogoSvg, alt: 'Cursor CLI', isSvg: true },
};
