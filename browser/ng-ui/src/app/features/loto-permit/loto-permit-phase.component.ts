import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { ServerStatusService } from '../../services/server-status.service';
import { LotoDrawingService } from '../loto-standard/loto-drawing.service';
import { LotoDrawingViewerComponent } from '../loto-standard/loto-drawing-viewer.component';
import { LotoPermitApiService } from './loto-permit-api.service';
import { LotoPermitStore } from './loto-permit-store.service';
import { LotoPermitSyncService } from './loto-permit-sync.service';
import { PhaseDraft, PositionOptions, PwaLotoDetail, PwaLotoPoint } from './loto-permit.model';
import { LotoWoLinkComponent } from './loto-wo-link.component';
import { GlobalMessageService } from '../../services/global-message.service';

/**
 * Hang or Verify a LOTO permit (mode from route data). HANG is order-locked: a point is available only once every
 * install-predecessor is hung. VERIFY is order-deviatable: any order, but every point must be verified (and the
 * server still enforces all-hung + hanger≠verifier). Offline-first: cache on open, work against a draft, one submit
 * that flushes on reconnect. Safety conditions must be acknowledged before a point can be marked.
 */
@Component({
  selector: 'app-loto-permit-phase',
  standalone: true,
  imports: [FormsModule, MainLayoutComponent, LotoDrawingViewerComponent, LotoWoLinkComponent],
  template: `
    <app-main-layout [header]="mode() === 'HANG' ? 'Hang LOTO' : mode() === 'VERIFY' ? 'Verify LOTO' : 'LOTO Permit'">
      <ng-container main-content>
        <div class="ph">
          <button class="ph-back" (click)="back()">← LOTO</button>
          @if (!online()) { <div class="ph-net">📴 Offline — saved on this device, submits when you reconnect.</div> }

          @if (loading()) { <p class="ph-msg">Loading…</p> }
          @else if (error() && !detail()) { <p class="ph-msg ph-err">{{ error() }}</p> }
          @else if (detail()) {
            @let d = detail()!;
            <div class="ph-head">
              <div class="ph-title">{{ d.permitNumber || ('Permit #' + d.id) }}</div>
              @if (readOnly()) {
                <div class="ph-sub">{{ d.equipmentSystem }} · {{ d.status }} · {{ hungTotal(d) }}/{{ d.points.length }} hung · {{ verifiedTotal(d) }}/{{ d.points.length }} verified</div>
              } @else {
                <div class="ph-sub">{{ d.equipmentSystem }} · {{ doneCount() }}/{{ d.points.length }} {{ mode() === 'HANG' ? 'hung' : 'verified' }}</div>
              }
              @if (readOnly()) {
                <div class="ph-ro">👁 View only — this permit has no step available to you right now.</div>
              }
            </div>

            <app-loto-wo-link [lotoId]="d.id"></app-loto-wo-link>

            @if (mode() === 'VERIFY' && !d.canVerifyAny) {
              <div class="ph-blocked">
                🔒 <b>You hung these points.</b> A different qualified person must verify them (separation of duty).
                You can review the permit below, but not verify it.
              </div>
            }

            @for (p of d.points; track p.id) {
              <div class="ph-p" [class.done]="isDone(p)" [class.locked]="!available(p)">
                <div class="ph-p-head">
                  <span class="ph-tag">{{ p.tagNumber || ('#' + p.id) }}</span>
                  <span class="ph-flags">
                    @if (readOnly()) {
                      @if (p.hungBy) { <span class="ph-badge ok">✓ hung {{ p.hungBy }}</span> }
                      @if (p.verifiedBy) { <span class="ph-badge ok">✓ verified {{ p.verifiedBy }}</span> }
                    } @else if (isServerDone(p)) {
                      <span class="ph-badge ok">✓ {{ mode() === 'HANG' ? p.hungBy : p.verifiedBy }}</span>
                    }
                    @if (hasDrawing(p.id)) { <button class="ph-dwg" (click)="openDrawing(p)">📄 Drawing</button> }
                  </span>
                </div>
                <div class="ph-desc">{{ p.description }}</div>
                <div class="ph-pos">
                  <span>Isolate: <b>{{ isoName(p) }}</b></span>
                  <span>Restore: <b>{{ normName(p) }}</b></span>
                  @if (p.zeroEnergyMethod) { <span>ZE: {{ p.zeroEnergyMethod }}</span> }
                  @if (p.specificLocation || p.generalLocation) { <span>{{ p.specificLocation || p.generalLocation }}</span> }
                </div>

                @if (!readOnly() && !available(p) && !isServerDone(p)) {
                  @if (mode() === 'HANG') {
                    <div class="ph-lock">🔒 Hang predecessor(s) first: {{ predecessorTags(p, d.points) }}</div>
                  } @else {
                    <div class="ph-lock">🔒 {{ p.verifyBlockedReason || 'You cannot verify this point.' }}</div>
                  }
                }

                @if (!readOnly() && !isServerDone(p)) {
                  @if (p.installSafetyConditions?.length) {
                    <div class="ph-safety">
                      <div class="ph-safety-h">Confirm before proceeding:</div>
                      @for (sc of p.installSafetyConditions; track sc) {
                        <label class="ph-chk"><input type="checkbox" [checked]="isAcked(p.id, sc)" (change)="toggleAck(p.id, sc)" [disabled]="!available(p)" /> {{ sc }}</label>
                      }
                    </div>
                  }
                  <textarea class="ph-notes" rows="1" [value]="noteOf(p.id)" (input)="setNote(p.id, $any($event.target).value)" placeholder="Note (optional)" [disabled]="!available(p)"></textarea>
                  <button class="ph-mark" [class.on]="isDraftChecked(p.id)" [disabled]="!available(p) || !safetyOk(p)" (click)="toggleMark(p)">
                    {{ isDraftChecked(p.id) ? '✓ Marked ' + (mode() === 'HANG' ? 'hung' : 'verified') : 'Mark ' + (mode() === 'HANG' ? 'hung' : 'verified') }}
                  </button>
                }
              </div>
            }

            @if (!readOnly()) {
            <div class="ph-foot">
              @if (error()) { <p class="ph-err">{{ error() }}</p> }
              <label class="ph-sign" [class.dis]="!allDone()">
                <input type="checkbox" [checked]="sign()" (change)="sign.set($any($event.target).checked)" [disabled]="!allDone()" />
                Sign {{ mode() === 'HANG' ? 'Hanging' : 'Verification' }} Complete
              </label>
              <textarea class="ph-notes" rows="2" [value]="aggNotes()" (input)="aggNotes.set($any($event.target).value)" placeholder="Sign-off note (optional)"></textarea>
              <button class="ph-submit" [disabled]="submitting() || !anyToSubmit()" (click)="submit()">
                {{ submitting() ? 'Submitting…' : 'Submit' }}
              </button>
            </div>
            }
          }
        </div>

        @if (drawingPoint(); as dp) {
          <app-loto-drawing-viewer [standardId]="lotoId" [pointId]="dp.id" [source]="'permit'"
                                   [title]="dp.tagNumber || 'Point'" (close)="drawingPoint.set(null)" />
        }
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .ph { padding: 10px 12px 90px; }
    .ph-back { background: none; border: none; color: var(--accent-color); padding: 4px 0 8px; font-size: 14px; }
    .ph-net { background: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border); border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .ph-msg { padding: 20px; text-align: center; color: var(--secondary-text); }
    .ph-err { color: var(--danger-text); }
    .ph-head { margin-bottom: 10px; }
    .ph-ro { margin-top: 6px; background: var(--info-bg); color: var(--info-text); border: 1px solid var(--accent-color); border-radius: 8px; padding: 8px 10px; font-size: 12px; }
    .ph-title { font-size: 16px; font-weight: 600; color: var(--primary-text); }
    .ph-sub { color: var(--secondary-text); font-size: 13px; margin-top: 2px; }
    .ph-p { background: var(--card-background); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; margin-bottom: 10px; }
    .ph-p.done { border-color: var(--success-border); background: var(--success-bg); }
    .ph-p.locked { opacity: 0.6; }
    .ph-p-head { display: flex; justify-content: space-between; align-items: center; }
    .ph-tag { font-weight: 700; color: var(--primary-text); }
    .ph-flags { display: flex; align-items: center; gap: 8px; }
    .ph-badge.ok { background: var(--success-bg); color: var(--success-text); border-radius: 4px; padding: 1px 6px; font-size: 11px; }
    .ph-dwg { background: var(--info-bg); color: var(--info-text); border: none; border-radius: 6px; padding: 4px 10px; font-size: 12px; }
    .ph-desc { margin: 4px 0 6px; font-size: 14px; color: var(--primary-text); }
    .ph-pos { display: flex; flex-wrap: wrap; gap: 10px; color: var(--secondary-text); font-size: 12px; }
    .ph-lock { margin-top: 8px; background: var(--warning-bg); color: var(--warning-text); border-radius: 6px; padding: 6px 8px; font-size: 12px; }
    .ph-blocked { background: var(--danger-bg); color: var(--danger-text); border: 1px solid var(--danger-border); border-radius: 8px; padding: 10px; font-size: 13px; line-height: 1.4; margin-bottom: 10px; }
    .ph-safety { margin-top: 8px; }
    .ph-safety-h { font-size: 12px; color: var(--secondary-text); font-weight: 600; }
    .ph-chk { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; margin-top: 3px; color: var(--primary-text); min-height: 44px; }
    .ph-notes { width: 100%; margin-top: 8px; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font: inherit; font-size: 16px; resize: vertical; background: var(--input-bg); color: var(--primary-text); }
    .ph-mark { margin-top: 8px; width: 100%; min-height: 52px; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--secondary-background); color: var(--primary-text); font-size: 16px; font-weight: 600; }
    .ph-mark.on { background: var(--success-solid); color: var(--on-solid); border-color: var(--success-solid); }
    .ph-mark:disabled { opacity: 0.5; }
    .ph-foot { position: sticky; bottom: 0; background: var(--primary-background); padding: 10px 0; border-top: 1px solid var(--border-color); padding-bottom: max(10px, env(safe-area-inset-bottom, 0px)); }
    .ph-sign { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--primary-text); min-height: 44px; }
    .ph-sign.dis { color: var(--secondary-text); opacity: 0.7; }
    .ph-submit { width: 100%; min-height: 52px; margin-top: 8px; background: var(--accent-color); color: var(--on-solid); border: none; border-radius: 8px; padding: 13px; font-size: 16px; font-weight: 600; }
    .ph-submit:disabled { opacity: 0.5; }
  `],
})
export class LotoPermitPhaseComponent implements OnInit {
  private api = inject(LotoPermitApiService);
  private globalMessage = inject(GlobalMessageService);
  private store = inject(LotoPermitStore);
  private syncSvc = inject(LotoPermitSyncService);
  private drawingSvc = inject(LotoDrawingService);
  private serverStatus = inject(ServerStatusService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lotoId = 0;
  /**
   * HANG and VERIFY are the working modes. VIEW is read-only: the permit renders in full, with every
   * marking control and the whole submit footer withheld. It is what the list opens for a permit that
   * has no phase available — Building before CA approval, or an Active one with nothing left to do —
   * which previously had nowhere to open at all.
   */
  mode = signal<'HANG' | 'VERIFY' | 'VIEW'>('HANG');
  /** True in VIEW: no marking, no drafts, no submit. Display and drawings only. */
  readOnly = computed(() => this.mode() === 'VIEW');
  /**
   * The mode as a WORKING phase, for the draft store and the submit payload — neither of which has a
   * concept of VIEW. Every caller is guarded by {@link readOnly} first, so the VIEW fallback here is
   * unreachable rather than a silent reinterpretation of the mode.
   */
  private phase(): 'HANG' | 'VERIFY' { return this.mode() === 'VERIFY' ? 'VERIFY' : 'HANG'; }
  detail = signal<PwaLotoDetail | null>(null);
  positions = signal<PositionOptions | null>(null);
  drawingPointIds = signal<Set<number>>(new Set());
  loading = signal(false);
  error = signal('');
  submitting = signal(false);
  online = computed(() => this.serverStatus.isOnline());

  sign = signal(false);
  aggNotes = signal('');
  drawingPoint = signal<PwaLotoPoint | null>(null);

  /** per-point working state: checked/acknowledged/notes (keyed by pointId). */
  private draft: Record<number, { checked: boolean; acknowledged: string[]; notes: string }> = {};
  private tick = signal(0);

  async ngOnInit(): Promise<void> {
    this.lotoId = Number(this.route.snapshot.paramMap.get('id'));
    this.mode.set((this.route.snapshot.data['mode'] as 'HANG' | 'VERIFY' | 'VIEW') || 'HANG');
    this.loading.set(true);
    // cache-first
    const cached = this.store.getCachedDetail(this.lotoId);
    if (cached) { this.detail.set(cached.detail); this.loading.set(false); }
    const cachedPos = this.store.getCachedPositions();
    if (cachedPos) this.positions.set(cachedPos);
    try {
      const [d, pos] = await Promise.all([
        firstValueFrom(this.api.getDetail(this.lotoId)),
        firstValueFrom(this.api.getPositions()).catch(() => null),
      ]);
      if (d) { this.detail.set(d); this.store.cacheDetail(d); }
      if (pos) { this.positions.set(pos); this.store.cachePositions(pos); }
      void this.drawingSvc.precache(this.lotoId, 'permit');
    } catch {
      if (!this.detail()) this.error.set('Connect to the network to open this permit.');
    } finally {
      this.loading.set(false);
    }
    this.seedDraft();
    void this.loadDrawingIndex();
  }

  private seedDraft(): void {
    const d = this.detail();
    if (!d || this.readOnly()) return; // VIEW never marks anything, so it never needs a draft
    const existing = this.store.getPhaseDraft(this.lotoId, this.phase());
    for (const p of d.points) {
      const serverDone = this.isServerDone(p);
      const saved = existing?.answers?.[p.id];
      this.draft[p.id] = {
        checked: serverDone || saved?.checked || false,
        acknowledged: serverDone ? (p.installSafetyConditions ?? []) : (saved?.acknowledged ?? []),
        notes: saved?.notes ?? '',
      };
    }
    if (existing) { this.sign.set(existing.sign); this.aggNotes.set(existing.aggregateNotes ?? ''); }
  }

  private async loadDrawingIndex(): Promise<void> {
    try {
      const desc = await this.drawingSvc.drawingDescriptors(this.lotoId, 'permit');
      if (desc) this.drawingPointIds.set(new Set(desc.map(x => x.pointId)));
    } catch { /* offline / none */ }
  }

  // ── state ──
  isServerDone(p: PwaLotoPoint): boolean { return this.mode() === 'HANG' ? !!p.hungBy : !!p.verifiedBy; }
  isDraftChecked(pid: number): boolean { this.tick(); return !!this.draft[pid]?.checked; }
  isDone(p: PwaLotoPoint): boolean { return this.isServerDone(p) || this.isDraftChecked(p.id); }

  available(p: PwaLotoPoint): boolean {
    this.tick();
    if (this.isServerDone(p)) return true;
    // VERIFY = any order, but separation-of-duty blocks the point's own hanger (surfaced here, not at submit)
    if (this.mode() === 'VERIFY') return p.canVerify;
    const preds = p.installPredecessors ?? [];
    const d = this.detail();
    if (!d) return true;
    for (const req of preds) {
      const rp = d.points.find(x => x.id === req);
      if (rp && !this.isDone(rp)) return false;           // hang = predecessors must be done first
    }
    return true;
  }

  /** VIEW-mode totals: both halves of the lifecycle at once, rather than the active mode's one. */
  hungTotal(d: PwaLotoDetail): number { return d.points.filter(p => !!p.hungBy).length; }
  verifiedTotal(d: PwaLotoDetail): number { return d.points.filter(p => !!p.verifiedBy).length; }

  isAcked(pid: number, sc: string): boolean { this.tick(); return (this.draft[pid]?.acknowledged ?? []).includes(sc); }
  toggleAck(pid: number, sc: string): void {
    const a = this.draft[pid].acknowledged;
    const i = a.indexOf(sc);
    if (i >= 0) { a.splice(i, 1); if (this.draft[pid].checked) this.draft[pid].checked = false; } else a.push(sc);
    this.persist();
  }
  safetyOk(p: PwaLotoPoint): boolean {
    const need = p.installSafetyConditions ?? [];
    const have = this.draft[p.id]?.acknowledged ?? [];
    return need.every(sc => have.includes(sc));
  }

  noteOf(pid: number): string { return this.draft[pid]?.notes ?? ''; }
  setNote(pid: number, v: string): void { this.draft[pid].notes = v; this.persist(); }

  toggleMark(p: PwaLotoPoint): void {
    if (!this.available(p) || !this.safetyOk(p)) return;
    this.draft[p.id].checked = !this.draft[p.id].checked;
    this.persist();
  }

  doneCount(): number {
    this.tick();
    const d = this.detail();
    return d ? d.points.filter(p => this.isDone(p)).length : 0;
  }
  allDone(): boolean {
    const d = this.detail();
    return !!d && d.points.length > 0 && d.points.every(p => this.isDone(p));
  }
  anyToSubmit(): boolean {
    const d = this.detail();
    if (!d) return false;
    return d.points.some(p => !this.isServerDone(p) && this.isDraftChecked(p.id)) || (this.sign() && this.allDone());
  }

  hasDrawing(pid: number): boolean { return this.drawingPointIds().has(pid); }
  openDrawing(p: PwaLotoPoint): void { this.drawingPoint.set(p); }

  isoName(p: PwaLotoPoint): string {
    const opt = this.positions()?.isoPos?.find(v => v.id === p.isoPosId);
    return opt?.name || p.isolatedPosition || '—';
  }
  normName(p: PwaLotoPoint): string {
    const opt = this.positions()?.normPos?.find(v => v.id === p.normPosId);
    return opt?.name || p.normalPosition || '—';
  }
  predecessorTags(p: PwaLotoPoint, points: PwaLotoPoint[]): string {
    return (p.installPredecessors ?? [])
      .filter(req => { const rp = points.find(x => x.id === req); return rp && !this.isDone(rp); })
      .map(req => points.find(x => x.id === req)?.tagNumber || ('#' + req)).join(', ');
  }

  private persist(): void {
    if (this.readOnly()) return; // nothing to persist: VIEW has no draft
    this.tick.update(n => n + 1);
    // never demote an already-queued ('pending'/'failed') submit back to 'draft' — that would strand the auto-flush
    const existing = this.store.getPhaseDraft(this.lotoId, this.phase());
    const status = existing && (existing.status === 'pending' || existing.status === 'failed') ? existing.status : 'draft';
    const draft: PhaseDraft = {
      lotoId: this.lotoId, phase: this.phase(), answers: this.draft, sign: this.sign(),
      aggregateNotes: this.aggNotes(), savedAt: Date.now(), status,
    };
    this.store.savePhaseDraft(draft);
  }

  submit(): void {
    const d = this.detail();
    if (!d || this.readOnly()) return; // the footer is not rendered in VIEW; this closes the path anyway
    this.submitting.set(true);
    this.error.set('');
    // only NEW (not server-done) checked points; server skips anything already done
    const answers: PhaseDraft['answers'] = {};
    for (const p of d.points) {
      if (!this.isServerDone(p) && this.draft[p.id]?.checked) answers[p.id] = this.draft[p.id];
    }
    const draft: PhaseDraft = {
      lotoId: this.lotoId, phase: this.phase(), answers, sign: this.sign() && this.allDone(),
      aggregateNotes: this.aggNotes(), savedAt: Date.now(), status: 'pending',
    };
    this.store.savePhaseDraft(draft);
    this.syncSvc.submitPhase(draft).subscribe({
      next: (res) => {
        // If the server rejected everything, stay put and SHOW WHY (don't bounce back with a bare "0 applied").
        if (res.applied === 0 && res.failures?.length) {
          this.submitting.set(false);
          this.error.set(`Nothing was applied. ${res.failures[0]}` + (res.failures.length > 1 ? ` (+${res.failures.length - 1} more)` : ''));
          return;
        }
        const parts = [`${res.applied} applied`];
        if (res.skipped) parts.push(`${res.skipped} already done`);
        if (res.aggregateSigned) parts.push('signed complete');
        if (res.failures?.length) parts.push(`${res.failures.length} rejected: ${res.failures[0]}`);
        if (res.aggregateMessage) parts.push(res.aggregateMessage);
        this.globalMessage.showSuccess('Submitted — ' + parts.join(', '));
        this.router.navigate(['/loto']);
      },
      error: (err) => {
        this.submitting.set(false);
        const status = err?.status;
        if (status === 400 || status === 409) this.error.set(err?.error?.message || 'Rejected — review and retry.');
        else { this.globalMessage.showInfo('No connection — saved and will submit automatically when back online.', 'yellow'); this.router.navigate(['/loto']); }
      },
    });
  }

  back(): void { this.router.navigate(['/loto']); }
}
