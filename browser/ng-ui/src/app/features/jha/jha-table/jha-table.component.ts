import { Component, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { JhaStateService } from '../jha-state.service';
import { Jha } from '../../../models/permits/jha.model';
import { TableComponent } from '../../../shared/table/table.component';

@Component({
  selector: 'app-jha-table',
  imports: [TableComponent],
  templateUrl: './jha-table.component.html',
  styleUrl: './jha-table.component.css'
})
export class JhaTableComponent {

  jhaStateService = inject(JhaStateService);
  reused = output<void>();

  items = toSignal(this.jhaStateService.allJhas$, { initialValue: [] });
  columns = new Jha().getTableColumns();

  onRowClick({ item }: { item: Jha, event: MouseEvent }) {
    this.jhaStateService.reuseJhaTemplate(item);
    this.reused.emit();
  }
}
