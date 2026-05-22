import { eq, sql } from 'drizzle-orm';
import { db } from '@main/db/client';
import { tasks } from '@main/db/schema';
import { err, ok, type Result } from '@shared/result';
import type { RenameTaskError, RenameTaskSuccess } from '@shared/tasks';
import { mapTaskRowToTask } from '../utils/utils';

export async function renameTask(
  _projectId: string,
  taskId: string,
  newName: string
): Promise<Result<RenameTaskSuccess, RenameTaskError>> {
  const [updatedRow] = await db
    .update(tasks)
    .set({
      customTitle: newName,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updatedRow) return err({ type: 'task-not-found', taskId });

  return ok({ task: mapTaskRowToTask(updatedRow) });
}
