import { DestroyRef, inject, Injectable } from "@angular/core";
import { BehaviorSubject, switchMap, tap } from "rxjs";
import { DailyPermitPackageDto } from "../../models/permits/dailt-permit-package.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { DailyPermitPackageService } from "../permits/daily-permit-package.service";
import { WorkRequestDto } from "../../models/permits/work-request.model";
import { WorkRequestService } from "../permits/work-request.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentDailyPermitPackageService {
    private dailyPermitPackageService = inject(DailyPermitPackageService);
    private workRequestService = inject(WorkRequestService);
    private destroyRef = inject(DestroyRef);

    private allActiveDailyPermitPackagesSubject = new BehaviorSubject<DailyPermitPackageDto[]>([]);
    allActiveDailyPermitPackages$ = this.allActiveDailyPermitPackagesSubject.asObservable();

    private selectedDailyPermitPackageSubject = new BehaviorSubject<DailyPermitPackageDto>(new DailyPermitPackageDto());
    selectedDailyPermitPackage$ = this.selectedDailyPermitPackageSubject.asObservable();

    currentDailyPacksge = toSignal(this.selectedDailyPermitPackage$, { initialValue: new DailyPermitPackageDto()  });
    allPackages = toSignal(this.allActiveDailyPermitPackages$, { initialValue: [] });

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

    setCurrentDailyPermitPackage(id: number) {
        this.dailyPermitPackageService.getDailyPermitPackageById(id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedDailyPermitPackageSubject.next(response.responseData);
        });
    }

    updateDailyPermitPackageInList(permitPackage: DailyPermitPackageDto) {
        const currentPackages = this.allActiveDailyPermitPackagesSubject.value;
        const updatedPackages = currentPackages.map(pkg => pkg.id === permitPackage.id ? permitPackage : pkg);
        this.allActiveDailyPermitPackagesSubject.next(updatedPackages);
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
                currentPackage.workRequestIds = [...currentPackage.workRequestIds, ...ids];
                break;
            case'safeWorks':
                currentPackage.safeWorkIds = [...currentPackage.safeWorkIds, ...ids];
                break;
            case 'hotWorks':
                currentPackage.hotWorkIds = [...currentPackage.hotWorkIds, ...ids];
                break;
            case 'confinedSpaces':
                currentPackage.confinedSpaceIds = [...currentPackage.confinedSpaceIds, ...ids];
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
          updatedPackage.workRequestIds = [...updatedPackage.workRequestIds, ...newWorkRequestIds];

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
      );
    }
}