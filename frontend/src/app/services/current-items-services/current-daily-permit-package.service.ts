import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, switchMap, tap } from "rxjs";
import { DailyPermitPackageDto } from "../../models/permits/dailt-permit-package.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { DailyPermitPackageService } from "../permits/daily-permit-package.service";
import { WorkRequestDto } from "../../models/permits/work-request.model";
import { WorkRequestService } from "../permits/work-request.service";
import { SafeWorkDto } from "../../models/permits/safe-work.model";
import { ConfinedSpaceService } from "../permits/confined-space.service";
import { HotWorkService } from "../permits/hot-work.service";
import { SafeWorkService } from "../permits/safe-work.service";
import { HotWorkDto } from "../../models/permits/hot-work.model";
import { ConfinedSpaceDto } from "../../models/permits/confined-space.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentDailyPermitPackageService {
    private dailyPermitPackageService = inject(DailyPermitPackageService);
    private workRequestService = inject(WorkRequestService);
    private safeWorkService = inject(SafeWorkService);
    private hotWorkService = inject(HotWorkService);
    private confinedSpaceService = inject(ConfinedSpaceService);
    private destroyRef = inject(DestroyRef);

    private allActiveDailyPermitPackagesSubject = new BehaviorSubject<DailyPermitPackageDto[]>([]);
    allActiveDailyPermitPackages$ = this.allActiveDailyPermitPackagesSubject.asObservable();

    private selectedDailyPermitPackageSubject = new BehaviorSubject<DailyPermitPackageDto>(new DailyPermitPackageDto());
    selectedDailyPermitPackage$ = this.selectedDailyPermitPackageSubject.asObservable();

    currentDailyPacksge = toSignal(this.selectedDailyPermitPackage$, { initialValue: new DailyPermitPackageDto()  });
    allPackages = toSignal(this.allActiveDailyPermitPackages$, { initialValue: [] });
    currentWorkRequest = signal<WorkRequestDto | null>(null);
    currentSafeWork = signal<SafeWorkDto | null>(null);
    currentHotWork = signal<HotWorkDto | null>(null);
    currentConfinedSpace = signal<ConfinedSpaceDto | null>(null);

    constructor() {
        this.loadDailyPermitPackages();
    }

    private loadDailyPermitPackages() {
        this.dailyPermitPackageService.getDailyPermitPackages().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveDailyPermitPackagesSubject.next(response.responseData);
            console.log('Daily permit packages loaded:', response.responseData);
        });
    }

    setCurrentDailyPermitPackage(id: number = 0) {
        if (id === 0) {
            // this.dailyPermitPackageService.createDailyPermitPackage(new DailyPermitPackageDto).pipe(
            //     takeUntilDestroyed(this.destroyRef)
            // ).subscribe(response => {
            //     this.selectedDailyPermitPackageSubject.next(response.responseData);
            //     this.addDailyPermitPackageToList(response.responseData);
            // });
            this.selectedDailyPermitPackageSubject.next(new DailyPermitPackageDto());
        }else{
          this.dailyPermitPackageService.getDailyPermitPackageById(id).pipe(
              takeUntilDestroyed(this.destroyRef)
          ).subscribe(response => {
              this.selectedDailyPermitPackageSubject.next(response.responseData);
          });
        }
    }
    
    updateCurrentDailyPacksge(current: DailyPermitPackageDto) {
      this.dailyPermitPackageService.createDailyPermitPackage(current).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(
        (response) => {
          this.updateDailyPermitPackageInList(response.responseData);
          this.selectedDailyPermitPackageSubject.next(response.responseData);
        },
        (error) => {
          console.error('Error updating daily permit package:', error);
        }
      );
    }

    updateDailyPermitPackageInList(permitPackage: DailyPermitPackageDto) {
        const currentPackages = this.allActiveDailyPermitPackagesSubject.value;
        const itemIndex = currentPackages.findIndex(pkg => pkg.id === permitPackage.id);

        if (itemIndex !== -1) {
            // Item exists, update it
            const updatedPackages = [...currentPackages];
            updatedPackages[itemIndex] = permitPackage;
            this.allActiveDailyPermitPackagesSubject.next(updatedPackages);
        } else {
            // Item is new, add it
            this.allActiveDailyPermitPackagesSubject.next([permitPackage, ...currentPackages]);
        }
    }

    addDailyPermitPackageToList(permitPackage: DailyPermitPackageDto) {
        const currentPackages = this.allActiveDailyPermitPackagesSubject.value;
        this.allActiveDailyPermitPackagesSubject.next([...currentPackages, permitPackage]);
    }

    removeDailyPermitPackageFromList(id: number) {
        const currentPackages = this.allActiveDailyPermitPackagesSubject.value;
        const updatedPackages = currentPackages.filter(pkg => pkg.id !== id);
        this.allActiveDailyPermitPackagesSubject.next(updatedPackages);
    }

    createDailyPermitPackage(permitPackageDto: DailyPermitPackageDto) {
        return this.dailyPermitPackageService.createDailyPermitPackage(permitPackageDto).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(response => {
                if (response && response.responseData) {
                    const newPackage = response.responseData;
                    this.addDailyPermitPackageToList(newPackage);
                    this.setCurrentDailyPermitPackage(newPackage.id);
                }
            })
        );
    }
    
    deleteCurrentDailyPacksge() {
      this.dailyPermitPackageService.deleteDailyPermitPackage(this.selectedDailyPermitPackageSubject.value.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((response) => {
        this.removeDailyPermitPackageFromList(this.selectedDailyPermitPackageSubject.value.id);
        this.selectedDailyPermitPackageSubject.next(new DailyPermitPackageDto());
      })
    }
    
    setSelectedPackage(packageItem: DailyPermitPackageDto) {
      this.selectedDailyPermitPackageSubject.next(packageItem);
    }
    addNewAttachments(ids: number[], permitType: string) {
        const currentPackage = this.selectedDailyPermitPackageSubject.value;
        if (!currentPackage) {
            console.error('No package selected.');
            return;
        }

        switch (permitType) {
            case 'workRequests':
                currentPackage.workRequestIds = [...currentPackage.workRequests.map(r=>r.id), ...ids];
                break;
            case'safeWorks':
                currentPackage.safeWorkIds = [...currentPackage.safeWorks.map(r=>r.id), ...ids];
                break;
            case 'hotWorks':
                currentPackage.hotWorkIds = [...currentPackage.hotWorks.map(r=>r.id), ...ids];
                break;
            case 'confinedSpaces':
                currentPackage.confinedSpaceIds = [...currentPackage.confinedSpaces.map(r=>r.id), ...ids];
                break;
            case 'lotos':
                currentPackage.lotoIds = [...currentPackage.lotoIds, ...ids];
                break;
            default:
                console.error('Invalid permit type:', permitType);
                return;
        }
      this.dailyPermitPackageService.createDailyPermitPackage(currentPackage).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: response => {
          const updatedPackage = new DailyPermitPackageDto(response.responseData);
          this.updateDailyPermitPackageInList(updatedPackage);
          this.setSelectedPackage(updatedPackage); // Also update the selected package
        },
        error: err => {
          console.error('Failed to add work request to package:', err);
          // Here you could also update a state to show an error message in the UI
        }
      });
    }



    /*******************************************************************************************
     * Permit functions
     *******************************************************************************************/
    createAndAttachWorkRequestsToPackage(requests: WorkRequestDto[]) {
      const currentPackage = this.selectedDailyPermitPackageSubject.value;
      if (!currentPackage || !currentPackage.id) {
        console.error('No package selected or package has no ID.');
        return;
      }
      if (!requests || requests.length === 0) {
        console.error('No work requests provided to attach.');
        return;
      }

      return this.workRequestService.save(requests).pipe(
        switchMap(response => {
          const newWorkRequests = response.responseData;
          const newWorkRequestIds = newWorkRequests.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(currentPackage);
          updatedPackage.workRequestIds = [...updatedPackage.workRequests.map(w=>w.id), ...newWorkRequestIds];

          // Using createDailyPermitPackage to update the package
          return this.dailyPermitPackageService.createDailyPermitPackage(updatedPackage);
        }),
        tap(response => {
          if (response && response.responseData) {
            const updatedPackage = new DailyPermitPackageDto(response.responseData);
            this.updateDailyPermitPackageInList(updatedPackage);
            this.setSelectedPackage(updatedPackage);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        error: err => console.error('Failed to create and attach work requests:', err)
      });
    }

    createAndAttachSafeWorksToPackage(requests: SafeWorkDto[]) {
      const currentPackage = this.selectedDailyPermitPackageSubject.value;
      if (!currentPackage || !currentPackage.id) {
        console.error('No package selected or package has no ID.');
        return;
      }
      if (!requests || requests.length === 0) {
        console.error('No safe work permits provided to attach.');
        return;
      }
    
      return this.safeWorkService.save(requests).pipe(
        switchMap(response => {
          const newPermits = response.responseData;
          const newPermitIds = newPermits.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(currentPackage);
          updatedPackage.safeWorkIds = [...updatedPackage.safeWorkIds, ...newPermitIds];
    
          return this.dailyPermitPackageService.createDailyPermitPackage(updatedPackage);
        }),
        tap(response => {
          if (response && response.responseData) {
            const updatedPackage = new DailyPermitPackageDto(response.responseData);
            this.updateDailyPermitPackageInList(updatedPackage);
            this.setSelectedPackage(updatedPackage);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        error: err => console.error('Failed to create and attach work requests:', err)
      });
    }
    
    createAndAttachHotWorksToPackage(requests: HotWorkDto[]) {
      const currentPackage = this.selectedDailyPermitPackageSubject.value;
      if (!currentPackage || !currentPackage.id) {
        console.error('No package selected or package has no ID.');
        return;
      }
      if (!requests || requests.length === 0) {
        console.error('No hot work permits provided to attach.');
        return;
      }
    
      return this.hotWorkService.save(requests).pipe(
        switchMap(response => {
          const newPermits = response.responseData;
          const newPermitIds = newPermits.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(currentPackage);
          updatedPackage.hotWorkIds = [...updatedPackage.hotWorkIds, ...newPermitIds];
    
          return this.dailyPermitPackageService.createDailyPermitPackage(updatedPackage);
        }),
        tap(response => {
          if (response && response.responseData) {
            const updatedPackage = new DailyPermitPackageDto(response.responseData);
            this.updateDailyPermitPackageInList(updatedPackage);
            this.setSelectedPackage(updatedPackage);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        error: err => console.error('Failed to create and attach work requests:', err)
      });
    }
    
    createAndAttachConfinedSpacesToPackage(requests: ConfinedSpaceDto[]) {
      const currentPackage = this.selectedDailyPermitPackageSubject.value;
      if (!currentPackage || !currentPackage.id) {
        console.error('No package selected or package has no ID.');
        return;
      }
      if (!requests || requests.length === 0) {
        console.error('No confined space permits provided to attach.');
        return;
      }
    
      return this.confinedSpaceService.save(requests).pipe(
        switchMap(response => {
          const newPermits = response.responseData;
          const newPermitIds = newPermits.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(currentPackage);
          updatedPackage.confinedSpaceIds = [...updatedPackage.confinedSpaceIds, ...newPermitIds];
    
          return this.dailyPermitPackageService.createDailyPermitPackage(updatedPackage);
        }),
        tap(response => {
          if (response && response.responseData) {
            const updatedPackage = new DailyPermitPackageDto(response.responseData);
            this.updateDailyPermitPackageInList(updatedPackage);
            this.setSelectedPackage(updatedPackage);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        error: err => console.error('Failed to create and attach work requests:', err)
      });
    }


    generateSafeWorkFromCurrentRequest(){
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest ||!currentRequest.id) {
        console.error('No work request selected or request has no ID.');
        return;
      }
      console.log('Generating safe work permit from current work request:', SafeWorkDto.generatePermitFromRequest(currentRequest));
      // return this.safeWorkService.generateSafeWorkFromWorkRequest(currentRequest.id).pipe(
      //   tap(response => {
      //     if (response && response.responseData) {
      //       const newPermit = new SafeWorkDto(response.responseData);
      //       this.currentSafeWorkSubject.next(newPermit);
      //     }
      //   }),
      //   takeUntilDestroyed(this.destroyRef)
      // ).subscribe({
      //   error: err => console.error('Failed to generate safe work permit:', err)
      // });
    }

    generateHotWorkFromCurrentRequest(){
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest ||!currentRequest.id) {
        console.error('No work request selected or request has no ID.');
        return;
      }
      console.log('Generating hot work permit from current work request:', HotWorkDto.generatePermitFromRequest(currentRequest));
      // return this.hotWorkService.generateHotWorkFromWorkRequest(currentRequest.id).pipe(
      //   tap(response => {
      //     if (response && response.responseData) {
      //       const newPermit = new HotWorkDto(response.responseData);
      //       this.currentHotWorkSubject.next(newPermit);
      //     }
      //   }),
      //   takeuntilDestroyed(this.destroyRef)
      // ).subscribe({
      //   error: err => console.error('Failed to generate hot work permit:', err)
      // });
    }

    generateConfinedSpaceFromCurrentRequest(){
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest ||!currentRequest.id) {
        console.error('No work request selected or request has no ID.');
        return;
      }
      console.log('Generating confined space permit from current work request:', ConfinedSpaceDto.generatePermitFromRequest(currentRequest));
      // return this.confinedSpaceService.generateConfinedSpaceFromWorkRequest(currentRequest.id).pipe(
      //   tap(response => {
      //     if (response && response.responseData) {
      //       const newPermit = new ConfinedSpaceDto(response.responseData);
      //       this.currentConfinedSpaceSubject.next(newPermit);
      //     }
      //   }),
      //   takeuntilDestroyed(this.destroyRef)
      // ).subscribe({
      //   error: err => console.error('Failed to generate confined space permit:', err)
      // });
    }

    generateAllPermitsFromCurrentRequest(){
      this.generateSafeWorkFromCurrentRequest();
      this.generateHotWorkFromCurrentRequest();
      this.generateConfinedSpaceFromCurrentRequest();
    }


}