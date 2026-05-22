import { computed, makeObservable, observable, reaction, runInAction } from 'mobx';
import {
  asMounted,
  getProjectManagerStore,
} from '@renderer/features/projects/stores/project-selectors';
import { isRegistered, type TaskStore } from '@renderer/features/tasks/stores/task-store';
import { events } from '@renderer/lib/ipc';
import { agentEventChannel, agentSessionExitedChannel } from '@shared/events/agentEvents';
import { prUpdatedChannel } from '@shared/events/prEvents';
import type { PullRequest } from '@shared/pull-requests';
import type { TaskLifecycleStatus } from '@shared/tasks';

export type HomeActivityKind =
  | 'agent-finished'
  | 'agent-errored'
  | 'agent-awaiting-input'
  | 'pr-opened'
  | 'pr-approved'
  | 'pr-changes-requested'
  | 'pr-merged'
  | 'pr-ci-failed'
  | 'task-status-changed'
  | 'task-created';

export type HomeActivityEntry = {
  id: string;
  kind: HomeActivityKind;
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  /** ISO timestamp. */
  at: string;
  details?: {
    fromStatus?: TaskLifecycleStatus;
    toStatus?: TaskLifecycleStatus;
    prUrl?: string;
    prTitle?: string;
  };
};

const MAX_ENTRIES = 200;
const RETENTION_MS = 24 * 60 * 60 * 1000; // 24h
const AWAITING_INPUT_DEBOUNCE_MS = 30_000;

/**
 * Curated cross-project activity log.
 *
 * Subscribes to authoritative IPC channels (PR + agent events) and watches
 * task lifecycle status via MobX reactions. Entries are capped at 24h and
 * the most recent {@link MAX_ENTRIES}. Reset on app restart — activity does
 * not persist.
 */
export class HomeActivityStore {
  entries = observable.array<HomeActivityEntry>([], { deep: false });

  private _started = false;
  private _disposers: Array<() => void> = [];
  private _prSeen = new Set<string>();
  private _prReviewSeen = new Map<string, string>();
  private _knownStatuses = new Map<string, TaskLifecycleStatus>();
  private _knownTasks = new Set<string>();
  private _awaitingInputTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private _seenInitialPrs = false;

  constructor() {
    makeObservable(this, {
      entries: observable,
      visibleEntries: computed,
    });
  }

  get visibleEntries(): HomeActivityEntry[] {
    const cutoff = Date.now() - RETENTION_MS;
    return this.entries.filter((e) => new Date(e.at).getTime() >= cutoff);
  }

  start(): void {
    if (this._started) return;
    this._started = true;

    this._seedFromCurrentState();

    this._disposers.push(
      events.on(prUpdatedChannel, ({ prs }) => {
        for (const pr of prs) this._consumePr(pr);
      })
    );

    this._disposers.push(
      events.on(agentEventChannel, ({ event }) => {
        if (event.type === 'notification' && event.payload.notificationType) {
          if (
            event.payload.notificationType === 'permission_prompt' ||
            event.payload.notificationType === 'idle_prompt' ||
            event.payload.notificationType === 'elicitation_dialog'
          ) {
            this._scheduleAwaitingInput(event.projectId, event.taskId);
          }
        } else if (event.type === 'error') {
          this._cancelAwaitingInput(event.taskId);
          this._pushFromTask(event.projectId, event.taskId, 'agent-errored');
        } else if (event.type === 'stop') {
          this._cancelAwaitingInput(event.taskId);
          this._pushFromTask(event.projectId, event.taskId, 'agent-finished');
        }
      })
    );

    this._disposers.push(
      events.on(agentSessionExitedChannel, ({ projectId, taskId, exitCode }) => {
        this._cancelAwaitingInput(taskId);
        if (typeof exitCode === 'number' && exitCode !== 0) {
          this._pushFromTask(projectId, taskId, 'agent-errored');
        }
      })
    );

    this._disposers.push(
      reaction(
        () => this._taskFingerprint(),
        () => this._reconcileFromCurrentState(),
        { fireImmediately: false }
      )
    );
  }

  stop(): void {
    for (const dispose of this._disposers) dispose();
    this._disposers = [];
    for (const t of this._awaitingInputTimers.values()) clearTimeout(t);
    this._awaitingInputTimers.clear();
    this._started = false;
  }

  /** Capture snapshot of every visible task's status so we can detect changes. */
  private _seedFromCurrentState(): void {
    for (const projectStore of getProjectManagerStore().projects.values()) {
      const mounted = asMounted(projectStore);
      if (!mounted) continue;
      for (const t of mounted.taskManager.tasks.values()) {
        if (!isRegistered(t)) continue;
        this._knownStatuses.set(t.data.id, t.data.status);
        this._knownTasks.add(t.data.id);
        for (const pr of t.data.prs) {
          this._prSeen.add(pr.url);
          if (pr.reviewDecision) {
            this._prReviewSeen.set(pr.url, pr.reviewDecision);
          }
        }
      }
    }
    this._seenInitialPrs = true;
  }

  /**
   * Returns a string that changes when any visible task is added, removed,
   * or its status or PR list changes. Used as the reaction key.
   */
  private _taskFingerprint(): string {
    const parts: string[] = [];
    for (const projectStore of getProjectManagerStore().projects.values()) {
      const mounted = asMounted(projectStore);
      if (!mounted) continue;
      for (const t of mounted.taskManager.tasks.values()) {
        if (!isRegistered(t)) continue;
        parts.push(`${t.data.id}:${t.data.status}:${t.data.prs.length}`);
      }
    }
    return parts.sort().join('|');
  }

