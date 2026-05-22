import { makeObservable, observable, reaction, runInAction } from 'mobx';
import { appState } from '@renderer/lib/stores/app-state';

const MAX_SAMPLES = 30;
const MIN_SAMPLE_INTERVAL_MS = 1000;

/**
 * Rolling CPU history for the home dashboard sparkline.
 *
 * Mirrors {@link appState.resourceMonitor} into a small fixed-size array
 * via a MobX reaction. Reset/recreated when home subscriptions are
 * acquired.
 */
export class HomeResourceHistory {
  /** Most-recent total CPU percentages (0 — 100+), oldest first. */
  cpu = observable.array<number>([], { deep: false });

  private _dispose: (() => void) | null = null;
  private _lastSampleAt = 0;

  constructor() {
    makeObservable(this, { cpu: observable });
  }

  start(): void {
    if (this._dispose) return;
    this._dispose = reaction(
      () => appState.resourceMonitor.totalCpuPercent,
      (cpu) => {
        const now = Date.now();
        if (now - this._lastSampleAt < MIN_SAMPLE_INTERVAL_MS) return;
        this._lastSampleAt = now;
        runInAction(() => {
          this.cpu.push(Math.max(0, cpu));
          while (this.cpu.length > MAX_SAMPLES) this.cpu.shift();
        });
      },
      { fireImmediately: true }
    );
  }

  stop(): void {
    this._dispose?.();
    this._dispose = null;
  }

  clear(): void {
    runInAction(() => this.cpu.clear());
  }
}

let _store: HomeResourceHistory | null = null;
export function getHomeResourceHistory(): HomeResourceHistory {
  if (!_store) _store = new HomeResourceHistory();
  return _store;
}
