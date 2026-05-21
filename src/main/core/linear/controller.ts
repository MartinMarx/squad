import { createRPCController } from '@shared/ipc/rpc';
import { linearConnectionService } from './linear-connection-service';

export const linearController = createRPCController({
  connectOAuth: async () => linearConnectionService.connectOAuth(),

  cancelOAuth: async () => {
    linearConnectionService.cancelOAuth();
    return { success: true };
  },

  checkConnection: async () => linearConnectionService.checkConnection(),

  clearToken: async () => linearConnectionService.clearToken(),
});