  private _reconcileFromCurrentState(): void {
    const seenNow = new Set<string>();
    for (const projectStore of getProjectManagerStore().projects.values()) {
      const mounted = asMounted(projectStore);
      if (!mounted) continue;
      for (const t of mounted.taskManager.tasks.values()) {
        if (!isRegistered(t)) continue;
        const id = t.data.id;
        seenNow.add(id);

        if (!this._knownTasks.has(id)) {
          this._knownTasks.add(id);
          this._knownStatuses.set(id, t.data.status);
          this._pushFromTaskStore(t, 'task-created');
          continue;
        }

        const prev = this._knownStatuses.get(id);
        if (prev && prev !== t.data.status) {
          this._knownStatuses.set(id, t.data.status);
          this._pushFromTaskStore(t, 'task-status-changed', {
            fromStatus: prev,
            toStatus: t.data.status,
          });
        }
      }
    }
    for (const id of [...this._knownTasks]) {
      if (!seenNow.has(id)) {
        this._knownTasks.delete(id);
        this._knownStatuses.delete(id);
      }
    }
  }

  private _scheduleAwaitingInput(projectId: string, taskId: string): void {
    if (this._awaitingInputTimers.has(taskId)) return;
    const timer = setTimeout(() => {
      this._awaitingInputTimers.delete(taskId);
      this._pushFromTask(projectId, taskId, 'agent-awaiting-input');
    }, AWAITING_INPUT_DEBOUNCE_MS);
    this._awaitingInputTimers.set(taskId, timer);
  }

  private _cancelAwaitingInput(taskId: string): void {
    const timer = this._awaitingInputTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this._awaitingInputTimers.delete(taskId);
    }
  }

  private _consumePr(pr: PullRequest): void {
    const wasSeen = this._prSeen.has(pr.url);
    this._prSeen.add(pr.url);

    const owner = this._findOwnerForPr(pr);
    if (!owner) return;

    if (!wasSeen && this._seenInitialPrs) {
      this._pushPrEvent(owner, pr, 'pr-opened');
    }

    if (pr.status === 'merged') {
      this._pushPrEvent(owner, pr, 'pr-merged');
    }

    const newDecision = pr.reviewDecision;
    const prevDecision = this._prReviewSeen.get(pr.url);
    if (newDecision && newDecision !== prevDecision) {
      this._prReviewSeen.set(pr.url, newDecision);
      const up = newDecision.toUpperCase();
      if (up === 'APPROVED') {
        this._pushPrEvent(owner, pr, 'pr-approved');
      } else if (up === 'CHANGES_REQUESTED') {
        this._pushPrEvent(owner, pr, 'pr-changes-requested');
      }
    }

    if (this._hasFailedCi(pr)) {
      this._pushPrEvent(owner, pr, 'pr-ci-failed');
    }
  }

  private _hasFailedCi(pr: PullRequest): boolean {
    for (const c of pr.checks) {
      const conclusion = (c.conclusion ?? '').toUpperCase();
      if (conclusion === 'FAILURE' || conclusion === 'TIMED_OUT' || conclusion === 'CANCELLED') {
        return true;
      }
    }
    return false;
  }

  private _findOwnerForPr(
    pr: PullRequest
  ): { projectId: string; taskId: string; taskName: string; projectName: string } | null {
    for (const projectStore of getProjectManagerStore().projects.values()) {
      const mounted = asMounted(projectStore);
      if (!mounted) continue;
      if (mounted.repository.repositoryUrl !== pr.repositoryUrl) continue;
      for (const t of mounted.taskManager.tasks.values()) {
        if (!isRegistered(t)) continue;
        if (t.data.taskBranch === pr.headRefName) {
          return {
            projectId: mounted.data.id,
            taskId: t.data.id,
            taskName: t.data.name,
            projectName: mounted.data.name,
          };
        }
      }
    }
    return null;
  }

  private _pushPrEvent(
    owner: { projectId: string; taskId: string; taskName: string; projectName: string },
    pr: PullRequest,
    kind: HomeActivityKind
  ): void {
    this._push({
      id: `${kind}:${pr.url}:${pr.updatedAt}`,
      kind,
      projectId: owner.projectId,
      projectName: owner.projectName,
      taskId: owner.taskId,
      taskName: owner.taskName,
      at: pr.updatedAt,
      details: { prUrl: pr.url, prTitle: pr.title },
    });
  }

  private _pushFromTask(projectId: string, taskId: string, kind: HomeActivityKind): void {
    const projectStore = getProjectManagerStore().projects.get(projectId);
    const mounted = asMounted(projectStore);
    if (!mounted) return;
    const t = mounted.taskManager.tasks.get(taskId);
    if (!t || !isRegistered(t)) return;
    this._pushFromTaskStore(t, kind);
  }

  private _pushFromTaskStore(
    t: TaskStore,
    kind: HomeActivityKind,
    details?: HomeActivityEntry['details']
  ): void {
    if (!isRegistered(t)) return;
    const projectStore = getProjectManagerStore().projects.get(t.data.projectId);
    const mounted = asMounted(projectStore);
    if (!mounted) return;
    const at = new Date().toISOString();
    this._push({
      id: `${kind}:${t.data.id}:${at}`,
      kind,
      projectId: t.data.projectId,
      projectName: mounted.data.name,
      taskId: t.data.id,
      taskName: t.data.name,
      at,
      details,
    });
  }

  private _push(entry: HomeActivityEntry): void {
    runInAction(() => {
      if (this.entries.length > 0 && this.entries[0].id === entry.id) return;
      this.entries.unshift(entry);
      while (this.entries.length > MAX_ENTRIES) {
        this.entries.pop();
      }
    });
  }
}

let _activity: HomeActivityStore | null = null;

export function getHomeActivityStore(): HomeActivityStore {
  if (!_activity) _activity = new HomeActivityStore();
  return _activity;
}
