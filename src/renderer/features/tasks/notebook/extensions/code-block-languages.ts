export type CodeBlockLanguage = {
  id: string;
  label: string;
};

const LANGUAGE_LABELS: Record<string, string> = {
  arduino: 'Arduino',
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  diff: 'Diff',
  go: 'Go',
  graphql: 'GraphQL',
  ini: 'Ini',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  kotlin: 'Kotlin',
  less: 'Less',
  lua: 'Lua',
  makefile: 'Makefile',
  markdown: 'Markdown',
  objectivec: 'Objective-C',
  perl: 'Perl',
  php: 'PHP',
  'php-template': 'PHP Template',
  plaintext: 'Plain Text',
  python: 'Python',
  'python-repl': 'Python REPL',
  r: 'R',
  ruby: 'Ruby',
  rust: 'Rust',
  scss: 'SCSS',
  shell: 'Shell',
  sql: 'SQL',
  swift: 'Swift',
  typescript: 'TypeScript',
  vbnet: 'VB.NET',
  wasm: 'WebAssembly',
  xml: 'XML',
  yaml: 'YAML',
};

export const CODE_BLOCK_LANGUAGES: CodeBlockLanguage[] = Object.entries(LANGUAGE_LABELS)
  .map(([id, label]) => ({ id, label }))
  .sort((a, b) => {
    if (a.id === 'plaintext') return -1;
    if (b.id === 'plaintext') return 1;
    return a.label.localeCompare(b.label);
  });

export function codeBlockLanguageLabel(language: string | null | undefined) {
  if (!language) return LANGUAGE_LABELS.plaintext;
  return LANGUAGE_LABELS[language] ?? language;
}

export function filterCodeBlockLanguages(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return CODE_BLOCK_LANGUAGES;
  return CODE_BLOCK_LANGUAGES.filter(
    (option) =>
      option.label.toLowerCase().includes(normalized) ||
      option.id.toLowerCase().includes(normalized)
  );
}
