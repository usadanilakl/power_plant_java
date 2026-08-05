
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, catchError, of, tap } from "rxjs";
import { HotWorkDto } from "../../models/permits/hot-work.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { HotWorkService } from "../permits/hot-work.service";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { PrintableFormService } from "../forms/printable-form.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentHotWorkService {
    private hotWorkService = inject(HotWorkService);
    private printableFormService = inject(PrintableFormService);
    private destroyRef = inject(DestroyRef);

    private allActiveHotWorksSubject = new BehaviorSubject<HotWorkDto[]>([]);
    allActiveHotWorks$ = this.allActiveHotWorksSubject.asObservable();

    private selectedHotWorkSubject = new BehaviorSubject<HotWorkDto>(new HotWorkDto());
    selectedHotWork$ = this.selectedHotWorkSubject.asObservable();

    private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    paperForm$ = this.paperFormSubject.asObservable();
  
    isPaperViewActive = signal<boolean>(false);
    selectedItem = toSignal(this.selectedHotWorkSubject.asObservable(), { initialValue: new HotWorkDto() });

    constructor() {
        this.loadHotWorks();
        this.loadPaperForm();
    }

    private normalizeHotWork(item: Partial<HotWorkDto> | null | undefined): HotWorkDto {
        return item ? HotWorkDto.fromJson(item) : new HotWorkDto();
    }

    private normalizeHotWorks(items: Partial<HotWorkDto>[] | null | undefined): HotWorkDto[] {
        return (items ?? []).map(item => this.normalizeHotWork(item));
    }

    private normalizePaperForm(item: Partial<PrintableFormDto> | null | undefined): PrintableFormDto {
        return item ? PrintableFormDto.fromJson(item) : new PrintableFormDto();
    }

    private loadHotWorks() {
        this.hotWorkService.getHotWorkRequests().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveHotWorksSubject.next(this.normalizeHotWorks(response.responseData));
            console.log('Hot works loaded:', response.responseData);
        });
    }
    private loadPaperForm() {
        this.printableFormService.getPrimaryFormByType('HotWork').pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
                console.error('Error loading paper form:', err);
                return of(null);
            })
        ).subscribe(response => {
            if (response && response.responseData) {
                this.paperFormSubject.next(this.normalizePaperForm(response.responseData));
                // console.log('Paper form loaded:', response.responseData);
            }
        });
    }

    switchFormView() {
        this.isPaperViewActive.set(!this.isPaperViewActive());
    }

    setCurrentHotWork(id: number) {
        this.hotWorkService.getHotWorkRequestById(id.toString()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedHotWorkSubject.next(this.normalizeHotWork(response.responseData));
        });
    }

    setCurrentHotWorkWithDto(dto: HotWorkDto) {
        this.selectedHotWorkSubject.next(dto);
    }

    updateHotWorkInList(hotWork: HotWorkDto) {
        const currentHotWorks = this.allActiveHotWorksSubject.value;
        const updatedHotWorks = currentHotWorks.map(hw => hw.id === hotWork.id ? hotWork : hw);
        this.allActiveHotWorksSubject.next(updatedHotWorks);
    }

    addHotWorkToList(hotWork: HotWorkDto) {
        const currentHotWorks = this.allActiveHotWorksSubject.value;
        this.allActiveHotWorksSubject.next([...currentHotWorks, hotWork]);
    }

    removeHotWorkFromList(id: number) {
        const currentHotWorks = this.allActiveHotWorksSubject.value;
        const updatedHotWorks = currentHotWorks.filter(hw => hw.id !== id);
        this.allActiveHotWorksSubject.next(updatedHotWorks);
    }

    createHotWork(hotWorkDto: HotWorkDto) {
        return this.hotWorkService.createHotWorkRequest(hotWorkDto).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(response => {
                if (response && response.responseData) {
                    const saved = this.normalizeHotWork(response.responseData);
                    // Upsert, not append. The paper form's onChange routes here on EVERY edit, and
                    // the server updates the existing row (the DTO carries a real id) -- so blindly
                    // appending added a duplicate left-menu entry per keystroke that vanished on
                    // refresh, because nothing new had actually been created.
                    const exists = saved.id != null && saved.id !== 0
                        && this.allActiveHotWorksSubject.value.some(hw => hw.id === saved.id);
                    if (exists) {
                        this.updateHotWorkInList(saved);
                    } else {
                        this.addHotWorkToList(saved);
                    }
                    this.setCurrentHotWorkWithDto(saved);
                }
            })
        );
    }
    saveHotWork(form: HotWorkDto) {
      this.createHotWork(form).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {},
        error: err => console.error('Error saving hot work:', err)
      });
    }
}
