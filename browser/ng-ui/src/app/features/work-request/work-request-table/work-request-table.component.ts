import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { WorkRequestStateService } from '../work-request-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { TableComponent } from "../../../shared/table/table.component";

@Component({
  selector: 'app-work-request-table',
  imports: [TableComponent],
  templateUrl: './work-request-table.component.html',
  styleUrl: './work-request-table.component.css'
})
export class WorkRequestTableComponent {

  workRequestStateService = inject(WorkRequestStateService);
  destroyRef = inject(DestroyRef);

  constructor() { }

  itemsInput = input<WorkRequest[]>();
  itemsFromService = toSignal(this.workRequestStateService.allWorkRequests$, { initialValue: [] });
  items = computed(() => this.itemsInput()?? this.itemsFromService());

  columns = new WorkRequest().toTableColumns();

}
