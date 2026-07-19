import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { SyncStatusService, SyncHealthCheckResult, EntityDrift } from '../../../services/sync-status.service';
import { EntitySyncCheckService, VerificationResult } from '../../../services/sync/entity-sync-check.service';

interface DriftRow extends EntityDrift {
  verifyResult?: VerificationResult | null;
  verifying?: boolean;
}

@Component({
  selector: 'app-sync-overview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="overview-container">
      <!-- Status Cards Row -->
      <div class="cards-row">
        <mat-card class="status-card" [class]="'status-' + overallStatus()">
          <mat-card-content>
            <mat-icon class="status-icon">{{ statusIcon() }}</mat-icon>
            <div class="status-text">
              <span class="status-label">{{ statusLabel() }}</span>
              <span class="status-detail">{{ health()?.message || 'Checking...' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ health()?.entityDifference ?? '—' }}</div>
            <div class="metric-label">Entity Drift</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-value">{{ health()?.fileDifference ?? '—' }}</div>
            <div class="metric-label">File Drift</div>
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
        <button mat-raised-button color="primary" (click)="checkNow()" [disabled]="checking()">
          <mat-icon>refresh</mat-icon>
          {{ checking() ? 'Checking...' : 'Check Now' }}
        </button>
      </div>

      <!-- Entity Drift Table -->
      @if (entityDrift().length > 0) {
        <h3>Entity Type Drift</h3>
        <table mat-table [dataSource]="driftRows()" class="drift-table">
          <ng-container matColumnDef="entityType">
            <th mat-header-cell *matHeaderCellDef>Entity Type</th>
            <td mat-cell *matCellDef="let row">{{ row.entityType }}</td>
          </ng-container>
          <ng-container matColumnDef="localCount">
            <th mat-header-cell *matHeaderCellDef>Local</th>
            <td mat-cell *matCellDef="let row">{{ row.localCount }}</td>
          </ng-container>
          <ng-container matColumnDef="serverCount">
            <th mat-header-cell *matHeaderCellDef>Hub</th>
            <td mat-cell *matCellDef="let row">{{ row.serverCount }}</td>
          </ng-container>
          <ng-container matColumnDef="difference">
            <th mat-header-cell *matHeaderCellDef>Diff</th>
            <td mat-cell *matCellDef="let row">
              <mat-chip [color]="row.difference > 5 ? 'warn' : 'accent'" highlighted>
                {{ row.difference }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="spStatus">
            <th mat-header-cell *matHeaderCellDef>SP Check</th>
            <td mat-cell *matCellDef="let row">
              @if (row.verifying) {
                <mat-spinner diameter="16"></mat-spinner>
              } @else if (row.verifyResult) {
                @if (!row.verifyResult.hubReachable) {
                  <span class="sp-err">Hub unreachable</span>
                } @else if (row.verifyResult.issueCount === 0) {
                  <span class="sp-ok"><mat-icon style="font-size:16px;width:16px;height:16px">check_circle</mat-icon> OK</span>
                } @else {
                  <span class="sp-warn">{{ row.verifyResult.issueCount }} issues</span>
                }
                @if (row.verifyResult.spBacked && row.verifyResult.spReachable) {
                  <span class="sp-count">(SP: {{ row.verifyResult.spCount }})</span>
                }
              } @else {
                <button mat-button (click)="verifyType(row); $event.stopPropagation()" style="font-size:11px">
                  Verify
                </button>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button mat-button color="primary" (click)="compareType(row.entityType)">
                Compare
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row"
              (click)="compareType(row.entityType)"></tr>
        </table>
      } @else if (health() && overallStatus() === 'in-sync') {
        <div class="all-good">
          <mat-icon>check_circle</mat-icon>
          <span>All entity counts match — no drift detected</span>
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
    .metric-label { font-size: 11px; text-transform: uppercase; opacity: 0.6; }
    .actions-row { margin-bottom: 16px; }
    .drift-table { width: 100%; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(255,255,255,0.05); }
    .all-good { display: flex; align-items: center; gap: 8px; padding: 24px; opacity: 0.7; }
    .all-good mat-icon { color: #4caf50; }
    .sp-ok { color: #4caf50; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
    .sp-warn { color: #ffb74d; font-size: 12px; font-weight: 600; }
    .sp-err { color: #ef5350; font-size: 12px; font-weight: 600; }
    .sp-count { color: var(--text-secondary, #aaa); font-size: 11px; margin-left: 4px; }
    h3 { margin: 16px 0 8px; }
  `]
})
export class SyncOverviewComponent implements OnInit, OnDestroy {
  private syncStatusService = inject(SyncStatusService);
  private syncCheckService = inject(EntitySyncCheckService);
  private router = inject(Router);
  private subs: Subscription[] = [];

  health = signal<SyncHealthCheckResult | null>(null);
  checking = signal(false);
  displayedColumns = ['entityType', 'localCount', 'serverCount', 'difference', 'spStatus', 'action'];

  // Mutable drift rows with verify state
  driftRows = signal<DriftRow[]>([]);

  overallStatus = computed(() => {
    const h = this.health();
    if (!h) return 'unknown';
    switch (h.syncStatus) {
      case 'IN_SYNC': return 'in-sync';
      case 'POSSIBLY_OUT_OF_SYNC': return 'possibly-out-of-sync';
      case 'OUT_OF_SYNC': return 'out-of-sync';
      default: return 'unknown';
    }
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
      case 'possibly-out-of-sync': return 'Possibly Out of Sync';
      case 'out-of-sync': return 'Out of Sync';
      default: return 'Checking...';
    }
  });

  entityDrift = computed<EntityDrift[]>(() => {
    const h = this.health();
    if (!h || !h.localStats || !h.serverStats) return [];
    const local = h.localStats.entityCounts;
    const server = h.serverStats.entityCounts;
    const allTypes = new Set([...Object.keys(local), ...Object.keys(server)]);
    const drifts: EntityDrift[] = [];
    for (const type of allTypes) {
      const lc = local[type] ?? 0;
      const sc = server[type] ?? 0;
      if (lc !== sc) {
        drifts.push({ entityType: type, localCount: lc, serverCount: sc, difference: Math.abs(lc - sc) });
      }
    }
    drifts.sort((a, b) => b.difference - a.difference);
    return drifts;
  });

  ngOnInit() {
    this.subs.push(
      this.syncStatusService.syncHealth$.subscribe(h => {
        if (h) {
          this.health.set(h);
          this.rebuildDriftRows();
        }
      })
    );
    this.syncStatusService.fetchSyncHealthCheck().subscribe();
  }

  checkNow() {
    this.checking.set(true);
    this.syncStatusService.forceSyncHealthCheck().subscribe({
      next: h => {
        this.health.set(h);
        this.rebuildDriftRows();
        this.checking.set(false);
      },
      error: () => this.checking.set(false)
    });
  }

  verifyType(row: DriftRow) {
    row.verifying = true;
    this.driftRows.set([...this.driftRows()]);
    this.syncCheckService.verify(row.entityType).subscribe({
      next: result => {
        row.verifyResult = result;
        row.verifying = false;
        this.driftRows.set([...this.driftRows()]);
      },
      error: () => {
        row.verifying = false;
        this.driftRows.set([...this.driftRows()]);
      }
    });
  }

  compareType(entityType: string) {
    // Compare panel was retired — the Drift Center is the consolidated compare/reconcile tool now.
    this.router.navigate(['/sync/drift'], { queryParams: { type: entityType } });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  private rebuildDriftRows() {
    const drifts = this.entityDrift();
    // Preserve existing verify results
    const existing = new Map(this.driftRows().map(r => [r.entityType, r]));
    this.driftRows.set(drifts.map(d => ({
      ...d,
      verifyResult: existing.get(d.entityType)?.verifyResult ?? null,
      verifying: false
    })));
  }
}
