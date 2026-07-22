import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { ServerStatusService } from '../../services/server-status.service';
import { LotoDrawingService } from './loto-drawing.service';
import { LotoDrawingViewerComponent } from './loto-drawing-viewer.component';
import { LotoPointActionsComponent } from './loto-point-actions.component';
import { LotoStandardApiService } from './loto-standard-api.service';
import { LotoStandardStore } from './loto-standard-store.service';
import { LotoWalkdownSyncService } from './loto-walkdown-sync.service';
import {
  GLOBAL_ITEMS, GlobalItemDef, LOTO_STANDARD_STATUS, LotoPointRef, LotoStandard, POINT_CHECKS,
  PointChecklist, PositionOptions, WalkdownDraft, orderedPoints, pointChecklistComplete, pointHasNegative,
} from './loto-standard.model';

type TransitionMode = 'verify' | 'walkdown' | null;

@Component({
  selector: 'app-loto-standard-walkdown',
  standalone: true,
  imports: [MainLayoutComponent, LotoDrawingViewerComponent, LotoPointActionsComponent],
  template: `
    <app-main-layout [header]="'Verify / Walk down'">
      <ng-container main-content>
        <div class="w-container">
          <button class="w-back" (click)="back()">← Standard</button>

          @if (!online()) {
            <div class="w-net">📴 Offline — your checklist is saved on this device and submits when you reconnect.</div>
          }

          @if (loading()) {
            <p class="w-msg">Loading…</p>
          } @else if (error() || !std() || !draft()) {
            <p class="w-msg w-error">{{ error() || 'Standard not available.' }}</p>
          } @else if (submitted()) {
            <div class="w-done">
              <div class="w-done-icon">✓</div>
              <p class="w-done-title">{{ submittedMessage() }}</p>
              <button class="w-save" (click)="back()">Back to standard</button>
            </div>
          } @else {
            <h1 class="w-title">{{ std()!.name || '(unnamed)' }}</h1>
            <p class="w-status">Status: <b>{{ statusName() || 'Draft' }}</b>
              @if (mode() === null) { <span class="w-hint">— not currently awaiting verification or walkdown</span> }
            </p>

            <!-- Global items -->
            <h2 class="w-h2">Standard items</h2>
            <div class="w-globals">
              @for (g of globalItemsToShow(); track g.key) {
                <div class="w-global-item">
                  <label class="w-global">
                    <input type="checkbox" [checked]="globalChecked(g.key)"
                           (change)="setGlobal(g.key, $any($event.target).checked)">
                    <span>{{ g.label }}</span>
                  </label>
                  @if (globalText(g); as txt) {
                    <details class="w-reveal"><summary>View text</summary><p class="w-reveal-body">{{ txt }}</p></details>
                  } @else if (g.field) {
                    <span class="w-reveal-empty">No text recorded</span>
                  }
                  @if (g.order) {
                    <details class="w-reveal">
                      <summary>View {{ g.order }} order</summary>
                      <ol class="w-order">
                        @for (p of orderFor(g.order); track p.id) {
                          <li class="w-order-item">
                            <span class="w-order-tag">{{ p.tagNumber || '—' }}</span>
                            @if (p.description) { <span class="w-order-desc">{{ p.description }}</span> }
                          </li>
                        }
                      </ol>
                    </details>
                  }
                </div>
              }
            </div>

            <!-- Points -->
            <h2 class="w-h2">Points ({{ completeCount() }}/{{ points().length }} complete)</h2>
            @for (p of points(); track p.id) {
              <div class="w-point" [class.done]="pointComplete(p.id)">
                <div class="w-point-head">
                  <span class="w-tag">{{ corrTag(p) || '—' }}</span>
                  <span class="w-point-head-right">
                    @if (hasDrawing(p.id)) { <button class="w-drawing-btn" (click)="openDrawing(p)">📄 Drawing</button> }
                    @else if (drawingMissing(p.id)) { <span class="w-flag-missing">⚠ No drawing</span> }
                    @if (pointComplete(p.id)) { <span class="w-badge-ok">✓ complete</span> }
                  </span>
                </div>

                <dl class="w-point-info">
                  @if (corrDesc(p)) { <dt>Description</dt><dd>{{ corrDesc(p) }}</dd> }
                  <dt>Isolation position</dt><dd>{{ isoName(p) || '—' }}</dd>
                  <dt>Restored position</dt><dd>{{ normName(p) || '—' }}</dd>
                  @if (p.zeroEnergyMethod) {
                    <dt>Zero energy</dt><dd>{{ p.zeroEnergyMethod }}</dd>
                  } @else {
                    <dt>Zero energy</dt><dd class="w-missing">⚠ none recorded — flag it below</dd>
                  }
                </dl>

                @for (c of checks; track c.key) {
                  <div class="w-check">
                    <span class="w-check-label">{{ c.label }}</span>
                    <span class="w-check-btns">
                      <button class="w-yn pass" [class.active]="checkValue(p.id, c.key) === true"
                              (click)="setCheck(p.id, c.key, true)">Pass</button>
                      <button class="w-yn fail" [class.active]="checkValue(p.id, c.key) === false"
                              (click)="setCheck(p.id, c.key, false)">Fail</button>
                    </span>
                  </div>
                }

                @if (pointNegative(p.id)) {
                  <textarea class="w-comment" rows="2" placeholder="Comment required — explain the failed check(s)"
                            [value]="comment(p.id)" (input)="setComment(p.id, $any($event.target).value)"></textarea>
                }

                <details class="w-correct">
                  <summary>Correct tag / description / position</summary>
                  <label class="w-field">Tag number
                    <input type="text" [value]="corrTag(p)" (input)="setCorr(p.id, 'tagNumber', $any($event.target).value)">
                  </label>
                  <label class="w-field">Description
                    <input type="text" [value]="corrDesc(p)" (input)="setCorr(p.id, 'description', $any($event.target).value)">
                  </label>
                  <label class="w-field">Isolation position
                    <select [value]="corrIso(p)" (change)="setCorrPos(p.id, 'isoPosId', $any($event.target).value)">
                      <option value="">—</option>
                      @for (o of positions().isoPos; track o.id) { <option [value]="o.id" [selected]="o.id === corrIso(p)">{{ o.name }}</option> }
                    </select>
                  </label>
                  <label class="w-field">Restored position
                    <select [value]="corrNorm(p)" (change)="setCorrPos(p.id, 'normPosId', $any($event.target).value)">
                      <option value="">—</option>
                      @for (o of positions().normPos; track o.id) { <option [value]="o.id" [selected]="o.id === corrNorm(p)">{{ o.name }}</option> }
                    </select>
                  </label>
                </details>

                <app-loto-point-actions
                  [pointId]="p.id"
                  [pointLabel]="corrTag(p) || null" />
              </div>
            }

            <!-- Submit -->
            <div class="w-finish">
              @if (mode() !== null) {
                <h2 class="w-h2">{{ mode() === 'verify' ? 'Complete verification' : 'Complete walkdown' }}</h2>
                @if (!readyToComplete()) {
                  <p class="w-hint">Check every standard item and answer all point checks to
                    {{ mode() === 'verify' ? 'verify' : 'complete the walkdown' }}.</p>
                }
              } @else {
                <h2 class="w-h2">Submit checklist</h2>
                <p class="w-hint">This standard isn't awaiting a transition — your checklist will be recorded as evidence.</p>
              }
              <textarea class="w-comment" rows="2" placeholder="Notes (optional)"
                        [value]="notes()" (input)="setNotes($any($event.target).value)"></textarea>
              <button class="w-finish-btn" [disabled]="!canSubmit() || submitting()" (click)="doSubmit()">
                {{ submitting() ? 'Submitting…'
                   : (!online() ? 'Save & queue for submit'
                   : (mode() === 'verify' ? 'Mark Verified' : mode() === 'walkdown' ? 'Mark Walkdown Complete' : 'Submit checklist')) }}
              </button>
              @if (draft()!.status === 'failed' && draft()!.lastError) {
                <p class="w-msg w-error">{{ draft()!.lastError }}</p>
              }
            </div>
          }

          @if (viewerPoint(); as vp) {
            <app-loto-drawing-viewer [standardId]="std()!.id" [pointId]="vp.pointId" [title]="vp.tag"
                                     (close)="closeDrawing()"></app-loto-drawing-viewer>
          }

          @if (flash()) { <div class="w-flash" [class.err]="flashErr()">{{ flash() }}</div> }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .w-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; padding-bottom: 4rem; }
    .w-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; }
    .w-net { background: #b9770e; color: #fff; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.82rem; margin: 0.4rem 0 0.6rem; }
    .w-msg { text-align: center; color: var(--secondary-text, #888); padding: 2rem 1rem; }
    .w-error { color: #e74c3c; }
    .w-done { text-align: center; padding: 2.5rem 1rem; }
    .w-done-icon { width: 3.5rem; height: 3.5rem; line-height: 3.5rem; margin: 0 auto 0.75rem; border-radius: 50%; background: #27ae60; color: #fff; font-size: 2rem; }
    .w-done-title { color: var(--primary-text); font-size: 1.05rem; margin-bottom: 1.25rem; }
    .w-title { font-size: 1.3rem; font-weight: 700; color: var(--primary-text); margin: 0.3rem 0 0.2rem; }
    .w-status { color: var(--primary-text); font-size: 0.9rem; margin: 0 0 1rem; }
    .w-hint { color: var(--secondary-text, #888); font-size: 0.85rem; font-style: italic; }
    .w-h2 { font-size: 1rem; font-weight: 700; color: var(--primary-text); margin: 1.2rem 0 0.5rem; }
    .w-globals { display: flex; flex-direction: column; gap: 0.65rem; }
    .w-global-item { border-bottom: 1px solid var(--border-color); padding-bottom: 0.55rem; }
    .w-global-item:last-child { border-bottom: none; padding-bottom: 0; }
    .w-global { display: flex; align-items: center; gap: 0.5rem; color: var(--primary-text); font-size: 0.92rem; }
    .w-global input { width: 1.15rem; height: 1.15rem; flex-shrink: 0; }
    .w-reveal { margin: 0.25rem 0 0 1.65rem; }
    .w-reveal summary { font-size: 0.78rem; color: var(--accent-color); cursor: pointer; }
    .w-reveal-body { white-space: pre-wrap; font-size: 0.85rem; color: var(--primary-text); margin: 0.35rem 0 0; }
    .w-reveal-empty { display: block; margin: 0.15rem 0 0 1.65rem; font-size: 0.72rem; font-style: italic; color: var(--secondary-text, #888); }
    .w-order { margin: 0.4rem 0 0 1.4rem; padding-left: 1rem; font-size: 0.85rem; color: var(--primary-text); }
    .w-order-item { margin: 0.35rem 0; padding-bottom: 0.35rem; border-bottom: 1px dashed var(--border-color); }
    .w-order-item:last-child { border-bottom: none; }
    .w-order-tag { font-weight: 700; }
    .w-order-desc { display: block; color: var(--secondary-text, #888); font-size: 0.8rem; margin-top: 0.1rem; }
    .w-point { border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem; margin-bottom: 0.75rem; background: var(--card-bg, var(--secondary-background)); }
    .w-point.done { border-color: #27ae60; }
    .w-point-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
    .w-point-head-right { display: flex; align-items: center; gap: 0.4rem; }
    .w-drawing-btn { background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color); border-radius: 8px; padding: 0.2rem 0.55rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-tag { font-weight: 700; color: var(--primary-text); }
    .w-badge-ok { font-size: 0.72rem; font-weight: 700; color: #fff; background: #27ae60; padding: 0.12rem 0.5rem; border-radius: 999px; }
    .w-point-info { display: grid; grid-template-columns: auto 1fr; gap: 0.15rem 0.7rem; margin: 0 0 0.55rem; }
    .w-point-info dt { font-size: 0.72rem; font-weight: 700; color: var(--secondary-text, #888); align-self: start; }
    .w-point-info dd { margin: 0; font-size: 0.85rem; color: var(--primary-text); }
    .w-point-info .w-missing { color: #e67e22; font-weight: 600; }
    .w-flag-missing { font-size: 0.72rem; font-weight: 700; color: #e67e22; white-space: nowrap; }
    .w-check { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.3rem 0; }
    .w-check-label { font-size: 0.85rem; color: var(--primary-text); flex: 1; }
    .w-check-btns { display: flex; gap: 0.3rem; flex-shrink: 0; }
    .w-yn { border: 1px solid var(--border-color); background: transparent; color: var(--secondary-text, #888); border-radius: 8px; padding: 0.3rem 0.7rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-yn.pass.active { background: #27ae60; border-color: #27ae60; color: #fff; }
    .w-yn.fail.active { background: #e74c3c; border-color: #e74c3c; color: #fff; }
    .w-comment { width: 100%; box-sizing: border-box; margin-top: 0.5rem; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.85rem; background: var(--secondary-background); color: var(--primary-text); resize: vertical; }
    .w-correct { margin-top: 0.6rem; }
    .w-correct summary { font-size: 0.8rem; color: var(--accent-color); cursor: pointer; }
    .w-field { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: var(--secondary-text, #888); margin: 0.5rem 0; }
    .w-field input, .w-field select { padding: 0.45rem 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .w-finish { margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem; }
    .w-finish-btn { width: 100%; margin-top: 0.5rem; background: #27ae60; color: #fff; border: none; border-radius: 10px; padding: 0.8rem; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-finish-btn:disabled { opacity: 0.5; cursor: default; }
    .w-save { background: var(--accent-color); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .w-flash { position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); background: #2c3e50; color: #fff; padding: 0.6rem 1.1rem; border-radius: 999px; font-size: 0.85rem; box-shadow: 0 3px 12px rgba(0,0,0,0.3); z-index: 50; max-width: 90%; text-align: center; }
    .w-flash.err { background: #c0392b; }
  `]
})
export class LotoStandardWalkdownComponent implements OnInit {
  private api = inject(LotoStandardApiService);
  private store = inject(LotoStandardStore);
  private sync = inject(LotoWalkdownSyncService);
  private drawingService = inject(LotoDrawingService);
  private serverStatus = inject(ServerStatusService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly checks = POINT_CHECKS;
  online = this.serverStatus.isOnline;

  std = signal<LotoStandard | null>(null);
  positions = signal<PositionOptions>({ isoPos: [], normPos: [] });
  draft = signal<WalkdownDraft | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  submitting = signal(false);
  submitted = signal(false);
  submittedMessage = signal('Submitted.');
  flash = signal<string | null>(null);
  flashErr = signal(false);
  pointsWithDrawings = signal<Set<number>>(new Set());
  drawingsChecked = signal(false);
  viewerPoint = signal<{ pointId: number; tag: string } | null>(null);

  points = computed<LotoPointRef[]>(() => this.std()?.lotoPoints ?? []);
  statusName = computed(() => this.std()?.developmentStatus?.name);
  mode = computed<TransitionMode>(() => this.modeFor(this.std()));
  notes = computed(() => this.draft()?.notes ?? '');

  globalItemsToShow = computed(() => {
    const s = this.std();
    return GLOBAL_ITEMS.filter(g => !g.field || !!(s?.[g.field]));
  });

  completeCount = computed(() => {
    const d = this.draft();
    return this.points().filter(p => pointChecklistComplete(d?.pointResults?.[String(p.id)])).length;
  });

  private allGlobalChecked = computed(() =>
    this.globalItemsToShow().every(g => this.draft()?.globalItems?.[g.key]?.checked));
  private allPointsComplete = computed(() => {
    const pts = this.points();
    return pts.length > 0 && pts.every(p => pointChecklistComplete(this.draft()?.pointResults?.[String(p.id)]));
  });
  readyToComplete = computed(() => this.allGlobalChecked() && this.allPointsComplete());
  /** With a pending transition, require completeness; with none, allow recording partial evidence. */
  canSubmit = computed(() => this.mode() === null ? true : this.readyToComplete());

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) { this.error.set('Missing standard id.'); this.loading.set(false); return; }
    const id = Number(idParam);

