import { and, eq } from 'drizzle-orm';
import { db } from '@main/db/client';
import { notebooks, tasks } from '@main/db/schema';
import { EMPTY_NOTEBOOK_DOC, type Notebook } from '@shared/notebooks';

export async function getNotebook(projectId: string, taskId: string): Promise<Notebook> {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
    .limit(1);

  if (!task) {
    throw new Error('Task not found');
  }

  const [row] = await db.select().from(notebooks).where(eq(notebooks.taskId, taskId)).limit(1);

  if (!row) {
    return {
      taskId,
      title: '',
      content: EMPTY_NOTEBOOK_DOC,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    taskId: row.taskId,
    title: row.title ?? '',
    content: JSON.parse(row.content) as Notebook['content'],
    updatedAt: row.updatedAt,
  };
}
