import { DestroyRef, inject, Injectable } from "@angular/core";
import { BehaviorSubject, catchError, map, Observable, of, tap } from "rxjs";
import { LotoStandardDto } from "../../models/loto/loto-standard.model";
import { LotoStandardService } from "../loto/loto-standard.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { LotoPointDto } from "../../models/loto/loto-point.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentLotoStandardService{

    private lotoStandardService = inject(LotoStandardService);
    private destroyRef = inject(DestroyRef);

    constructor(){
      this.loadStandardsFromServer();
    }

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

    addStandard(lotoStandard: LotoStandardDto) {
      this.lotoStandardService.createLotoStandard(lotoStandard).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<LotoStandardDto>) => response.responseData),
        tap((standard: LotoStandardDto) => {
          const standardDto = new LotoStandardDto(standard);
            this.allStandards.next([...this.allStandards.getValue(), standardDto]);
            this.currentStandardSubject.next(standard);
        }),
        catchError((error) => {
            console.error('Error adding LOTO standard:', error);
            return of(null);
        })
      ).subscribe();
    }

    addLotoPointToStandard(lotoPoint: LotoPointDto) {
      const lotoStandardId = this.currentStandardSubject.getValue()?.id;
      this.lotoStandardService.addLotoPointToStandard(lotoPoint.id, lotoStandardId).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<LotoStandardDto>) => response.responseData),
        tap((standard: LotoStandardDto) => {
          const currentStandards = this.allStandards.getValue();
          const existingStandardIndex = currentStandards.findIndex(s => s.id === standard.id);
          
          if (existingStandardIndex === -1) {
            // If the standard doesn't exist, add it to the array
            this.allStandards.next([...currentStandards, standard]);
          } else {
            // If the standard exists, update it in the array
            const updatedStandards = [...currentStandards];
            updatedStandards[existingStandardIndex] = standard;
            this.allStandards.next(updatedStandards);
          }
          
          // Always update the current standard
          this.currentStandardSubject.next(standard);
        }),
        catchError((error) => {
          console.error('Error adding LOTO point to standard:', error);
          return of(null);
        })
      ).subscribe();
    }

    setCurrentStandard(lotoStandardId: number) {
        this.lotoStandardService.getLotoStandardById(lotoStandardId).pipe(
            takeUntilDestroyed(this.destroyRef),
            map((response: SpringApiResponse<LotoStandardDto>) => response.responseData),
            tap((standard: LotoStandardDto) => {
                this.currentStandardSubject.next(new LotoStandardDto(standard));
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