    // Seed from cache immediately so the screen works with no signal.
    const cachedStd = this.store.getCachedStandard(id);
    const cachedPos = this.store.getCachedPositions();
    if (cachedStd) this.std.set(cachedStd.std);
    if (cachedPos) this.positions.set(cachedPos);
    this.draft.set(this.store.getDraft(id) ?? this.newDraft(id, this.std()));
    if (cachedStd) this.loading.set(false);
    this.loadDrawings(id);

    // Always try to refresh (works online; harmless offline — the request just fails and we keep the cache).
    forkJoin({
      std: this.api.getById(id).pipe(catchError(() => of(null))),
      pos: this.api.getPositions().pipe(catchError(() => of(null))),
    }).subscribe(({ std, pos }) => {
      if (std) { this.std.set(std); this.store.cacheStandard(std); this.reseedDraft(std); }
      if (pos) { this.positions.set(pos); this.store.cachePositions(pos); }
      if (!this.std()) {
        this.error.set("This standard isn't cached and couldn't be fetched. Open it once on a connection first.");
      }
      this.loading.set(false);
    });
  }

  // ── Draft seeding ──────────────────────────────────────────────────────────
  private newDraft(id: number, std: LotoStandard | null): WalkdownDraft {
    return {
      standardId: id, capturedVersion: std?.currentVersion, transition: this.modeFor(std),
      notes: '', globalItems: {}, pointResults: {}, corrections: {}, status: 'draft', updatedAt: Date.now(),
    };
  }
  /** Keep the captured version + transition intent aligned with the freshly-fetched standard. */
  private reseedDraft(std: LotoStandard): void {
    const d = this.clone(this.draft()!);
    d.capturedVersion = std.currentVersion;
    d.transition = this.modeFor(std);
    this.draft.set(d);
    this.store.saveDraft(d);
  }
  private modeFor(std: LotoStandard | null): TransitionMode {
    switch (std?.developmentStatus?.name) {
      case LOTO_STANDARD_STATUS.PENDING_VERIFICATION: return 'verify';
      case LOTO_STANDARD_STATUS.VERIFIED: return 'walkdown';
      default: return null;
    }
  }

  private clone(d: WalkdownDraft): WalkdownDraft { return JSON.parse(JSON.stringify(d)); }
  private patch(mutate: (d: WalkdownDraft) => void): void {
    const d = this.clone(this.draft()!);
    mutate(d);
    d.status = 'draft';
    this.draft.set(d);
    this.store.saveDraft(d);
  }

  // ── Global items ───────────────────────────────────────────────────────────
  globalChecked(key: string): boolean { return !!this.draft()?.globalItems?.[key]?.checked; }
  setGlobal(key: string, checked: boolean): void { this.patch(d => { d.globalItems[key] = { checked }; }); }
  globalText(g: GlobalItemDef): string | null {
    if (!g.field) return null;
    const v = this.std()?.[g.field];
    return typeof v === 'string' && v.trim() ? v : null;
  }
  orderFor(which: 'install' | 'removal'): LotoPointRef[] { return orderedPoints(this.std(), which); }

  // ── Drawings ───────────────────────────────────────────────────────────────
  private async loadDrawings(id: number): Promise<void> {
    const list = await this.drawingService.drawingDescriptors(id);
    if (list) { this.pointsWithDrawings.set(new Set(list.map(d => d.pointId))); this.drawingsChecked.set(true); }
    this.drawingService.precache(id); // fire-and-forget: cache image blobs for offline field use
  }
  hasDrawing(pointId: number): boolean { return this.pointsWithDrawings().has(pointId); }
  drawingMissing(pointId: number): boolean { return this.drawingsChecked() && !this.pointsWithDrawings().has(pointId); }
  openDrawing(p: LotoPointRef): void { this.viewerPoint.set({ pointId: p.id, tag: this.corrTag(p) || String(p.id) }); }
  closeDrawing(): void { this.viewerPoint.set(null); }
  isoName(p: LotoPointRef): string {
    const cid = this.draft()?.corrections?.[String(p.id)]?.isoPosId;
    if (cid) return this.positions().isoPos.find(o => o.id === cid)?.name ?? '';
    return p.isoPos?.name ?? p.isolatedPosition ?? '';
  }
  normName(p: LotoPointRef): string {
    const cid = this.draft()?.corrections?.[String(p.id)]?.normPosId;
    if (cid) return this.positions().normPos.find(o => o.id === cid)?.name ?? '';
    return p.normPos?.name ?? p.normalPosition ?? '';
  }

  // ── Per-point checks ───────────────────────────────────────────────────────
  checkValue(pointId: number, key: keyof PointChecklist): boolean | null | undefined {
    return this.draft()?.pointResults?.[String(pointId)]?.[key] as boolean | null | undefined;
  }
  setCheck(pointId: number, key: keyof PointChecklist, value: boolean): void {
    this.patch(d => {
      const cur: PointChecklist = { ...(d.pointResults[String(pointId)] ?? {}) };
      (cur[key] as boolean | null) = cur[key] === value ? null : value;
      d.pointResults[String(pointId)] = cur;
    });
  }
  pointNegative(pointId: number): boolean { return pointHasNegative(this.draft()?.pointResults?.[String(pointId)]); }
  pointComplete(pointId: number): boolean { return pointChecklistComplete(this.draft()?.pointResults?.[String(pointId)]); }
  comment(pointId: number): string { return this.draft()?.pointResults?.[String(pointId)]?.comment ?? ''; }
  setComment(pointId: number, text: string): void {
    this.patch(d => { d.pointResults[String(pointId)] = { ...(d.pointResults[String(pointId)] ?? {}), comment: text }; });
  }

  // ── Corrections ────────────────────────────────────────────────────────────
  corrTag(p: LotoPointRef): string { return this.draft()?.corrections?.[String(p.id)]?.tagNumber ?? p.tagNumber ?? ''; }
  corrDesc(p: LotoPointRef): string { return this.draft()?.corrections?.[String(p.id)]?.description ?? p.description ?? ''; }
  corrIso(p: LotoPointRef): number | '' {
    const c = this.draft()?.corrections?.[String(p.id)];
    return (c?.isoPosId ?? p.isoPos?.id) ?? '';
  }
  corrNorm(p: LotoPointRef): number | '' {
    const c = this.draft()?.corrections?.[String(p.id)];
    return (c?.normPosId ?? p.normPos?.id) ?? '';
  }
  setCorr(pointId: number, field: 'tagNumber' | 'description', value: string): void {
    this.patch(d => { d.corrections[String(pointId)] = { ...(d.corrections[String(pointId)] ?? {}), [field]: value }; });
  }
  setCorrPos(pointId: number, field: 'isoPosId' | 'normPosId', value: string): void {
    const id = value ? Number(value) : null;
    this.patch(d => { d.corrections[String(pointId)] = { ...(d.corrections[String(pointId)] ?? {}), [field]: id }; });
  }

  // ── Notes + submit ─────────────────────────────────────────────────────────
  setNotes(text: string): void { this.patch(d => { d.notes = text; }); }

  doSubmit(): void {
    const d = this.clone(this.draft()!);
    // client-side guard: any negative needs a comment
    for (const p of this.points()) {
      const cl = d.pointResults[String(p.id)];
      if (pointHasNegative(cl) && !(cl?.comment ?? '').trim()) {
        this.flashMsg(`Point ${this.corrTag(p) || p.id}: add a comment for the failed check(s).`, true);
        return;
      }
    }
    d.transition = this.mode();
    d.capturedVersion = this.std()?.currentVersion;
    this.draft.set(d);
    this.store.saveDraft(d);

    // Optimistic: always attempt the submit. On a real network failure sync.submit() re-saves it as 'pending'
    // (queued) and it flushes on reconnect — so we don't depend on the possibly-stale online() signal here.
    this.submitting.set(true);
    this.sync.submit(d).subscribe({
      next: res => {
        this.submitting.set(false);
        if (res.standard) this.std.set(res.standard);
        this.submittedMessage.set(res.transitioned
          ? (this.mode() === 'walkdown' ? 'Walkdown complete.' : 'Standard verified.')
          : (res.transitionMessage ? `Checklist recorded. Not finalized: ${res.transitionMessage}` : 'Checklist recorded.'));
        this.submitted.set(true);
      },
      error: err => {
        this.submitting.set(false);
        const status = err?.status;
        if (status === 409) {
          this.flashMsg(err?.error?.message || 'This standard changed — reopen it to refresh.', true);
        } else if (status === 400) {
          this.flashMsg(this.msg(err), true);
        } else {
          // network / offline / 5xx — sync.submit() already queued it as 'pending'.
          this.submittedMessage.set('Saved on this device — it will submit automatically when you reconnect.');
          this.submitted.set(true);
        }
      }
    });
  }

  back(): void { this.router.navigate(['/loto-standards', this.route.snapshot.paramMap.get('id')]); }

  private flashMsg(text: string, isErr = false): void {
    this.flash.set(text); this.flashErr.set(isErr);
    setTimeout(() => { if (this.flash() === text) this.flash.set(null); }, 3500);
  }
  private msg(e: any, fallback = 'Something went wrong.'): string {
    return e?.error?.message || e?.message || fallback;
  }
}
