import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  SyncStatusService, EntityComparisonResult, EntityTypeSummary
} from '../../../services/sync-status.service';
import {
  EntitySyncCheckService, VerificationResult, EntityVerificationStatus
} from '../../../services/sync/entity-sync-check.service';
import { SyncEntityDiffComponent } from '../sync-entity-diff/sync-entity-diff.component';

@Component({
  selector: 'app-sync-compare',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule,
    MatExpansionModule, MatProgressSpinnerModule, MatSnackBarModule, SyncEntityDiffComponent
  ],
  template: `
    <div class="compare-container">
      <!-- Entity Type List -->
      @if (!selectedType()) {
        <h3>Select Entity Type to Compare</h3>
        @if (loading()) {
          <mat-spinner diameter="30"></mat-spinner>
        } @else {
          <table mat-table [dataSource]="entityTypes()" class="type-table">
            <ng-container matColumnDef="entityType">
              <th mat-header-cell *matHeaderCellDef>Entity Type</th>
              <td mat-cell *matCellDef="let row">{{ row.entityType }}</td>
            </ng-container>
            <ng-container matColumnDef="localCount">
              <th mat-header-cell *matHeaderCellDef>Local Count</th>
              <td mat-cell *matCellDef="let row">{{ row.localCount }}</td>
            </ng-container>
            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-raised-button color="primary" (click)="compare(row.entityType)">
                  <mat-icon>compare_arrows</mat-icon> Compare
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="typeColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: typeColumns;"></tr>
          </table>
        }
      }

      <!-- Comparison Result -->
      @if (selectedType()) {
        <div class="result-header">
          <button mat-icon-button (click)="back()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h3>{{ selectedType() }} Comparison</h3>
          @if (comparing()) {
            <mat-spinner diameter="24"></mat-spinner>
          }
          <span class="spacer"></span>
          <!-- 3-way verify button -->
          <button mat-raised-button (click)="runVerification()" [disabled]="verifying()">
            <mat-icon>verified</mat-icon>
            {{ verifying() ? 'Verifying...' : 'Verify 3-Way' }}
          </button>
        </div>

        @if (comparison()) {
          <div class="summary-row">
            <span class="summary-chip">Local: {{ comparison()!.localCount }}</span>
            <span class="summary-chip">Hub: {{ comparison()!.serverCount }}</span>
            <span class="summary-chip">Common: {{ comparison()!.commonCount }}</span>
            @if (verifyResult()) {
              <span class="summary-chip sp" *ngIf="verifyResult()!.spBacked">
                SP: {{ verifyResult()!.spReachable ? verifyResult()!.spCount : '?' }}
              </span>
              <span class="verify-summary" [class]="!verifyResult()!.hubReachable ? 'error' : (verifyResult()!.issueCount === 0 ? 'ok' : 'warn')">
                @if (!verifyResult()!.hubReachable) {
                  Hub unreachable
                } @else if (verifyResult()!.issueCount === 0) {
                  All {{ verifyResult()!.okCount }} verified
                } @else {
                  {{ verifyResult()!.issueCount }} issue(s)
                }
              </span>
            }
          </div>

          <!-- Bulk Actions -->
          <div class="bulk-actions">
            @if (comparison()!.serverOnly.length > 0) {
              <button mat-raised-button color="accent"
                      (click)="bulkAcceptRemote()"
                      [disabled]="resolving()">
                <mat-icon>cloud_download</mat-icon>
                Accept All Remote ({{ comparison()!.serverOnly.length }})
              </button>
            }
            @if (comparison()!.localOnly.length > 0) {
              <button mat-raised-button color="primary"
                      (click)="bulkAcceptLocal()"
                      [disabled]="resolving()">
                <mat-icon>cloud_upload</mat-icon>
                Push All Local ({{ comparison()!.localOnly.length }})
              </button>
            }
          </div>

          <!-- 3-way Verification Issues -->
          @if (verifyResult() && verifyResult()!.issueCount > 0) {
            <mat-expansion-panel [expanded]="true">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  Verification Issues ({{ verifyResult()!.issueCount }})
                </mat-panel-title>
                <mat-panel-description>Entities with mismatches across Local / Hub / SharePoint</mat-panel-description>
              </mat-expansion-panel-header>
              <table mat-table [dataSource]="verifyResult()!.issues" class="verify-table">
                <ng-container matColumnDef="entityId">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let row" class="mono">{{ row.entityId ?? ('SP:' + row.sharepointId) }}</td>
                </ng-container>
                <ng-container matColumnDef="inLocal">
                  <th mat-header-cell *matHeaderCellDef>Local</th>
                  <td mat-cell *matCellDef="let row">
                    <span [class]="row.inLocal ? 'yes' : 'no'">{{ row.inLocal ? 'Yes' : 'No' }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="inHub">
                  <th mat-header-cell *matHeaderCellDef>Hub</th>
                  <td mat-cell *matCellDef="let row">
                    <span [class]="row.inHub ? 'yes' : 'no'">{{ row.inHub ? 'Yes' : 'No' }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="inSharePoint">
                  <th mat-header-cell *matHeaderCellDef>SP</th>
                  <td mat-cell *matCellDef="let row">
                    <span [class]="row.inSharePoint === true ? 'yes' : (row.inSharePoint === false ? 'no' : 'na')">
                      {{ row.inSharePoint == null ? (verifyResult()!.spReachable ? '-' : '?') : (row.inSharePoint ? 'Yes' : 'No') }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="localModified">
                  <th mat-header-cell *matHeaderCellDef>Local Modified</th>
                  <td mat-cell *matCellDef="let row" class="ts">{{ row.localModified ? (row.localModified | date:'short') : '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="hubModified">
                  <th mat-header-cell *matHeaderCellDef>Hub Modified</th>
                  <td mat-cell *matCellDef="let row" class="ts">{{ row.hubModified ? (row.hubModified | date:'short') : '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="spModified">
                  <th mat-header-cell *matHeaderCellDef>SP Modified</th>
                  <td mat-cell *matCellDef="let row" class="ts">{{ row.spModified ? (row.spModified | date:'short') : '-' }}</td>
                </ng-container>
                <ng-container matColumnDef="overallStatus">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [class]="'st-' + row.overallStatus.toLowerCase()">
                      {{ row.overallStatus.replace('_', ' ') }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="action">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    @if (row.entityId != null) {
                      <button mat-icon-button (click)="viewDiff(row.entityId); $event.stopPropagation()" title="View 3-way diff">
                        <mat-icon>compare_arrows</mat-icon>
                      </button>
                    } @else {
                      <span class="sp-only-hint">SP only</span>
                    }
                    @if (row.overallStatus === 'HUB_ONLY' || row.overallStatus === 'STALE_LOCAL') {
                      <button mat-icon-button (click)="resolveIssue(row, 'hub'); $event.stopPropagation()" title="Pull from hub" [disabled]="resolving()">
                        <mat-icon>cloud_download</mat-icon>
                      </button>
                    }
                    @if (row.overallStatus === 'LOCAL_ONLY' || row.overallStatus === 'STALE_HUB') {
                      <button mat-icon-button (click)="resolveIssue(row, 'local'); $event.stopPropagation()" title="Push to hub" [disabled]="resolving()">
                        <mat-icon>cloud_upload</mat-icon>
                      </button>
                    }
                    @if (row.inLocal && row.inSharePoint) {
                      <button mat-icon-button (click)="resolveIssue(row, 'sp'); $event.stopPropagation()" title="Accept from SP" [disabled]="resolving()">
                        <mat-icon>table_view</mat-icon>
                      </button>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="verifyColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: verifyColumns;"
                    [class.clickable-row]="row.entityId != null"
                    [class.sp-only-row]="row.entityId == null"
                    (click)="row.entityId != null ? viewDiff(row.entityId) : null"></tr>
              </table>
            </mat-expansion-panel>
          }

          <!-- Local Only -->
          @if (comparison()!.localOnly.length > 0) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  Local Only ({{ comparison()!.localOnly.length }})
                </mat-panel-title>
                <mat-panel-description>Entities present locally but not on hub</mat-panel-description>
              </mat-expansion-panel-header>
              <div class="id-list">
                @for (id of comparison()!.localOnly; track id) {
                  <mat-chip (click)="viewDiff(id)" class="clickable-chip">{{ id }}</mat-chip>
                }
              </div>
            </mat-expansion-panel>
          }

          <!-- Server Only -->
          @if (comparison()!.serverOnly.length > 0) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  Hub Only ({{ comparison()!.serverOnly.length }})
                </mat-panel-title>
                <mat-panel-description>Entities on hub but not locally</mat-panel-description>
              </mat-expansion-panel-header>
              <div class="id-list">
                @for (id of comparison()!.serverOnly; track id) {
                  <mat-chip>{{ id }}</mat-chip>
                }
              </div>
            </mat-expansion-panel>
          }

          <!-- Stale Entities (kept for backward compat, hidden when verify results available) -->
          @if (comparison()!.staleEntities.length > 0 && !verifyResult()) {
            <mat-expansion-panel [expanded]="true">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  Stale Records ({{ comparison()!.staleEntities.length }})
                </mat-panel-title>
                <mat-panel-description>Entities with different timestamps</mat-panel-description>
              </mat-expansion-panel-header>
              <table mat-table [dataSource]="comparison()!.staleEntities" class="stale-table">
                <ng-container matColumnDef="entityId">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let row">{{ row.entityId }}</td>
                </ng-container>
                <ng-container matColumnDef="localNewer">
                  <th mat-header-cell *matHeaderCellDef>Newer Side</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-chip [color]="row.localNewer ? 'primary' : 'accent'" highlighted>
                      {{ row.localNewer ? 'Local' : 'Server' }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="action">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-button (click)="viewDiff(row.entityId)">View Diff</button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="staleColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: staleColumns;"></tr>
              </table>
            </mat-expansion-panel>
          }

          <!-- Inline Entity Diff (now 3-way) -->
          @if (diffEntityId()) {
            <app-sync-entity-diff
              [entityType]="selectedType()!"
              [entityId]="diffEntityId()!"
              [useThreeWay]="true"
              (resolved)="onResolved()"
              (close)="diffEntityId.set(null)">
            </app-sync-entity-diff>
          }
        }
      }
    </div>
  `,
  styles: [`
    .compare-container { padding: 16px; }
    .type-table, .stale-table, .verify-table { width: 100%; }
    .result-header { display: flex; align-items: center; gap: 8px; }
    .result-header h3 { margin: 0; }
    .spacer { flex: 1; }
    .summary-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; font-size: 14px; flex-wrap: wrap; }
    .summary-chip {
      padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600;
      background: rgba(255,255,255,0.06); color: var(--text-secondary, #aaa);
    }
    .summary-chip.sp { background: rgba(0,150,136,0.12); color: #4db6ac; }
    .verify-summary {
      padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-left: auto;
    }
    .verify-summary.ok { background: rgba(76,175,80,0.15); color: #81c784; }
    .verify-summary.warn { background: rgba(255,152,0,0.15); color: #ffb74d; }
    .verify-summary.error { background: rgba(244,67,54,0.15); color: #ef5350; }
    .bulk-actions { display: flex; gap: 8px; margin: 12px 0; }
    .id-list { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 0; }
    .clickable-chip { cursor: pointer; }
    mat-expansion-panel { margin: 8px 0; }
    .mono { font-family: monospace; font-size: 12px; }
    .ts { font-size: 11px; white-space: nowrap; opacity: 0.7; }
    .yes { color: #4caf50; font-weight: 600; }
    .no { color: #f44336; font-weight: 600; }
    .na { color: #666; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: rgba(255,255,255,0.04); }
    .st-local_only { background: rgba(33,150,243,0.15) !important; color: #42a5f5 !important; }
    .st-hub_only { background: rgba(156,39,176,0.15) !important; color: #ce93d8 !important; }
    .st-stale_local, .st-stale_hub { background: rgba(255,152,0,0.15) !important; color: #ffb74d !important; }
    .st-missing_from_sp { background: rgba(244,67,54,0.15) !important; color: #ef5350 !important; }
    .st-sp_only { background: rgba(0,150,136,0.15) !important; color: #4db6ac !important; }
    .st-mismatch { background: rgba(244,67,54,0.15) !important; color: #ef5350 !important; }
    .sp-only-row { opacity: 0.6; cursor: default; }
    .sp-only-hint { font-size: 11px; color: #4db6ac; font-style: italic; }
  `]
})
export class SyncCompareComponent implements OnInit {
  private syncStatusService = inject(SyncStatusService);
  private syncCheckService = inject(EntitySyncCheckService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  entityTypes = signal<EntityTypeSummary[]>([]);
  selectedType = signal<string | null>(null);
  comparison = signal<EntityComparisonResult | null>(null);
  verifyResult = signal<VerificationResult | null>(null);
  diffEntityId = signal<number | null>(null);
  loading = signal(false);
  comparing = signal(false);
  verifying = signal(false);
  resolving = signal(false);

  typeColumns = ['entityType', 'localCount', 'action'];
  staleColumns = ['entityId', 'localNewer', 'action'];
  verifyColumns: string[] = [];

  ngOnInit() {
    this.loadEntityTypes();
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.compare(params['type']);
      }
    });
  }

  loadEntityTypes() {
    this.loading.set(true);
    this.syncStatusService.getEntityTypeSummaries().subscribe({
      next: types => { this.entityTypes.set(types); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  compare(entityType: string) {
    this.selectedType.set(entityType);
    this.comparing.set(true);
    this.comparison.set(null);
    this.verifyResult.set(null);
    this.diffEntityId.set(null);

    this.syncStatusService.compareEntityType(entityType).subscribe({
      next: result => { this.comparison.set(result); this.comparing.set(false); },
      error: () => this.comparing.set(false)
    });
  }

  runVerification() {
    const type = this.selectedType();
    if (!type) return;
    this.verifying.set(true);
    this.syncCheckService.verify(type).subscribe({
      next: result => {
        this.verifyResult.set(result);
        // Dynamic columns based on whether entity type is SP-backed
        const base = ['entityId', 'inLocal', 'inHub'];
        if (result?.spBacked) base.push('inSharePoint');
        base.push('localModified', 'hubModified');
        if (result?.spBacked) base.push('spModified');
        base.push('overallStatus', 'action');
        this.verifyColumns = base;
        this.verifying.set(false);
      },
      error: () => this.verifying.set(false)
    });
  }

  back() {
    this.selectedType.set(null);
    this.comparison.set(null);
    this.verifyResult.set(null);
    this.diffEntityId.set(null);
  }

  viewDiff(entityId: number) {
    this.diffEntityId.set(entityId);
  }

  resolveIssue(issue: EntityVerificationStatus, source: 'local' | 'hub' | 'sp') {
    if (issue.entityId == null) return;
    this.resolving.set(true);
    let action$;
    if (source === 'local') action$ = this.syncCheckService.pushToHub(this.selectedType()!, issue.entityId);
    else if (source === 'hub') action$ = this.syncCheckService.pullFromHub(this.selectedType()!, issue.entityId);
    else action$ = this.syncCheckService.acceptFromSp(this.selectedType()!, issue.entityId);

    action$.subscribe({
      next: () => {
        this.snackBar.open(`Accepted from ${source}`, 'OK', { duration: 3000 });
        this.resolving.set(false);
        this.runVerification();
      },
      error: () => this.resolving.set(false)
    });
  }

  bulkAcceptRemote() {
    const comp = this.comparison();
    if (!comp || !this.selectedType()) return;
    this.resolving.set(true);
    this.syncStatusService.bulkResolve({
      entityType: this.selectedType()!,
      resolution: 'ACCEPT_REMOTE',
      entityIds: comp.serverOnly
    }).subscribe({
      next: res => {
        this.snackBar.open(`Resolved ${res?.resolved ?? 0} entities`, 'OK', { duration: 3000 });
        this.resolving.set(false);
        this.compare(this.selectedType()!);
      },
      error: () => this.resolving.set(false)
    });
  }

  bulkAcceptLocal() {
    const comp = this.comparison();
    if (!comp || !this.selectedType()) return;
    this.resolving.set(true);
    this.syncStatusService.bulkResolve({
      entityType: this.selectedType()!,
      resolution: 'ACCEPT_LOCAL',
      entityIds: comp.localOnly
    }).subscribe({
      next: res => {
        this.snackBar.open(`Pushed ${res?.resolved ?? 0} entities`, 'OK', { duration: 3000 });
        this.resolving.set(false);
        this.compare(this.selectedType()!);
      },
      error: () => this.resolving.set(false)
    });
  }

  onResolved() {
    this.diffEntityId.set(null);
    if (this.selectedType()) {
      this.compare(this.selectedType()!);
      if (this.verifyResult()) this.runVerification();
    }
  }
}
