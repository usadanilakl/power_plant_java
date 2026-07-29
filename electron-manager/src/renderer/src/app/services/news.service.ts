import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { CorkBoardAction, ElectronService, FeedItem, PjmStatus, PjmUnitEvolution } from './electron.service';

/**
 * Aggregates the desktop "Updates / News" feed for the shell.
 *
 * Three sources merge here:
 *  - **Backend feed** (work requests, plant conversations, schedule) — pushed from the main process
 *    via {@link ElectronService.onNewsUpdate}, seeded once with {@link ElectronService.newsList}.
 *  - **PJM day-ahead** — Electron-only data that never touches the backend, folded in client-side
 *    from the existing {@code pjm:status} broadcast.
 *  - **Cork-Board actions** — Electron-only (SharePoint via IPC); active, non-expired actions polled
 *    on the same 120 s cadence as the advisory band.
 *
 * Unread tracking is a single localStorage watermark (epoch millis): everything newer than the last
 * time the user opened the Updates page counts as unread. No server-side per-user state.
 */
@Injectable({ providedIn: 'root' })
export class NewsService implements OnDestroy {

  private static readonly SEEN_KEY = 'newsLastSeenMs';
  private static readonly PJM_OBS_KEY = 'newsPjmObs';
  private static readonly MAX_ITEMS = 80;
  private static readonly CORK_BOARD_POLL_MS = 120_000;

  /** Backend-sourced items (already sorted by the server, but we re-sort on merge). */
  private readonly backendItems = signal<FeedItem[]>([]);
  /** PJM day-ahead items, keyed by unit, rebuilt on each pjm:status push. */
  private readonly pjmItems = signal<FeedItem[]>([]);
  /** Active Cork-Board action items, refreshed by polling SharePoint via IPC. */
  private readonly corkBoardItems = signal<FeedItem[]>([]);
  private corkBoardPoll: ReturnType<typeof setInterval> | null = null;

  /** Last time (epoch ms) the user marked the feed seen. */
  private readonly lastSeenMs = signal<number>(this.loadSeen());

  /** message→observation-timestamp per PJM unit, so an item only "bumps" when the schedule changes. */
  private pjmObs: Record<string, { message: string; ts: string }> = this.loadPjmObs();

  private readonly unsubs: Array<() => void> = [];

  /** Merged, newest-first feed (capped). */
  readonly items = computed<FeedItem[]>(() =>
    [...this.backendItems(), ...this.pjmItems(), ...this.corkBoardItems()]
      .sort((a, b) => this.ms(b.timestamp) - this.ms(a.timestamp))
      .slice(0, NewsService.MAX_ITEMS)
  );

  /** How many items are newer than the watermark. */
  readonly unreadCount = computed<number>(() => {
    const seen = this.lastSeenMs();
    return this.items().filter(i => this.ms(i.timestamp) > seen).length;
  });

  constructor(private electron: ElectronService) {
    // Seed from the main-process cache, then live-update on every push.
    this.electron.newsList().then(res => {
      if (res.success && res.data) this.backendItems.set(res.data);
    }).catch(() => { /* not in Electron / backend down — stays empty */ });

    this.unsubs.push(this.electron.onNewsUpdate(items => this.backendItems.set(items ?? [])));
    this.unsubs.push(this.electron.onPjmStatusChange(status => this.applyPjm(status)));

    // Cork-Board actions have no push channel — poll like the advisory band does.
    void this.loadCorkBoard();
    this.corkBoardPoll = setInterval(() => { void this.loadCorkBoard(); }, NewsService.CORK_BOARD_POLL_MS);
    this.unsubs.push(() => { if (this.corkBoardPoll) clearInterval(this.corkBoardPoll); this.corkBoardPoll = null; });
  }

  /** Force a refresh of all sources (push also updates us, but this is immediate on user action). */
  async refresh(): Promise<void> {
    const [res] = await Promise.all([this.electron.newsRefresh(), this.loadCorkBoard()]);
    if (res.success && res.data) this.backendItems.set(res.data);
  }

  /** Mark everything currently shown as seen — clears the unread badge. */
  markAllSeen(): void {
    const newest = this.items().reduce((max, i) => Math.max(max, this.ms(i.timestamp)), 0);
    const seen = newest > 0 ? newest : Date.now();
    this.lastSeenMs.set(seen);
    try { localStorage.setItem(NewsService.SEEN_KEY, String(seen)); } catch { /* private mode */ }
  }

