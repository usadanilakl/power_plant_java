
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, catchError, of, tap } from "rxjs";
import { ConfinedSpaceDto } from "../../models/permits/confined-space.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ConfinedSpaceService } from "../permits/confined-space.service";
import { PrintableFormService } from "../forms/printable-form.service";
import { PrintableFormDto } from "../../models/forms/printable-form.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentConfinedSpaceService {
    private confinedSpaceService = inject(ConfinedSpaceService);
    private printableFormService = inject(PrintableFormService);
    private destroyRef = inject(DestroyRef);

    private allActiveConfinedSpacesSubject = new BehaviorSubject<ConfinedSpaceDto[]>([]);
    allActiveConfinedSpaces$ = this.allActiveConfinedSpacesSubject.asObservable();

    private selectedConfinedSpaceSubject = new BehaviorSubject<ConfinedSpaceDto>(new ConfinedSpaceDto());
    selectedConfinedSpace$ = this.selectedConfinedSpaceSubject.asObservable();

    private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    paperForm$ = this.paperFormSubject.asObservable();
  
    isPaperViewActive = signal<boolean>(false);
    selectedItem = toSignal(this.selectedConfinedSpaceSubject.asObservable(), { initialValue: new ConfinedSpaceDto() });

    constructor() {
        this.loadConfinedSpaces();
        this.loadPaperForm();
    }

    private loadConfinedSpaces() {
        this.confinedSpaceService.getConfinedSpaceRequests().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveConfinedSpacesSubject.next(response.responseData);
            console.log('Confined spaces loaded:', response.responseData);
        });
    }
    private loadPaperForm() {
        this.printableFormService.getPrimaryFormByType('ConfinedSpace').pipe(
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

    setCurrentConfinedSpace(id: number) {
        this.confinedSpaceService.getConfinedSpaceRequestById(id.toString()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedConfinedSpaceSubject.next(response.responseData);
        });
    }    
    setCurrentConfinedSpaceWithDto(dto: ConfinedSpaceDto) {
        this.selectedConfinedSpaceSubject.next(dto);
    }

    updateOrAddConfinedSpaceToList(confinedSpace: ConfinedSpaceDto) {
        const currentConfinedSpaces = this.allActiveConfinedSpacesSubject.value;
        const index = currentConfinedSpaces.findIndex(cs => cs.id === confinedSpace.id);

        if (index !== -1) {
            // Update existing item
            const updatedConfinedSpaces = [...currentConfinedSpaces];
            updatedConfinedSpaces[index] = confinedSpace;
            this.allActiveConfinedSpacesSubject.next(updatedConfinedSpaces);
        } else {
            // Add new item
            const updatedConfinedSpaces = [...currentConfinedSpaces, confinedSpace];
            this.allActiveConfinedSpacesSubject.next(updatedConfinedSpaces);
        }
    }

    addConfinedSpaceToList(confinedSpace: ConfinedSpaceDto) {
        const currentConfinedSpaces = this.allActiveConfinedSpacesSubject.value;
        this.allActiveConfinedSpacesSubject.next([...currentConfinedSpaces, confinedSpace]);
    }

    removeConfinedSpaceFromList(id: number) {
        const currentConfinedSpaces = this.allActiveConfinedSpacesSubject.value;
        const updatedConfinedSpaces = currentConfinedSpaces.filter(cs => cs.id !== id);
        this.allActiveConfinedSpacesSubject.next(updatedConfinedSpaces);
    }

    createConfinedSpace(confinedSpaceDto: ConfinedSpaceDto) {
        return this.confinedSpaceService.createConfinedSpaceRequest(confinedSpaceDto).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(response => {
                if (response && response.responseData) {
                    const newConfinedSpace = response.responseData;
                    this.updateOrAddConfinedSpaceToList(newConfinedSpace);
                    this.setCurrentConfinedSpaceWithDto(new ConfinedSpaceDto(newConfinedSpace));
                }
            })
        );
    }
    save(form: ConfinedSpaceDto) {
      this.createConfinedSpace(form).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
}