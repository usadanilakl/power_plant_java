import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { WorkRequest } from '../../models/permits/work-request.model';
import { WorkRequestApiService } from './wokr-request-api.service';
import { WorkRequestLocalStorageService } from './work-request-local-storage.service';
import { WorkRequestDbService } from './work-request-db.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalMessageService } from '../../services/global-message.service';

@Injectable({
  providedIn: 'root'
})
export class WorkRequestStateService {

  workRequestApiService = inject(WorkRequestApiService);
  workRequestLocalStorageService = inject(WorkRequestLocalStorageService);
  workRequesDbService = inject(WorkRequestDbService);
  globalMessageService = inject(GlobalMessageService);
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
    this.workRequesDbService.getAllWorkRequests().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (workRequests) => this.allWorkRequestsSubject.next(workRequests),
      error: (error) => this.globalMessageService.showMessage('Error loading work requests from API', 'red', 20000)
    });
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
    this.globalMessageService.showMessage('Submitting request...', 'white', 20000);
    this.workRequestApiService.submitFormToSharepoint(workReuest).pipe(
      switchMap(response => {
        console.log('Submission successful!', response);
        const updatedWorkRequest = new WorkRequest({...workReuest, sharepointId: response.id, status: 'received'  });
        // The addWorkRequest observable will be executed by switchMap
        return this.workRequesDbService.addWorkRequest(updatedWorkRequest).pipe(
          // tap allows side-effects without altering the stream
          tap(() => {
            this.selectWorkRequest(updatedWorkRequest);
            this.workRequestLocalStorageService.clearDraft();
            this.addWorkRequestsToList([updatedWorkRequest]);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.globalMessageService.showMessage('Request submitted successfully.', 'green');
      },
      error: (err) => {
        console.error('Submission failed!', err);
        this.globalMessageService.showMessage('Failed to submit request. Please try again or submit by email.', 'red');
      }
    });
  }

}