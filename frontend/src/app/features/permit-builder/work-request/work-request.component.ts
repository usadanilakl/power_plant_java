import { Component, DestroyRef, inject, Input, OnInit, signal, Signal, computed } from '@angular/core';
import { WorkRequestTableComponent } from "./work-request-table/work-request-table.component";
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";
import { DailyPermitPackageFormComponent } from "../daily-permit-package/daily-permit-package-form/daily-permit-package-form.component";
import { WorkRequestDto } from '../../../models/permits/work-request.model';
import { CurrentWorkRequestService } from '../../../services/current-items-services/current-work-requests.service';
import { toSignal } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-work-request',
  imports: [WorkRequestTableComponent, PopupProjectionComponent, DailyPermitPackageFormComponent],
  templateUrl: './work-request.component.html',
  styleUrl: './work-request.component.css'
})
export class WorkRequestComponent implements OnInit {

  private currentWorkRequestService = inject(CurrentWorkRequestService);

  isDailyPermitPackageFormOpen = false;
  currentWorkRequest = toSignal(this.currentWorkRequestService.selectedWorkRequest$, { initialValue: new WorkRequestDto() });

  constructor() { }
  
  ngOnInit(): void {
    // Implement your initialization logic here
  }

  onDailyPermitPackageFormClose(){
    this.isDailyPermitPackageFormOpen = false;
    // Implement your form close logic here
  }

  onWorkRequestTableRowLeftClick(workRequest: WorkRequestDto){
    this.isDailyPermitPackageFormOpen = true;
  }
}
