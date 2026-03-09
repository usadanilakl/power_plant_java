import { Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { Column } from '../../../models/column.model';
import { InstrumentDto } from '../../../models/instrumentation/instrument.model';
import { InstrumentApiService } from '../../../services/instrumentation/instrument-api.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-instrument-table',
  standalone: true,
  imports: [TableComponent],
  template: `
    <div class="table-wrapper">
      <app-table
        [tableId]="'instrument-table'"
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
export class InstrumentTableComponent {
  private apiService = inject(InstrumentApiService);

  rowClickEvent = output<InstrumentDto>();

  private allItems = toSignal(
    this.apiService.getAll().pipe(map(r => r.responseData ?? [])),
    { initialValue: [] }
  );

  items = computed(() => this.allItems());
  columns = signal<Column[]>(InstrumentDto.toTableColumns());

  onRowDoubleClick(instrument: InstrumentDto): void {
    this.rowClickEvent.emit(instrument);
  }
}
