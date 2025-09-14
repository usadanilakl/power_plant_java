
import { DestroyRef, inject, Injectable } from "@angular/core";
import { BehaviorSubject, tap } from "rxjs";
import { HotWorkDto } from "../../models/permits/hot-work.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HotWorkService } from "../permits/hot-work.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentHotWorkService {
    private hotWorkService = inject(HotWorkService);
    private destroyRef = inject(DestroyRef);

    private allActiveHotWorksSubject = new BehaviorSubject<HotWorkDto[]>([]);
    allActiveHotWorks$ = this.allActiveHotWorksSubject.asObservable();

    private selectedHotWorkSubject = new BehaviorSubject<HotWorkDto>(new HotWorkDto());
    selectedHotWork$ = this.selectedHotWorkSubject.asObservable();

    constructor() {
        this.loadHotWorks();
    }

    private loadHotWorks() {
        this.hotWorkService.getHotWorkRequests().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.allActiveHotWorksSubject.next(response.responseData);
            console.log('Hot works loaded:', response.responseData);
        });
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
}