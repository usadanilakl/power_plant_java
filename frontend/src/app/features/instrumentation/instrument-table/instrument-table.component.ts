import { Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { Column } from '../../../models/column.model';
import { InstrumentDto } from '../../../models/instrumentation/instrument.model';
import { InstrumentApiService } from '../../../services/instrumentation/instrument-api.service';
import { map } from 'rxjs/operators';
import { TableSearchService } from '../../../shared/table/refactored/services/table-search.service';
import { TableStateService } from '../../../shared/table/refactored/services/table-state.service';
import { TableSelectionService } from '../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../shared/table/refactored/services/table-sync.service';
import { TableControlsService } from '../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../shared/table/refactored/services/table-data.service';
import { TableClickService } from '../../../shared/table/refactored/services/table-click.service';
import { InstrumentTableClickService } from '../services/instrument-table-click.service';
import { InstrumentContextMenuService } from '../services/instrument-context-menu.service';

/** The three values the register actually uses, plus the all-items pseudo-bucket. */
const STATUS_BUCKETS = ['All', 'Normal Operation', 'In Progress', 'Disconnected/Removed'] as const;
type StatusBucket = typeof STATUS_BUCKETS[number];

@Component({
  selector: 'app-instrument-table',
  standalone: true,
  imports: [TableComponent],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    TableControlsService,
    TableDataService,
    // Subclass swapped in for the base so a right-click opens the instrument context menu. Registered
    // against the base token because the table injects TableClickService, not our subclass.
    InstrumentContextMenuService,
    { provide: TableClickService, useClass: InstrumentTableClickService },
  ],
  template: `
    <div class="table-wrapper">
      <div class="status-bar">
        @for (bucket of statusBuckets; track bucket) {
          <button
            type="button"
            class="status-tab"
            [class.active]="activeStatus() === bucket"
            [class]="'status-tab ' + tabClass(bucket) + (activeStatus() === bucket ? ' active' : '')"
            (click)="setStatus(bucket)"
          >
            {{ bucket }}
            <span class="count">{{ countFor(bucket) }}</span>
          </button>
        }

        @if (selectedItems().length > 0) {
          <span class="spacer"></span>
          <span class="selected-count">{{ selectedItems().length }} selected</span>
          <button type="button" class="danger-btn" (click)="deleteSelected()" [disabled]="isDeleting()">
            {{ isDeleting() ? 'Deleting…' : 'Delete selected' }}
          </button>
        }
      </div>

      @if (deleteError()) {
        <div class="delete-error">{{ deleteError() }}</div>
      }

      <app-table
        [tableId]="'instrument-table'"
        [items]="items()"
        [columns]="columns()"
        [isTableIsolated]="true"
        (rowDoubleClicked)="rowDetailsRequested.emit($event)"
        (selectedItemsEvent)="selectedItems.set($event)"
      ></app-table>

      <!-- No menu markup here: GlobalContextMenuComponent at the app root renders whichever
           context-menu service registered itself as active, so showContextMenu() is all we do. -->
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .table-wrapper {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0 0 0.4rem;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .status-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: 999px;
      background: var(--card-background, transparent);
      color: var(--primary-text);
      cursor: pointer;
      font-size: 0.8rem;
    }
    .status-tab.active {
      border-color: var(--accent-color);
      font-weight: 700;
      box-shadow: inset 0 0 0 1px var(--accent-color);
    }
    .status-tab.normal.active { background: var(--status-complete); }
    .status-tab.progress.active { background: var(--status-attention); }
    .status-tab.removed.active { background: var(--status-not-processed); }
    .count {
      font-size: 0.72rem;
      opacity: 0.75;
    }
    .spacer { flex: 1 1 auto; }
    .selected-count {
      font-size: 0.8rem;
      color: var(--secondary-text);
    }
    .danger-btn {
      padding: 0.25rem 0.7rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--status-not-processed);
      color: var(--primary-text);
      cursor: pointer;
      font-size: 0.8rem;
    }
    .danger-btn:disabled { opacity: 0.6; cursor: default; }
    .delete-error {
      padding: 0.4rem 0.6rem;
      margin-bottom: 0.4rem;
      border: 1px solid var(--status-not-processed);
      border-radius: 4px;
      font-size: 0.82rem;
      color: var(--primary-text);
      flex-shrink: 0;
    }
  `]
})
export class InstrumentTableComponent {
  private apiService = inject(InstrumentApiService);
  private contextMenu = inject(InstrumentContextMenuService);

