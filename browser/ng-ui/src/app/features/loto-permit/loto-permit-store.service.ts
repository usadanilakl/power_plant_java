import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { PhaseDraft, PositionOptions, PwaLotoDetail, PwaLotoListItem, PwaWalkdownSession, WalkdownDraft } from './loto-permit.model';

interface Cached<T> { cachedAt: number; data: T; }

/**
 * Offline store for the mobile LOTO permit flows (localStorage — checklists are small JSON, no attachments; drawing
 * blobs live in IndexedDB via the shared LotoDrawingService). Caches the list/detail/positions so a grabbed permit
 * can be worked with no signal, and holds phase drafts (hang/verify) + walkdown drafts + a pending-submit index.
 */
@Injectable({ providedIn: 'root' })
export class LotoPermitStore {
  private ls = inject(LocalStorageService);

  private readonly LIST = 'lotoPermit.list';
  private readonly POSITIONS = 'lotoPermit.positions';
  private readonly DETAIL = (id: number | string) => `lotoPermit.detail.${id}`;
  private readonly SESSIONS = (id: number | string) => `lotoPermit.sessions.${id}`;
  private readonly PHASE = (lotoId: number | string, phase: string) => `lotoPermit.phaseDraft.${lotoId}.${phase}`;
  private readonly PHASE_INDEX = 'lotoPermit.phaseDraft.index';
  private readonly WD = (sessionId: number | string) => `lotoPermit.wdDraft.${sessionId}`;
  private readonly WD_INDEX = 'lotoPermit.wdDraft.index';

  // ── list / detail / positions ──
  cacheList(list: PwaLotoListItem[]): void { this.ls.setItem<Cached<PwaLotoListItem[]>>(this.LIST, { cachedAt: Date.now(), data: list }); }
  getCachedList(): { at: number; list: PwaLotoListItem[] } | null {
    const c = this.ls.getItem<Cached<PwaLotoListItem[]>>(this.LIST);
    return c ? { at: c.cachedAt, list: c.data ?? [] } : null;
  }

  cacheDetail(d: PwaLotoDetail): void { this.ls.setItem<Cached<PwaLotoDetail>>(this.DETAIL(d.id), { cachedAt: Date.now(), data: d }); }
  getCachedDetail(id: number): { at: number; detail: PwaLotoDetail } | null {
    const c = this.ls.getItem<Cached<PwaLotoDetail>>(this.DETAIL(id));
    return c ? { at: c.cachedAt, detail: c.data } : null;
  }

  cacheSessions(lotoId: number, sessions: PwaWalkdownSession[]): void {
    this.ls.setItem<Cached<PwaWalkdownSession[]>>(this.SESSIONS(lotoId), { cachedAt: Date.now(), data: sessions });
  }
  getCachedSessions(lotoId: number): PwaWalkdownSession[] | null {
    const c = this.ls.getItem<Cached<PwaWalkdownSession[]>>(this.SESSIONS(lotoId));
    return c ? c.data ?? [] : null;
  }

  cachePositions(p: PositionOptions): void { this.ls.setItem<Cached<PositionOptions>>(this.POSITIONS, { cachedAt: Date.now(), data: p }); }
  getCachedPositions(): PositionOptions | null {
    const c = this.ls.getItem<Cached<PositionOptions>>(this.POSITIONS);
    return c ? c.data : null;
  }

  // ── phase drafts (hang / verify) ──
  getPhaseDraft(lotoId: number, phase: 'HANG' | 'VERIFY'): PhaseDraft | null {
    return this.ls.getItem<PhaseDraft>(this.PHASE(lotoId, phase));
  }
  savePhaseDraft(d: PhaseDraft): void {
    this.ls.setItem(this.PHASE(d.lotoId, d.phase), d);
    const key = `${d.lotoId}:${d.phase}`;
    const idx = this.phaseIds();
    if (!idx.includes(key)) { idx.push(key); this.ls.setItem<string[]>(this.PHASE_INDEX, idx); }
  }
  clearPhaseDraft(lotoId: number, phase: 'HANG' | 'VERIFY'): void {
    this.ls.removeItem(this.PHASE(lotoId, phase));
    this.ls.setItem<string[]>(this.PHASE_INDEX, this.phaseIds().filter(k => k !== `${lotoId}:${phase}`));
  }
  private phaseIds(): string[] { return this.ls.getItem<string[]>(this.PHASE_INDEX) ?? []; }
  private allPhaseDrafts(): PhaseDraft[] {
    return this.phaseIds().map(k => {
      const [id, phase] = k.split(':');
      return this.getPhaseDraft(Number(id), phase as 'HANG' | 'VERIFY');
    }).filter((d): d is PhaseDraft => !!d);
  }

  // ── walkdown drafts ──
  getWalkdownDraft(sessionId: number): WalkdownDraft | null { return this.ls.getItem<WalkdownDraft>(this.WD(sessionId)); }
  saveWalkdownDraft(d: WalkdownDraft): void {
    this.ls.setItem(this.WD(d.sessionId), d);
    const idx = this.wdIds();
    if (!idx.includes(d.sessionId)) { idx.push(d.sessionId); this.ls.setItem<number[]>(this.WD_INDEX, idx); }
  }
  clearWalkdownDraft(sessionId: number): void {
    this.ls.removeItem(this.WD(sessionId));
    this.ls.setItem<number[]>(this.WD_INDEX, this.wdIds().filter(id => id !== sessionId));
  }
  private wdIds(): number[] { return this.ls.getItem<number[]>(this.WD_INDEX) ?? []; }
  private allWalkdownDrafts(): WalkdownDraft[] {
    return this.wdIds().map(id => this.getWalkdownDraft(id)).filter((d): d is WalkdownDraft => !!d);
  }

  // ── pending (queued) submits, both kinds ──
  pendingPhaseDrafts(): PhaseDraft[] { return this.allPhaseDrafts().filter(d => d.status === 'pending' || d.status === 'failed'); }
  pendingWalkdownDrafts(): WalkdownDraft[] { return this.allWalkdownDrafts().filter(d => d.status === 'pending' || d.status === 'failed'); }
  pendingCount(): number { return this.pendingPhaseDrafts().length + this.pendingWalkdownDrafts().length; }
}
