import { describe, expect, it } from 'vitest';
import {
  buildProviderTitleArgs,
  buildTitlePrompt,
  CLAUDE_TITLE_MAX_BUDGET_USD,
  parseAgentTitleOutput,
  sanitizeGeneratedTitle,
  TITLE_GENERATION_MODEL,
} from './agent-title-utils';

describe('buildTitlePrompt', () => {
  it('asks for a summarized title instead of copying the user message', () => {
    const prompt = buildTitlePrompt('Fix the login page crash on mobile');
    expect(prompt).toContain('Do not copy the user message verbatim');
    expect(prompt).toContain('Fix the login page crash on mobile');
  });
});

describe('sanitizeGeneratedTitle', () => {
  it('strips quotes and trailing punctuation', () => {
    expect(sanitizeGeneratedTitle('"Mobile Login Fix"')).toBe('Mobile Login Fix');
  });
});

describe('buildProviderTitleArgs', () => {
  it('uses the cheapest model tier for each provider', () => {
    const prompt = buildTitlePrompt('Fix login crash on mobile');

    expect(buildProviderTitleArgs('claude', prompt)).toEqual(
      expect.arrayContaining([
        '--model',
        TITLE_GENERATION_MODEL.claude,
        '--effort',
        'low',
        '--max-budget-usd',
        CLAUDE_TITLE_MAX_BUDGET_USD,
      ])
    );
    expect(buildProviderTitleArgs('cursor', prompt)).toEqual(
      expect.arrayContaining(['--model', TITLE_GENERATION_MODEL.cursor])
    );
    expect(buildProviderTitleArgs('codex', prompt)).toEqual(
      expect.arrayContaining(['--model', TITLE_GENERATION_MODEL.codex])
    );
  });
});

describe('parseAgentTitleOutput', () => {
  it('reads claude structured output', () => {
    const stdout = JSON.stringify({
      structured_output: { title: 'Mobile Safari Login Fix' },
    });
    expect(parseAgentTitleOutput('claude', stdout)).toBe('Mobile Safari Login Fix');
  });

  it('reads plain text output from cursor-agent', () => {
    expect(parseAgentTitleOutput('cursor', 'Fix Mobile Safari Login Crash\n')).toBe(
      'Fix Mobile Safari Login Crash'
    );
  });

  it('reads codex exec stdout', () => {
    expect(parseAgentTitleOutput('codex', 'Mobile login crash fix')).toBe('Mobile login crash fix');
  });
});
