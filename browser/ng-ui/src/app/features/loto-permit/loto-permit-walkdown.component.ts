import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { ServerStatusService } from '../../services/server-status.service';
import { LotoDrawingService } from '../loto-standard/loto-drawing.service';
import { LotoDrawingViewerComponent } from '../loto-standard/loto-drawing-viewer.component';
import { LotoPermitApiService } from './loto-permit-api.service';
import { LotoPermitStore } from './loto-permit-store.service';
import { LotoPermitSyncService } from './loto-permit-sync.service';
import { PwaLotoDetail, PwaLotoPoint, PwaWalkdownSession, WalkdownDraft } from './loto-permit.model';

/**
 * Repeatable LOTO permit walkdown — a standalone multi-crew checklist available once the permit is verified. Free
 * order + free point selection (no predecessor gating). Start a new session (online) or continue an incomplete one,
 * check points offline against a draft, then submit once (flushes on reconnect).
 */
@Component({
  selector: 'app-loto-permit-walkdown',
  standalone: true,
  imports: [FormsModule, DatePipe, MainLayoutComponent, LotoDrawingViewerComponent],
  template: `
    <app-main-layout header="Walk down LOTO">
      <ng-container main-content>
        <div class="wd">
          <button class="wd-back" (click)="back()">← LOTO</button>
          @if (!online()) { <div class="wd-net">📴 Offline — saved on this device, submits when you reconnect.</div> }

          @if (loading()) { <p class="wd-msg">Loading…</p> }
          @else if (error() && !detail()) { <p class="wd-msg wd-err">{{ error() }}</p> }
          @else if (detail()) {
            @let d = detail()!;
            <div class="wd-head">
              <div class="wd-title">{{ d.permitNumber || ('Permit #' + d.id) }}</div>
              <div class="wd-sub">{{ d.equipmentSystem }}</div>
            </div>

            @if (!sessionId()) {
              <button class="wd-start" [disabled]="starting() || !online()" (click)="start()">
                {{ starting() ? 'Starting…' : '+ Start a walkdown' }}
              </button>
              @if (!online()) { <p class="wd-hint">Starting a new walkdown needs a connection.</p> }
              @if (sessions().length) {
                <div class="wd-sec">Sessions</div>
                @for (s of sessions(); track s.id) {
                  <div class="wd-sess" (click)="openSession(s)">
                    <div>{{ s.crewName || 'Crew' }} <span class="wd-muted">· {{ s.startedBy }}</span></div>
                    <div class="wd-muted">{{ s.startedAt | date:'MMM d, h:mm a' }} · {{ s.completed ? 'completed' : 'in progress' }}</div>
                  </div>
                }
              }
            } @else {
              <div class="wd-sesshdr">
                Walkdown · {{ checkedCount() }}/{{ d.points.length }} checked
                <button class="wd-switch" (click)="sessionId.set(null)">sessions</button>
              </div>
              @for (p of d.points; track p.id) {
                <div class="wd-p" [class.on]="isChecked(p.id)">
                  <label class="wd-row">
                    <input type="checkbox" [checked]="isChecked(p.id)" (change)="toggle(p.id)" />
                    <span class="wd-tag">{{ p.tagNumber || ('#' + p.id) }}</span>
                    <span class="wd-desc">{{ p.description }}</span>
                  </label>
                  <div class="wd-pos">
                    <span>Iso: {{ p.isolatedPosition || '—' }}</span>
                    @if (p.zeroEnergyMethod) { <span>ZE: {{ p.zeroEnergyMethod }}</span> }
                    @if (hasDrawing(p.id)) { <button class="wd-dwg" (click)="drawingPoint.set(p)">📄</button> }
                  </div>
                  @if (isChecked(p.id)) {
                    <input class="wd-note" [value]="noteOf(p.id)" (input)="setNote(p.id, $any($event.target).value)" placeholder="Note (optional)" />
                  }
                </div>
              }
              <div class="wd-foot">
                @if (error()) { <p class="wd-err">{{ error() }}</p> }
                <label class="wd-complete"><input type="checkbox" [checked]="complete()" (change)="complete.set($any($event.target).checked)" /> Mark walkdown complete</label>
                <textarea class="wd-note" rows="2" [value]="notes()" (input)="notes.set($any($event.target).value)" placeholder="Walkdown note (optional)"></textarea>
                <button class="wd-submit" [disabled]="submitting()" (click)="submit()">{{ submitting() ? 'Submitting…' : 'Submit walkdown' }}</button>
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
    .wd { padding: 10px 12px 90px; }
    .wd-back { background: none; border: none; color: #1976d2; padding: 4px 0 8px; font-size: 14px; }
    .wd-net { background: #fff8e1; color: #8d6e00; border: 1px solid #ffe082; border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .wd-msg { padding: 20px; text-align: center; color: #777; }
    .wd-err { color: #c62828; }
    .wd-head { margin-bottom: 10px; }
    .wd-title { font-size: 16px; font-weight: 600; }
    .wd-sub { color: #666; font-size: 13px; }
    .wd-start { width: 100%; background: #2e7d32; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 15px; }
    .wd-start:disabled { background: #a5d6a7; }
    .wd-hint { color: #888; font-size: 12px; text-align: center; }
    .wd-sec { font-size: 12px; font-weight: 700; color: #607d8b; text-transform: uppercase; margin: 14px 0 4px; }
    .wd-sess { background: #fff; border: 1px solid #e6e6e6; border-radius: 8px; padding: 10px; margin-bottom: 6px; }
    .wd-muted { color: #999; font-size: 12px; }
    .wd-sesshdr { display: flex; align-items: center; justify-content: space-between; color: #555; font-size: 13px; margin-bottom: 8px; }
    .wd-switch { background: #eef4fb; color: #1976d2; border: none; border-radius: 6px; padding: 4px 8px; font-size: 12px; }
    .wd-p { background: #fff; border: 1px solid #e6e6e6; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
    .wd-p.on { border-color: #90caf9; background: #f5f9ff; }
    .wd-row { display: flex; align-items: center; gap: 8px; }
    .wd-tag { font-weight: 700; }
    .wd-desc { color: #333; font-size: 14px; }
    .wd-pos { display: flex; align-items: center; gap: 10px; color: #666; font-size: 12px; margin-top: 4px; padding-left: 24px; }
    .wd-dwg { background: #eef4fb; color: #1976d2; border: none; border-radius: 6px; padding: 2px 8px; }
    .wd-note { width: 100%; margin-top: 6px; padding: 7px; border: 1px solid #ccc; border-radius: 6px; font: inherit; }
    .wd-foot { position: sticky; bottom: 0; background: #fff; padding: 10px 0; border-top: 1px solid #eee; }
    .wd-complete { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .wd-submit { width: 100%; margin-top: 8px; background: #1976d2; color: #fff; border: none; border-radius: 8px; padding: 13px; font-size: 16px; }
    .wd-submit:disabled { background: #90caf9; }
  `],
})
export class LotoPermitWalkdownComponent implements OnInit {
  private api = inject(LotoPermitApiService);
  private store = inject(LotoPermitStore);
  private syncSvc = inject(LotoPermitSyncService);
  private drawingSvc = inject(LotoDrawingService);
  private serverStatus = inject(ServerStatusService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lotoId = 0;
  detail = signal<PwaLotoDetail | null>(null);
  sessions = signal<PwaWalkdownSession[]>([]);
  sessionId = signal<number | null>(null);
  drawingPointIds = signal<Set<number>>(new Set());
  loading = signal(false);
  starting = signal(false);
  submitting = signal(false);
  error = signal('');
  online = computed(() => this.serverStatus.isOnline());

  complete = signal(false);
  notes = signal('');
  drawingPoint = signal<PwaLotoPoint | null>(null);

  private answers: Record<number, { checked: boolean; notes: string }> = {};
  private tick = signal(0);

  async ngOnInit(): Promise<void> {
    this.lotoId = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    const cached = this.store.getCachedDetail(this.lotoId);
    if (cached) { this.detail.set(cached.detail); this.loading.set(false); }
    try {
      const [d, sess] = await Promise.all([
        firstValueFrom(this.api.getDetail(this.lotoId)),
        firstValueFrom(this.api.walkdownSessions(this.lotoId)).catch(() => [] as PwaWalkdownSession[]),
      ]);
      if (d) { this.detail.set(d); this.store.cacheDetail(d); }
      this.sessions.set(sess);
      void this.drawingSvc.precache(this.lotoId, 'permit');
      void this.loadDrawingIndex();
    } catch {
      if (!this.detail()) this.error.set('Connect to the network to open this permit.');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadDrawingIndex(): Promise<void> {
    try {
      const desc = await this.drawingSvc.drawingDescriptors(this.lotoId, 'permit');
      if (desc) this.drawingPointIds.set(new Set(desc.map(x => x.pointId)));
    } catch { /* none */ }
  }

  async start(): Promise<void> {
    this.starting.set(true);
    this.error.set('');
    try {
      const s = await firstValueFrom(this.api.startWalkdown(this.lotoId, { crewName: null, notes: null }));
      this.sessions.update(list => [s, ...list]);
      this.enterSession(s);
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Could not start walkdown');
    } finally {
      this.starting.set(false);
    }
  }

  openSession(s: PwaWalkdownSession): void { this.enterSession(s); }

  private enterSession(s: PwaWalkdownSession): void {
    this.sessionId.set(s.id);
    this.answers = {};
    // seed from server session state, then overlay any local draft
    for (const ps of s.points ?? []) this.answers[ps.pointId] = { checked: ps.checked, notes: ps.notes ?? '' };
    const draft = this.store.getWalkdownDraft(s.id);
    if (draft) {
      for (const [pid, a] of Object.entries(draft.answers)) this.answers[Number(pid)] = a;
      this.complete.set(draft.complete);
      this.notes.set(draft.notes ?? '');
    }
    this.tick.update(n => n + 1);
  }

  isChecked(pid: number): boolean { this.tick(); return !!this.answers[pid]?.checked; }
  toggle(pid: number): void {
    const a = this.answers[pid] ?? (this.answers[pid] = { checked: false, notes: '' });
    a.checked = !a.checked;
    this.persist();
  }
  noteOf(pid: number): string { return this.answers[pid]?.notes ?? ''; }
  setNote(pid: number, v: string): void { (this.answers[pid] ?? (this.answers[pid] = { checked: false, notes: '' })).notes = v; this.persist(); }

  checkedCount(): number { this.tick(); return Object.values(this.answers).filter(a => a.checked).length; }
  hasDrawing(pid: number): boolean { return this.drawingPointIds().has(pid); }

  private persist(): void {
    this.tick.update(n => n + 1);
    const sid = this.sessionId();
    if (sid == null) return;
    const draft: WalkdownDraft = {
      sessionId: sid, lotoId: this.lotoId, answers: this.answers, complete: this.complete(),
      notes: this.notes(), savedAt: Date.now(), status: 'draft',
    };
    this.store.saveWalkdownDraft(draft);
  }

  submit(): void {
    const sid = this.sessionId();
    if (sid == null) return;
    this.submitting.set(true);
    this.error.set('');
    const draft: WalkdownDraft = {
      sessionId: sid, lotoId: this.lotoId, answers: this.answers, complete: this.complete(),
      notes: this.notes(), savedAt: Date.now(), status: 'pending',
    };
    this.store.saveWalkdownDraft(draft);
    this.syncSvc.submitWalkdown(draft).subscribe({
      next: () => { alert('Walkdown submitted.'); this.router.navigate(['/loto']); },
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
