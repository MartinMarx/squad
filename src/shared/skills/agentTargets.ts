import * as os from 'os';
import * as path from 'path';

export interface AgentSyncTarget {
  id: string;
  name: string;
  /** Directory where the agent looks for skills/commands */
  getSkillDir: (skillId: string) => string;
  /** Top-level config dir to check if agent is installed */
  configDir: string;
}

const home = os.homedir();

/**
 * Agents that Squad syncs skills INTO (symlinks from ~/.agentskills/).
 * Each agent has its own native directory for skills/commands.
 */
export const agentTargets: AgentSyncTarget[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    configDir: path.join(home, '.claude'),
    getSkillDir: (skillId: string) => path.join(home, '.claude', 'commands', skillId),
  },
  {
    id: 'codex',
    name: 'Codex',
    configDir: path.join(home, '.codex'),
    getSkillDir: (skillId: string) => path.join(home, '.codex', 'skills', skillId),
  },
  {
    id: 'cursor',
    name: 'Cursor',
    configDir: path.join(home, '.cursor'),
    getSkillDir: (skillId: string) => path.join(home, '.cursor', 'skills', skillId),
  },
];

/**
 * All global directories where agents store skills.
 * Derived from agentTargets (parent dir of each skill dir) plus shared/cross-agent paths.
 * Used to discover externally-installed skills (not installed through Squad).
 */
export const skillScanPaths: string[] = [
  ...new Set(agentTargets.map((t) => path.dirname(t.getSkillDir('_placeholder')))),
  path.join(home, '.claude', 'skills'),
  path.join(home, '.agent', 'skills'),
  path.join(home, '.agents', 'skills'),
];
