import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { TableSearchService } from '../../../shared/table/refactored/services/table-search.service';
import { TableStateService } from '../../../shared/table/refactored/services/table-state.service';
import { TableSelectionService } from '../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../shared/table/refactored/services/table-data.service';
import { TableUtilService } from '../../../shared/table/refactored/services/table-util.service';
import { TableLocalStorageService } from '../../../shared/table/refactored/services/table-local-storage.service';
import { Column } from '../../../models/column.model';
import { SyncAuditApiService } from '../services/sync-audit-api.service';
import { SyncAuditEntityType } from '../services/sync-audit.models';
import { getEntityColumns, getEntityLabel } from '../services/sync-audit-entity-registry';
import { SyncAuditComparisonDialogComponent } from '../sync-audit-comparison-dialog/sync-audit-comparison-dialog.component';
import {
  SyncStatusService,
  EntityComparisonResult,
  BulkResolveRequest,
} from '../../../services/sync-status.service';

@Component({
  selector: 'app-sync-audit-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, SyncAuditComparisonDialogComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    TableControlsService,
    TableDataService,
    TableUtilService,
    TableLocalStorageService,
  ],
  templateUrl: './sync-audit-page.component.html',
  styleUrl: './sync-audit-page.component.css',
})
export class SyncAuditPageComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private api = inject(SyncAuditApiService);
  private syncStatus = inject(SyncStatusService);
  private selectionService = inject(TableSelectionService);

  entityTypes = signal<SyncAuditEntityType[]>([]);
  selectedEntityType = signal<string>('');
  entities = signal<any[]>([]);
  loading = signal(false);
  loadingTypes = signal(false);
  bulkLoading = signal(false);
  error = signal<string>('');
  statusMessage = signal<string>('');

  // Sync comparison result
  comparison = signal<EntityComparisonResult | null>(null);

  currentColumns = computed<Column[]>(() => {
    const type = this.selectedEntityType();
    return type ? getEntityColumns(type) : [];
  });

  currentLabel = computed(() => {
    const type = this.selectedEntityType();
    return type ? getEntityLabel(type) : '';
  });

  tableId = computed(() => 'sync-audit-' + this.selectedEntityType());

  // Summary counts
  localOnlyCount = computed(() => this.comparison()?.localOnly?.length ?? 0);
  serverOnlyCount = computed(() => this.comparison()?.serverOnly?.length ?? 0);
  staleCount = computed(() => this.comparison()?.staleEntities?.length ?? 0);

  // Comparison dialog state
  dialogOpen = signal(false);
  dialogEntityType = signal('');
  dialogEntityId = signal(0);

  // Selected items from table
  selectedItems = signal<any[]>([]);

  ngOnInit() {
    this.loadEntityTypes();
  }

  loadEntityTypes() {
    this.loadingTypes.set(true);
    this.api.getEntityTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.entityTypes.set(res.responseData ?? []);
          this.loadingTypes.set(false);
        },
        error: () => {
          this.error.set('Failed to load entity types');
          this.loadingTypes.set(false);
        }
      });
  }

  onEntityTypeChange(entityType: string) {
    this.selectedEntityType.set(entityType);
    this.entities.set([]);
    this.comparison.set(null);
    this.selectedItems.set([]);
    this.error.set('');
    this.statusMessage.set('');
    if (entityType) {
      this.loadEntitiesWithStatus(entityType);
    }
  }

  loadEntitiesWithStatus(entityType: string) {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      entities: this.api.getEntities(entityType),
      comparison: this.syncStatus.compareEntityType(entityType),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ entities, comparison }) => {
          const localEntities = entities.responseData ?? [];
          this.comparison.set(comparison);
          this.entities.set(this.mergeWithSyncStatus(localEntities, comparison));
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load entities or comparison data');
          this.loading.set(false);
        }
      });
  }

  private mergeWithSyncStatus(localEntities: any[], comparison: EntityComparisonResult | null): any[] {
    if (!comparison) {
      return localEntities.map(e => ({ ...e, _syncLocal: true, _syncServer: true, _syncStatus: 'UNKNOWN' }));
    }

    const localOnlySet = new Set(comparison.localOnly ?? []);
    const serverOnlySet = new Set(comparison.serverOnly ?? []);
    const staleMap = new Map<number, boolean>(); // entityId → localNewer
    for (const s of comparison.staleEntities ?? []) {
      staleMap.set(s.entityId, s.localNewer);
    }

    const merged = localEntities.map(e => {
      const id = Number(e.id);
      let status: string;
      if (localOnlySet.has(id)) {
        status = 'LOCAL_ONLY';
      } else if (staleMap.has(id)) {
        status = staleMap.get(id) ? 'STALE_SERVER' : 'STALE_LOCAL';
      } else {
        status = 'IN_SYNC';
      }
      return {
        ...e,
        _syncLocal: true,
        _syncServer: !localOnlySet.has(id),
        _syncStatus: status,
      };
    });

    // Add server-only entities as rows
    for (const serverId of serverOnlySet) {
      merged.push({
        id: serverId,
        _syncLocal: false,
        _syncServer: true,
        _syncStatus: 'SERVER_ONLY',
      });
    }

    return merged;
  }

  onEntityClicked(item: any) {
    const id = item?.id;
    if (id == null) return;
    this.dialogEntityType.set(this.selectedEntityType());
    this.dialogEntityId.set(Number(id));
    this.dialogOpen.set(true);
  }

  onDialogClose() {
    this.dialogOpen.set(false);
  }

  onDialogResolved() {
    this.dialogOpen.set(false);
    this.refresh();
  }

  onSelectionChanged(items: any[]) {
    this.selectedItems.set(items);
  }

  refresh() {
    const type = this.selectedEntityType();
    if (type) {
      this.selectedItems.set([]);
      this.loadEntitiesWithStatus(type);
    }
  }

  // ==================== Bulk Actions ====================

  bulkAcceptLocal() {
    const ids = this.selectedItems()
      .filter(i => i._syncLocal)
      .map(i => Number(i.id));
    if (ids.length === 0) return;
    this.executeBulk('ACCEPT_LOCAL', ids);
  }

  bulkAcceptServer() {
    const ids = this.selectedItems()
      .filter(i => i._syncServer)
      .map(i => Number(i.id));
    if (ids.length === 0) return;
    this.executeBulk('ACCEPT_REMOTE', ids);
  }

  private executeBulk(resolution: 'ACCEPT_LOCAL' | 'ACCEPT_REMOTE', entityIds: number[]) {
    this.bulkLoading.set(true);
    this.statusMessage.set('');

    const request: BulkResolveRequest = {
      entityType: this.selectedEntityType(),
      resolution,
      entityIds,
    };

    this.syncStatus.bulkResolve(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const label = resolution === 'ACCEPT_LOCAL' ? 'pushed to server' : 'pulled from server';
          this.statusMessage.set(`${res?.resolved ?? entityIds.length} entities ${label}`);
          this.bulkLoading.set(false);
          this.refresh();
        },
        error: () => {
          this.error.set('Bulk operation failed');
          this.bulkLoading.set(false);
        }
      });
  }
}
