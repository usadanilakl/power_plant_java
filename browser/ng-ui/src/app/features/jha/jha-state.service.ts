import { BehaviorSubject, combineLatest, map, Observable, startWith, switchMap, tap } from "rxjs";
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
      const d = workRequest.dateOfWork ? new Date(workRequest.dateOfWork) : new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const newJha = new Jha({
        jobName: workRequest.workScope,
        date: dateStr,
        workRequestSharepointId: workRequest.sharepointId,
        workRequestLocalUuid: workRequest.localUuid,
      });
      this.selectJha(newJha);
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
      jha = new Jha({ ...formData, attachments });

      this.globalMessageService.showMessage('Submitting JHA...', 'white', 20000);
      this.jhaApiService.submitFormToSharepoint(jha).pipe(
        switchMap(response => {
          console.log('Submission successful!', response);
          const updatedJha = new Jha({...jha, sharepointId: response.id, status: 'received'  });
          return this.jhaDbService.addJha(updatedJha).pipe(
            tap(() => {
              this.addJhasToList([updatedJha]);
              this.jhaLocalStorageService.clearDraft();
              this.selectJha(new Jha());
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.globalMessageService.showMessage('JHA submitted successfully.', 'green');
        },
        error: (err) => {
          console.error('Submission failed!', err);
          this.globalMessageService.showMessage('Failed to submit JHA. Please try again or submit by email.', 'red');
        }
      });
    }

    resubmitSelected() {
      const jha = this.getSelectedJha();
      const { attachments, files, id, localUuid, sharepointId, submissionStatus, status, ...draftFields } = jha as any;
      this.jhaLocalStorageService.saveDraft(draftFields);
      this.selectJha(new Jha(draftFields));
    }

    revokeSelected(){
      this.globalMessageService.showMessage('Revoking JHA...', 'white', 20000);
      this.jhaApiService.revokeRequestOnSharepoint(this.getSelectedJha()).pipe(
        switchMap(response => {
          console.log('Revocation successful!', response);
          const updatedJha = new Jha({...this.getSelectedJha(), status: 'revoked' });
          return this.jhaDbService.updateJha(updatedJha).pipe(
            tap(() => {
              this.selectJha(updatedJha);
              this.addJhasToList([updatedJha]);
              this.globalMessageService.showMessage('JHA revoked successfully.', 'green');
            })
          );
        }),takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          error: (err) => {
            console.error('Revocation failed!', err);
            this.globalMessageService.showMessage('Failed to revoke JHA. Please try again or contact your supervisor.', 'red');
          }
        })
    }
}