export const ACCOUNT_CONFIG = {
  authServer: {
    baseUrl: 'https://auth.squad.sh',
    authTimeoutMs: Number(process.env.SQUAD_AUTH_TIMEOUT_MS || 300000),
  },
};
