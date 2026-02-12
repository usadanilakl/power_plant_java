import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { JhaStateService } from '../jha-state.service';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { TableComponent } from '../../../shared/table/table.component';

@Component({
  selector: 'app-jha-left-menu',
  imports: [TableComponent],
  templateUrl: './jha-left-menu.component.html',
  styleUrl: './jha-left-menu.component.css'
})
export class JhaLeftMenuComponent {

  jhaStateService = inject(JhaStateService);

  items = toSignal(this.jhaStateService.workRequestsForJha$, { initialValue: [] });
  columns = new WorkRequest().toTableColumns({ columns: ['workScope', 'company', 'dateOfWork', 'jhaStatus'] });

  onRowClick({ item }: { item: WorkRequest, event: MouseEvent }) {
    this.jhaStateService.selectWorkRequestForJha(item);
  }
}
