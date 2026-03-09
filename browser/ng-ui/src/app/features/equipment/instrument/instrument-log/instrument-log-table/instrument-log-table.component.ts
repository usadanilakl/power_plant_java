import { Component, computed, inject } from '@angular/core';
import { InstrumentStateService } from '../../instrument-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { InstrumentLogEntry } from '../../../../../models/equipment/instrument-log.model';
import { TableComponent } from '../../../../../shared/table/table.component';

@Component({
  selector: 'app-instrument-log-table',
  imports: [TableComponent],
  templateUrl: './instrument-log-table.component.html',
  styleUrl: './instrument-log-table.component.css'
})
export class InstrumentLogTableComponent {
  private instrumentStateService = inject(InstrumentStateService);
  logsFromService = toSignal(this.instrumentStateService.instrumentLogs$, { initialValue: [] as InstrumentLogEntry[] });
  logs = computed(() => this.logsFromService());
  columns = new InstrumentLogEntry().toTableColumns();

}
