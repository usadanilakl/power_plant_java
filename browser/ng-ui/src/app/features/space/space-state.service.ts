import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap } from 'rxjs';
import { Space } from '../../models/permits/space.model';
import { SpaceApiService } from './space-api.service';
import { SpaceLocalStorageService } from './space-local-storage.service';
import { SpaceDbService } from './space-db.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalMessageService } from '../../services/global-message.service';

@Injectable({
  providedIn: 'root'
})
export class SpaceStateService {

  spaceApiService = inject(SpaceApiService);
  spaceLocalStorageService = inject(SpaceLocalStorageService);
  spaceDbService = inject(SpaceDbService);
  globalMessageService = inject(GlobalMessageService);
  destroyRef = inject(DestroyRef)

  constructor() { 
    this.loadSpaces();
    this.loadFromLocalStorage();
  }

  private allSpacesSubject = new BehaviorSubject<Space[]>([]);
  allSpaces$ = this.allSpacesSubject.asObservable();

  private selectedSpaceSubject = new BehaviorSubject<Space>(new Space());
  selectedSpace$ = this.selectedSpaceSubject.asObservable();

  loadSpaces() {
    this.spaceDbService.getAllSpaces().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (spaces) => this.allSpacesSubject.next(spaces),
      error: (error) => this.globalMessageService.showMessage('Error loading spaces from local database', 'red', 20000)
    });
  }

  addSpacesToList(spaces: Space[]): void {
    const currentSpaces = this.allSpacesSubject.getValue();
    const spaceMap = new Map(currentSpaces.map(s => [s.sharepointId, s]));

    spaces.forEach(newSpace => {
      spaceMap.set(newSpace.sharepointId, newSpace);
    });

    const updatedSpaces = Array.from(spaceMap.values());
    this.allSpacesSubject.next(updatedSpaces);
  }

  selectSpace(space: Space) {
    this.selectedSpaceSubject.next(space);
  }
  getSelectedSpace(): Space {
    return this.selectedSpaceSubject.value;
  }
  saveDraft(space: Space) {
    this.spaceLocalStorageService.saveDraft(space);
  }

  loadFromLocalStorage() {
    const draft = this.spaceLocalStorageService.loadDraft();
    if (draft) {
      this.selectSpace(new Space(draft));
    }
  }

  submitNewRequest(space: Space) {
    this.globalMessageService.showMessage('Submitting request...', 'white', 20000);
    this.spaceApiService.submitFormToSharepoint(space).pipe(
      switchMap(response => {
        console.log('Submission successful!', response);
        const updatedSpace = new Space({...space, sharepointId: response.id, status: 'received'  });
        return this.spaceDbService.addSpace(updatedSpace).pipe(
          tap(() => {
            this.selectSpace(updatedSpace);
            this.spaceLocalStorageService.clearDraft();
            this.addSpacesToList([updatedSpace]);
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

  resubmitSelected() {
    this.spaceLocalStorageService.saveDraft(this.getSelectedSpace());
  }

  revokeSelected(){
    this.globalMessageService.showMessage('Revoking request...', 'white', 20000);
    this.spaceApiService.revokeRequestOnSharepoint(this.getSelectedSpace()).pipe(
      switchMap(response => {
        console.log('Revocation successful!', response);
        const updatedSpace = new Space({...this.getSelectedSpace(), status: 'revoked' });
        return this.spaceDbService.updateSpace(updatedSpace).pipe(
          tap(() => {
            this.selectSpace(updatedSpace);
            this.addSpacesToList([updatedSpace]);
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
  
  synchronize(): void {
    throw new Error('Method not implemented.');
  }
}