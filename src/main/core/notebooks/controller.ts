import { createRPCController } from '@shared/ipc/rpc';
import { getNotebook } from './getNotebook';
import { saveNotebook } from './saveNotebook';

export const notebookController = createRPCController({
  getNotebook,
  saveNotebook,
});
