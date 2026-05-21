import type { AdapterType, RawServerEntry, ServerMap } from '@shared/mcp/types';

function isHttpServer(s: RawServerEntry): boolean {
  return s.type === 'http';
}

function isStdio(s: RawServerEntry): boolean {
  return !isHttpServer(s) && s.command !== undefined;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function transformHttpServers(
  servers: ServerMap,
  fn: (s: RawServerEntry) => RawServerEntry
): ServerMap {
  const result: ServerMap = {};
  for (const [k, v] of Object.entries(servers)) {
    if (typeof v === 'object' && v !== null && isHttpServer(v)) {
      result[k] = fn(deepClone(v));
    } else {
      result[k] = deepClone(v);
    }
  }
  return result;
}

function fwdPassthrough(servers: ServerMap): ServerMap {
  return deepClone(servers);
}

function fwdCursor(servers: ServerMap): ServerMap {
  return transformHttpServers(servers, (s) => {
    const url = s.url ?? '';
    const headers = s.headers ?? {};
    const result: RawServerEntry = { url, headers };
    if (s.env && typeof s.env === 'object') result.env = s.env;
    return result;
  });
}

function fwdCodex(servers: ServerMap): ServerMap {
  const result: ServerMap = {};
  for (const [k, v] of Object.entries(servers)) {
    if (typeof v === 'object' && v !== null && isStdio(v)) {
      result[k] = deepClone(v);
    }
  }
  return result;
}

function revPassthrough(servers: ServerMap): ServerMap {
  return deepClone(servers);
}

function revCursor(servers: ServerMap): ServerMap {
  const result: ServerMap = {};
  for (const [k, v] of Object.entries(servers)) {
    if (typeof v === 'object' && v !== null && 'url' in v && !('command' in v)) {
      result[k] = { ...deepClone(v), type: 'http' };
    } else {
      result[k] = deepClone(v);
    }
  }
  return result;
}

function revCodex(servers: ServerMap): ServerMap {
  return deepClone(servers);
}

const FORWARD: Record<AdapterType, (s: ServerMap) => ServerMap> = {
  passthrough: fwdPassthrough,
  cursor: fwdCursor,
  codex: fwdCodex,
};

const REVERSE: Record<AdapterType, (s: ServerMap) => ServerMap> = {
  passthrough: revPassthrough,
  cursor: revCursor,
  codex: revCodex,
};

export function adaptForward(adapter: AdapterType, servers: ServerMap): ServerMap {
  return FORWARD[adapter](servers);
}

export function adaptReverse(adapter: AdapterType, servers: ServerMap): ServerMap {
  return REVERSE[adapter](servers);
}
