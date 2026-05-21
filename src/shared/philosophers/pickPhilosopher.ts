import { resolveTaskBranchName } from '@shared/resolveTaskBranchName';
import type { Philosopher, PickPhilosopherError, PickedPhilosopher } from './types';

type PickPhilosopherInput = {
  catalog: readonly Philosopher[];
  takenBranchNames: ReadonlySet<string>;
  branchPrefix: string;
  order?: readonly Philosopher[];
};

function branchForSlug(slug: string, branchPrefix: string): string {
  return resolveTaskBranchName({
    rawBranch: slug,
    branchPrefix,
    suffix: '',
    appendRandomSuffix: false,
  });
}

function isBranchTaken(branchName: string, taken: ReadonlySet<string>): boolean {
  return taken.has(branchName);
}

function* candidateSlugs(baseSlug: string): Generator<string> {
  yield baseSlug;
  for (let n = 2; n <= 99; n++) {
    yield `${baseSlug}-${n}`;
  }
}

export function pickPhilosopher(
  input: PickPhilosopherInput
): PickedPhilosopher | PickPhilosopherError {
  const { catalog, takenBranchNames, branchPrefix } = input;
  const order = input.order ?? catalog;

  for (const philosopher of order) {
    const branchName = branchForSlug(philosopher.slug, branchPrefix);
    if (!isBranchTaken(branchName, takenBranchNames)) {
      return {
        slug: philosopher.slug,
        displayName: philosopher.displayName,
        branchName,
      };
    }
  }

  for (const philosopher of order) {
    for (const slug of candidateSlugs(philosopher.slug)) {
      if (slug === philosopher.slug) continue;
      const branchName = branchForSlug(slug, branchPrefix);
      if (!isBranchTaken(branchName, takenBranchNames)) {
        return {
          slug,
          displayName: philosopher.displayName,
          branchName,
        };
      }
    }
  }

  return { type: 'no-philosopher-available' };
}

export function shufflePhilosophers(catalog: readonly Philosopher[], seed?: number): Philosopher[] {
  const copy = [...catalog];
  let state = seed ?? Date.now();
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
