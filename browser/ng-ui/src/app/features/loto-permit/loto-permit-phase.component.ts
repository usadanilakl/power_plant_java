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

/**
 * Hang or Verify a LOTO permit (mode from route data). HANG is order-locked: a point is available only once every
 * install-predecessor is hung. VERIFY is order-deviatable: any order, but every point must be verified (and the
 * server still enforces all-hung + hanger≠verifier). Offline-first: cache on open, work against a draft, one submit
 * that flushes on reconnect. Safety conditions must be acknowledged before a point can be marked.
 */
@Component({
  selector: 'app-loto-permit-phase',
  standalone: true,
  imports: [FormsModule, MainLayoutComponent, LotoDrawingViewerComponent],
  template: `
    <app-main-layout [header]="mode() === 'HANG' ? 'Hang LOTO' : 'Verify LOTO'">
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
              <div class="ph-sub">{{ d.equipmentSystem }} · {{ doneCount() }}/{{ d.points.length }} {{ mode() === 'HANG' ? 'hung' : 'verified' }}</div>
            </div>

            @for (p of d.points; track p.id) {
              <div class="ph-p" [class.done]="isDone(p)" [class.locked]="!available(p)">
                <div class="ph-p-head">
                  <span class="ph-tag">{{ p.tagNumber || ('#' + p.id) }}</span>
                  <span class="ph-flags">
                    @if (isServerDone(p)) { <span class="ph-badge ok">✓ {{ mode() === 'HANG' ? p.hungBy : p.verifiedBy }}</span> }
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

                @if (mode() === 'HANG' && !available(p) && !isServerDone(p)) {
                  <div class="ph-lock">🔒 Hang predecessor(s) first: {{ predecessorTags(p, d.points) }}</div>
                }

                @if (!isServerDone(p)) {
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
    .ph-back { background: none; border: none; color: #1976d2; padding: 4px 0 8px; font-size: 14px; }
    .ph-net { background: #fff8e1; color: #8d6e00; border: 1px solid #ffe082; border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .ph-msg { padding: 20px; text-align: center; color: #777; }
    .ph-err { color: #c62828; }
    .ph-head { margin-bottom: 10px; }
    .ph-title { font-size: 16px; font-weight: 600; }
    .ph-sub { color: #666; font-size: 13px; margin-top: 2px; }
    .ph-p { background: #fff; border: 1px solid #e6e6e6; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
    .ph-p.done { border-color: #a5d6a7; background: #f4fbf4; }
    .ph-p.locked { opacity: 0.6; }
    .ph-p-head { display: flex; justify-content: space-between; align-items: center; }
    .ph-tag { font-weight: 700; }
    .ph-flags { display: flex; align-items: center; gap: 8px; }
    .ph-badge.ok { background: #e8f5e9; color: #2e7d32; border-radius: 4px; padding: 1px 6px; font-size: 11px; }
    .ph-dwg { background: #eef4fb; color: #1976d2; border: none; border-radius: 6px; padding: 4px 8px; font-size: 12px; }
    .ph-desc { margin: 4px 0 6px; font-size: 14px; }
    .ph-pos { display: flex; flex-wrap: wrap; gap: 10px; color: #555; font-size: 12px; }
    .ph-lock { margin-top: 8px; background: #fff3e0; color: #e65100; border-radius: 6px; padding: 6px 8px; font-size: 12px; }
    .ph-safety { margin-top: 8px; }
    .ph-safety-h { font-size: 12px; color: #666; font-weight: 600; }
    .ph-chk { display: flex; align-items: flex-start; gap: 6px; font-size: 13px; margin-top: 3px; }
    .ph-notes { width: 100%; margin-top: 8px; padding: 7px; border: 1px solid #ccc; border-radius: 6px; font: inherit; resize: vertical; }
    .ph-mark { margin-top: 8px; width: 100%; padding: 10px; border: 1px solid #cfcfcf; border-radius: 8px; background: #fafafa; font-size: 15px; }
    .ph-mark.on { background: #2e7d32; color: #fff; border-color: #2e7d32; }
    .ph-mark:disabled { opacity: 0.5; }
    .ph-foot { position: sticky; bottom: 0; background: #fff; padding: 10px 0; border-top: 1px solid #eee; }
    .ph-sign { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .ph-sign.dis { color: #aaa; }
    .ph-submit { width: 100%; margin-top: 8px; background: #1976d2; color: #fff; border: none; border-radius: 8px; padding: 13px; font-size: 16px; }
    .ph-submit:disabled { background: #90caf9; }
  `],
})
export class LotoPermitPhaseComponent implements OnInit {
  private api = inject(LotoPermitApiService);
  private store = inject(LotoPermitStore);
  private syncSvc = inject(LotoPermitSyncService);
  private drawingSvc = inject(LotoDrawingService);
  private serverStatus = inject(ServerStatusService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lotoId = 0;
  mode = signal<'HANG' | 'VERIFY'>('HANG');
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
    this.mode.set((this.route.snapshot.data['mode'] as 'HANG' | 'VERIFY') || 'HANG');
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
    if (!d) return;
    const existing = this.store.getPhaseDraft(this.lotoId, this.mode());
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
    if (this.mode() === 'VERIFY') return true;            // verify = any order
    if (this.isServerDone(p)) return true;
    const preds = p.installPredecessors ?? [];
    const d = this.detail();
    if (!d) return true;
    for (const req of preds) {
      const rp = d.points.find(x => x.id === req);
      if (rp && !this.isDone(rp)) return false;           // hang = predecessors must be done first
    }
    return true;
  }

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
    this.tick.update(n => n + 1);
    const draft: PhaseDraft = {
      lotoId: this.lotoId, phase: this.mode(), answers: this.draft, sign: this.sign(),
      aggregateNotes: this.aggNotes(), savedAt: Date.now(), status: 'draft',
    };
    this.store.savePhaseDraft(draft);
  }

  submit(): void {
    const d = this.detail();
    if (!d) return;
    this.submitting.set(true);
    this.error.set('');
    // only NEW (not server-done) checked points; server skips anything already done
    const answers: PhaseDraft['answers'] = {};
    for (const p of d.points) {
      if (!this.isServerDone(p) && this.draft[p.id]?.checked) answers[p.id] = this.draft[p.id];
    }
    const draft: PhaseDraft = {
      lotoId: this.lotoId, phase: this.mode(), answers, sign: this.sign() && this.allDone(),
      aggregateNotes: this.aggNotes(), savedAt: Date.now(), status: 'pending',
    };
    this.store.savePhaseDraft(draft);
    this.syncSvc.submitPhase(draft).subscribe({
      next: (res) => {
        const parts = [`${res.applied} applied`];
        if (res.skipped) parts.push(`${res.skipped} already done`);
        if (res.aggregateSigned) parts.push('signed complete');
        if (res.failures?.length) parts.push(`${res.failures.length} rejected`);
        if (res.aggregateMessage) parts.push(res.aggregateMessage);
        alert('Submitted — ' + parts.join(', '));
        this.router.navigate(['/loto']);
      },
      error: (err) => {
        this.submitting.set(false);
        const status = err?.status;
        if (status === 400 || status === 409) this.error.set(err?.error?.message || 'Rejected — review and retry.');
        else { alert('No connection — saved and will submit automatically when back online.'); this.router.navigate(['/loto']); }
      },
    });
  }

  back(): void { this.router.navigate(['/loto']); }
}
