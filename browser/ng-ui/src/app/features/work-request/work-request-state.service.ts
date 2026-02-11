import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { WorkRequest } from '../../models/permits/work-request.model';
import { WorkRequestApiService } from './wokr-request-api.service';
import { WorkRequestLocalStorageService } from './work-request-local-storage.service';
import { WorkRequestDbService } from './work-request-db.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalMessageService } from '../../services/global-message.service';
import { SubmissionOrchestratorService, SubmissionResult } from '../../services/submission-orchestrator.service';

@Injectable({
  providedIn: 'root'
})
export class WorkRequestStateService {

  workRequestApiService = inject(WorkRequestApiService);
  workRequestLocalStorageService = inject(WorkRequestLocalStorageService);
  workRequesDbService = inject(WorkRequestDbService);
  globalMessageService = inject(GlobalMessageService);
  orchestrator = inject(SubmissionOrchestratorService);
  destroyRef = inject(DestroyRef);

  emailFallbackData = signal<{ mailto: string; body: string } | null>(null);

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

  submitNewRequest(workRequest: WorkRequest) {
    this.globalMessageService.showMessage('Submitting request...', 'white', 30000);
    this.emailFallbackData.set(null);

    workRequest.submissionStatus = 'pending';

    this.orchestrator.submitWorkRequest(workRequest).pipe(
      switchMap((result: SubmissionResult) => {
        console.log('[WorkRequestState] Submission result:', result);

        if (result.requiresEmail) {
          const emailContent = this.orchestrator.generateEmailContent(workRequest);
          this.emailFallbackData.set({ mailto: emailContent.mailto, body: emailContent.body });
          workRequest.submissionStatus = 'failed';
          this.globalMessageService.showMessage(
            'Submission failed. Please use email fallback below.',
            'yellow',
            10000
          );
          return this.workRequesDbService.addWorkRequest(workRequest);
        }

        const updatedWorkRequest = new WorkRequest({
          ...workRequest,
          sharepointId: result.sharepointId || '',
          submissionStatus: 'submitted',
          submissionMethod: result.method,
          status: 'received'
        });

        return this.workRequesDbService.addWorkRequest(updatedWorkRequest).pipe(
          tap(() => {
            this.selectWorkRequest(updatedWorkRequest);
            this.workRequestLocalStorageService.clearDraft();
            this.addWorkRequestsToList([updatedWorkRequest]);
            this.globalMessageService.showMessage(
              `Request submitted via ${result.method}.`,
              'green'
            );
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      error: (err) => {
        console.error('[WorkRequestState] Submission error:', err);
        const emailContent = this.orchestrator.generateEmailContent(workRequest);
        this.emailFallbackData.set({ mailto: emailContent.mailto, body: emailContent.body });
        this.globalMessageService.showMessage(
          'Submission failed. Please use email fallback.',
          'red'
        );
      }
    });
  }

  clearEmailFallback() {
    this.emailFallbackData.set(null);
  }

  resubmitSelected() {
    this.workRequestLocalStorageService.saveDraft(this.getSelectedWorkRequest());
  }

  revokeSelected(){
    this.globalMessageService.showMessage('Revoking request...', 'white', 20000);
    this.workRequestApiService.revokeRequestOnSharepoint(this.getSelectedWorkRequest()).pipe(
      switchMap(response => {
        console.log('Revocation successful!', response);
        const updatedWorkRequest = new WorkRequest({...this.getSelectedWorkRequest(), status: 'revoked' });
        return this.workRequesDbService.updateWorkRequest(updatedWorkRequest).pipe(
          tap(() => {
            this.selectWorkRequest(updatedWorkRequest);
            this.addWorkRequestsToList([updatedWorkRequest]);
            this.globalMessageService.showMessage('Request revoked successfully.', 'green');
          })
        );
      }),takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        error: (err) => {
          console.error('Revocation failed!', err);
          this.globalMessageService.showMessage('Failed to revoke request. Please try again or contact your supervisor.', 'red');
        }
      })
  }

}