
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { SafeWorkService } from "../permits/safe-work.service";
import { BehaviorSubject, catchError, of, tap } from "rxjs";
import { SafeWorkDto } from "../../models/permits/safe-work.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { PrintableFormService } from "../forms/printable-form.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentSafeWorkService {
    private safeWorkService = inject(SafeWorkService);
    private printableFormService = inject(PrintableFormService);
    private destroyRef = inject(DestroyRef);

    private allActiveSafeWorksSubject = new BehaviorSubject<SafeWorkDto[]>([]);
    allActiveSafeWorks$ = this.allActiveSafeWorksSubject.asObservable();

    private selectedSafeWorkSubject = new BehaviorSubject<SafeWorkDto>(new SafeWorkDto());
    selectedSafeWork$ = this.selectedSafeWorkSubject.asObservable();

    private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    paperForm$ = this.paperFormSubject.asObservable();
  
    isPaperViewActive = signal<boolean>(false);

    constructor() {
        this.loadSafeWorks();
        this.loadPaperForm();
    }

    private loadSafeWorks() {
        this.safeWorkService.getSafeWorkRequests().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveSafeWorksSubject.next(response.responseData);
            console.log('Safe works loaded:', response.responseData);
        });
    }
    private loadPaperForm() {
        this.printableFormService.getPrimaryFormByType('SafeWork').pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
                console.error('Error loading paper form:', err);
                return of(null);
            })
        ).subscribe(response => {
            if (response && response.responseData) {
                this.paperFormSubject.next(response.responseData);
                // console.log('Paper form loaded:', response.responseData);
            }
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
        const itemIndex = currentSafeWorks.findIndex(sw => sw.id === safeWork.id);

        if (itemIndex !== -1) {
            // Item exists, so update it
            const updatedSafeWorks = [...currentSafeWorks];
            updatedSafeWorks[itemIndex] = safeWork;
            this.allActiveSafeWorksSubject.next(updatedSafeWorks);
        } else {
            // Item does not exist, so add it
            this.allActiveSafeWorksSubject.next([...currentSafeWorks, safeWork]);
        }
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
                    this.updateSafeWorkInList(newSafeWork);
                    this.setCurrentSafeWorkWithDto(new SafeWorkDto(newSafeWork));
                }
            })
        );
    }

    saveSafeWork(safeWorkDto: SafeWorkDto) {
        this.createSafeWork(safeWorkDto).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(
            () => {},
            err => console.error('Error saving safe work:', err)
        );
    }

}