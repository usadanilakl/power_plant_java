
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, catchError, of, tap } from "rxjs";
import { VentingPermitDto } from "../../models/permits/venting-permit.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { VentingPermitService } from "../permits/venting-permit.service";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { PrintableFormService } from "../forms/printable-form.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentVentingPermitService {
    private ventingPermitService = inject(VentingPermitService);
    private printableFormService = inject(PrintableFormService);
    private destroyRef = inject(DestroyRef);

    private allActivePermitsSubject = new BehaviorSubject<VentingPermitDto[]>([]);
    allActivePermits$ = this.allActivePermitsSubject.asObservable();

    private selectedPermitSubject = new BehaviorSubject<VentingPermitDto>(new VentingPermitDto());
    selectedPermit$ = this.selectedPermitSubject.asObservable();

    private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    paperForm$ = this.paperFormSubject.asObservable();

    isPaperViewActive = signal<boolean>(false);
    selectedItem = toSignal(this.selectedPermitSubject.asObservable(), { initialValue: new VentingPermitDto() });

    constructor() {
        this.loadPermits();
        this.loadPaperForm();
    }

    private normalizePermit(item: Partial<VentingPermitDto> | null | undefined): VentingPermitDto {
        return item ? VentingPermitDto.fromJson(item) : new VentingPermitDto();
    }

    private normalizePermits(items: Partial<VentingPermitDto>[] | null | undefined): VentingPermitDto[] {
        return (items ?? []).map(item => this.normalizePermit(item));
    }

    private normalizePaperForm(item: Partial<PrintableFormDto> | null | undefined): PrintableFormDto {
        return item ? PrintableFormDto.fromJson(item) : new PrintableFormDto();
    }

    private loadPermits() {
        this.ventingPermitService.getAll().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActivePermitsSubject.next(this.normalizePermits(response.responseData));
            console.log('Venting permits loaded:', response.responseData);
        });
    }
    private loadPaperForm() {
        this.printableFormService.getPrimaryFormByType('VentingPermit').pipe(
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
        this.ventingPermitService.getById(id.toString()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedPermitSubject.next(this.normalizePermit(response.responseData));
        });
    }

    setCurrentPermitWithDto(dto: VentingPermitDto) {
        this.selectedPermitSubject.next(dto);
    }

    updatePermitInList(permit: VentingPermitDto) {
        const currentPermits = this.allActivePermitsSubject.value;
        const updatedPermits = currentPermits.map(p => p.id === permit.id ? permit : p);
        this.allActivePermitsSubject.next(updatedPermits);
    }

    addPermitToList(permit: VentingPermitDto) {
        const currentPermits = this.allActivePermitsSubject.value;
        this.allActivePermitsSubject.next([...currentPermits, permit]);
    }

    removePermitFromList(id: number) {
        const currentPermits = this.allActivePermitsSubject.value;
        const updatedPermits = currentPermits.filter(p => p.id !== id);
        this.allActivePermitsSubject.next(updatedPermits);
    }

    createPermit(dto: VentingPermitDto) {
        return this.ventingPermitService.create(dto).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(response => {
                if (response && response.responseData) {
                    const newPermit = this.normalizePermit(response.responseData);
                    this.addPermitToList(newPermit);
                    this.setCurrentPermitWithDto(newPermit);
                }
            })
        );
    }
    savePermit(form: VentingPermitDto) {
      this.createPermit(form).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {},
        error: err => console.error('Error saving venting permit:', err)
      });
    }
}
