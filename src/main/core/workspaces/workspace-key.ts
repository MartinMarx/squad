import crypto from 'node:crypto';

export function computeWorkspaceKey(type: 'local', absolutePath: string): string {
  const input = `local:${absolutePath}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}
