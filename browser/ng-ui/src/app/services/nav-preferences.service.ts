import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * Per-user navigation preferences: which shortcuts sit in the bottom bar, and what order everything
 * is listed in.
 *
 * Two separate things, deliberately:
 *
 *  - **pins** — exactly what the bar shows, in bar order. Previously the bar was "the first N of the
 *    saved order", which meant promoting something from row fifteen took fifteen taps on an arrow.
 *    Pinning is a single tap from wherever the entry happens to be, and reordering only ever happens
 *    within the four pinned rows.
 *  - **order** — how sections and pages are listed on Home and in the sheet.
 *
 * Stored in localStorage rather than on the hub, so this stays a pure-PWA feature: no endpoint, no
 * hub deploy. The trade-off is that it is per-device. Keyed by email so two people sharing a plant
 * tablet don't inherit each other's layout.
 */
@Injectable({ providedIn: 'root' })
export class NavPreferencesService {
  private static readonly ORDER_PREFIX = 'pwa_nav_order:';
  private static readonly PINS_PREFIX = 'pwa_nav_pins:';

  private auth = inject(AuthService);

  /** Preferred listing order, most-preferred first. Empty means "never customised". */
  readonly order = signal<string[]>([]);

  /** Nav keys shown in the bottom bar, in bar order. Empty means "use the default head of the list". */
  readonly pins = signal<string[]>([]);

  private loadedFor: string | null = null;

  constructor() {
    this.syncToCurrentUser();
  }

  private key(prefix: string): string {
    const email = this.auth.getAuthData()?.user?.email;
    return prefix + (email || 'guest');
  }

  /** Reload from storage if the signed-in user changed since the last read. */
  syncToCurrentUser(): void {
    const marker = this.key(NavPreferencesService.PINS_PREFIX);
    if (marker === this.loadedFor) return;
    this.loadedFor = marker;
    this.order.set(this.readList(NavPreferencesService.ORDER_PREFIX));
    this.pins.set(this.readList(NavPreferencesService.PINS_PREFIX));
  }

  private readList(prefix: string): string[] {
    try {
      const raw = localStorage.getItem(this.key(prefix));
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }

  private write(prefix: string, values: string[], target: ReturnType<typeof signal<string[]>>): void {
    target.set(values);
    try {
      localStorage.setItem(this.key(prefix), JSON.stringify(values));
    } catch {
      // Quota / private mode — the in-memory value still applies for this session.
    }
  }

  // ── Listing order ─────────────────────────────────────────────────────────

  /**
   * Sort `items` by the saved order.
   *
   * Entries the user has never seen (a feature shipped after they last customised) are NOT dropped —
   * they keep their declared position by being appended in declaration order. Saved entries the user
   * can no longer see are ignored rather than reserving a slot.
   */
  apply<T extends { navKey: string }>(items: T[]): T[] {
    const saved = this.order();
    if (!saved.length) return items;
    const rank = new Map(saved.map((navKey, i) => [navKey, i]));
    const known = items.filter(i => rank.has(i.navKey))
      .sort((a, b) => rank.get(a.navKey)! - rank.get(b.navKey)!);
    const unknown = items.filter(i => !rank.has(i.navKey));
    return [...known, ...unknown];
  }

  /** Move one entry one slot toward the front of the listing order. */
  move(current: { navKey: string }[], navKey: string, direction: -1 | 1): void {
    const keys = current.map(i => i.navKey);
    const from = keys.indexOf(navKey);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= keys.length) return;
    [keys[from], keys[to]] = [keys[to], keys[from]];
    this.write(NavPreferencesService.ORDER_PREFIX, keys, this.order);
  }

  /** Jump an entry to the front — the move that arrows made tedious. */
  moveToTop(current: { navKey: string }[], navKey: string): void {
    const keys = current.map(i => i.navKey);
    const from = keys.indexOf(navKey);
    if (from <= 0) return;
    keys.splice(from, 1);
    keys.unshift(navKey);
    this.write(NavPreferencesService.ORDER_PREFIX, keys, this.order);
  }

  // ── Bar pins ──────────────────────────────────────────────────────────────

  isPinned(navKey: string): boolean {
    return this.pins().includes(navKey);
  }

  /**
   * @param limit bar capacity.
   * @returns false when the bar is already full. Refusing beats silently evicting something: the
   *          user would not know which tab they had just lost, and the obvious victim — whatever was
   *          pinned first — is usually Home.
   */
  pin(navKey: string, limit: number): boolean {
    if (this.isPinned(navKey)) return true;
    if (this.pins().length >= limit) return false;
    this.write(NavPreferencesService.PINS_PREFIX, [...this.pins(), navKey], this.pins);
    return true;
  }

  unpin(navKey: string): void {
    this.write(NavPreferencesService.PINS_PREFIX, this.pins().filter(k => k !== navKey), this.pins);
  }

  /** @returns false only when a pin was refused because the bar is full. */
  togglePin(navKey: string, limit: number): boolean {
    if (this.isPinned(navKey)) {
      this.unpin(navKey);
      return true;
    }
    return this.pin(navKey, limit);
  }

  /**
   * Adopt the bar's current contents as explicit pins.
   *
   * Until someone pins anything the bar is implicit — the head of the list. Pinning one entry would
   * otherwise make the pin list authoritative and blank the other three tabs, so the first pin has
   * to start from what the user is already looking at.
   */
  seedPins(current: { navKey: string }[]): void {
    if (this.pins().length) return;
    this.write(NavPreferencesService.PINS_PREFIX, current.map(i => i.navKey), this.pins);
  }

  /** Reorder within the pinned set only — never more than a handful of rows. */
  movePin(navKey: string, direction: -1 | 1): void {
    const keys = [...this.pins()];
    const from = keys.indexOf(navKey);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= keys.length) return;
    [keys[from], keys[to]] = [keys[to], keys[from]];
    this.write(NavPreferencesService.PINS_PREFIX, keys, this.pins);
  }

  /**
   * The bar's contents: pinned entries in pin order, filtered to what this user can currently see.
   * With nothing pinned it falls back to the head of the listing order, which is the behaviour
   * someone who has never opened the editor already had.
   */
  barItems<T extends { navKey: string; route?: string }>(visible: T[], limit: number): T[] {
    const pinned = this.pins();
    if (!pinned.length) return visible.filter(i => !!i.route).slice(0, limit);
    const byKey = new Map(visible.map(i => [i.navKey, i]));
    return pinned.map(k => byKey.get(k)).filter((i): i is T => !!i && !!i.route).slice(0, limit);
  }

  /** Drop every customisation. */
  reset(): void {
    this.order.set([]);
    this.pins.set([]);
    try {
      localStorage.removeItem(this.key(NavPreferencesService.ORDER_PREFIX));
      localStorage.removeItem(this.key(NavPreferencesService.PINS_PREFIX));
    } catch {
      // Nothing to clean up.
    }
  }

  get isCustomised(): boolean {
    return this.order().length > 0 || this.pins().length > 0;
  }
}
