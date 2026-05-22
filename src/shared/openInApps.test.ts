import { describe, expect, it } from 'vitest';
import { isValidOpenInAppId, OPEN_IN_APPS } from './openInApps';

describe('OPEN_IN_APPS', () => {
  it('registers Ghostty as an open-in terminal option', () => {
    expect(isValidOpenInAppId('ghostty')).toBe(true);
    expect(OPEN_IN_APPS.ghostty).toMatchObject({
      id: 'ghostty',
      iconPath: 'ghostty.png',
      label: 'Ghostty',
      supportsRemote: true,
    });
  });

  it('configures Ghostty launch commands for supported desktop platforms', () => {
    expect(OPEN_IN_APPS.ghostty.platforms.darwin?.bundleIds).toContain('com.mitchellh.ghostty');
    expect(OPEN_IN_APPS.ghostty.platforms.darwin?.openCommands).toContain(
      'open -b com.mitchellh.ghostty {{path}}'
    );
    expect(OPEN_IN_APPS.ghostty.platforms.linux?.openCommands).toEqual([
      'ghostty --working-directory={{path}}',
    ]);
  });
});
