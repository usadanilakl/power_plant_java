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

    private allActiveRequestsSubject = new BehaviorSubject<WorkRequestDto[] >([]);
    allActiveRequests$ = this.allActiveRequestsSubject.asObservable();

    private selectedWorkRequestSubject = new BehaviorSubject<WorkRequestDto>(new WorkRequestDto()  );
    selectedWorkRequest$ = this.selectedWorkRequestSubject.asObservable();

    constructor() {
        this.loadWorkRequests();
    }

    private normalizeWorkRequest(item: Partial<WorkRequestDto> | null | undefined): WorkRequestDto {
        return item ? WorkRequestDto.fromJson(item) : new WorkRequestDto();
    }

    private normalizeWorkRequests(items: Partial<WorkRequestDto>[] | null | undefined): WorkRequestDto[] {
        return (items ?? []).map(item => this.normalizeWorkRequest(item));
    }

    private loadWorkRequests() {
        this.workRequestService.getWorkRequestsByStatus('active').pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveRequestsSubject.next(this.normalizeWorkRequests(response.responseData));
            console.log('Work requests loaded:', response.responseData);
        });
    }

    setCurrentWorkRequest(id: number) {
      this.workRequestService.getWorkRequestById(id.toString()).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedWorkRequestSubject.next(this.normalizeWorkRequest(response.responseData));
        });
    }

    /**
     * Republishes a request the caller has just saved, without a re-fetch.
     *
     * <p>For screens that change the selected request through an endpoint of their own — the
     * package builder's area / equipment / scope override is the first — so everything bound to
     * the selection redraws from one place. Pushing here rather than emitting an `@Output` means
     * a host that forgot to wire the event cannot leave the operator looking at stale values
     * while the server holds the new ones.
     */
    updateSelectedWorkRequest(workRequest: Partial<WorkRequestDto> | null | undefined) {
        this.selectedWorkRequestSubject.next(this.normalizeWorkRequest(workRequest));
    }
}
