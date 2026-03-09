import { Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from '../../../shared/table/table.component';
import { Column } from '../../../models/column.model';
import { InstrumentLogDto } from '../../../models/instrumentation/instrument-log.model';
import { InstrumentLogApiService } from '../../../services/instrumentation/instrument-log-api.service';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-instrument-log-table',
  standalone: true,
  imports: [TableComponent],
  template: `
    <div class="table-wrapper">
      <app-shared-table
        [items]="items"
        [columns]="columns"
        [clickCallback]="onRowClick.bind(this)"
      ></app-shared-table>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
    .table-wrapper {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow: auto;
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

  itemsSignal = computed(() => this.allLogs());
  items: Observable<InstrumentLogDto[]> = toObservable(this.itemsSignal);
  columns: Column[] = InstrumentLogDto.toTableColumns();

  onRowClick(log: InstrumentLogDto): void {
    this.rowClickEvent.emit(log);
  }
}
