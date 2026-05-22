import { describe, expect, it } from 'vitest';
import { pickPhilosopher } from './pickPhilosopher';

const catalog = [
  { slug: 'plato', displayName: 'Plato' },
  { slug: 'aristo', displayName: 'Aristotle' },
  { slug: 'kants', displayName: 'Immanuel Kant' },
] as const;

describe('pickPhilosopher', () => {
  it('returns the first philosopher whose branch is unused', () => {
    const result = pickPhilosopher({
      catalog,
      takenBranchNames: new Set(['squad/plato']),
      branchPrefix: 'squad',
    });
    expect(result).toEqual({
      slug: 'aristo',
      displayName: 'Aristotle',
      branchName: 'squad/aristo',
    });
  });

  it('respects branch prefix when checking collisions', () => {
    const result = pickPhilosopher({
      catalog,
      takenBranchNames: new Set(['plato']),
      branchPrefix: '',
    });
    expect(result).toEqual({
      slug: 'aristo',
      displayName: 'Aristotle',
      branchName: 'aristo',
    });
  });

  it('falls back to suffixed slug when base slug branch is taken', () => {
    const result = pickPhilosopher({
      catalog: [{ slug: 'plato', displayName: 'Plato' }],
      takenBranchNames: new Set(['squad/plato']),
      branchPrefix: 'squad',
    });
    expect(result).toEqual({
      slug: 'plato-2',
      displayName: 'Plato',
      branchName: 'squad/plato-2',
    });
  });

  it('returns error when every candidate is taken', () => {
    const taken = new Set<string>();
    for (let n = 2; n <= 99; n++) taken.add(`squad/plato-${n}`);
    taken.add('squad/plato');

    const result = pickPhilosopher({
      catalog: [{ slug: 'plato', displayName: 'Plato' }],
      takenBranchNames: taken,
      branchPrefix: 'squad',
    });
    expect(result).toEqual({ type: 'no-philosopher-available' });
  });
});
