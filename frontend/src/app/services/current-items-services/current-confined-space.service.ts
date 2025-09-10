
import { DestroyRef, inject, Injectable } from "@angular/core";
import { BehaviorSubject, tap } from "rxjs";
import { ConfinedSpaceDto } from "../../models/permits/confined-space.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ConfinedSpaceService } from "../permits/confined-space.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentConfinedSpaceService {
    private confinedSpaceService = inject(ConfinedSpaceService);
    private destroyRef = inject(DestroyRef);

    private allActiveConfinedSpacesSubject = new BehaviorSubject<ConfinedSpaceDto[]>([]);
    allActiveConfinedSpaces$ = this.allActiveConfinedSpacesSubject.asObservable();

    private selectedConfinedSpaceSubject = new BehaviorSubject<ConfinedSpaceDto | null>(null);
    selectedConfinedSpace$ = this.selectedConfinedSpaceSubject.asObservable();

    constructor() {
        this.loadConfinedSpaces();
    }

    private loadConfinedSpaces() {
        this.confinedSpaceService.getConfinedSpaceRequests().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveConfinedSpacesSubject.next(response.responseData);
            console.log('Confined spaces loaded:', response.responseData);
        });
    }

    setCurrentConfinedSpace(id: number) {
        this.confinedSpaceService.getConfinedSpaceRequestById(id.toString()).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.selectedConfinedSpaceSubject.next(response.responseData);
        });
    }

    updateConfinedSpaceInList(confinedSpace: ConfinedSpaceDto) {
        const currentConfinedSpaces = this.allActiveConfinedSpacesSubject.value;
        const updatedConfinedSpaces = currentConfinedSpaces.map(cs => cs.id === confinedSpace.id ? confinedSpace : cs);
        this.allActiveConfinedSpacesSubject.next(updatedConfinedSpaces);
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
                    this.addConfinedSpaceToList(newConfinedSpace);
                    this.setCurrentConfinedSpace(newConfinedSpace.id);
                }
            })
        );
    }
}