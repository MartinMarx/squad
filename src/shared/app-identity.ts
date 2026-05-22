type ImportMetaWithEnv = ImportMeta & { env?: { VITE_BUILD?: string } };

const isCanary = (import.meta as ImportMetaWithEnv).env?.VITE_BUILD === 'canary';

export const APP_ID = isCanary ? 'com.squad.canary' : 'com.squad.stable';
export const PRODUCT_NAME = isCanary ? 'Squad Canary' : 'Squad';
export const APP_NAME_LOWER = isCanary ? 'squad-canary' : 'squad';
export const ARTIFACT_PREFIX = isCanary ? 'squad-canary' : 'squad';
