import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * Per-user ordering for the mobile bottom nav.
 *
 * Stored in localStorage rather than on the hub, so this stays a pure-PWA feature: no endpoint, no
 * hub deploy. The trade-off is that the order is per-device — someone who uses both a phone and a
 * tablet sets it twice. Moving it server-side later only means swapping the load/save pair here.
 *
 * Keyed by email so two people sharing a device don't inherit each other's layout. Signed-out
 * (tier-1) users share a 'guest' key, which is the same audience the default order already suits.
 */
@Injectable({ providedIn: 'root' })
export class NavPreferencesService {
  private static readonly KEY_PREFIX = 'pwa_nav_order:';

  private auth = inject(AuthService);

  /**
   * Saved route order, most-preferred first. Empty means "never customised" — callers fall back to
   * the component's declaration order.
   */
  readonly order = signal<string[]>([]);

  /** The key currently loaded, so a user switch can be detected lazily without an auth subscription. */
  private loadedFor: string | null = null;

  constructor() {
    this.syncToCurrentUser();
  }

  private storageKey(): string {
    const email = this.auth.getAuthData()?.user?.email;
    return NavPreferencesService.KEY_PREFIX + (email || 'guest');
  }

  /** Reload from storage if the signed-in user changed since the last read. */
  syncToCurrentUser(): void {
    const key = this.storageKey();
    if (key === this.loadedFor) return;
    this.loadedFor = key;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      this.order.set(Array.isArray(parsed) ? parsed.filter(r => typeof r === 'string') : []);
    } catch {
      this.order.set([]);
    }
  }

  private persist(routes: string[]): void {
    this.order.set(routes);
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(routes));
    } catch {
      // Quota / private mode — the in-memory order still applies for this session.
    }
  }

  /**
   * Sort `items` by the saved order.
   *
   * Routes the user has never seen (a feature shipped after they last customised) are NOT dropped —
   * they keep their declared position relative to the saved block by being appended in declaration
   * order. Saved routes the user can no longer see are ignored rather than reserving a slot.
   */
  apply<T extends { route: string }>(items: T[]): T[] {
    const saved = this.order();
    if (!saved.length) return items;

    const rank = new Map(saved.map((route, i) => [route, i]));
    const known = items.filter(i => rank.has(i.route)).sort((a, b) => rank.get(a.route)! - rank.get(b.route)!);
    const unknown = items.filter(i => !rank.has(i.route));
    return [...known, ...unknown];
  }

  /** Persist an explicit order (the full visible list, in the order the user arranged it). */
  setOrder(items: { route: string }[]): void {
    this.persist(items.map(i => i.route));
  }

  /**
   * Move one route one slot toward the front. `current` must be the full ordered list as the user
   * currently sees it, so the saved order stays complete rather than partial.
   */
  move(current: { route: string }[], route: string, direction: -1 | 1): void {
    const routes = current.map(i => i.route);
    const from = routes.indexOf(route);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= routes.length) return;
    [routes[from], routes[to]] = [routes[to], routes[from]];
    this.persist(routes);
  }

  /** Drop the customisation and fall back to declaration order. */
  reset(): void {
    this.order.set([]);
    try {
      localStorage.removeItem(this.storageKey());
    } catch {
      // Nothing to clean up.
    }
  }

  get isCustomised(): boolean {
    return this.order().length > 0;
  }
}
