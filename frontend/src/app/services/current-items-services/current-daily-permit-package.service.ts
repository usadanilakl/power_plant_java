import { DestroyRef, inject, Injectable } from "@angular/core";
import { BehaviorSubject, tap } from "rxjs";
import { DailyPermitPackageDto } from "../../models/permits/dailt-permit-package.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DailyPermitPackageService } from "../permits/daily-permit-package.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentDailyPermitPackageService {
    private dailyPermitPackageService = inject(DailyPermitPackageService);
    private destroyRef = inject(DestroyRef);

    private allActiveDailyPermitPackagesSubject = new BehaviorSubject<DailyPermitPackageDto[]>([]);
    allActiveDailyPermitPackages$ = this.allActiveDailyPermitPackagesSubject.asObservable();

    private selectedDailyPermitPackageSubject = new BehaviorSubject<DailyPermitPackageDto | null>(null);
    selectedDailyPermitPackage$ = this.selectedDailyPermitPackageSubject.asObservable();

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
}