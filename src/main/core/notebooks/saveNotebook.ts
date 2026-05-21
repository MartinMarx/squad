import { and, eq, sql } from 'drizzle-orm';
import { db } from '@main/db/client';
import { notebooks, tasks } from '@main/db/schema';
import type { SaveNotebookParams, Notebook } from '@shared/notebooks';

export async function saveNotebook(params: SaveNotebookParams): Promise<Notebook> {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, params.taskId), eq(tasks.projectId, params.projectId)))
    .limit(1);

  if (!task) {
    throw new Error('Task not found');
  }

  const content = JSON.stringify(params.content);

  const [row] = await db
    .insert(notebooks)
    .values({
      taskId: params.taskId,
      title: params.title,
      content,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .onConflictDoUpdate({
      target: notebooks.taskId,
      set: {
        title: params.title,
        content,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning();

  return {
    taskId: row.taskId,
    title: row.title ?? '',
    content: params.content,
    updatedAt: row.updatedAt,
  };
}
