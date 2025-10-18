import { BehaviorSubject, switchMap, tap } from "rxjs";
import { JhaApiService } from "./jha-api.service";
import { JhaDbService } from "./jha-db.service";
import { Jha } from "../../models/permits/jha.model";
import { GlobalMessageService } from "../../services/global-message.service";
import { DestroyRef, inject, Injectable } from "@angular/core";
import { JhaLocalStorageService } from "./jha-local-storage.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
@Injectable({
  providedIn: 'root'
})
export class JhaStateService {

    jhaApiService = inject(JhaApiService);
    jhaLocalStorageService = inject(JhaLocalStorageService);
    jhaDbService = inject(JhaDbService);
    globalMessageService = inject(GlobalMessageService);
    destroyRef = inject(DestroyRef);

    constructor() {
        this.loadJhas();
        this.loadFromLocalStorage();
    }

    private allJhasSubject = new BehaviorSubject<Jha[]>([]);
    allJhas$ = this.allJhasSubject.asObservable();

    private selectedJhaSubject = new BehaviorSubject<Jha>(new Jha());
    selectedJha$ = this.selectedJhaSubject.asObservable();

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
      this.globalMessageService.showMessage('Submitting JHA...', 'white', 20000);
      this.jhaApiService.submitFormToSharepoint(jha).pipe(
        switchMap(response => {
          console.log('Submission successful!', response);
          const updatedJha = new Jha({...jha, sharepointId: response.id, status: 'received'  });
          return this.jhaDbService.addJha(updatedJha).pipe(
            tap(() => {
              this.selectJha(updatedJha);
              this.jhaLocalStorageService.clearDraft();
              this.addJhasToList([updatedJha]);
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
      this.jhaLocalStorageService.saveDraft(this.getSelectedJha());
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