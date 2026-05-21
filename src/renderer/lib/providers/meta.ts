import claudeIcon from '@/assets/images/claude.png';
import cursorlogoIcon from '@/assets/images/cursor.svg?raw';
import openaiIcon from '@/assets/images/openai.svg?raw';
import { AGENT_PROVIDERS, type AgentProviderId } from '@shared/agent-provider-registry';

export type UiAgent = AgentProviderId;

const ICONS: Record<string, string> = {
  'openai.svg': openaiIcon,
  'claude.png': claudeIcon,
  'cursor.svg': cursorlogoIcon,
};

export type AgentMeta = {
  label: string;
  icon?: string;
  /** True when the icon is a raw SVG string rather than an image URL. */
  isSvg?: boolean;
  /** When true, the icon should be colour-inverted in dark mode. */
  invertInDark?: boolean;
  /** Accessible alt text for the provider logo. */
  alt?: string;
  terminalOnly: boolean;
  cli?: string;
  planActivate?: string;
  autoStartCommand?: string;
  autoApproveFlag?: string;
  initialPromptFlag?: string;
  useKeystrokeInjection?: boolean;
  initialPromptViaStdinPipe?: boolean;
};

export const agentMeta: Record<UiAgent, AgentMeta> = Object.fromEntries(
  AGENT_PROVIDERS.map((p) => [
    p.id,
    {
      label: p.name,
      icon: p.icon ? ICONS[p.icon] : undefined,
      isSvg: p.icon ? p.icon.endsWith('.svg') : undefined,
      invertInDark: p.invertInDark,
      alt: p.alt,
      terminalOnly: p.terminalOnly ?? true,
      cli: p.cli,
      planActivate: p.planActivateCommand,
      autoStartCommand: p.autoStartCommand,
      autoApproveFlag: p.autoApproveFlag,
      initialPromptFlag: p.initialPromptFlag,
      useKeystrokeInjection: p.useKeystrokeInjection,
      initialPromptViaStdinPipe: p.initialPromptViaStdinPipe,
    },
  ])
) as Record<UiAgent, AgentMeta>;
