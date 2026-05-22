import { log } from '@main/lib/logger';
import { createRPCController } from '@shared/ipc/rpc';
import { squadAccountService } from './services/squad-account-service';

export const accountController = createRPCController({
  getSession: async () => {
    try {
      return await squadAccountService.getSession();
    } catch (error) {
      log.error('Failed to get account session:', error);
      return { user: null, isSignedIn: false, hasAccount: false };
    }
  },

  signIn: async (provider?: string) => {
    try {
      const result = await squadAccountService.signIn(provider);
      return { success: true, user: result.user };
    } catch (error) {
      log.error('Account sign-in failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign-in failed',
      };
    }
  },

  signOut: async () => {
    try {
      await squadAccountService.signOut();
      return { success: true };
    } catch (error) {
      log.error('Account sign-out failed:', error);
      return { success: false, error: 'Sign-out failed' };
    }
  },

  checkHealth: async () => {
    try {
      return await squadAccountService.checkServerHealth();
    } catch {
      return false;
    }
  },

  validateSession: async () => {
    try {
      return await squadAccountService.validateSession();
    } catch {
      return false;
    }
  },
});
