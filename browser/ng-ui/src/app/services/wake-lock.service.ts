import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * Holds a screen wake lock for the duration of a long field task (performing a round, walking down
 * a standard). Without it the phone sleeps between readings and the operator re-unlocks it dozens
 * of times per round — with gloves on.
 *
 * Notes:
 * - Requires a secure context. GitHub Pages serves the PWA over HTTPS, so this is satisfied in
 *   production; on plain-HTTP local dev `navigator.wakeLock` is undefined and every call no-ops.
 * - The browser drops the lock whenever the page is hidden (tab switch, screen off, app
 *   backgrounded). We re-acquire on visibilitychange so returning to a half-finished round keeps
 *   the screen awake without the caller having to think about it.
 * - Safari 16.4+ and Chrome 84+ support this; anywhere else it degrades to current behaviour.
 */
@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private sentinel: any = null;
  /** How many callers currently want the screen awake — supports nested/overlapping requests. */
  private holders = 0;
  private visibilityBound = false;

  /** True while a lock is actually held; useful for surfacing state in a UI if ever needed. */
  readonly active = signal(false);

  private get api(): any {
    return typeof navigator !== 'undefined' ? (navigator as any).wakeLock : undefined;
  }

  /**
   * Keep the screen awake until the returned release function is called. Safe to call when
   * unsupported — you still get a release function, it just does nothing.
   *
   * Prefer {@link bindTo} in components so the lock can't outlive the screen that asked for it.
   */
  async acquire(): Promise<() => void> {
    this.holders++;
    this.bindVisibility();
    await this.request();

    let released = false;
    return () => {
      if (released) return; // idempotent: a double release must not unbalance the count
      released = true;
      this.holders = Math.max(0, this.holders - 1);
      if (this.holders === 0) void this.release();
    };
  }

  /**
   * Acquire a lock and release it automatically when the injection context is destroyed.
   * Call from a component's field initialiser or constructor:
   *
   *   private wake = inject(WakeLockService).bindTo();
   */
  bindTo(destroyRef: DestroyRef = inject(DestroyRef)): void {
    let release: (() => void) | null = null;
    let destroyed = false;

    void this.acquire().then(r => {
      // The component may have been destroyed while the request was in flight.
      if (destroyed) { r(); return; }
      release = r;
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      release?.();
    });
  }

  private async request(): Promise<void> {
    if (!this.api || this.sentinel || this.holders === 0) return;
    try {
      this.sentinel = await this.api.request('screen');
      this.active.set(true);
      // Fires when the OS or browser takes the lock back (e.g. battery saver kicks in).
      this.sentinel.addEventListener?.('release', () => {
        this.sentinel = null;
        this.active.set(false);
      });
    } catch {
      // Denied (battery saver, no user gesture, unsupported). Field screens must still work.
      this.sentinel = null;
      this.active.set(false);
    }
  }

  private async release(): Promise<void> {
    const s = this.sentinel;
    this.sentinel = null;
    this.active.set(false);
    try {
      await s?.release?.();
    } catch {
      // Already released by the browser — nothing to do.
    }
  }

  /** The browser always drops the lock when the page hides; take it back when we return. */
  private bindVisibility(): void {
    if (this.visibilityBound || typeof document === 'undefined') return;
    this.visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.holders > 0 && !this.sentinel) {
        void this.request();
      }
    });
  }
}
