import { eq, sql } from 'drizzle-orm';
import { workspaceRegistry } from '@main/core/workspaces/workspace-registry';
import { db } from '@main/db/client';
import { tasks } from '@main/db/schema';
import { log } from '@main/lib/logger';
import type { AgentProviderId } from '@shared/agent-provider-registry';
import type { Task } from '@shared/tasks';
import { generateTaskTitle } from '../name-generation/generateTaskTitle';
import { mapTaskRowToTask } from '../utils/utils';

const inFlight = new Set<string>();

export async function maybeGenerateCustomTitle(
  projectId: string,
  taskId: string,
  prompt: string,
  providerId: AgentProviderId
): Promise<Task | null> {
  if (inFlight.has(taskId)) return null;

  const [row] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!row) return null;
  if (row.projectId !== projectId) return null;
  if (row.customTitle != null) return null;

  inFlight.add(taskId);
  try {
    const cwd = row.workspaceId
      ? (workspaceRegistry.get(row.workspaceId)?.path ?? undefined)
      : undefined;
    const title = await generateTaskTitle(providerId, prompt, { cwd });
    if (!title) return null;

    const [updated] = await db
      .update(tasks)
      .set({ customTitle: title, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(tasks.id, taskId))
      .returning();
    return updated ? mapTaskRowToTask(updated) : null;
  } catch (err) {
    log.warn('maybeGenerateCustomTitle: failed', {
      taskId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  } finally {
    inFlight.delete(taskId);
  }
}
