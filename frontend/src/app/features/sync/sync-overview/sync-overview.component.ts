import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { SyncStatusService, SyncHealthCheckResult } from '../../../services/sync-status.service';
import { DriftService, DriftScanState } from '../../../services/drift.service';

/**
 * Sync Dashboard › Overview. An at-a-glance summary sourced from the ACCURATE content-hash drift signal
 * (DriftService), NOT the old count/timestamp heuristic that read green while fields were drifting. Drift
 * numbers come from DriftService.summary()/overview(); the two "pending" backlog cards remain from the
 * connectivity health check (orthogonal to drift). Drill-down links into the Drift Center.
 */
@Component({
  selector: 'app-sync-overview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule],
  template: `
    <div class="overview-container">
      <!-- Status Cards Row -->
      <div class="cards-row">
        <mat-card class="status-card" [class]="'status-' + overallStatus()">
          <mat-card-content>
            <mat-icon class="status-icon">{{ statusIcon() }}</mat-icon>
            <div class="status-text">
              <span class="status-label">{{ statusLabel() }}</span>
              <span class="status-detail">{{ statusDetail() }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value" [class.warn]="summary().flagged > 0">{{ summary().flagged }}</div>
            <div class="metric-label">Drifting Fields</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ driftingTypes().length }}</div>
            <div class="metric-label">Types Drifting</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ health()?.localStats?.pendingSyncCount ?? '—' }}</div>
            <div class="metric-label">Pending Local</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ health()?.serverPendingChangesForClient ?? '—' }}</div>
            <div class="metric-label">Pending Server</div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Actions -->
      <div class="actions-row">
        <button mat-raised-button color="primary" (click)="scanNow()" [disabled]="scanning()">
          <mat-icon>refresh</mat-icon>
          {{ scanning() ? 'Scanning…' : 'Scan Now' }}
        </button>
        <button mat-button color="primary" (click)="openDriftCenter()">
          <mat-icon>rule</mat-icon>
          Open Drift Center
        </button>
        <span class="last-scan">last scan {{ fmt(lastScanAt()) }}</span>
      </div>

      <!-- Per-type Drift Table -->
      @if (driftingTypes().length > 0) {
        <h3>Drifting Entity Types</h3>
        <table mat-table [dataSource]="driftingTypes()" class="drift-table">
          <ng-container matColumnDef="entityType">
            <th mat-header-cell *matHeaderCellDef>Entity Type</th>
            <td mat-cell *matCellDef="let row">{{ row.entityType }}</td>
          </ng-container>
          <ng-container matColumnDef="flagged">
            <th mat-header-cell *matHeaderCellDef>Drift</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip color="warn" highlighted>{{ row.flaggedCount }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="peers">
            <th mat-header-cell *matHeaderCellDef>Checked against</th>
            <td mat-cell *matCellDef="let row">{{ row.spBacked ? 'hub + SharePoint' : 'hub' }}</td>
          </ng-container>
          <ng-container matColumnDef="lastScan">
            <th mat-header-cell *matHeaderCellDef>Last scan</th>
            <td mat-cell *matCellDef="let row">{{ fmt(row.lastScannedAt) }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button mat-button color="primary" (click)="openDriftCenter(row.entityType)">Review</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"
              (click)="openDriftCenter(row.entityType)"></tr>
        </table>
      } @else if (scannedAny()) {
        <div class="all-good">
          <mat-icon>check_circle</mat-icon>
          <span>No content drift detected — every scanned type matches the hub.</span>
        </div>
      } @else {
        <div class="all-good muted">
          <mat-icon>hourglass_empty</mat-icon>
          <span>No scan has run yet — click "Scan Now" to check for drift.</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .overview-container { padding: 16px; }
    .cards-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .status-card { flex: 2; min-width: 250px; }
    .metric-card { flex: 1; min-width: 120px; text-align: center; }
    .status-card mat-card-content { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .status-icon { font-size: 36px; width: 36px; height: 36px; }
    .status-in-sync .status-icon { color: #4caf50; }
    .status-possibly-out-of-sync .status-icon { color: #ff9800; }
    .status-out-of-sync .status-icon { color: #f44336; }
    .status-unknown .status-icon { color: #9e9e9e; }
    .status-text { display: flex; flex-direction: column; }
    .status-label { font-weight: 600; font-size: 16px; }
    .status-detail { font-size: 12px; opacity: 0.7; }
    .metric-value { font-size: 24px; font-weight: 600; }
    .metric-value.warn { color: #ff9800; }
    .metric-label { font-size: 11px; text-transform: uppercase; opacity: 0.6; }
    .actions-row { margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
    .last-scan { font-size: 12px; opacity: 0.6; font-style: italic; }
    .drift-table { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(255,255,255,0.05); }
    .all-good { display: flex; align-items: center; gap: 8px; padding: 24px; opacity: 0.7; }
    .all-good.muted mat-icon { color: #9e9e9e; }
    .all-good mat-icon { color: #4caf50; }
    h3 { margin: 16px 0 8px; }
  `]
})
export class SyncOverviewComponent implements OnInit, OnDestroy {
  private driftService = inject(DriftService);
  private syncStatusService = inject(SyncStatusService);
  private router = inject(Router);
  private subs: Subscription[] = [];

