import { describe, expect, it, vi } from 'vitest';
import { pickPhilosopherName } from './pickPhilosopherName';

vi.mock('@main/core/projects/project-manager', () => ({
  projectManager: { getProject: vi.fn() },
}));

vi.mock('@main/core/settings/settings-service', () => ({
  appSettingsService: { get: vi.fn() },
}));

import { projectManager } from '@main/core/projects/project-manager';
import { appSettingsService } from '@main/core/settings/settings-service';

describe('pickPhilosopherName', () => {
  it('returns project-not-found when project is missing', async () => {
    vi.mocked(projectManager.getProject).mockReturnValue(undefined);
    await expect(pickPhilosopherName({ projectId: 'missing' })).resolves.toEqual({
      type: 'project-not-found',
    });
  });

  it('returns an unused philosopher branch for the project', async () => {
    vi.mocked(projectManager.getProject).mockReturnValue({
      repository: {
        getLocalBranchesPayload: vi.fn().mockResolvedValue({
          localBranches: [{ branch: 'squad/plato' }],
          currentBranch: 'main',
          isUnborn: false,
        }),
      },
    } as never);
    vi.mocked(appSettingsService.get).mockResolvedValue({
      pushOnCreate: true,
      branchPrefix: 'squad',
      appendRandomBranchSuffix: true,
      tmuxByDefault: false,
    });

    const result = await pickPhilosopherName({ projectId: 'p1' });
    expect(result).toMatchObject({
      slug: expect.any(String),
      displayName: expect.any(String),
      branchName: expect.stringMatching(/^squad\//),
    });
    if ('type' in result) throw new Error('expected picked philosopher');
    expect(result.branchName).not.toBe('squad/plato');
  });
});
