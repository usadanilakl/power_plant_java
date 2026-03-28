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
import { EnergizedWorkPermitDto } from "../../models/permits/energized-work-permit.model";
import { ExcavationPermitDto } from "../../models/permits/excavation-permit.model";
import { VentingPermitDto } from "../../models/permits/venting-permit.model";
import { EnergizedWorkPermitService } from "../permits/energized-work-permit.service";
import { ExcavationPermitService } from "../permits/excavation-permit.service";
import { VentingPermitService } from "../permits/venting-permit.service";

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
    private energizedWorkPermitService = inject(EnergizedWorkPermitService);
    private excavationPermitService = inject(ExcavationPermitService);
    private ventingPermitService = inject(VentingPermitService);
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

    hotWorks = computed<HotWorkDto[]>(() => {return this.currentDailyPacksge().hotWorks});
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

    energizedWorkPermits = computed<EnergizedWorkPermitDto[]>(() => this.currentDailyPacksge().energizedWorkPermits);
    energizedWorkPermitCount = computed(() => this.energizedWorkPermits().length);
    currentEnergizedWorkPermit = signal<EnergizedWorkPermitDto | null>(null);

    excavationPermits = computed<ExcavationPermitDto[]>(() => this.currentDailyPacksge().excavationPermits);
    excavationPermitCount = computed(() => this.excavationPermits().length);
    currentExcavationPermit = signal<ExcavationPermitDto | null>(null);

    ventingPermits = computed<VentingPermitDto[]>(() => this.currentDailyPacksge().ventingPermits);
    ventingPermitCount = computed(() => this.ventingPermits().length);
    currentVentingPermit = signal<VentingPermitDto | null>(null);

    // Status lifecycle
    packageStatus = computed(() => this.currentDailyPacksge().packageStatus?.name ?? 'Building');
    isEditable = computed(() => ['Building', 'Test'].includes(this.packageStatus()));
    isReadOnly = computed(() => !this.isEditable());

    constructor() {
        this.loadDailyPermitPackages();
    }

    reloadDailyPermitPackages() {
        this.loadDailyPermitPackages();
    }

    private normalizePackage(packageItem: Partial<DailyPermitPackageDto> | null | undefined): DailyPermitPackageDto {
        if (!packageItem) {
            return new DailyPermitPackageDto();
        }
        return packageItem instanceof DailyPermitPackageDto
            ? packageItem
            : DailyPermitPackageDto.fromJson(packageItem);
    }

    private normalizePackages(packages: Partial<DailyPermitPackageDto>[] | null | undefined): DailyPermitPackageDto[] {
        return (packages ?? []).map(packageItem => this.normalizePackage(packageItem));
    }

    private mergeWithCurrentVersion(packageItem: Partial<DailyPermitPackageDto> | null | undefined): DailyPermitPackageDto {
        const normalized = this.normalizePackage(packageItem);
        const selected = this.selectedDailyPermitPackageSubject.value;

        if (
            normalized.id &&
            selected?.id === normalized.id &&
            (selected.version ?? -1) > (normalized.version ?? -1)
        ) {
            const mergedData = {
                ...(normalized as DailyPermitPackageDto & { version?: number | null }),
                version: selected.version,
            };
            return new DailyPermitPackageDto(mergedData as any);
        }

        return normalized;
    }

    private loadDailyPermitPackages() {
        this.dailyPermitPackageService.getDailyPermitPackages().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveDailyPermitPackagesSubject.next(
                this.normalizePackages(response.responseData)
            );
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
              this.setSelectedPackage(response.responseData);
          });
        }
    }
    
    updateCurrentDailyPacksge(current: DailyPermitPackageDto) {
      this.dailyPermitPackageService.createDailyPermitPackage(current).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(
        (response) => {
          this.setSelectedPackage(response.responseData);
        },
        (error) => {
          console.error('Error updating daily permit package:', error);
        }
      );
    }

    updateDailyPermitPackageInList(permitPackage: Partial<DailyPermitPackageDto>) {
        const normalizedPackage = this.mergeWithCurrentVersion(permitPackage);
        const currentPackages = this.allActiveDailyPermitPackagesSubject.value;
        const itemIndex = currentPackages.findIndex(pkg => pkg.id === normalizedPackage.id);

        if (itemIndex !== -1) {
            // Item exists, update it
            const updatedPackages = [...currentPackages];
            updatedPackages[itemIndex] = normalizedPackage;
            this.allActiveDailyPermitPackagesSubject.next(updatedPackages);
        } else {
            // Item is new, add it
            this.allActiveDailyPermitPackagesSubject.next([normalizedPackage, ...currentPackages]);
        }
    }

    addDailyPermitPackageToList(permitPackage: Partial<DailyPermitPackageDto>) {
        const normalizedPackage = this.mergeWithCurrentVersion(permitPackage);
        const currentPackages = this.allActiveDailyPermitPackagesSubject.value;
        this.allActiveDailyPermitPackagesSubject.next([...currentPackages, normalizedPackage]);
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
                    const newPackage = this.normalizePackage(response.responseData);
                    this.addDailyPermitPackageToList(newPackage);
                    this.setSelectedPackage(newPackage);
                }
            })
        );
    }

    createAndAddDailyPackage(permitPackageDto: DailyPermitPackageDto) {
      this.createDailyPermitPackage(permitPackageDto).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe();
    }
    
    deleteCurrentDailyPacksge() {
      this.dailyPermitPackageService.deleteDailyPermitPackage(this.selectedDailyPermitPackageSubject.value.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((response) => {
        this.removeDailyPermitPackageFromList(this.selectedDailyPermitPackageSubject.value.id);
        this.selectedDailyPermitPackageSubject.next(new DailyPermitPackageDto());
      })
    }

  build(whatToBuild: string = 'all', id: number = 0) {
    this.dailyPermitPackageService.buildPermitsById(this.currentDailyPacksge().id+'',whatToBuild, id).pipe(
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
    
    setSelectedPackage(packageItem: Partial<DailyPermitPackageDto> | null | undefined) {
      const normalizedPackage = this.mergeWithCurrentVersion(packageItem);
      this.selectedDailyPermitPackageSubject.next(normalizedPackage);
      if (normalizedPackage?.id) {
        this.updateDailyPermitPackageInList(normalizedPackage);
      }
    }
    setCurrentDailyPackage(id: number) {
      this.dailyPermitPackageService.getDailyPermitPackageById(id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(response => {
        if (response?.responseData) {
          const pkg = DailyPermitPackageDto.fromJson(response.responseData);
          this.setSelectedPackage(pkg);
        }
      });
    }
    // --- Status Lifecycle ---

    activatePackage() {
      const pkg = this.selectedDailyPermitPackageSubject.value;
      if (!pkg?.id) return;
      this.dailyPermitPackageService.activatePackage(pkg.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: response => {
          if (response?.responseData) {
            const updated = DailyPermitPackageDto.fromJson(response.responseData);
            this.setSelectedPackage(updated);
            this.updatePackageInList(updated);
          }
        },
        error: err => console.error('Error activating package:', err)
      });
    }

    putPackageUnderTest() {
      const pkg = this.selectedDailyPermitPackageSubject.value;
      if (!pkg?.id) return;
      this.dailyPermitPackageService.putPackageUnderTest(pkg.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: response => {
          if (response?.responseData) {
            const updated = DailyPermitPackageDto.fromJson(response.responseData);
            this.setSelectedPackage(updated);
            this.updatePackageInList(updated);
          }
        },
        error: err => console.error('Error putting package under test:', err)
      });
    }

    closePackage(closureData?: Record<string, any>) {
      const pkg = this.selectedDailyPermitPackageSubject.value;
      if (!pkg?.id) return;
      this.dailyPermitPackageService.closePackage(pkg.id, closureData).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: response => {
          if (response?.responseData) {
            const updated = DailyPermitPackageDto.fromJson(response.responseData);
            this.setSelectedPackage(updated);
            this.updatePackageInList(updated);
          }
        },
        error: err => console.error('Error closing package:', err)
      });
    }

    applyDateTimeToAllPermits(date: string, time: string) {
      const pkg = this.selectedDailyPermitPackageSubject.value;
      if (!pkg?.id) return;

      this.dailyPermitPackageService.applyDateTimeToPackagePermits(pkg.id, date, time).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: response => {
          if (response?.responseData) {
            const updated = DailyPermitPackageDto.fromJson(response.responseData);
            this.setSelectedPackage(updated);
            this.updatePackageInList(updated);
          }
        },
        error: err => console.error('Error applying package date/time:', err)
      });
    }

    private updatePackageInList(pkg: DailyPermitPackageDto) {
      const current = this.allActiveDailyPermitPackagesSubject.value;
      const exists = current.some(p => p.id === pkg.id);
      const updated = exists
        ? current.map(p => p.id === pkg.id ? pkg : p)
        : [pkg, ...current];
      this.allActiveDailyPermitPackagesSubject.next(updated);
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
            case 'energizedWorkPermits':
                currentPackage.energizedWorkPermitIds = [...currentPackage.energizedWorkPermits.map(p=>p.id), ...ids];
                break;
            case 'excavationPermits':
                currentPackage.excavationPermitIds = [...currentPackage.excavationPermits.map(p=>p.id), ...ids];
                break;
            case 'ventingPermits':
                currentPackage.ventingPermitIds = [...currentPackage.ventingPermits.map(p=>p.id), ...ids];
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

    removeAttachment(id: number, permitType: string) {
        const currentPackage = this.selectedDailyPermitPackageSubject.value;
        if (!currentPackage) {
            console.error('No package selected.');
            return;
        }

        switch (permitType) {
            case 'workRequests':
                currentPackage.workRequests = currentPackage.workRequests.filter(r => r.id !== id);
                currentPackage.workRequestIds = currentPackage.workRequestIds.filter(i => i !== id);
                break;
            case 'safeWorks':
                currentPackage.safeWorks = currentPackage.safeWorks.filter(r => r.id !== id);
                currentPackage.safeWorkIds = currentPackage.safeWorkIds.filter(i => i !== id);
                break;
            case 'hotWorks':
                currentPackage.hotWorks = currentPackage.hotWorks.filter(r => r.id !== id);
                currentPackage.hotWorkIds = currentPackage.hotWorkIds.filter(i => i !== id);
                break;
            case 'confinedSpaces':
                currentPackage.confinedSpaces = currentPackage.confinedSpaces.filter(r => r.id !== id);
                currentPackage.confinedSpaceIds = currentPackage.confinedSpaceIds.filter(i => i !== id);
                break;
            case 'lotos':
                currentPackage.lotos = currentPackage.lotos.filter(l => l.id !== id);
                currentPackage.lotoIds = currentPackage.lotoIds.filter(i => i !== id);
                break;
            case 'energizedWorkPermits':
                currentPackage.energizedWorkPermits = currentPackage.energizedWorkPermits.filter(p => p.id !== id);
                currentPackage.energizedWorkPermitIds = currentPackage.energizedWorkPermitIds.filter(i => i !== id);
                break;
            case 'excavationPermits':
                currentPackage.excavationPermits = currentPackage.excavationPermits.filter(p => p.id !== id);
                currentPackage.excavationPermitIds = currentPackage.excavationPermitIds.filter(i => i !== id);
                break;
            case 'ventingPermits':
                currentPackage.ventingPermits = currentPackage.ventingPermits.filter(p => p.id !== id);
                currentPackage.ventingPermitIds = currentPackage.ventingPermitIds.filter(i => i !== id);
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
                this.setSelectedPackage(updatedPackage);
            },
            error: err => {
                console.error('Failed to remove attachment from package:', err);
            }
        });
    }

    removePermitFromPackage(id: number, permitType: string) {
        const currentPackage = this.selectedDailyPermitPackageSubject.value;
        if (!currentPackage?.id) {
            console.error('No package selected.');
            return;
        }

        if (typeof id !== 'number' || Number.isNaN(id)) {
            console.warn(`Permit id is not available yet for ${permitType}; removing local unsaved item instead.`);
            return;
        }

        this.dailyPermitPackageService.removePermitFromPackage(currentPackage.id, permitType, id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: response => {
                const updatedPackage = new DailyPermitPackageDto(response.responseData);
                this.updateDailyPermitPackageInList(updatedPackage);
                this.setSelectedPackage(updatedPackage);
            },
            error: err => {
                console.error('Failed to delete permit from package:', err);
            }
        });
    }

    removePermitFromPackageItem(item: any, permitType: string) {
        const id = item?.id;
        if (typeof id === 'number' && !Number.isNaN(id)) {
            this.removePermitFromPackage(id, permitType);
            return;
        }

        const currentPackage = this.selectedDailyPermitPackageSubject.value;
        if (!currentPackage) {
            console.error('No package selected.');
            return;
        }

        const updatedPackage = new DailyPermitPackageDto(currentPackage);

        switch (permitType) {
            case 'workRequests':
                updatedPackage.workRequests = updatedPackage.workRequests.filter(entry => entry !== item);
                updatedPackage.workRequestIds = updatedPackage.workRequests.map(entry => entry.id).filter((entryId): entryId is number => typeof entryId === 'number');
                break;
            case 'safeWorks':
                updatedPackage.safeWorks = updatedPackage.safeWorks.filter(entry => entry !== item);
                updatedPackage.safeWorkIds = updatedPackage.safeWorks.map(entry => entry.id).filter((entryId): entryId is number => typeof entryId === 'number');
                break;
            case 'hotWorks':
                updatedPackage.hotWorks = updatedPackage.hotWorks.filter(entry => entry !== item);
                updatedPackage.hotWorkIds = updatedPackage.hotWorks.map(entry => entry.id).filter((entryId): entryId is number => typeof entryId === 'number');
                break;
            case 'confinedSpaces':
                updatedPackage.confinedSpaces = updatedPackage.confinedSpaces.filter(entry => entry !== item);
                updatedPackage.confinedSpaceIds = updatedPackage.confinedSpaces.map(entry => entry.id).filter((entryId): entryId is number => typeof entryId === 'number');
                break;
            case 'lotos':
                updatedPackage.lotos = updatedPackage.lotos.filter(entry => entry !== item);
                updatedPackage.lotoIds = updatedPackage.lotos.map(entry => entry.id).filter((entryId): entryId is number => typeof entryId === 'number');
                break;
            case 'energizedWorkPermits':
                updatedPackage.energizedWorkPermits = updatedPackage.energizedWorkPermits.filter(entry => entry !== item);
                updatedPackage.energizedWorkPermitIds = updatedPackage.energizedWorkPermits.map(entry => entry.id).filter((entryId): entryId is number => typeof entryId === 'number');
                break;
            case 'excavationPermits':
                updatedPackage.excavationPermits = updatedPackage.excavationPermits.filter(entry => entry !== item);
                updatedPackage.excavationPermitIds = updatedPackage.excavationPermits.map(entry => entry.id).filter((entryId): entryId is number => typeof entryId === 'number');
                break;
            case 'ventingPermits':
                updatedPackage.ventingPermits = updatedPackage.ventingPermits.filter(entry => entry !== item);
                updatedPackage.ventingPermitIds = updatedPackage.ventingPermits.map(entry => entry.id).filter((entryId): entryId is number => typeof entryId === 'number');
                break;
            default:
                console.error('Invalid permit type:', permitType);
                return;
        }

        this.updateDailyPermitPackageInList(updatedPackage);
        this.setSelectedPackage(updatedPackage);
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
          const latestPackage = this.selectedDailyPermitPackageSubject.value!;
          const newWorkRequests = response.responseData;
          const newWorkRequestIds = newWorkRequests.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(latestPackage);
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
          const latestPackage = this.selectedDailyPermitPackageSubject.value!;
          const newPermits = response.responseData;
          const newPermitIds = newPermits.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(latestPackage);
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
          const latestPackage = this.selectedDailyPermitPackageSubject.value!;
          const newPermits = response.responseData;
          const newPermitIds = newPermits.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(latestPackage);
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
          const latestPackage = this.selectedDailyPermitPackageSubject.value!;
          const newPermits = response.responseData;
          const newPermitIds = newPermits.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(latestPackage);
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
          const latestPackage = this.selectedDailyPermitPackageSubject.value!;
          const newPermits = response.responseData;
          const newPermitIds = newPermits.map(req => req.id);
          const updatedPackage = new DailyPermitPackageDto(latestPackage);
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

    generateEnergizedWorkPermitFromCurrentRequest() {
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest || !currentRequest.id) return;
      const newPermit = EnergizedWorkPermitDto.generatePermitFromRequest(currentRequest);
      this.createAndAttachEnergizedWorkPermitsToPackage([newPermit]);
    }

    generateExcavationPermitFromCurrentRequest() {
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest || !currentRequest.id) return;
      const newPermit = ExcavationPermitDto.generatePermitFromRequest(currentRequest);
      this.createAndAttachExcavationPermitsToPackage([newPermit]);
    }

    generateVentingPermitFromCurrentRequest() {
      const currentRequest = this.currentWorkRequest();
      if (!currentRequest || !currentRequest.id) return;
      const newPermit = VentingPermitDto.generatePermitFromRequest(currentRequest);
      this.createAndAttachVentingPermitsToPackage([newPermit]);
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


  
  reissuePermits(pckg: DailyPermitPackageDto) {
    const packageIdToReissue = pckg.id;
    const targetPackageId = this.selectedDailyPermitPackageSubject.value?.id;
    if(!packageIdToReissue || !targetPackageId) throw new Error('No package ID provided to reissue permits');
    this.dailyPermitPackageService.reissuePermits(packageIdToReissue, targetPackageId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if(!response?.responseData) throw new Error('No response data from reissuing permits');

        // Update the current package with the response from server
        const updatedPackage = new DailyPermitPackageDto(response.responseData);
        this.selectedDailyPermitPackageSubject.next(updatedPackage);
        this.updateDailyPermitPackageInList(updatedPackage);
      }),
    ).subscribe({
      next: () => console.log('Permits reissued successfully.'),
      error: err => console.error('Error reissuing permits:', err)
    });
  }

  reissuePermitsWithDate(pckg: DailyPermitPackageDto, date: string, time: string) {
    const packageIdToReissue = pckg.id;
    const targetPackageId = this.selectedDailyPermitPackageSubject.value?.id;
    if(!packageIdToReissue || !targetPackageId) throw new Error('No package ID provided to reissue permits');
    this.dailyPermitPackageService.reissuePermitsWithDate(packageIdToReissue, targetPackageId, date, time).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if(!response?.responseData) throw new Error('No response data from reissuing permits');
        const updatedPackage = new DailyPermitPackageDto(response.responseData);
        this.selectedDailyPermitPackageSubject.next(updatedPackage);
        this.updateDailyPermitPackageInList(updatedPackage);
      }),
    ).subscribe({
      next: () => console.log('Permits reissued with date successfully.'),
      error: err => console.error('Error reissuing permits with date:', err)
    });
  }

  reissueCurrentPackageWithDate(date: string, time: string) {
    const sourcePackageId = this.selectedDailyPermitPackageSubject.value?.id;
    if (!sourcePackageId) {
      throw new Error('No current package selected to reissue');
    }

    this.dailyPermitPackageService.reissueCurrentPackage(sourcePackageId, date, time).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if (!response?.responseData) {
          throw new Error('No response data from reissuing current package');
        }

        const newPackage = new DailyPermitPackageDto(response.responseData);
        this.selectedDailyPermitPackageSubject.next(newPackage);
        this.updateDailyPermitPackageInList(newPackage);
      }),
    ).subscribe({
      next: () => console.log('Current package reissued successfully.'),
      error: err => console.error('Error reissuing current package:', err),
    });
  }

  reIssuePermitsByWorkRequestId(workRequestId: number) {
    this.dailyPermitPackageService.reissuePermitsByWorkRequestId(workRequestId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if(!response?.responseData) throw new Error('No response data from reissuing permits');

        // Update the current package with the response from server
        const updatedPackage = new DailyPermitPackageDto(response.responseData);
        this.selectedDailyPermitPackageSubject.next(updatedPackage);
        this.updateDailyPermitPackageInList(updatedPackage);
      }),
    ).subscribe({
      next: () => console.log('Permits reissued successfully by work request ID.'),
      error: err => console.error('Error reissuing permits by work request ID:', err)
    });
  }





    createAndAttachEnergizedWorkPermitsToPackage(permits: EnergizedWorkPermitDto[]) {
      const currentPackage = this.selectedDailyPermitPackageSubject.value;
      if (!currentPackage || !currentPackage.id || !permits?.length) return;
      return this.energizedWorkPermitService.save(permits).pipe(
        switchMap(response => {
          const latestPackage = this.selectedDailyPermitPackageSubject.value!;
          const newIds = response.responseData.map(p => p.id);
          const updatedPackage = new DailyPermitPackageDto(latestPackage);
          updatedPackage.energizedWorkPermitIds = [...updatedPackage.energizedWorkPermits.map(p => p.id), ...newIds];
          return this.dailyPermitPackageService.createDailyPermitPackage(updatedPackage);
        }),
        tap(response => {
          if (response?.responseData) {
            const updatedPackage = new DailyPermitPackageDto(response.responseData);
            this.updateDailyPermitPackageInList(updatedPackage);
            this.setSelectedPackage(updatedPackage);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({ error: err => console.error('Failed to attach energized work permits:', err) });
    }

    createAndAttachExcavationPermitsToPackage(permits: ExcavationPermitDto[]) {
      const currentPackage = this.selectedDailyPermitPackageSubject.value;
      if (!currentPackage || !currentPackage.id || !permits?.length) return;
      return this.excavationPermitService.save(permits).pipe(
        switchMap(response => {
          const latestPackage = this.selectedDailyPermitPackageSubject.value!;
          const newIds = response.responseData.map(p => p.id);
          const updatedPackage = new DailyPermitPackageDto(latestPackage);
          updatedPackage.excavationPermitIds = [...updatedPackage.excavationPermits.map(p => p.id), ...newIds];
          return this.dailyPermitPackageService.createDailyPermitPackage(updatedPackage);
        }),
        tap(response => {
          if (response?.responseData) {
            const updatedPackage = new DailyPermitPackageDto(response.responseData);
            this.updateDailyPermitPackageInList(updatedPackage);
            this.setSelectedPackage(updatedPackage);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({ error: err => console.error('Failed to attach excavation permits:', err) });
    }

    createAndAttachVentingPermitsToPackage(permits: VentingPermitDto[]) {
      const currentPackage = this.selectedDailyPermitPackageSubject.value;
      if (!currentPackage || !currentPackage.id || !permits?.length) return;
      return this.ventingPermitService.save(permits).pipe(
        switchMap(response => {
          const latestPackage = this.selectedDailyPermitPackageSubject.value!;
          const newIds = response.responseData.map(p => p.id);
          const updatedPackage = new DailyPermitPackageDto(latestPackage);
          updatedPackage.ventingPermitIds = [...updatedPackage.ventingPermits.map(p => p.id), ...newIds];
          return this.dailyPermitPackageService.createDailyPermitPackage(updatedPackage);
        }),
        tap(response => {
          if (response?.responseData) {
            const updatedPackage = new DailyPermitPackageDto(response.responseData);
            this.updateDailyPermitPackageInList(updatedPackage);
            this.setSelectedPackage(updatedPackage);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({ error: err => console.error('Failed to attach venting permits:', err) });
    }

    submitEnergizedWorkPermit(permit: EnergizedWorkPermitDto) {
      this.energizedWorkPermitService.save([permit]).pipe(
        tap(response => {
          if (!response?.responseData?.[0]) return;
          const saved = new EnergizedWorkPermitDto(response.responseData[0]);
          const currentPackage = this.selectedDailyPermitPackageSubject.value;
          if (!currentPackage) return;
          const updatedPackage = new DailyPermitPackageDto(currentPackage);
          const idx = updatedPackage.energizedWorkPermits.findIndex(p => p.id === saved.id);
          if (idx > -1) {
            updatedPackage.energizedWorkPermits[idx] = saved;
            updatedPackage.energizedWorkPermits = [...updatedPackage.energizedWorkPermits];
          } else {
            updatedPackage.energizedWorkPermits = [...updatedPackage.energizedWorkPermits, saved];
          }
          updatedPackage.energizedWorkPermitIds = updatedPackage.energizedWorkPermits.map(p => p.id);
          this.selectedDailyPermitPackageSubject.next(updatedPackage);
          this.updateDailyPermitPackageInList(updatedPackage);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({ error: err => console.error('Failed to save energized work permit:', err) });
    }

    submitExcavationPermit(permit: ExcavationPermitDto) {
      this.excavationPermitService.save([permit]).pipe(
        tap(response => {
          if (!response?.responseData?.[0]) return;
          const saved = new ExcavationPermitDto(response.responseData[0]);
          const currentPackage = this.selectedDailyPermitPackageSubject.value;
          if (!currentPackage) return;
          const updatedPackage = new DailyPermitPackageDto(currentPackage);
          const idx = updatedPackage.excavationPermits.findIndex(p => p.id === saved.id);
          if (idx > -1) {
            updatedPackage.excavationPermits[idx] = saved;
            updatedPackage.excavationPermits = [...updatedPackage.excavationPermits];
          } else {
            updatedPackage.excavationPermits = [...updatedPackage.excavationPermits, saved];
          }
          updatedPackage.excavationPermitIds = updatedPackage.excavationPermits.map(p => p.id);
          this.selectedDailyPermitPackageSubject.next(updatedPackage);
          this.updateDailyPermitPackageInList(updatedPackage);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({ error: err => console.error('Failed to save excavation permit:', err) });
    }

    submitVentingPermit(permit: VentingPermitDto) {
      this.ventingPermitService.save([permit]).pipe(
        tap(response => {
          if (!response?.responseData?.[0]) return;
          const saved = new VentingPermitDto(response.responseData[0]);
          const currentPackage = this.selectedDailyPermitPackageSubject.value;
          if (!currentPackage) return;
          const updatedPackage = new DailyPermitPackageDto(currentPackage);
          const idx = updatedPackage.ventingPermits.findIndex(p => p.id === saved.id);
          if (idx > -1) {
            updatedPackage.ventingPermits[idx] = saved;
            updatedPackage.ventingPermits = [...updatedPackage.ventingPermits];
          } else {
            updatedPackage.ventingPermits = [...updatedPackage.ventingPermits, saved];
          }
          updatedPackage.ventingPermitIds = updatedPackage.ventingPermits.map(p => p.id);
          this.selectedDailyPermitPackageSubject.next(updatedPackage);
          this.updateDailyPermitPackageInList(updatedPackage);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({ error: err => console.error('Failed to save venting permit:', err) });
    }


  /***************************************************************************************************************************************
   * Paper Form Functions
   ****************************************************************************************************************************************/



}
