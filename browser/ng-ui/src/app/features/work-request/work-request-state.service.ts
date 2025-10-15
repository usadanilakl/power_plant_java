import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { WorkRequest } from '../../models/permits/work-request.model';
import { WorkRequestApiService } from './wokr-request-api.service';

@Injectable({
  providedIn: 'root'
})
export class WorkRequestStateService {

  workRequestApiService = inject(WorkRequestApiService);
  destroyRef = inject(DestroyRef)

  constructor() { }

  private allWorkRequestsSubject = new BehaviorSubject<WorkRequest[]>([]);
  allWorkRequests$ = this.allWorkRequestsSubject.asObservable();

  private selectedWorkRequestSubject = new BehaviorSubject<WorkRequest>(new WorkRequest());
  selectedWorkRequest$ = this.selectedWorkRequestSubject.asObservable();

  loadWorkRequests() {
    this.allWorkRequestsSubject.next([]); //to be implemented with actual API call
  }

  selectWorkRequest(workRequest: WorkRequest) {
    this.selectedWorkRequestSubject.next(workRequest);
  }
  getSelectedWorkRequest(): WorkRequest {
    return this.selectedWorkRequestSubject.value;
  }

}