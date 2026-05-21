import { createPortSummary, type PortContext, type PortSummary } from './types';

export async function portSshConnections(_ctx: PortContext): Promise<PortSummary> {
  return createPortSummary('ssh_connections');
}
