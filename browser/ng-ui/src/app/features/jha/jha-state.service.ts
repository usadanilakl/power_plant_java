import { BehaviorSubject, combineLatest, from, map, Observable, startWith, switchMap, tap } from "rxjs";
import { JhaApiService } from "./jha-api.service";
import { JhaDbService } from "./jha-db.service";
import { Jha } from "../../models/permits/jha.model";
import { GlobalMessageService } from "../../services/global-message.service";
import { DestroyRef, inject, Injectable } from "@angular/core";
import { JhaLocalStorageService } from "./jha-local-storage.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { WorkRequestDbService } from "../work-request/work-request-db.service";
import { RouteDataEncoderService } from "../../services/route-data-encoder.service";
import { IJhaTransfer, JhaTransfer } from "../../models/permits/jha-transfer.model";
import { WorkRequest } from "../../models/permits/work-request.model";
import { UserSetupService } from "../../services/user-setup.service";
import { IAttachment } from "../../models/permits/attachment.model";
import { SubmissionOrchestratorService } from "../../services/submission-orchestrator.service";
import { captureJhaAsImage } from "./jha-image/jha-image.util";
@Injectable({
  providedIn: 'root'
})
export class JhaStateService {

    jhaApiService = inject(JhaApiService);
    jhaLocalStorageService = inject(JhaLocalStorageService);
    jhaDbService = inject(JhaDbService);
    globalMessageService = inject(GlobalMessageService);
    workRequestDbService = inject(WorkRequestDbService);
    routeDataEncoder = inject(RouteDataEncoderService);
    userSetupService = inject(UserSetupService);
    submissionOrchestrator = inject(SubmissionOrchestratorService);
    destroyRef = inject(DestroyRef);

    constructor() {
        this.loadJhas();
        this.loadFromLocalStorage();
        this.initializeJhaTransfers();
    }

    private allJhasSubject = new BehaviorSubject<Jha[]>([]);
    allJhas$ = this.allJhasSubject.asObservable();

    private selectedJhaSubject = new BehaviorSubject<Jha>(new Jha());
    selectedJha$ = this.selectedJhaSubject.asObservable();

    private selectedWorkRequestSubject = new BehaviorSubject<WorkRequest | null>(null);
    selectedWorkRequest$ = this.selectedWorkRequestSubject.asObservable();
    selectedWorkRequestSignal = toSignal(this.selectedWorkRequestSubject, { initialValue: null });

    private jhaTransfersSubject = new BehaviorSubject<JhaTransfer[]>([]);
    jhaTransfers$: Observable<JhaTransfer[]> = this.jhaTransfersSubject.asObservable();
    jhaTransfersSignal = toSignal(this.jhaTransfersSubject, { initialValue: [] });

    workRequestsForJha$: Observable<WorkRequest[]> = this.workRequestDbService.getWorkRequestsNeedingJha();

    private queryParamTransfersSubject = new BehaviorSubject<JhaTransfer[]>([]);


    private initializeJhaTransfers(): void {
      combineLatest([
        this.queryParamTransfersSubject.asObservable(),
        this.workRequestDbService.getWorkRequestWithoutJha().pipe(
          map(workRequests =>
            workRequests.map(workRequest =>
              new JhaTransfer({
                requestSharepointId: +workRequest.sharepointId,
                workScope: workRequest.workScope,
                dateOfWork: workRequest.dateOfWork
              })
            )
          ),
          startWith([])
        )
      ]).pipe(
        map(([queryParamTransfers, dbTransfers]) => {
          const allTransfers = [...queryParamTransfers, ...dbTransfers];
          const uniqueTransfers = allTransfers.reduce((acc, transfer) => {
            const exists = acc.find(t => t.requestSharepointId === transfer.requestSharepointId);
            if (!exists) {
              acc.push(transfer);
            }
            return acc;
          }, [] as JhaTransfer[]);
          return uniqueTransfers;
        })
      ).subscribe(this.jhaTransfersSubject);
    }

    /**
     * Updates the list of JHA transfers that come from route query parameters.
     * @param encodedData The encoded string from the 'data' query parameter.
     */
    updateTransfersFromQueryParams(encodedData: string | null): void {
      if (encodedData) {
        const decodedData = this.routeDataEncoder.decode<IJhaTransfer>(encodedData);
        const transfers = decodedData.map(item => new JhaTransfer(item));
        this.queryParamTransfersSubject.next(transfers);
      } else {
        this.queryParamTransfersSubject.next([]);
      }
    }