  health = signal<SyncHealthCheckResult | null>(null); // ONLY for the pending-backlog cards (connectivity)
  displayedColumns = ['entityType', 'flagged', 'peers', 'lastScan', 'action'];

  summary = computed(() => this.driftService.summary());
  scanning = computed(() => this.driftService.scanning());
  private states = computed<DriftScanState[]>(() => [...this.driftService.scanState().values()]);
  driftingTypes = computed(() =>
    this.states().filter(s => s.flaggedCount > 0).sort((a, b) => b.flaggedCount - a.flaggedCount));
  scannedAny = computed(() => this.states().some(s => !!s.lastScannedAt));
  lastScanAt = computed(() =>
    this.states().map(s => s.lastScannedAt).filter(Boolean).sort().pop() ?? null);

  overallStatus = computed(() => {
    const s = this.summary();
    if (s.flagged > 0) return 'out-of-sync';
    if (s.acknowledged > 0) return 'possibly-out-of-sync';
    if (this.scannedAny()) return 'in-sync';
    return 'unknown';
  });
  statusIcon = computed(() => {
    switch (this.overallStatus()) {
      case 'in-sync': return 'cloud_done';
      case 'possibly-out-of-sync': return 'sync';
      case 'out-of-sync': return 'sync_problem';
      default: return 'cloud_sync';
    }
  });
  statusLabel = computed(() => {
    switch (this.overallStatus()) {
      case 'in-sync': return 'All Up to Date';
      case 'possibly-out-of-sync': return 'Acknowledged Drift';
      case 'out-of-sync': return 'Out of Sync';
      default: return 'Not Scanned Yet';
    }
  });
  statusDetail = computed(() => {
    const s = this.summary();
    switch (this.overallStatus()) {
      case 'out-of-sync': return `${s.flagged} field(s) drifting across ${this.driftingTypes().length} type(s)`;
      case 'possibly-out-of-sync': return `${s.acknowledged} acknowledged drift(s) — resolve in the Drift Center`;
      case 'in-sync': return 'Content matches the hub for every scanned type';
      default: return 'Run a scan to check for drift';
    }
  });

  ngOnInit() {
    this.driftService.refreshSummary();
    this.driftService.loadOverview();
    // pending-backlog cards only (connectivity signal, orthogonal to drift)
    this.subs.push(this.syncStatusService.syncHealth$.subscribe(h => { if (h) this.health.set(h); }));
    this.syncStatusService.fetchSyncHealthCheck().subscribe();
  }

  scanNow() {
    this.driftService.scanAll().subscribe(() => { this.driftService.loadOverview(); this.driftService.refreshSummary(); });
  }

  openDriftCenter(entityType?: string) {
    this.router.navigate(['/sync/drift'], entityType ? { queryParams: { type: entityType } } : {});
  }

  fmt(iso?: string | null): string {
    if (!iso) return 'never';
    const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
}
