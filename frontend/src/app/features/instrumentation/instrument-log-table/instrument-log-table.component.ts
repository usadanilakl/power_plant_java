import { Component, computed, inject, input, output, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { Column } from '../../../models/column.model';
import { InstrumentLogDto } from '../../../models/instrumentation/instrument-log.model';
import { InstrumentLogApiService } from '../../../services/instrumentation/instrument-log-api.service';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

@Component({
  selector: 'app-instrument-log-table',
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
    TableClickService,
    TableControlsService,
    TableDataService,
  ],
  template: `
    <div class="table-wrapper">
      <app-table
        [tableId]="'instrument-log-table'"
        [items]="items()"
        [columns]="columns()"
        [isTableIsolated]="true"
        (rowDoubleClicked)="onRowDoubleClick($event)"
      ></app-table>
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
  `]
})
export class InstrumentLogTableComponent {
  private apiService = inject(InstrumentLogApiService);

  tagNumber = input<string | null>(null);
  rowClickEvent = output<InstrumentLogDto>();

  private tagNumberSignal = computed(() => this.tagNumber());

  private allLogs = toSignal(
    toObservable(this.tagNumberSignal).pipe(
      switchMap(tag => {
        if (tag) {
          return this.apiService.getByInstrument(tag).pipe(map(r => r.responseData ?? []));
        }
        return this.apiService.getAll().pipe(map(r => r.responseData ?? []));
      })
    ),
    { initialValue: [] }
  );

  items = computed(() => this.allLogs());
  columns = signal<Column[]>(InstrumentLogDto.toTableColumns());

  onRowDoubleClick(log: InstrumentLogDto): void {
    this.rowClickEvent.emit(log);
  }
}
