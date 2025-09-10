import { DestroyRef, inject, Injectable } from "@angular/core";
import { WorkRequestService } from "../permits/work-request.service";
import { BehaviorSubject } from "rxjs";
import { WorkRequestDto } from "../../models/permits/work-request.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class CurrentWorkRequestService {
    private workRequestService = inject(WorkRequestService);
    private destroyRef = inject(DestroyRef);

    private allActiveRequestsSubject = new BehaviorSubject<WorkRequestDto[] | null>(null);
    allActiveRequests$ = this.allActiveRequestsSubject.asObservable();

    private selectedWorkRequestSubject = new BehaviorSubject<WorkRequestDto | null>(null);
    selectedWorkRequest$ = this.selectedWorkRequestSubject.asObservable();

    constructor() {
        this.loadWorkRequests();
    }

    private loadWorkRequests() {
        this.workRequestService.getWorkRequestsByStatus('active').pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveRequestsSubject.next(response.responseData);
            console.log('Work requests loaded:', response.responseData);
        });
    }

    setCurrentWorkRequest(id: number) {
      this.workRequestService.getWorkRequestById(id.toString()).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedWorkRequestSubject.next(response.responseData);
        });
    }
}