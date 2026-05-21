import type { AgentProviderId } from '@shared/agent-provider-registry';

const MAX_TITLE_LENGTH = 60;

/** Cheapest/fastest model per provider for one-shot background title generation. */
export const TITLE_GENERATION_MODEL = {
  claude: 'haiku',
  cursor: 'gpt-5.5-none-fast',
  codex: 'gpt-5.3-codex-low',
} as const satisfies Record<AgentProviderId, string>;

export const CLAUDE_TITLE_MAX_BUDGET_USD = '0.05';

export function buildTitlePrompt(userPrompt: string): string {
  return [
    'Summarize this coding agent task as a short tab title (3-6 words).',
    'Do not copy the user message verbatim.',
    'Return only the title.',
    '',
    'Task:',
    userPrompt.trim(),
  ].join('\n');
}

export function sanitizeGeneratedTitle(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '');
  if (!cleaned || cleaned.length < 2) return null;
  if (cleaned.length <= MAX_TITLE_LENGTH) return cleaned;
  return `${cleaned.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

export function parseAgentTitleOutput(providerId: AgentProviderId, stdout: string): string | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;

  if (providerId === 'claude') {
    const jsonStart = trimmed.indexOf('{');
    if (jsonStart === -1) return null;
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart)) as {
        structured_output?: { title?: string };
      };
      return sanitizeGeneratedTitle(parsed.structured_output?.title ?? '');
    } catch {
      return null;
    }
  }

  const lastLine = trimmed.split('\n').at(-1)?.trim() ?? trimmed;
  return sanitizeGeneratedTitle(lastLine);
}

export const TITLE_JSON_SCHEMA = JSON.stringify({
  type: 'object',
  properties: { title: { type: 'string', maxLength: MAX_TITLE_LENGTH } },
  required: ['title'],
});

export const CLAUDE_DISALLOWED_TOOLS =
  'Bash,Edit,Write,Read,Glob,Grep,WebFetch,WebSearch,Task,Agent,NotebookEdit';

export function buildProviderTitleArgs(providerId: AgentProviderId, titlePrompt: string): string[] {
  switch (providerId) {
    case 'claude':
      return [
        '-p',
        '--no-session-persistence',
        '--output-format',
        'json',
        '--json-schema',
        TITLE_JSON_SCHEMA,
        '--disallowed-tools',
        CLAUDE_DISALLOWED_TOOLS,
        '--model',
        TITLE_GENERATION_MODEL.claude,
        '--effort',
        'low',
        '--max-budget-usd',
        CLAUDE_TITLE_MAX_BUDGET_USD,
        titlePrompt,
      ];
    case 'cursor':
      return [
        '-p',
        '--trust',
        '--output-format',
        'text',
        '--model',
        TITLE_GENERATION_MODEL.cursor,
        titlePrompt,
      ];
    case 'codex':
      return [
        'exec',
        '--skip-git-repo-check',
        '--sandbox',
        'read-only',
        '--dangerously-bypass-approvals-and-sandbox',
        '--model',
        TITLE_GENERATION_MODEL.codex,
        titlePrompt,
      ];
    default:
      return [];
  }
}
