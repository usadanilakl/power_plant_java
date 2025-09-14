
import { DestroyRef, inject, Injectable } from "@angular/core";
import { SafeWorkService } from "../permits/safe-work.service";
import { BehaviorSubject, tap } from "rxjs";
import { SafeWorkDto } from "../../models/permits/safe-work.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class CurrentSafeWorkService {
    private safeWorkService = inject(SafeWorkService);
    private destroyRef = inject(DestroyRef);

    private allActiveSafeWorksSubject = new BehaviorSubject<SafeWorkDto[]>([]);
    allActiveSafeWorks$ = this.allActiveSafeWorksSubject.asObservable();

    private selectedSafeWorkSubject = new BehaviorSubject<SafeWorkDto>(new SafeWorkDto());
    selectedSafeWork$ = this.selectedSafeWorkSubject.asObservable();

    constructor() {
        this.loadSafeWorks();
    }

    private loadSafeWorks() {
        this.safeWorkService.getSafeWorkRequests().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveSafeWorksSubject.next(response.responseData);
            console.log('Safe works loaded:', response.responseData);
        });
    }

    setCurrentSafeWork(id: number) {
        this.safeWorkService.getSafeWorkRequestById(id.toString()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedSafeWorkSubject.next(response.responseData);
        });
    }

    setCurrentSafeWorkWithDto(dto: SafeWorkDto) {
        this.selectedSafeWorkSubject.next(dto);
    }

    updateSafeWorkInList(safeWork: SafeWorkDto) {
        const currentSafeWorks = this.allActiveSafeWorksSubject.value;
        const updatedSafeWorks = currentSafeWorks.map(sw => sw.id === safeWork.id ? safeWork : sw);
        this.allActiveSafeWorksSubject.next(updatedSafeWorks);
    }

    addSafeWorkToList(safeWork: SafeWorkDto) {
        const currentSafeWorks = this.allActiveSafeWorksSubject.value;
        this.allActiveSafeWorksSubject.next([...currentSafeWorks, safeWork]);
    }

    removeSafeWorkFromList(id: number) {
        const currentSafeWorks = this.allActiveSafeWorksSubject.value;
        const updatedSafeWorks = currentSafeWorks.filter(sw => sw.id !== id);
        this.allActiveSafeWorksSubject.next(updatedSafeWorks);
    }

    createSafeWork(safeWorkDto: SafeWorkDto) {
        return this.safeWorkService.createSafeWork(safeWorkDto).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(response => {
                if (response && response.responseData) {
                    const newSafeWork = response.responseData;
                    this.addSafeWorkToList(newSafeWork);
                    this.setCurrentSafeWorkWithDto(new SafeWorkDto(newSafeWork));
                }
            })
        );
    }

}