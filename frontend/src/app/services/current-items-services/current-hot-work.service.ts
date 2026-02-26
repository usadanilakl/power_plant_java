
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

    private loadHotWorks() {
        this.hotWorkService.getHotWorkRequests().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveHotWorksSubject.next(response.responseData);
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
                this.paperFormSubject.next(response.responseData);
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
            this.selectedHotWorkSubject.next(response.responseData);
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
                    const newHotWork = response.responseData;
                    this.addHotWorkToList(newHotWork);
                    this.setCurrentHotWorkWithDto(new HotWorkDto(newHotWork));
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