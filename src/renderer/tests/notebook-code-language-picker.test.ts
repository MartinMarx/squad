import { describe, expect, it } from 'vitest';
import {
  CODE_BLOCK_LANGUAGES,
  filterCodeBlockLanguages,
} from '@renderer/features/tasks/notebook/extensions/code-block-languages';

describe('filterCodeBlockLanguages', () => {
  it('returns all languages for an empty query', () => {
    expect(filterCodeBlockLanguages('')).toHaveLength(CODE_BLOCK_LANGUAGES.length);
  });

  it('filters by label and id', () => {
    expect(filterCodeBlockLanguages('type').map((option) => option.id)).toEqual(['typescript']);
    expect(filterCodeBlockLanguages('script').map((option) => option.id)).toEqual([
      'javascript',
      'typescript',
    ]);
  });
});
