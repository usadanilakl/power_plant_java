
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, catchError, of, tap } from "rxjs";
import { EnergizedWorkPermitDto } from "../../models/permits/energized-work-permit.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { EnergizedWorkPermitService } from "../permits/energized-work-permit.service";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { PrintableFormService } from "../forms/printable-form.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentEnergizedWorkPermitService {
    private energizedWorkPermitService = inject(EnergizedWorkPermitService);
    private printableFormService = inject(PrintableFormService);
    private destroyRef = inject(DestroyRef);

    private allActivePermitsSubject = new BehaviorSubject<EnergizedWorkPermitDto[]>([]);
    allActivePermits$ = this.allActivePermitsSubject.asObservable();

    private selectedPermitSubject = new BehaviorSubject<EnergizedWorkPermitDto>(new EnergizedWorkPermitDto());
    selectedPermit$ = this.selectedPermitSubject.asObservable();

    private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    paperForm$ = this.paperFormSubject.asObservable();

    isPaperViewActive = signal<boolean>(false);
    selectedItem = toSignal(this.selectedPermitSubject.asObservable(), { initialValue: new EnergizedWorkPermitDto() });

    constructor() {
        this.loadPermits();
        this.loadPaperForm();
    }

    private loadPermits() {
        this.energizedWorkPermitService.getAll().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActivePermitsSubject.next(response.responseData);
            console.log('Energized work permits loaded:', response.responseData);
        });
    }
    private loadPaperForm() {
        this.printableFormService.getPrimaryFormByType('EnergizedWorkPermit').pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
                console.error('Error loading paper form:', err);
                return of(null);
            })
        ).subscribe(response => {
            if (response && response.responseData) {
                this.paperFormSubject.next(response.responseData);
            }
        });
    }

    switchFormView() {
        this.isPaperViewActive.set(!this.isPaperViewActive());
    }

    setCurrentPermit(id: number) {
        this.energizedWorkPermitService.getById(id.toString()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedPermitSubject.next(response.responseData);
        });
    }

    setCurrentPermitWithDto(dto: EnergizedWorkPermitDto) {
        this.selectedPermitSubject.next(dto);
    }

    updatePermitInList(permit: EnergizedWorkPermitDto) {
        const currentPermits = this.allActivePermitsSubject.value;
        const updatedPermits = currentPermits.map(p => p.id === permit.id ? permit : p);
        this.allActivePermitsSubject.next(updatedPermits);
    }

    addPermitToList(permit: EnergizedWorkPermitDto) {
        const currentPermits = this.allActivePermitsSubject.value;
        this.allActivePermitsSubject.next([...currentPermits, permit]);
    }

    removePermitFromList(id: number) {
        const currentPermits = this.allActivePermitsSubject.value;
        const updatedPermits = currentPermits.filter(p => p.id !== id);
        this.allActivePermitsSubject.next(updatedPermits);
    }

    createPermit(dto: EnergizedWorkPermitDto) {
        return this.energizedWorkPermitService.create(dto).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(response => {
                if (response && response.responseData) {
                    const newPermit = response.responseData;
                    this.addPermitToList(newPermit);
                    this.setCurrentPermitWithDto(new EnergizedWorkPermitDto(newPermit));
                }
            })
        );
    }
    savePermit(form: EnergizedWorkPermitDto) {
      this.createPermit(form).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {},
        error: err => console.error('Error saving energized work permit:', err)
      });
    }
}
