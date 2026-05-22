import { events } from '@main/lib/events';
import { taskUpdatedChannel } from '@shared/events/taskEvents';
import { taskService } from './task-service';

export function initializeTaskEventBroadcaster(): void {
  taskService.on('task:updated', (task) => {
    events.emit(taskUpdatedChannel, {
      projectId: task.projectId,
      taskId: task.id,
      patch: task,
    });
  });
}
