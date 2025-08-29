import { DestroyRef, inject, Injectable } from "@angular/core";
import { LotoService } from "../loto/loto.service";
import { BehaviorSubject, map } from "rxjs";
import { LotoDto } from "../../models/loto/loto.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { SpringPaginatedResponse } from "../../models/api/spring-pagenated.response.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentLotoService{
    private lotoService = inject(LotoService);
    private destroyRef = inject(DestroyRef);

    private allLotosSubject = new BehaviorSubject<LotoDto[]>([]);
    allLotos$ = this.allLotosSubject.asObservable();

    private currentLotoSubject = new BehaviorSubject<LotoDto | null>(null);
    currentLoto$ = this.currentLotoSubject.asObservable();

    constructor() {
        this.loadLotosFromServer();
    }

    private loadLotosFromServer() {
        this.lotoService.getLotos().pipe(
            takeUntilDestroyed(this.destroyRef),
            map((response: SpringPaginatedResponse<LotoDto>) => response.responseData.content || [])
        ).subscribe((lotos: LotoDto[]) => {
            this.allLotosSubject.next(lotos);
        });
    }

    setCurrentLoto(loto: LotoDto | null) {
        this.currentLotoSubject.next(loto);
    }

    addLotoPointToCurrentLoto(pointId: number) {
        // Add the point to the current loto
        if(this.currentLotoSubject.value) {
            // Save the changes to the server
            this.lotoService.addLotoPointToLoto(pointId, this.currentLotoSubject.value.id).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe((response: SpringApiResponse<LotoDto>) => {
                // Update the current loto
                const receivedLoto = new LotoDto(response.responseData);
                this.updateLotoInList(receivedLoto);
                this.currentLotoSubject.next(receivedLoto);
            });
        }
    }

    updateLotoInList(loto: LotoDto) {
        const currentLotos = this.allLotosSubject.value;
        const updatedLotos = currentLotos.map(l => l.id === loto.id? loto : l);
        this.allLotosSubject.next(updatedLotos);
    }

    
    processLotoChanges(lotoDto: LotoDto) {
      if(!lotoDto) return;
      const lotoIdDto = new LotoDto(lotoDto).toIdModel();
      this.lotoService.updateLoto(lotoIdDto).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((response: SpringApiResponse<LotoDto>) => {
        if(response){
            const receivedLoto = new LotoDto(response.responseData);
            this.updateLotoInList(receivedLoto);
            this.setCurrentLoto(receivedLoto);
        }
        else{
            console.error('Error creating Loto:', response);
        }
      });
    }


}