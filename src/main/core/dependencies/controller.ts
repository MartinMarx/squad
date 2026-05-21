import { createRPCController } from '@shared/ipc/rpc';
import { getDependencyManager } from './dependency-manager';
import type { DependencyCategory, DependencyId } from '@shared/dependencies';

export const dependenciesController = createRPCController({
  getAll: async () => {
    const mgr = await getDependencyManager();
    return Object.fromEntries(mgr.getAll());
  },
  get: async (id: DependencyId) => {
    const mgr = await getDependencyManager();
    return mgr.get(id);
  },
  getByCategory: async (cat: DependencyCategory) => {
    const mgr = await getDependencyManager();
    return mgr.getByCategory(cat);
  },
  probe: async (id: DependencyId) => {
    const mgr = await getDependencyManager();
    return mgr.probe(id);
  },
  probeAll: async () => {
    const mgr = await getDependencyManager();
    return mgr.probeAll();
  },
  probeCategory: async (cat: DependencyCategory) => {
    const mgr = await getDependencyManager();
    return mgr.probeCategory(cat);
  },
  install: async (id: DependencyId) => {
    const mgr = await getDependencyManager();
    return mgr.install(id);
  },
});
