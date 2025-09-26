import { computed, DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, switchMap, tap, throwError } from "rxjs";
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
import { FormBinding } from "../../features/form-designer/printable-form/form-binder/form-binder.component";
import { LotoDto } from "../../models/loto/loto.model";
import { LotoService } from "../loto/loto.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentDailyPermitPackageService {
    private dailyPermitPackageService = inject(DailyPermitPackageService);
    private workRequestService = inject(WorkRequestService);
    private safeWorkService = inject(SafeWorkService);
    private hotWorkService = inject(HotWorkService);
    private confinedSpaceService = inject(ConfinedSpaceService);
    private lotoService = inject(LotoService);
    private destroyRef = inject(DestroyRef);

    private allActiveDailyPermitPackagesSubject = new BehaviorSubject<DailyPermitPackageDto[]>([]);
    allActiveDailyPermitPackages$ = this.allActiveDailyPermitPackagesSubject.asObservable();

    private selectedDailyPermitPackageSubject = new BehaviorSubject<DailyPermitPackageDto>(new DailyPermitPackageDto());
    selectedDailyPermitPackage$ = this.selectedDailyPermitPackageSubject.asObservable();

    currentDailyPacksge = toSignal(this.selectedDailyPermitPackage$, { initialValue: new DailyPermitPackageDto()  });
    allPackages = toSignal(this.allActiveDailyPermitPackages$, { initialValue: [] });

    requests = computed<WorkRequestDto[]>(() => this.currentDailyPacksge().workRequests);
    requestCount = computed(() => this.requests().length);
    currentWorkRequest = signal<WorkRequestDto | null>(null);

    safeWorks = computed<SafeWorkDto[]>(() => this.currentDailyPacksge().safeWorks);
    safeWorkCount = computed(() => this.safeWorks().length);
    emptySafeWorksExists = computed(() => this.safeWorks().some(sw => !sw.location && !sw.companyPerson && !sw.requestedBy &&!sw.workScope));
    currentSafeWork = signal<SafeWorkDto | null>(null);

    hotWorks = computed<HotWorkDto[]>(() => {console.log('updating hotworks'); return this.currentDailyPacksge().hotWorks});
    hotWorkCount = computed(() => this.hotWorks().length);
    emptyHotWorksExists = computed(() => this.hotWorks().some(hw =>!hw.location &&!hw.workScope &&!hw.foreman &&!hw.fireWatch));
    currentHotWork = signal<HotWorkDto | null>(null);

    confinedSpaces = computed<ConfinedSpaceDto[]>(() => this.currentDailyPacksge().confinedSpaces);
    confinedSpaceCount = computed(() => this.confinedSpaces().length);
    emptyConfinedSpacesExists = computed(() => this.confinedSpaces().some(cs =>!cs.space &&!cs.workScope &&!cs.issuedTo));
    currentConfinedSpace = signal<ConfinedSpaceDto | null>(null);

    lotos = computed<LotoDto[]>(() => this.currentDailyPacksge().lotos);
    lotoCount = computed(() => this.lotos().length);
    currentLoto = signal<LotoDto>(this.lotos()[0]);


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

  build(){
    this.dailyPermitPackageService.buildPermitsById(this.currentDailyPacksge().id+'').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (permits) => {
        console.log('Permits built successfully', permits.responseData);
      },
      error: (err) => {
        console.error('Error building permits', err);
      }
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
                currentPackage.lotoIds = [...currentPackage.lotos.map(l=>l.id), ...ids];
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
          updatedPackage.safeWorkIds = [...updatedPackage.safeWorks.map(sw=>sw.id), ...newPermitIds];
    
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
          updatedPackage.hotWorkIds = [...updatedPackage.hotWorks.map(hw=>hw.id), ...newPermitIds];
    
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
          updatedPackage.confinedSpaceIds = [...updatedPackage.confinedSpaces.map(c=>c.id), ...newPermitIds];
    
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

    createAndAttachLotosToPackage(lotos: LotoDto[]) {
      const currentPackage = this.selectedDailyPermitPackageSubject.value;
      if (!currentPackage ||!currentPackage.id) {
        console.error('No package selected or package has no ID.');
        return;
      }
      if (!lotos || lotos.length === 0) {
        console.error('No LOTO permits provided to attach.');
        return;
      }

      return this.lotoService.save(lotos).pipe(
        switchMap(response => {
          const newPermits = response.responseData;
          const newPermitIds = newPermits.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(currentPackage);
          updatedPackage.lotoIds = [...updatedPackage.lotos.map(l=>l.id),...newPermitIds];
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
        error: err => console.error('Failed to create and attach LOTO permits:', err)
      });
    }




    generateSafeWorkFromCurrentRequest(){
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest ||!currentRequest.id) {
        console.error('No work request selected or request has no ID.');
        return;
      }
      const newPermit = SafeWorkDto.generatePermitFromRequest(currentRequest);
      this.createAndAttachSafeWorksToPackage([newPermit]);
    }

    generateHotWorkFromCurrentRequest(){
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest ||!currentRequest.id) {
        console.error('No work request selected or request has no ID.');
        return;
      }
      const newPermit = HotWorkDto.generatePermitFromRequest(currentRequest);
      this.createAndAttachHotWorksToPackage([newPermit]);
    }

    generateConfinedSpaceFromCurrentRequest(){
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest ||!currentRequest.id) {
        console.error('No work request selected or request has no ID.');
        return;
      }
      const newPermit = ConfinedSpaceDto.generatePermitFromRequest(currentRequest);
      this.createAndAttachConfinedSpacesToPackage([newPermit]);
    }

    generateAllPermitsFromCurrentRequest(){
      this.generateSafeWorkFromCurrentRequest();
      this.generateHotWorkFromCurrentRequest();
      this.generateConfinedSpaceFromCurrentRequest();
    }

    


    
  submitSafeWork($event: SafeWorkDto) {
    console.log('Submitting safe work permit:', $event);
    this.safeWorkService.save([$event]).pipe(
      tap(response => {
        if (!response?.responseData?.[0]) {
          console.error('Invalid response from save safe work');
          return; // Stop execution if the response is invalid
        }

        const savedPermit = new SafeWorkDto(response.responseData[0]);
        const currentPackage = this.selectedDailyPermitPackageSubject.value;

        if (!currentPackage) {
          console.error('No daily permit package selected, cannot update local state.');
          return;
        }

        // Create a new package instance for immutability
        const updatedPackage = new DailyPermitPackageDto(currentPackage);
        
        const permitIndex = updatedPackage.safeWorks.findIndex(sw => sw.id === savedPermit.id);

        if (permitIndex > -1) {
          // Update existing permit in the array
          updatedPackage.safeWorks[permitIndex] = savedPermit;
          // Ensure the array reference changes for change detection
          updatedPackage.safeWorks = [...updatedPackage.safeWorks];
        } else {
          // Add new permit if it's not in the array
          updatedPackage.safeWorks = [...updatedPackage.safeWorks, savedPermit];
        }
        
        // Sync the IDs array with the updated safeWorks array
        updatedPackage.safeWorkIds = updatedPackage.safeWorks.map(sw => sw.id);

        // Emit the updated package to notify all subscribers
        this.selectedDailyPermitPackageSubject.next(updatedPackage);
        this.updateDailyPermitPackageInList(updatedPackage);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => console.log('Safe work permit saved and local package state updated.'),
      error: err => console.error('Failed to save safe work permit:', err)
    });
  }

  submitHotWork($event: HotWorkDto) {
    console.log('Submitting hot work permit:', $event);
    this.hotWorkService.save([$event]).pipe(
      tap(response => {
        if (!response?.responseData?.[0]) {
          console.error('Invalid response from save hot work');
          return;
        }

        const savedPermit = new HotWorkDto(response.responseData[0]);
        const currentPackage = this.selectedDailyPermitPackageSubject.value;

        if (!currentPackage) {
          console.error('No daily permit package selected, cannot update local state.');
          return;
        }

        const updatedPackage = new DailyPermitPackageDto(currentPackage);
        const permitIndex = updatedPackage.hotWorks.findIndex(hw => hw.id === savedPermit.id);

        if (permitIndex > -1) {
          updatedPackage.hotWorks[permitIndex] = savedPermit;
          updatedPackage.hotWorks = [...updatedPackage.hotWorks];
        } else {
          updatedPackage.hotWorks = [...updatedPackage.hotWorks, savedPermit];
        }

        updatedPackage.hotWorkIds = updatedPackage.hotWorks.map(hw => hw.id);

        this.selectedDailyPermitPackageSubject.next(updatedPackage);
        this.updateDailyPermitPackageInList(updatedPackage);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => console.log('Hot work permit saved and local package state updated.'),
      error: err => console.error('Failed to save hot work permit:', err)
    });
  }

  submitConfinedSpace($event: ConfinedSpaceDto) {
    console.log('Submitting confined space permit:', $event);
    this.confinedSpaceService.save([$event]).pipe(
      tap(response => {
        if (!response?.responseData?.[0]) {
          console.error('Invalid response from save confined space');
          return;
        }

        const savedPermit = new ConfinedSpaceDto(response.responseData[0]);
        const currentPackage = this.selectedDailyPermitPackageSubject.value;

        if (!currentPackage) {
          console.error('No daily permit package selected, cannot update local state.');
          return;
        }

        const updatedPackage = new DailyPermitPackageDto(currentPackage);
        const permitIndex = updatedPackage.confinedSpaces.findIndex(cs => cs.id === savedPermit.id);

        if (permitIndex > -1) {
          updatedPackage.confinedSpaces[permitIndex] = savedPermit;
          updatedPackage.confinedSpaces = [...updatedPackage.confinedSpaces];
        } else {
          updatedPackage.confinedSpaces = [...updatedPackage.confinedSpaces, savedPermit];
        }

        updatedPackage.confinedSpaceIds = updatedPackage.confinedSpaces.map(cs => cs.id);

        this.selectedDailyPermitPackageSubject.next(updatedPackage);
        this.updateDailyPermitPackageInList(updatedPackage);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => console.log('Confined space permit saved and local package state updated.'),
      error: err => console.error('Failed to save confined space permit:', err)
    });
  }





  /***************************************************************************************************************************************
   * Paper Form Functions
   ****************************************************************************************************************************************/



}