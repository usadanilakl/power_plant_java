import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { LotoStandard, PositionOptions, WalkdownDraft } from './loto-standard.model';

interface Cached<T> { cachedAt: number; data: T; }

/**
 * Offline store for the mobile LOTO Standards feature (localStorage-backed — checklists are small and have
 * no attachments, so no IndexedDB needed). Caches the list + per-standard detail + position options so a
 * walkdown works with no signal, and persists the in-progress {@link WalkdownDraft} + a pending-submit queue.
 */
@Injectable({ providedIn: 'root' })
export class LotoStandardStore {
  private ls = inject(LocalStorageService);

  private readonly LIST = 'loto-std-list';
  private readonly POSITIONS = 'loto-std-positions';
  private readonly DRAFT_INDEX = 'loto-wd-draft-index';
  private detailKey = (id: number | string) => `loto-std-${id}`;
  private draftKey = (id: number | string) => `loto-wd-draft-${id}`;

  // ── List ──────────────────────────────────────────────────────────────────
  cacheList(list: LotoStandard[]): void { this.ls.setItem<Cached<LotoStandard[]>>(this.LIST, { cachedAt: Date.now(), data: list }); }
  getCachedList(): { at: number; list: LotoStandard[] } | null {
    const c = this.ls.getItem<Cached<LotoStandard[]>>(this.LIST);
    return c ? { at: c.cachedAt, list: c.data ?? [] } : null;
  }

  // ── Detail (cached on open while online) ──────────────────────────────────
  cacheStandard(std: LotoStandard): void {
    if (!std?.id) return;
    this.ls.setItem<Cached<LotoStandard>>(this.detailKey(std.id), { cachedAt: Date.now(), data: std });
  }
  getCachedStandard(id: number | string): { at: number; std: LotoStandard } | null {
    const c = this.ls.getItem<Cached<LotoStandard>>(this.detailKey(id));
    return c ? { at: c.cachedAt, std: c.data } : null;
  }

  // ── Position options ──────────────────────────────────────────────────────
  cachePositions(p: PositionOptions): void { this.ls.setItem<Cached<PositionOptions>>(this.POSITIONS, { cachedAt: Date.now(), data: p }); }
  getCachedPositions(): PositionOptions | null {
    const c = this.ls.getItem<Cached<PositionOptions>>(this.POSITIONS);
    return c?.data ?? null;
  }

  // ── Draft + pending queue ─────────────────────────────────────────────────
  getDraft(id: number | string): WalkdownDraft | null { return this.ls.getItem<WalkdownDraft>(this.draftKey(id)); }

  saveDraft(d: WalkdownDraft): void {
    d.updatedAt = Date.now();
    this.ls.setItem<WalkdownDraft>(this.draftKey(d.standardId), d);
    this.indexAdd(d.standardId);
  }

  clearDraft(id: number | string): void {
    this.ls.removeItem(this.draftKey(id));
    this.indexRemove(id);
  }

  listDrafts(): WalkdownDraft[] {
    return this.draftIndex()
      .map(id => this.getDraft(id))
      .filter((d): d is WalkdownDraft => !!d);
  }

  /** Drafts awaiting a (re)submit: queued while offline, or a submit that failed with a retryable error. */
  listPending(): WalkdownDraft[] {
    return this.listDrafts().filter(d => d.status === 'pending' || d.status === 'failed');
  }

  private draftIndex(): number[] { return this.ls.getItem<number[]>(this.DRAFT_INDEX) ?? []; }
  private indexAdd(id: number): void {
    const ix = this.draftIndex();
    if (!ix.includes(id)) { ix.push(id); this.ls.setItem(this.DRAFT_INDEX, ix); }
  }
  private indexRemove(id: number | string): void {
    this.ls.setItem(this.DRAFT_INDEX, this.draftIndex().filter(x => x !== Number(id)));
  }
}
