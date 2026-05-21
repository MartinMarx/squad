export type Philosopher = {
  slug: string;
  displayName: string;
};

export type PickedPhilosopher = Philosopher & {
  branchName: string;
};

export type PickPhilosopherError = {
  type: 'no-philosopher-available';
};
