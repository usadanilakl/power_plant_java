import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { RoundDraft, RoundListItem, RoundPerform } from './rounds.model';

interface Cached<T> { cachedAt: number; data: T; }

/**
 * Offline store for mobile Rounds (localStorage-backed — rounds are small text/number payloads). Caches the round
 * list and each opened round so an operator can perform without a connection, and holds performing drafts (autosaved)
 * + queued submits (flushed on reconnect by {@link RoundsSyncService}).
 */
@Injectable({ providedIn: 'root' })
export class RoundsStore {
  private ls = inject(LocalStorageService);

  private readonly LIST = 'rounds.list';
  private readonly DETAIL = (id: number | string) => `rounds.detail.${id}`;
  private readonly DRAFT = (instanceId: number | string) => `rounds.draft.${instanceId}`;
  private readonly DRAFT_INDEX = 'rounds.draft.index';

  // ── List (cached while online) ──
  cacheList(list: RoundListItem[]): void {
    this.ls.setItem<Cached<RoundListItem[]>>(this.LIST, { cachedAt: Date.now(), data: list });
  }
  getCachedList(): { at: number; list: RoundListItem[] } | null {
    const c = this.ls.getItem<Cached<RoundListItem[]>>(this.LIST);
    return c ? { at: c.cachedAt, list: c.data ?? [] } : null;
  }

  // ── Round detail (cached on open while online) ──
  cacheRound(round: RoundPerform): void {
    this.ls.setItem<Cached<RoundPerform>>(this.DETAIL(round.id), { cachedAt: Date.now(), data: round });
  }
  getCachedRound(roundId: number): { at: number; round: RoundPerform } | null {
    const c = this.ls.getItem<Cached<RoundPerform>>(this.DETAIL(roundId));
    return c ? { at: c.cachedAt, round: c.data } : null;
  }

  // ── Drafts (autosave while performing + queued submits) ──
  getDraft(instanceId: number | string): RoundDraft | null {
    return this.ls.getItem<RoundDraft>(this.DRAFT(instanceId));
  }
  saveDraft(d: RoundDraft): void {
    this.ls.setItem(this.DRAFT(d.instanceId), d);
    const idx = this.draftIds();
    if (!idx.includes(d.instanceId)) { idx.push(d.instanceId); this.ls.setItem<number[]>(this.DRAFT_INDEX, idx); }
  }
  clearDraft(instanceId: number | string): void {
    this.ls.removeItem(this.DRAFT(instanceId));
    this.ls.setItem<number[]>(this.DRAFT_INDEX, this.draftIds().filter(id => String(id) !== String(instanceId)));
  }
  /** All drafts (any status). */
  listDrafts(): RoundDraft[] {
    return this.draftIds().map(id => this.getDraft(id)).filter((d): d is RoundDraft => !!d);
  }
  /** Submitted-but-unsent drafts to flush. */
  listPending(): RoundDraft[] {
    return this.listDrafts().filter(d => d.status === 'pending' || d.status === 'failed');
  }

  private draftIds(): number[] {
    return this.ls.getItem<number[]>(this.DRAFT_INDEX) ?? [];
  }
}
