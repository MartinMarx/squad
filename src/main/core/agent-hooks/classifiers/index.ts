import type { AgentProviderId } from '@shared/agent-provider-registry';
import type { ProviderClassifier } from './base';
import { createCursorClassifier } from './cursor';
import { createGenericClassifier } from './generic';

export type { ProviderClassifier, ClassificationResult } from './base';

const classifierFactories: Partial<Record<AgentProviderId, () => ProviderClassifier>> = {
  cursor: createCursorClassifier,
};

export function createClassifier(providerId: AgentProviderId): ProviderClassifier {
  const factory = classifierFactories[providerId];
  return factory ? factory() : createGenericClassifier();
}
