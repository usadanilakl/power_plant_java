import { DestroyRef, inject, Injectable } from "@angular/core";
import { BehaviorSubject, catchError, map, Observable, of, tap } from "rxjs";
import { LotoStandardDto } from "../../models/loto/loto-standard.model";
import { LotoStandardService } from "../loto/loto-standard.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentLotoStandardService{

    private lotoStandardService = inject(LotoStandardService);
    private destroyRef = inject(DestroyRef);

    constructor(){}

    private allStandards = new BehaviorSubject<LotoStandardDto[]>([]);
    allStandards$ = this.allStandards.asObservable();

    private currentStandardSubject = new BehaviorSubject<LotoStandardDto | null>(null);
    currentStandard$ = this.currentStandardSubject.asObservable();

    loadStandardsFromServer() {
      this.lotoStandardService.getAllLotoStandards().pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<LotoStandardDto[]>) => response.responseData),
        tap((standards: LotoStandardDto[]) => {
          this.allStandards.next(standards);
        }),
        catchError((error) => {
          console.error('Error fetching LOTO standards:', error);
          this.allStandards.next([]);
          return of([]);
        })
      ).subscribe();
    }

    setCurrentStandard(lotoStandardId: number) {
        this.lotoStandardService.getLotoStandardById(lotoStandardId).pipe(
            takeUntilDestroyed(this.destroyRef),
            map((response: SpringApiResponse<LotoStandardDto>) => response.responseData),
            tap((standard: LotoStandardDto) => {
                this.currentStandardSubject.next(standard);
            }),
            catchError((error) => {
                console.error('Error fetching LOTO standard:', error);
                this.currentStandardSubject.next(null);
                return of(null);
            })
        ).subscribe();
    }

    getCurrentStandard(): Observable<LotoStandardDto | null> {
        return this.currentStandard$;
    }
}