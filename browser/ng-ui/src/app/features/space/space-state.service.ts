import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, take, tap } from 'rxjs';
import { Space } from '../../models/permits/space.model';
import { SpaceApiService } from './space-api.service';
import { SpaceLocalStorageService } from './space-local-storage.service';
import { SpaceDbService } from './space-db.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalMessageService } from '../../services/global-message.service';
import { SpacePa } from '../../models/permits/space-pa.model';
import { SpaceTestResult } from '../../models/permits/space-test-result.model';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SpaceStateService {

  spaceApiService = inject(SpaceApiService);
  spaceLocalStorageService = inject(SpaceLocalStorageService);
  spaceDbService = inject(SpaceDbService);
  globalMessageService = inject(GlobalMessageService);
  authService = inject(AuthService);
  destroyRef = inject(DestroyRef)

  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  private allSpacesSubject = new BehaviorSubject<Space[]>([]);
  allSpaces$ = this.allSpacesSubject.asObservable();

  private selectedSpaceSubject = new BehaviorSubject<Space>(new Space());
  selectedSpace$ = this.selectedSpaceSubject.asObservable();

  newSpaceFormFields = new Space().toFormFields({ fields: ["space"] });

  constructor() { 
    this.loadSpaces();
    this.loadFromLocalStorage();
  }

  loadSpaces() {
    // Load from IndexedDB first (primary source)
    this.spaceDbService.getAllSpaces().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (spaces) => {
        this.allSpacesSubject.next(spaces);
        console.log('Spaces loaded from IndexedDB:', spaces.length);
      },
      error: (error) => {
        console.error('Error loading spaces from IndexedDB:', error);
        this.globalMessageService.showMessage('Error loading spaces from local database', 'red', 5000);
      }
    });

    // Check if we need to sync with API
    this.syncWithApiIfNeeded();
  }

  private syncWithApiIfNeeded(): void {
    const lastSync = this.spaceLocalStorageService.getSyncItem();
    const now = Date.now();

    // console.log('Last sync:', lastSync);
    // console.log('Now:', now);
    // console.log('Interval:', this.SYNC_INTERVAL_MS);
    // console.log('Should sync:', now - lastSync);
    
    if (!lastSync || (now - lastSync) >= this.SYNC_INTERVAL_MS) {
      this.syncWithApi();
    }
  }

  synchronize(): void {
    this.syncWithApi();
  }

  private syncWithApi(): void {
    console.log('Syncing spaces...');
    this.globalMessageService.showMessage('Syncing spaces...', 'white', 20000);
    
    this.spaceApiService.getSpaces().pipe(
      switchMap(response => {
        const spaces = Array.isArray(response) ? response : (response?.data || response?.value || []);
        if (!spaces.length) {
          return of([]);
        }

        console.log('Spaces from API:', spaces);

        const convertedSpaces = spaces.map((spaceData: any) => new SpacePa(spaceData).convertToSpace());

        console.log('Converted spaces:', convertedSpaces);
        
        // Update IndexedDB with API data
        return this.spaceDbService.updateSpacesBySharepointId(convertedSpaces).pipe(
          tap(() => {
            this.addSpacesToList(convertedSpaces);
            this.spaceLocalStorageService.setSyncItem(Date.now());
          }),
          switchMap(() => of(convertedSpaces))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (spaces) => {
        if (spaces.length > 0) {
          console.log('Spaces synced successfully from API:', spaces.length);
          this.globalMessageService.showMessage('Spaces synced successfully', 'green', 2000);
        }
      },
      error: (error) => {
        console.error('Error syncing spaces from API:', error);
        this.globalMessageService.showMessage('Failed to sync spaces from server', 'red', 5000);
      }
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

  createNewSpace(space: Space) {
    if(!space) throw new Error('Space object is required');
    space.status = 'Inactive';
    this.globalMessageService.showMessage('Submitting request...', 'white', 20000);
    this.spaceApiService.submitFormToSharepoint(space).pipe(
      switchMap(response => {
        console.log('Submission successful!', response);
        const updatedSpace = new Space({...space, sharepointId: response.id});
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

  submitNewTest(space: Space) {
    if(!space) throw new Error('Space object is required');

    const spaceTestResult = new SpaceTestResult({
      SpaceId: space.sharepointId,
      TesterId: this.authService.currentUser()?.id,
      Co: space.co,
      Oxygen: space.oxygen,
      Lel: space.lel,
      H2s: space.h2s,
      Nh3: space.nh3,
      MeterSerialNumber: space.meterSerialNumber
    });

    this.globalMessageService.showMessage('Submitting test results...', 'white', 20000);

    this.spaceApiService.submitTestResultsToSharepoint(spaceTestResult).pipe(
      switchMap(response => {
        console.log('Test results submission successful!', response);
        return this.spaceDbService.updateSpace(new Space({...space, testerName: this.authService.currentUser()?.lastName })).pipe(
          tap(() => {
            this.selectSpace(new Space({...space, testerName: this.authService.currentUser()?.lastName }));
            this.globalMessageService.showMessage('Test results submitted successfully.', 'green');
          })
        )
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.globalMessageService.showMessage('Test results submitted successfully.', 'green');
      },
      error: (err) => {
        console.error('Test results submission failed!', err);
        this.globalMessageService.showMessage('Failed to submit test results. Please try again or contact your supervisor.', 'red');
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

  private isSpaceSafe(): boolean {
    const space = this.getSelectedSpace();
    if (!space) {
      return false;
    }

    // Direct number comparison - no parsing needed
    return space.co < 35 &&
           space.oxygen > 19.5 && space.oxygen < 23.6 &&
           space.lel < 10 &&
           space.h2s < 10 &&
           space.nh3 < 100;
  }
  
}