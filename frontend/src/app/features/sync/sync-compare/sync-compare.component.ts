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
  SyncStatusService, EntityComparisonResult, EntityTypeSummary,
  EntityFieldDiff
} from '../../../services/sync-status.service';
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
        </div>

        @if (comparison()) {
          <div class="summary-row">
            <span>Local: {{ comparison()!.localCount }} | Server: {{ comparison()!.serverCount }} | Common: {{ comparison()!.commonCount }}</span>
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

          <!-- Local Only -->
          @if (comparison()!.localOnly.length > 0) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  Local Only ({{ comparison()!.localOnly.length }})
                </mat-panel-title>
                <mat-panel-description>Entities present locally but not on server</mat-panel-description>
              </mat-expansion-panel-header>
              <div class="id-list">
                @for (id of comparison()!.localOnly; track id) {
                  <mat-chip>{{ id }}</mat-chip>
                }
              </div>
            </mat-expansion-panel>
          }

          <!-- Server Only -->
          @if (comparison()!.serverOnly.length > 0) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  Server Only ({{ comparison()!.serverOnly.length }})
                </mat-panel-title>
                <mat-panel-description>Entities on server but not locally</mat-panel-description>
              </mat-expansion-panel-header>
              <div class="id-list">
                @for (id of comparison()!.serverOnly; track id) {
                  <mat-chip>{{ id }}</mat-chip>
                }
              </div>
            </mat-expansion-panel>
          }

          <!-- Stale Entities -->
          @if (comparison()!.staleEntities.length > 0) {
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

          <!-- Inline Entity Diff -->
          @if (diffEntityId()) {
            <app-sync-entity-diff
              [entityType]="selectedType()!"
              [entityId]="diffEntityId()!"
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
    .type-table, .stale-table { width: 100%; }
    .result-header { display: flex; align-items: center; gap: 8px; }
    .result-header h3 { margin: 0; flex: 1; }
    .summary-row { padding: 8px 0; font-size: 14px; opacity: 0.8; }
    .bulk-actions { display: flex; gap: 8px; margin: 12px 0; }
    .id-list { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 0; }
    mat-expansion-panel { margin: 8px 0; }
  `]
})
export class SyncCompareComponent implements OnInit {
  private syncStatusService = inject(SyncStatusService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  entityTypes = signal<EntityTypeSummary[]>([]);
  selectedType = signal<string | null>(null);
  comparison = signal<EntityComparisonResult | null>(null);
  diffEntityId = signal<number | null>(null);
  loading = signal(false);
  comparing = signal(false);
  resolving = signal(false);

  typeColumns = ['entityType', 'localCount', 'action'];
  staleColumns = ['entityId', 'localNewer', 'action'];

  ngOnInit() {
    this.loadEntityTypes();

    // Check if a type was pre-selected via query param
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
    this.diffEntityId.set(null);

    this.syncStatusService.compareEntityType(entityType).subscribe({
      next: result => { this.comparison.set(result); this.comparing.set(false); },
      error: () => this.comparing.set(false)
    });
  }

  back() {
    this.selectedType.set(null);
    this.comparison.set(null);
    this.diffEntityId.set(null);
  }

  viewDiff(entityId: number) {
    this.diffEntityId.set(entityId);
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
        this.compare(this.selectedType()!); // Refresh
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
    if (this.selectedType()) this.compare(this.selectedType()!);
  }
}
