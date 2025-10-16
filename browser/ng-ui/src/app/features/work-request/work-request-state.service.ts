import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { WorkRequest } from '../../models/permits/work-request.model';
import { WorkRequestApiService } from './wokr-request-api.service';
import { WorkRequestLocalStorageService } from './work-request-local-storage.service';
import { WorkRequestDbService } from './work-request-db.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class WorkRequestStateService {

  workRequestApiService = inject(WorkRequestApiService);
  workRequestLocalStorageService = inject(WorkRequestLocalStorageService);
  workRequesDbService = inject(WorkRequestDbService);
  destroyRef = inject(DestroyRef)

  constructor() { 
    this.loadWorkRequests();
    this.loadFromLocalStorage();
  }

  private allWorkRequestsSubject = new BehaviorSubject<WorkRequest[]>([]);
  allWorkRequests$ = this.allWorkRequestsSubject.asObservable();

  private selectedWorkRequestSubject = new BehaviorSubject<WorkRequest>(new WorkRequest());
  selectedWorkRequest$ = this.selectedWorkRequestSubject.asObservable();

  loadWorkRequests() {
    this.allWorkRequestsSubject.next([]); //to be implemented with actual API call
  }

  addWorkRequestsToList(workRequests: WorkRequest[]): void {
    const currentWorkRequests = this.allWorkRequestsSubject.getValue();
    const workRequestMap = new Map(currentWorkRequests.map(wr => [wr.sharepointId, wr]));

    workRequests.forEach(newWr => {
      workRequestMap.set(newWr.sharepointId, newWr);
    });

    const updatedWorkRequests = Array.from(workRequestMap.values());
    this.allWorkRequestsSubject.next(updatedWorkRequests);
  }

  selectWorkRequest(workRequest: WorkRequest) {
    this.selectedWorkRequestSubject.next(workRequest);
  }
  getSelectedWorkRequest(): WorkRequest {
    return this.selectedWorkRequestSubject.value;
  }
  saveDraft(workRequest: WorkRequest) {
    this.workRequestLocalStorageService.saveDraft(workRequest);
  }

  loadFromLocalStorage() {
    const draft = this.workRequestLocalStorageService.loadDraft();
    if (draft) {
      this.selectWorkRequest(new WorkRequest(draft));
    }
  }
  submitNewRequest(workReuest: WorkRequest) {
    this.workRequestApiService.submitFormToSharepoint(workReuest).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        console.log('Submission successful!', response);
        const updatedWorkRequest = new WorkRequest({...workReuest, sharepointId: response.id, status: 'received'  });
        this.workRequesDbService.addWorkRequest(updatedWorkRequest);
        this.selectWorkRequest(updatedWorkRequest);
        this.workRequestLocalStorageService.clearDraft();
        this.addWorkRequestsToList([updatedWorkRequest]);
      },
      error: (err) => {
        console.error('Submission failed!', err);
        // Handle error (e.g., show a notification to the user)
      }
    });
  }

}