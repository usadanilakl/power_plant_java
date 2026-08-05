
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, catchError, of, tap } from "rxjs";
import { ExcavationPermitDto } from "../../models/permits/excavation-permit.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ExcavationPermitService } from "../permits/excavation-permit.service";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { PrintableFormService } from "../forms/printable-form.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentExcavationPermitService {
    private excavationPermitService = inject(ExcavationPermitService);
    private printableFormService = inject(PrintableFormService);
    private destroyRef = inject(DestroyRef);

    private allActivePermitsSubject = new BehaviorSubject<ExcavationPermitDto[]>([]);
    allActivePermits$ = this.allActivePermitsSubject.asObservable();

    private selectedPermitSubject = new BehaviorSubject<ExcavationPermitDto>(new ExcavationPermitDto());
    selectedPermit$ = this.selectedPermitSubject.asObservable();

    private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    paperForm$ = this.paperFormSubject.asObservable();

    isPaperViewActive = signal<boolean>(false);
    selectedItem = toSignal(this.selectedPermitSubject.asObservable(), { initialValue: new ExcavationPermitDto() });

    constructor() {
        this.loadPermits();
        this.loadPaperForm();
    }

    private normalizePermit(item: Partial<ExcavationPermitDto> | null | undefined): ExcavationPermitDto {
        return item ? ExcavationPermitDto.fromJson(item) : new ExcavationPermitDto();
    }

    private normalizePermits(items: Partial<ExcavationPermitDto>[] | null | undefined): ExcavationPermitDto[] {
        return (items ?? []).map(item => this.normalizePermit(item));
    }

    private normalizePaperForm(item: Partial<PrintableFormDto> | null | undefined): PrintableFormDto {
        return item ? PrintableFormDto.fromJson(item) : new PrintableFormDto();
    }

    private loadPermits() {
        this.excavationPermitService.getAll().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActivePermitsSubject.next(this.normalizePermits(response.responseData));
            console.log('Excavation permits loaded:', response.responseData);
        });
    }
    private loadPaperForm() {
        this.printableFormService.getPrimaryFormByType('ExcavationPermit').pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
                console.error('Error loading paper form:', err);
                return of(null);
            })
        ).subscribe(response => {
            if (response && response.responseData) {
                this.paperFormSubject.next(this.normalizePaperForm(response.responseData));
            }
        });
    }

    switchFormView() {
        this.isPaperViewActive.set(!this.isPaperViewActive());
    }

    setCurrentPermit(id: number) {
        this.excavationPermitService.getById(id.toString()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedPermitSubject.next(this.normalizePermit(response.responseData));
        });
    }

    setCurrentPermitWithDto(dto: ExcavationPermitDto) {
        this.selectedPermitSubject.next(dto);
    }

    updatePermitInList(permit: ExcavationPermitDto) {
        const currentPermits = this.allActivePermitsSubject.value;
        const updatedPermits = currentPermits.map(p => p.id === permit.id ? permit : p);
        this.allActivePermitsSubject.next(updatedPermits);
    }

    addPermitToList(permit: ExcavationPermitDto) {
        const currentPermits = this.allActivePermitsSubject.value;
        this.allActivePermitsSubject.next([...currentPermits, permit]);
    }

    removePermitFromList(id: number) {
        const currentPermits = this.allActivePermitsSubject.value;
        const updatedPermits = currentPermits.filter(p => p.id !== id);
        this.allActivePermitsSubject.next(updatedPermits);
    }

    createPermit(dto: ExcavationPermitDto) {
        return this.excavationPermitService.create(dto).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(response => {
                if (response && response.responseData) {
                    const saved = this.normalizePermit(response.responseData);
                    // Upsert, not append: the paper form's onChange routes here on every edit and the
                    // server updates the existing row, so appending grew the left menu by one phantom
                    // entry per keystroke (gone on refresh, because nothing new was created).
                    const exists = saved.id != null && saved.id !== 0
                        && this.allActivePermitsSubject.value.some(p => p.id === saved.id);
                    if (exists) {
                        this.updatePermitInList(saved);
                    } else {
                        this.addPermitToList(saved);
                    }
                    this.setCurrentPermitWithDto(saved);
                }
            })
        );
    }
    savePermit(form: ExcavationPermitDto) {
      this.createPermit(form).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {},
        error: err => console.error('Error saving excavation permit:', err)
      });
    }
}
