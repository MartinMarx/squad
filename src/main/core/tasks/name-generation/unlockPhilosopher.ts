import { appSettingsService } from '@main/core/settings/settings-service';
import { resolvePhilosopherCatalogSlug } from '@shared/philosophers/resolvePhilosopherCatalogSlug';

export async function unlockPhilosopherFromTaskName(taskName: string): Promise<void> {
  const catalogSlug = resolvePhilosopherCatalogSlug(taskName.trim().toLowerCase());
  if (!catalogSlug) return;

  const settings = await appSettingsService.get('philosophers');
  if (settings.unlocked.includes(catalogSlug)) return;

  await appSettingsService.update('philosophers', {
    unlocked: [...settings.unlocked, catalogSlug],
  });
}
