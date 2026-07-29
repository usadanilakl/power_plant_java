/**
 * NewsManager — polls the local Spring Boot feed endpoint (`/ng/feed/recent`) and pushes a merged
 * "Updates / News" list to the renderer.
 *
 * Detection is delegated to the backend: every source (work requests, plant conversations, schedule)
 * is a JPA entity whose `dateModified` moves on real writes, so the endpoint always reflects current
 * state. This manager just fetches, caches and broadcasts — no change-tracking of its own. It mirrors
 * the advisory band's cadence (120 s) and, like it, keeps the previous list on a transient failure so
 * a backend restart doesn't blank the feed.
 *
 * PJM day-ahead is Electron-only data and is merged client-side in the renderer, so it never flows
 * through here.
 */

import { backendGet } from '../clients/backend-client';
import type { FeedItem } from '../../shared/types';

const POLL_INTERVAL_MS = 120_000; // 2 min — matches the advisory band
const FEED_LIMIT = 50;

export class NewsManager {
  private pollInterval: NodeJS.Timeout | null = null;
  private cached: FeedItem[] = [];
  private readonly onUpdate: (items: FeedItem[]) => void;

  constructor(onUpdate: (items: FeedItem[]) => void) {
    this.onUpdate = onUpdate;
  }

  /** Begin polling. Idempotent — a second call while already running is a no-op. */
  public start(): void {
    if (this.pollInterval) return;
    void this.fetchNow();
    this.pollInterval = setInterval(() => { void this.fetchNow(); }, POLL_INTERVAL_MS);
  }

  public getFeed(): FeedItem[] {
    return this.cached;
  }

  /** Force an immediate refresh (e.g. when Spring Boot becomes healthy, or on user request). */
  public async refresh(): Promise<FeedItem[]> {
    await this.fetchNow();
    return this.cached;
  }

  public cleanup(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async fetchNow(): Promise<void> {
    try {
      const resp = await backendGet<{ responseData: FeedItem[] }>(`/ng/feed/recent?limit=${FEED_LIMIT}`);
      const items = Array.isArray(resp?.responseData) ? resp.responseData : [];
      this.cached = items;
      this.onUpdate(items);
    } catch (err: any) {
      // Transient (backend starting/restarting) — keep the previous list, like the advisory band.
      console.warn(`[News] feed fetch failed: ${err?.message ?? err}`);
    }
  }
}
