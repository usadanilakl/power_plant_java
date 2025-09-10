import { Component, computed, DestroyRef, inject, Input, OnInit, Signal } from '@angular/core';
import { CurrentWorkRequestService } from '../../../../services/current-items-services/current-work-requests.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkRequestDto } from '../../../../models/permits/work-request.model';
import { TableComponent } from "../../../../shared/table/table.component";
import { Column } from '../../../../models/column.model';

@Component({
  selector: 'app-work-request-table',
  imports: [TableComponent],
  templateUrl: './work-request-table.component.html',
  styleUrl: './work-request-table.component.css'
})
export class WorkRequestTableComponent implements OnInit {
  private currentWorkRequestService = inject(CurrentWorkRequestService);
  private destroyRef = inject(DestroyRef);

  @Input() itemsInput: Signal<WorkRequestDto[]> | null = null;
  globalItems = toSignal(this.currentWorkRequestService.allActiveRequests$, { initialValue: null as WorkRequestDto[] | null });
  
  items = computed(() => {
    if (this.itemsInput) {
      return this.itemsInput();
    } else if (this.globalItems()) {
      return [this.globalItems()!];
    }
    return [];
  });

  columns: Column[] = WorkRequestDto.toTableColumns();

  constructor() { }
  
  ngOnInit(): void {
    // Implement your initialization logic here
  }

  onWorkRequestRowClick(workRequest: WorkRequestDto): void {
    this.currentWorkRequestService.setCurrentWorkRequest(workRequest.id);
    // Implement your row click logic here
  }
}
