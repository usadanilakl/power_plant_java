import { DestroyRef, inject, Injectable } from "@angular/core";
import { LotoService } from "../loto/loto.service";
import { BehaviorSubject, catchError, map, Observable, of, tap } from "rxjs";
import { LotoDto } from "../../models/loto/loto.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { SpringPaginatedResponse } from "../../models/api/spring-pagenated.response.model";
import { LotoPointDto } from "../../models/loto/loto-point.model";
import { FileDto } from "../../models/file/file.model";
import { LotoPointService } from "../loto/loto-point.service";

@Injectable({
  providedIn: 'root'
})
export class CurrentLotoService{
    private lotoService = inject(LotoService);
    private lotoPointService = inject(LotoPointService);
    private destroyRef = inject(DestroyRef);

    private allLotosSubject = new BehaviorSubject<LotoDto[]>([]);
    allLotos$ = this.allLotosSubject.asObservable();

    private currentLotoSubject = new BehaviorSubject<LotoDto | null>(null);
    currentLoto$ = this.currentLotoSubject.asObservable();
    
    private currentLotoPointSubject = new BehaviorSubject<LotoPointDto | null>(null);
    currentLotoPoint$ = this.currentLotoPointSubject.asObservable();
    
    private currentLotoPointFilesSubject = new BehaviorSubject<FileDto[]>([]);
    currentLotoPointFiles$ = this.currentLotoPointFilesSubject.asObservable();

    private currentLotoFilesSubject = new BehaviorSubject<FileDto[]>([]);
    currentLotoFiles$ = this.currentLotoFilesSubject.asObservable();

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
      if(loto && loto.id && loto.id!=0){
        this.lotoService.getLotoById(loto.id.toString()).pipe(
          takeUntilDestroyed(this.destroyRef),
          map((response: SpringApiResponse<LotoDto>) => response.responseData)
        ).subscribe((lotoFromServer: LotoDto) => {
          if(lotoFromServer){
            this.currentLotoSubject.next(lotoFromServer);
            this.loadCurrentLotoFiles(lotoFromServer.id);
          }
        });
      }else{
        this.currentLotoSubject.next(new LotoDto());
      }
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
                this.loadCurrentLotoFiles(receivedLoto.id);
            });
        }
    }

    removeLotoPointFromCurrentLoto(id: number) {
      // Remove the point from the current loto
      if(this.currentLotoSubject.value) {
          // Save the changes to the server
          this.lotoService.removeLotoPointFromLoto(id, this.currentLotoSubject.value.id).pipe(
              takeUntilDestroyed(this.destroyRef)
          ).subscribe((response: SpringApiResponse<LotoDto>) => {
              // Update the current loto
              const receivedLoto = new LotoDto(response.responseData);
              this.updateLotoInList(receivedLoto);
              this.currentLotoSubject.next(receivedLoto);
              this.loadCurrentLotoFiles(receivedLoto.id);
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


    
    getCurrentLotoFiles(): Observable<FileDto[]>   {
      return this.currentLotoFiles$;
    }
    getCurrentLotoPointFiles(): Observable<FileDto[]>   {
      return this.currentLotoPointFiles$;
    }
    getCurrentLotoPoint(): Observable<LotoPointDto | null>   {
      return this.currentLotoPoint$;
    }
    
    setCurrentLotoPoint(lotoPoint: LotoPointDto | null) {
      this.currentLotoPointSubject.next(lotoPoint);
      if(lotoPoint && lotoPoint.id)this.loadCurrentLotoPoitFiles(lotoPoint.id);
    }
    
    loadCurrentLotoPoitFiles(lotoPointId: number) {
      this.lotoPointService.getRelatedFiles(lotoPointId).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<FileDto[]>) => response.responseData),
        tap((files: FileDto[]) => {
          this.currentLotoPointFilesSubject.next([...files]);
        }),
        catchError((error) => {
          console.error('Error fetching LOTO point file links:', error);
          this.currentLotoPointFilesSubject.next([]);
          return of([]);
        })
      ).subscribe()
    }

    loadCurrentLotoFiles(lotoStandardId: number) {
      this.lotoService.getRelatedFiles(lotoStandardId).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<FileDto[]>) => response.responseData),
        tap((files: FileDto[]) => {
          this.currentLotoFilesSubject.next([...files]);
        }),
        catchError((error) => {
          console.error('Error fetching LOTO standard file links:', error);
          this.currentLotoFilesSubject.next([]);
          return of([]);
        })
      ).subscribe();
    }

    addFileToCurrentLotoFiles(fileDto: FileDto) {
      const currentFiles = this.currentLotoFilesSubject.getValue();
      const fileExists = currentFiles.some(file => file.id === fileDto.id);
    
      if (!fileExists) {
        // If the file doesn't exist, add it to the array
        this.currentLotoFilesSubject.next([...currentFiles, fileDto]);
      } else {
        // If the file already exists, you might want to update it
        const updatedFiles = currentFiles.map(file => 
          file.id === fileDto.id ? fileDto : file
        );
        this.currentLotoFilesSubject.next(updatedFiles);
      }
    
      // console.log(`File ${fileExists ? 'updated' : 'added'} in current standard files:`, fileDto);
    }

    removeFileFromCurrentLotoFiles(fileId: number) {
      const currentFiles = this.currentLotoFilesSubject.getValue();
      const updatedFiles = currentFiles.filter(file => file.id!== fileId);
      this.currentLotoFilesSubject.next(updatedFiles);
    }
    
    reorderLotoPoints(lotoPoints: LotoPointDto[]) {
      const currentStandardId = this.currentLotoSubject.getValue()?.id;
      if (!currentStandardId) {
        console.error('No current LOTO standard selected');
        return;
      }
      const lotoPointsIds = lotoPoints.map(p => p.id);
      if(!lotoPointsIds.length) {
        console.error('No LOTO points provided');
        return;
      }
      this.lotoService.reorderLotoPoints(currentStandardId,lotoPointsIds).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if(response && response.responseData){
            const currentStandards = this.allLotosSubject.getValue();
            const existingStandardIndex = currentStandards.findIndex(s => s.id === currentStandardId);
            if (existingStandardIndex!== -1) {
              // If the standard exists, update it in the array
              const updatedStandards = [...currentStandards];
              updatedStandards[existingStandardIndex] = new LotoDto({...response.responseData});
              this.allLotosSubject.next(updatedStandards);
            }

            this.currentLotoSubject.next(new LotoDto({...response.responseData}));
            this.loadCurrentLotoFiles(currentStandardId);
          }
        }),
        catchError((error) => {
          console.error('Error reordering LOTO points:', error);
          return of(null);
        })
      ).subscribe();
    }


}