    loadJhas() {
        this.jhaDbService.getAllJhas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (jhas) => this.allJhasSubject.next(jhas),
            error: (error) => this.globalMessageService.showMessage('Error loading Jhas:', 'red', 20000)
        });
    }

    addJhasToList(jhas: Jha[]): void {
      const currentJhas = this.allJhasSubject.getValue();
      const jhaMap = new Map(currentJhas.map(j => [j.sharepointId, j]));

      jhas.forEach(newJha => {
        jhaMap.set(newJha.sharepointId, newJha);
      });

      const updatedJhas = Array.from(jhaMap.values());
      this.allJhasSubject.next(updatedJhas);
    }

    selectJha(jha: Jha) {
      this.selectedJhaSubject.next(jha);
    }

    selectWorkRequestForJha(workRequest: WorkRequest): void {
      this.selectedWorkRequestSubject.next(workRequest);
      const current = this.getSelectedJha();
      const d = workRequest.dateOfWork ? new Date(workRequest.dateOfWork) : new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const updatedJha = new Jha({
        ...current,
        jobName: workRequest.workScope,
        date: dateStr,
        workRequestSharepointId: workRequest.sharepointId,
        workRequestLocalUuid: workRequest.localUuid,
        sharepointId: '',
        localUuid: current.localUuid || crypto.randomUUID(),
      });
      this.selectJha(updatedJha);
    }

    getSelectedJha(): Jha {
      return this.selectedJhaSubject.value;
    }

    saveDraft(jha: Jha) {
      this.jhaLocalStorageService.saveDraft(jha);
    }

    loadFromLocalStorage() {
      const draft = this.jhaLocalStorageService.loadDraft();
      if (draft) {
        this.selectJha(new Jha(draft));
      }
    }

    submitNewRequest(jha: Jha) {
      const selectedJha = this.getSelectedJha();
      const submittedWr = this.selectedWorkRequestSubject.value;

      if (!selectedJha.workRequestSharepointId) {
        this.globalMessageService.showMessage(
          'Please select a Work Request from the left panel before submitting a JHA.', 'red'
        );
        return;
      }

      const formData = jha as any;
      const attachments: IAttachment[] = [
        ...(Array.isArray(formData.files) ? formData.files : []),
      ];
      const userSignature = this.userSetupService.getUserData()?.signature;
      if (userSignature) {
        const base64 = userSignature.includes(',')
          ? userSignature.split(',')[1]
          : userSignature;
        attachments.push({
          fileName: 'signature.png',
          contentType: 'image/png',
          base64Content: base64,
          type: 'signature'
        });
      }
      jha = new Jha({
        ...formData,
        attachments,
        workRequestSharepointId: selectedJha.workRequestSharepointId,
        workRequestLocalUuid: selectedJha.workRequestLocalUuid,
      });

      this.globalMessageService.showMessage('Generating JHA form image...', 'white', 20000);
      from(captureJhaAsImage(jha)).pipe(
        map(base64Png => {
          const imageAttachment: IAttachment = {
            fileName: `JHA-${jha.localUuid}.png`,
            contentType: 'image/png',
            base64Content: base64Png,
            type: 'document'
          };
          return new Jha({ ...jha, attachments: [...jha.attachments, imageAttachment] });
        }),
        tap(() => this.globalMessageService.showMessage('Submitting JHA...', 'white', 20000)),
        switchMap(jhaWithImage => this.submissionOrchestrator.submitJha(jhaWithImage).pipe(
          map(result => ({ result, jhaWithImage }))
        )),
        switchMap(({ result, jhaWithImage }) => {
          if (result.requiresEmail) {
            const emailData = this.submissionOrchestrator.generateJhaEmailContent(jhaWithImage);
            window.location.href = emailData.mailto;
            throw new Error(result.message);
          }
          const updatedJha = new Jha({
            ...jhaWithImage,
            sharepointId: result.sharepointId || '',
            status: result.success ? 'received' : 'pending'
          });
          return this.jhaDbService.addJha(updatedJha).pipe(
            tap(() => {
              this.addJhasToList([updatedJha]);
              this.jhaLocalStorageService.clearDraft();
              if (submittedWr?.id) {
                this.workRequestDbService.updateWorkRequest({
                  id: submittedWr.id, jhaStatus: 'Completed'
                }).subscribe();
              }
              this.selectedWorkRequestSubject.next(null);
              this.selectJha(new Jha());
            }),
            map(() => result)
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (result) => {
          this.globalMessageService.showMessage(
            result.message || 'JHA submitted successfully.', 'green'
          );
        },
        error: (err) => {
          console.error('Submission failed!', err);
          this.globalMessageService.showMessage(
            err.message || 'Failed to submit JHA. Please try again or submit by email.', 'red'
          );
        }
      });
    }

    /** Populate form from a previously submitted JHA, keeping current WR selection. */
    reuseJhaTemplate(source: Jha): void {
      const currentWr = this.selectedWorkRequestSubject.value;
      const current = this.getSelectedJha();
      const reusedJha = new Jha({
        ...source,
        // Clear submission-specific fields
        sharepointId: '',
        localUuid: crypto.randomUUID(),
        submissionStatus: 'draft',
        attachments: [],
        // Preserve current WR link (user selects WR separately)
        workRequestSharepointId: current.workRequestSharepointId,
        workRequestLocalUuid: current.workRequestLocalUuid,
        // Override jobName/date from WR if one is selected
        ...(currentWr ? {
          jobName: currentWr.workScope,
          date: (() => {
            const d = currentWr.dateOfWork ? new Date(currentWr.dateOfWork) : new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })()
        } : {}),
      });
      this.selectJha(reusedJha);
      this.jhaLocalStorageService.saveDraft(reusedJha);
    }

    resubmitSelected() {
      const jha = this.getSelectedJha();
      const { attachments, files, id, localUuid, sharepointId, submissionStatus, status, ...draftFields } = jha as any;
      this.jhaLocalStorageService.saveDraft(draftFields);
      this.selectJha(new Jha(draftFields));
    }

    submitFileOnlyJha(files: IAttachment[]) {
      const selectedJha = this.getSelectedJha();
      const submittedWr = this.selectedWorkRequestSubject.value;

      if (!selectedJha.workRequestSharepointId) {
        this.globalMessageService.showMessage(
          'Please select a Work Request from the left panel before submitting a JHA.', 'red'
        );
        return;
      }

      const userData = this.userSetupService.getUserData();
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const attachments: IAttachment[] = [...files];
      const userSignature = userData?.signature;
      if (userSignature) {
        const base64 = userSignature.includes(',')
          ? userSignature.split(',')[1]
          : userSignature;
        attachments.push({
          fileName: 'signature.png',
          contentType: 'image/png',
          base64Content: base64,
          type: 'signature'
        });
      }

      const jha = new Jha({
        localUuid: crypto.randomUUID(),
        jobName: submittedWr?.workScope || 'JHA - File Attached',
        date: dateStr,
        analysisBy: userData?.name || '',
        applicability: userData?.company || '',
        attachments,
        workRequestSharepointId: selectedJha.workRequestSharepointId,
        workRequestLocalUuid: selectedJha.workRequestLocalUuid,
      });

      this.globalMessageService.showMessage('Submitting JHA (file only)...', 'white', 20000);
      this.submissionOrchestrator.submitJha(jha).pipe(
        switchMap(result => {
          if (result.requiresEmail) {
            const emailData = this.submissionOrchestrator.generateJhaEmailContent(jha);
            window.location.href = emailData.mailto;
            throw new Error(result.message);
          }
          const updatedJha = new Jha({
            ...jha,
            sharepointId: result.sharepointId || '',
            status: result.success ? 'received' : 'pending'
          });
          return this.jhaDbService.addJha(updatedJha).pipe(
            tap(() => {
              this.addJhasToList([updatedJha]);
              this.jhaLocalStorageService.clearDraft();
              if (submittedWr?.id) {
                this.workRequestDbService.updateWorkRequest({
                  id: submittedWr.id, jhaStatus: 'Completed'
                }).subscribe();
              }
              this.selectedWorkRequestSubject.next(null);
              this.selectJha(new Jha());
            }),
            map(() => result)
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (result) => {
          this.globalMessageService.showMessage(
            result.message || 'JHA submitted successfully (file only).', 'green'
          );
        },
        error: (err) => {
          console.error('File-only JHA submission failed!', err);
          this.globalMessageService.showMessage(
            err.message || 'Failed to submit JHA. Please try again or submit by email.', 'red'
          );
        }
      });
    }

    revokeSelected(){
      const jha = this.getSelectedJha();
      if (!jha?.sharepointId) {
        this.globalMessageService.showMessage('Cannot revoke: no SharePoint ID.', 'red');
        return;
      }
      this.globalMessageService.showMessage('Revoking JHA...', 'white', 20000);
      this.submissionOrchestrator.revokeJha(jha.sharepointId, jha.localUuid || '').pipe(
        switchMap(result => {
          if (!result.success) {
            this.globalMessageService.showMessage(result.message || 'Revoke failed.', 'red');
            return from([null]);
          }
          const updatedJha = new Jha({...jha, status: 'revoked' });
          return this.jhaDbService.updateJha(updatedJha).pipe(
            tap(() => {
              this.selectJha(updatedJha);
              this.addJhasToList([updatedJha]);
              this.globalMessageService.showMessage('JHA revoked successfully.', 'green');
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        error: (err) => {
          console.error('Revocation failed!', err);
          this.globalMessageService.showMessage('Failed to revoke JHA. Please try again or contact your supervisor.', 'red');
        }
      });
    }
}