  /** Emitted on double-click and from the context menu's "Details" action. */
  rowDetailsRequested = output<InstrumentDto>();
  /** "View logs" — the old whole-page swap, now an explicit choice rather than the only behaviour. */
  viewLogsRequested = output<InstrumentDto>();

  readonly statusBuckets = STATUS_BUCKETS;
  activeStatus = signal<StatusBucket>('All');
  selectedItems = signal<InstrumentDto[]>([]);
  isDeleting = signal(false);
  deleteError = signal<string | null>(null);

  private allItems = signal<InstrumentDto[]>([]);

  private loaded = toSignal(
    this.apiService.getAll().pipe(map(r => r.responseData ?? [])),
    { initialValue: [] as InstrumentDto[] }
  );

  /** Status buckets filter the rows fed to the table; the table's own column filters stack on top. */
  items = computed(() => {
    const source = this.allItems().length > 0 ? this.allItems() : this.loaded();
    const bucket = this.activeStatus();
    if (bucket === 'All') return source;
    return source.filter(i => (i.currentStatus ?? '') === bucket);
  });

  columns = signal<Column[]>(
    InstrumentDto.toTableColumns().map(c => ({ ...c, filterable: true }))
  );

  constructor() {
    this.contextMenu.detailsRequested.subscribe(item => this.rowDetailsRequested.emit(item));
    this.contextMenu.viewLogsRequested.subscribe(item => this.viewLogsRequested.emit(item));
    this.contextMenu.deleteRequested.subscribe(item => this.deleteInstruments([item]));
  }

  countFor(bucket: StatusBucket): number {
    const source = this.allItems().length > 0 ? this.allItems() : this.loaded();
    if (bucket === 'All') return source.length;
    return source.filter(i => (i.currentStatus ?? '') === bucket).length;
  }

  tabClass(bucket: StatusBucket): string {
    if (bucket === 'Normal Operation') return 'normal';
    if (bucket === 'In Progress') return 'progress';
    if (bucket === 'Disconnected/Removed') return 'removed';
    return '';
  }

  setStatus(bucket: StatusBucket): void {
    this.activeStatus.set(bucket);
  }

  deleteSelected(): void {
    this.deleteInstruments(this.selectedItems());
  }

  /**
   * Deletes sequentially rather than in parallel: each one is a SharePoint round-trip plus a hub
   * write, and firing thirty at once would both hammer SharePoint and make a partial failure
   * impossible to report cleanly. Rows that succeed are removed from the list as we go, so a failure
   * halfway leaves the table showing exactly what is left.
   */
  private deleteInstruments(targets: InstrumentDto[]): void {
    if (targets.length === 0 || this.isDeleting()) return;

    const label = targets.length === 1
      ? `Delete instrument ${targets[0].tagNumber}?`
      : `Delete ${targets.length} instruments?`;
    if (!confirm(`${label}\n\nThis removes them from SharePoint and from the plant database.`)) return;

    this.isDeleting.set(true);
    this.deleteError.set(null);
    const remaining = [...targets];
    const deletedIds: number[] = [];

    const step = () => {
      const next = remaining.shift();
      if (!next) {
        this.finishDelete(deletedIds, null);
        return;
      }
      this.apiService.delete(next.id).subscribe({
        next: () => { deletedIds.push(next.id); step(); },
        error: err => this.finishDelete(
          deletedIds,
          `Failed on ${next.tagNumber}: ${err?.error?.message || err?.message || 'delete rejected'}`
        )
      });
    };
    step();
  }

  private finishDelete(deletedIds: number[], error: string | null): void {
    if (deletedIds.length > 0) {
      const gone = new Set(deletedIds);
      const source = this.allItems().length > 0 ? this.allItems() : this.loaded();
      this.allItems.set(source.filter(i => !gone.has(i.id)));
    }
    this.selectedItems.set([]);
    this.isDeleting.set(false);
    this.deleteError.set(error);
  }
}
