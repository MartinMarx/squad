import { basename } from 'node:path';
import { eq } from 'drizzle-orm';
import { projects } from '@main/db/schema';
import { log } from '@main/lib/logger';
import { localProjectIdentityKey } from '../../legacy-source/project-identity';
import {
  isUniqueConstraintError,
  readLegacyRows,
  toInteger,
  toIsoTimestamp,
  toTrimmedString,
} from './helpers';
import { insertWithRegeneratedId } from './insert';
import { createPortSummary, type PortContext, type PortSummary } from './types';

function pickDefaultProjectName(projectPath: string, fallbackId: string): string {
  const derived = basename(projectPath.trim());
  return derived.length > 0 ? derived : `Legacy Project ${fallbackId.slice(0, 8)}`;
}

export async function portProjects({
  appDb,
  legacyDb,
  remap,
  skipLegacyProjectIds,
}: PortContext & {
  skipLegacyProjectIds?: ReadonlySet<string>;
}): Promise<PortSummary> {
  const summary = createPortSummary('projects');
  const nowIso = new Date().toISOString();

  const existingProjectRows = await appDb
    .select({
      id: projects.id,
      path: projects.path,
      workspaceProvider: projects.workspaceProvider,
    })
    .from(projects)
    .execute();

  const projectIds = new Set<string>();
  const localKeyToProjectId = new Map<string, string>();

  for (const row of existingProjectRows) {
    projectIds.add(row.id);
    if (row.workspaceProvider !== 'local') continue;
    localKeyToProjectId.set(localProjectIdentityKey(row.path), row.id);
  }

  const legacyRows = readLegacyRows(legacyDb, 'projects', [
    'id',
    'name',
    'path',
    'base_ref',
    'is_remote',
    'remote_path',
    'ssh_connection_id',
    'created_at',
    'updated_at',
  ]);

  for (const row of legacyRows) {
    summary.considered += 1;

    const legacyProjectId = toTrimmedString(row.id);
    if (!legacyProjectId) {
      summary.skippedInvalid += 1;
      log.warn('legacy-port: projects: skipping invalid row (missing id)');
      continue;
    }

    if (skipLegacyProjectIds?.has(legacyProjectId)) {
      summary.skippedDedup += 1;
      continue;
    }

    const isRemote = toInteger(row.is_remote) === 1;
    if (isRemote) {
      summary.skippedInvalid += 1;
      log.warn('legacy-port: projects: skipping remote SSH project (SSH projects are no longer supported)', {
        legacyProjectId,
      });
      continue;
    }

    const createdAt = toIsoTimestamp(row.created_at, nowIso);
    const updatedAt = toIsoTimestamp(row.updated_at, nowIso);

    const localPath = toTrimmedString(row.path);
    if (!localPath) {
      summary.skippedInvalid += 1;
      log.warn('legacy-port: projects: skipping local row with missing path', {
        legacyProjectId,
      });
      continue;
    }

    const dedupKey = localProjectIdentityKey(localPath);
    const existingProjectId = localKeyToProjectId.get(dedupKey);
    if (existingProjectId) {
      remap.projectId.set(legacyProjectId, existingProjectId);
      summary.skippedDedup += 1;
      continue;
    }

    const insertValues = {
      id: legacyProjectId,
      name: toTrimmedString(row.name) ?? pickDefaultProjectName(localPath, legacyProjectId),
      path: localPath,
      workspaceProvider: 'local' as const,
      baseRef: toTrimmedString(row.base_ref) ?? null,
      sshConnectionId: null,
      createdAt,
      updatedAt,
    };

    const insertResult = await insertWithRegeneratedId({
      initialId: legacyProjectId,
      existingIds: projectIds,
      uniqueConstraintDetail: 'projects.id',
      setId: (id) => {
        insertValues.id = id;
      },
      insert: () => appDb.insert(projects).values(insertValues).execute(),
    });

    if (!insertResult.inserted) {
      if (isUniqueConstraintError(insertResult.error, 'projects.path')) {
        const [existingByPath] = await appDb
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.path, localPath))
          .limit(1)
          .execute();

        if (existingByPath) {
          remap.projectId.set(legacyProjectId, existingByPath.id);
          summary.skippedDedup += 1;
        } else {
          summary.skippedError += 1;
          log.warn('legacy-port: projects: path conflict but no surviving row found', {
            legacyProjectId,
            projectPath: localPath,
          });
        }
      } else {
        summary.skippedError += 1;
        log.warn('legacy-port: projects: failed to insert row', {
          legacyProjectId,
          error:
            insertResult.error instanceof Error
              ? insertResult.error.message
              : String(insertResult.error),
        });
      }
      continue;
    }

    remap.projectId.set(legacyProjectId, insertResult.id);
    projectIds.add(insertResult.id);
    summary.inserted += 1;
    localKeyToProjectId.set(localProjectIdentityKey(localPath), insertResult.id);
  }

  return summary;
}
