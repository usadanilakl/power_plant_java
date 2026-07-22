import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { LotoDrawingService } from './loto-drawing.service';
import { LotoDrawingViewerComponent } from './loto-drawing-viewer.component';
import { LotoPointActionsComponent } from './loto-point-actions.component';
import { LotoStandardApiService } from './loto-standard-api.service';
import { LotoStandardStore } from './loto-standard-store.service';
import { LOTO_STANDARD_STATUS, LotoStandard, LotoPointRef, statusPhase } from './loto-standard.model';

type Tab = 'standard' | 'procedure';

@Component({
  selector: 'app-loto-standard-detail',
  standalone: true,
  imports: [MainLayoutComponent, DatePipe, LotoDrawingViewerComponent, LotoPointActionsComponent],
  template: `
    <app-main-layout [header]="std()?.name || 'LOTO Standard'">
      <ng-container main-content>
        <div class="d-container">
          <button class="d-back" (click)="back()">← Standards</button>

          @if (loading()) {
            <p class="d-msg">Loading…</p>
          } @else if (error() || !std()) {
            <p class="d-msg d-error">{{ error() || 'Standard not found.' }}</p>
          } @else {
            <div class="d-head">
              <h1 class="d-title">{{ std()!.name || '(unnamed)' }}</h1>
              <span class="d-badge" [class]="badgeClass()">{{ phase() }}</span>
            </div>

            @if (walkdownMode()) {
              <button class="d-action" (click)="openWalkdown()">
                {{ walkdownMode() === 'verify' ? '✓ Verify this standard' : '✓ Walk down this standard' }}
              </button>
            }

            <div class="d-tabs">
              <button class="d-tab" [class.active]="tab() === 'standard'" (click)="tab.set('standard')">Standard &amp; Points</button>
              <button class="d-tab" [class.active]="tab() === 'procedure'" (click)="tab.set('procedure')">Procedure</button>
            </div>

            @if (tab() === 'standard') {
              <section class="d-section">
                @if (std()!.description) { <p class="d-desc">{{ std()!.description }}</p> }
                <dl class="d-facts">
                  <dt>Status</dt><dd>{{ std()!.developmentStatus?.name || 'Draft' }}</dd>
                  @if (std()!.currentVersion != null) { <dt>Version</dt><dd>{{ std()!.currentVersion }}</dd> }
                  @if (std()!.verifiedBy) { <dt>Verified</dt><dd>{{ std()!.verifiedBy }} · {{ std()!.verifiedAt | date:'short' }}</dd> }
                  @if (std()!.walkdownBy) { <dt>Walked down</dt><dd>{{ std()!.walkdownBy }} · {{ std()!.walkdownAt | date:'short' }}</dd> }
                  @if (std()!.managerApprovedBy) { <dt>Approved</dt><dd>{{ std()!.managerApprovedBy }} · {{ std()!.managerApprovedAt | date:'short' }}</dd> }
                </dl>
              </section>

              <h2 class="d-h2">LOTO Points ({{ points().length }})</h2>
              @if (points().length === 0) {
                <p class="d-msg">No points on this standard.</p>
              } @else {
                <div class="d-points">
                  @for (p of points(); track p.id) {
                    <div class="d-point">
                      <div class="d-point-top">
                        <span class="d-tag">{{ p.tagNumber || '—' }}</span>
                        <span class="d-flags">
                          @if (hasDrawing(p.id)) { <button class="d-drawing-btn" (click)="openDrawing(p)">📄 Drawing</button> }
                          @if (p.isLockable) { <span class="d-flag">lockable</span> }
                          @if (p.isLabeled) { <span class="d-flag">tagged</span> }
                        </span>
                      </div>
                      @if (p.description) { <div class="d-point-desc">{{ p.description }}</div> }
                      <div class="d-point-pos">
                        <span><b>Isolate:</b> {{ p.isoPos?.name || p.isolatedPosition || '—' }}</span>
                        <span><b>Restore:</b> {{ p.normPos?.name || p.normalPosition || '—' }}</span>
                      </div>
                      @if (p.specificLocation || p.generalLocation) {
                        <div class="d-point-loc">{{ p.specificLocation || p.generalLocation }}</div>
                      }
                      @if (p.zeroEnergyMethod) {
                        <div class="d-point-ze"><b>Zero energy:</b> {{ p.zeroEnergyMethod }}</div>
                      }
                      <app-loto-point-actions
                        [pointId]="p.id"
                        [pointLabel]="p.tagNumber || null" />
                    </div>
                  }
                </div>
              }
            } @else {
              <section class="d-section">
                @for (b of procedureBlocks(); track b.label) {
                  @if (b.text) {
                    <div class="d-proc">
                      <h3 class="d-proc-h">{{ b.label }}</h3>
                      <p class="d-proc-body">{{ b.text }}</p>
                    </div>
                  }
                }
                @if (!hasAnyProcedure()) { <p class="d-msg">No procedure text on this standard.</p> }
                @if (std()!.removalReversesInstallOrder) {
                  <p class="d-note">Removal reverses the installation order.</p>
                }
              </section>
            }

            @if (viewerPoint(); as vp) {
              <app-loto-drawing-viewer [standardId]="std()!.id" [pointId]="vp.pointId" [title]="vp.tag"
                                       (close)="closeDrawing()"></app-loto-drawing-viewer>
            }
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .d-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .d-back { background: none; border: none; color: var(--accent-color); font-size: 0.9rem; padding: 0.2rem 0; cursor: pointer; }
    .d-msg { text-align: center; color: var(--secondary-text, #888); padding: 2rem 1rem; }
    .d-error { color: #e74c3c; }
    .d-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin: 0.4rem 0 0.75rem; }
    .d-title { font-size: 1.3rem; font-weight: 700; color: var(--primary-text); margin: 0; }
    .d-badge { font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; color: #fff; white-space: nowrap; }
    .d-badge.b-active { background: #27ae60; }
    .d-badge.b-walkdown { background: #2980b9; }
    .d-badge.b-verification { background: #e67e22; }
    .d-badge.b-draft { background: #95a5a6; }
    .d-action { display: block; width: 100%; margin: 0 0 1rem; background: #e67e22; color: #fff; border: none; border-radius: 10px; padding: 0.7rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .d-tabs { display: flex; gap: 0.4rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1rem; }
    .d-tab {
      background: none; border: none; padding: 0.6rem 0.4rem; font-size: 0.95rem; font-weight: 600; cursor: pointer;
      color: var(--secondary-text, #888); border-bottom: 2px solid transparent; font-family: inherit;
    }
    .d-tab.active { color: var(--primary-text); border-bottom-color: var(--accent-color); }
    .d-section { margin-bottom: 1rem; }
    .d-desc { color: var(--primary-text); margin: 0 0 0.75rem; }
    .d-facts { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.8rem; margin: 0; }
    .d-facts dt { font-weight: 700; color: var(--secondary-text, #888); font-size: 0.85rem; }
    .d-facts dd { margin: 0; color: var(--primary-text); font-size: 0.9rem; }
    .d-h2 { font-size: 1rem; font-weight: 700; color: var(--primary-text); margin: 1rem 0 0.5rem; }
    .d-points { display: flex; flex-direction: column; gap: 0.5rem; }
    .d-point { border: 1px solid var(--border-color); border-radius: 10px; padding: 0.7rem 0.85rem; background: var(--card-bg, var(--secondary-background)); }
    .d-point-top { display: flex; align-items: center; justify-content: space-between; }
    .d-tag { font-weight: 700; color: var(--primary-text); }
    .d-flags { display: flex; gap: 0.3rem; }
    .d-flag { font-size: 0.68rem; background: var(--border-color); color: var(--primary-text); padding: 0.1rem 0.4rem; border-radius: 6px; }
    .d-drawing-btn { font-size: 0.68rem; font-weight: 700; background: transparent; border: 1px solid var(--accent-color); color: var(--accent-color); padding: 0.1rem 0.4rem; border-radius: 6px; cursor: pointer; font-family: inherit; }
    .d-point-desc { color: var(--primary-text); font-size: 0.9rem; margin-top: 0.25rem; }
    .d-point-pos { display: flex; flex-wrap: wrap; gap: 0.2rem 1rem; margin-top: 0.35rem; font-size: 0.82rem; color: var(--secondary-text, #888); }
    .d-point-loc { margin-top: 0.25rem; font-size: 0.8rem; color: var(--secondary-text, #888); }
    .d-point-ze { margin-top: 0.25rem; font-size: 0.8rem; color: var(--secondary-text, #888); }
    .d-proc { margin-bottom: 1rem; }
    .d-proc-h { font-size: 0.9rem; font-weight: 700; color: var(--primary-text); margin: 0 0 0.3rem; }
    .d-proc-body { white-space: pre-wrap; color: var(--primary-text); font-size: 0.9rem; margin: 0; }
    .d-note { font-style: italic; color: var(--secondary-text, #888); font-size: 0.85rem; }
  `]
})
export class LotoStandardDetailComponent implements OnInit {
  private api = inject(LotoStandardApiService);
  private store = inject(LotoStandardStore);
  private drawingService = inject(LotoDrawingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  std = signal<LotoStandard | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  tab = signal<Tab>('standard');
  pointsWithDrawings = signal<Set<number>>(new Set());
  viewerPoint = signal<{ pointId: number; tag: string } | null>(null);

  points = computed<LotoPointRef[]>(() => this.std()?.lotoPoints ?? []);
  phase = computed(() => statusPhase(this.std()?.developmentStatus?.name));
  walkdownMode = computed<'verify' | 'walkdown' | null>(() => {
    switch (this.std()?.developmentStatus?.name) {
      case LOTO_STANDARD_STATUS.PENDING_VERIFICATION: return 'verify';
      case LOTO_STANDARD_STATUS.VERIFIED: return 'walkdown';
      default: return null;
    }
  });

  procedureBlocks = computed(() => {
    const s = this.std();
    return [
      { label: 'Install — Prerequisites', text: s?.installPrerequisitesText },
      { label: 'Install — Hazard Control', text: s?.installHazardControlText },
      { label: 'Install — Procedure', text: s?.installProcedureText },
      { label: 'Removal — Prerequisites', text: s?.removalPrerequisitesText },
      { label: 'Removal — Hazard Control', text: s?.removalHazardControlText },
      { label: 'Removal — Procedure', text: s?.removalProcedureText },
    ];
  });
  hasAnyProcedure = computed(() => this.procedureBlocks().some(b => !!b.text));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('Missing standard id.'); this.loading.set(false); return; }
    // Serve the cached copy instantly (works offline); refresh + re-cache when the network answers.
    const cached = this.store.getCachedStandard(id);
    if (cached) { this.std.set(cached.std); this.loading.set(false); }
    this.api.getById(id).subscribe({
      next: s => {
        if (s) { this.std.set(s); this.store.cacheStandard(s); }
        else if (!cached) this.error.set('Standard not found.');
        this.loading.set(false);
      },
      error: () => {
        if (!cached) this.error.set('Could not load this standard. You may be offline — open it once on a connection to cache it.');
        this.loading.set(false);
      }
    });
    this.loadDrawings(Number(id));
  }

  private async loadDrawings(id: number): Promise<void> {
    const list = await this.drawingService.drawingDescriptors(id);
    if (list) this.pointsWithDrawings.set(new Set(list.map(d => d.pointId)));
    this.drawingService.precache(id);
  }
  hasDrawing(pointId: number): boolean { return this.pointsWithDrawings().has(pointId); }
  openDrawing(p: LotoPointRef): void { this.viewerPoint.set({ pointId: p.id, tag: p.tagNumber || String(p.id) }); }
  closeDrawing(): void { this.viewerPoint.set(null); }

  back(): void { this.router.navigate(['/loto-standards']); }
  openWalkdown(): void { this.router.navigate(['/loto-standards', this.std()!.id, 'walkdown']); }
  badgeClass(): string {
    switch (this.phase()) {
      case 'Active': return 'd-badge b-active';
      case 'Walked down': return 'd-badge b-walkdown';
      case 'Verification': return 'd-badge b-verification';
      default: return 'd-badge b-draft';
    }
  }
}
