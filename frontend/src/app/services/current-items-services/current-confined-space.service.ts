
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { BehaviorSubject, catchError, of, tap } from "rxjs";
import { ConfinedSpaceDto } from "../../models/permits/confined-space.model";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ConfinedSpaceService } from "../permits/confined-space.service";
import { PrintableFormService, PrintableFormType } from "../forms/printable-form.service";
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

    /** Cache per form type so switching back and forth does not re-fetch. */
    private paperFormCache = new Map<string, PrintableFormDto>();

    constructor() {
        this.loadConfinedSpaces();
        // The two classifications are separate PrintableForm rows (the Reclassified sheet carries
        // section 7 and a different attendant rail), so the paper form has to follow the selection
        // rather than being fetched once for 'ConfinedSpace'.
        this.selectedConfinedSpace$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(dto => this.loadPaperForm(
            dto?.csType === 'RECLASSIFIED' ? 'ConfinedSpaceReclassified' : 'ConfinedSpace'
        ));
    }

    private normalizeConfinedSpace(item: Partial<ConfinedSpaceDto> | null | undefined): ConfinedSpaceDto {
        return item ? ConfinedSpaceDto.fromJson(item) : new ConfinedSpaceDto();
    }

    private normalizeConfinedSpaces(items: Partial<ConfinedSpaceDto>[] | null | undefined): ConfinedSpaceDto[] {
        return (items ?? []).map(item => this.normalizeConfinedSpace(item));
    }

    private normalizePaperForm(item: Partial<PrintableFormDto> | null | undefined): PrintableFormDto {
        return item ? PrintableFormDto.fromJson(item) : new PrintableFormDto();
    }

    private loadConfinedSpaces() {
        this.confinedSpaceService.getConfinedSpaceRequests().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveConfinedSpacesSubject.next(this.normalizeConfinedSpaces(response.responseData));
            console.log('Confined spaces loaded:', response.responseData);
        });
    }
    private loadPaperForm(formType: PrintableFormType) {
        const cached = this.paperFormCache.get(formType);
        if (cached) {
            this.paperFormSubject.next(cached);
            return;
        }
        this.printableFormService.getPrimaryFormByType(formType).pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
                console.error(`Error loading paper form ${formType}:`, err);
                return of(null);
            })
        ).subscribe(response => {
            if (response && response.responseData) {
                const form = this.normalizePaperForm(response.responseData);
                this.paperFormCache.set(formType, form);
                this.paperFormSubject.next(form);
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
            this.selectedConfinedSpaceSubject.next(this.normalizeConfinedSpace(response.responseData));
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
                    const newConfinedSpace = this.normalizeConfinedSpace(response.responseData);
                    this.updateOrAddConfinedSpaceToList(newConfinedSpace);
                    this.setCurrentConfinedSpaceWithDto(newConfinedSpace);
                }
            })
        );
    }
    save(form: ConfinedSpaceDto) {
      this.createConfinedSpace(form).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
}