  isUnread(item: FeedItem): boolean {
    return this.ms(item.timestamp) > this.lastSeenMs();
  }

  ngOnDestroy(): void {
    this.unsubs.forEach(u => { try { u(); } catch { /* noop */ } });
  }

  // ---------------------------------------------------------------- Cork-Board merge

  private async loadCorkBoard(): Promise<void> {
    try {
      const res = await this.electron.corkBoardListActions();
      const actions = res.success && res.data ? res.data : [];
      this.corkBoardItems.set(
        actions.filter(a => this.isActiveAction(a)).map(a => this.toFeedItem(a))
      );
    } catch {
      // Transient (SharePoint/IPC hiccup) — keep prior cork-board items.
    }
  }

  private isActiveAction(a: CorkBoardAction): boolean {
    if (a.active === false) return false;
    if (a.expiresOn) {
      const exp = Date.parse(a.expiresOn);
      if (!Number.isNaN(exp) && exp < Date.now()) return false;
    }
    return true;
  }

  private toFeedItem(a: CorkBoardAction): FeedItem {
    const responses = a.responseCount ? `${a.responseCount} response${a.responseCount === 1 ? '' : 's'}` : undefined;
    return {
      id: `CORK_BOARD:${a.id}`,
      category: 'CORK_BOARD',
      entityType: 'CorkBoardAction',
      title: a.title,
      summary: a.description || responses || this.actionTypeLabel(a.type),
      timestamp: a.createdAt || a.modified || new Date().toISOString(),
      changeType: 'NEW',
      actor: a.createdBy ?? null,
      severity: 'info',
    };
  }

  private actionTypeLabel(type: CorkBoardAction['type']): string {
    switch (type) {
      case 'acknowledge': return 'Acknowledgement requested';
      case 'poll':        return 'Poll';
      case 'signup':      return 'Sign-up';
      default:            return 'Action';
    }
  }

  // ---------------------------------------------------------------- PJM merge

  private applyPjm(status: PjmStatus | null | undefined): void {
    if (!status) { this.pjmItems.set([]); return; }
    const built: FeedItem[] = [];
    const seenKeys = new Set<string>();

    const consider = (unitKey: string, label: string, evo?: PjmUnitEvolution) => {
      if (!evo || evo.status === 'unknown' || !evo.message) return;
      seenKeys.add(unitKey);
      // Only advance the timestamp when the day-ahead message actually changes.
      const prev = this.pjmObs[unitKey];
      const ts = prev && prev.message === evo.message ? prev.ts : new Date().toISOString();
      this.pjmObs[unitKey] = { message: evo.message, ts };

      const steps = (evo.steps ?? []).map(s => `${s.type} ${s.time}`).join(' · ');
      built.push({
        id: `PJM:${unitKey}`,
        category: 'PJM',
        entityType: 'Pjm',
        title: `${label}: ${evo.message}`,
        summary: steps && evo.steps && evo.steps.length > 1 ? steps : undefined,
        timestamp: ts,
        changeType: 'UPDATED',
        actor: 'PJM Day-Ahead',
        severity: 'info',
      });
    };

    consider('unit1', 'Unit 1', status.unit1Evolution);
    consider('unit2', 'Unit 2', status.unit2Evolution);

    // Drop observations for units that no longer report an evolution.
    for (const key of Object.keys(this.pjmObs)) {
      if (!seenKeys.has(key)) delete this.pjmObs[key];
    }
    try { localStorage.setItem(NewsService.PJM_OBS_KEY, JSON.stringify(this.pjmObs)); } catch { /* noop */ }

    this.pjmItems.set(built);
  }

  // ---------------------------------------------------------------- helpers

  /** Parse a feed timestamp to epoch millis. Backend times are naive-local; PJM times are ISO/UTC —
   *  Date.parse resolves both to the correct instant on a machine set to plant-local time. */
  private ms(iso: string): number {
    const t = Date.parse(iso);
    return Number.isNaN(t) ? 0 : t;
  }

  private loadSeen(): number {
    try {
      const raw = localStorage.getItem(NewsService.SEEN_KEY);
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) ? n : 0;
    } catch { return 0; }
  }

  private loadPjmObs(): Record<string, { message: string; ts: string }> {
    try {
      const raw = localStorage.getItem(NewsService.PJM_OBS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
}
