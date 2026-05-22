export {
  APP_ID,
  APP_NAME_LOWER,
  ARTIFACT_PREFIX,
  PRODUCT_NAME,
} from '../../../src/shared/app-identity.ts';

export const RELEASE_DIR = 'release';
export const NATIVE_MODULES = ['better-sqlite3', 'node-pty', '@parcel/watcher'];

export function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}
