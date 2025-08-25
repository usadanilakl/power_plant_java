import { DestroyRef, inject, Injectable } from "@angular/core";
import { BehaviorSubject, catchError, map, Observable, of, tap } from "rxjs";
import { LotoStandardDto } from "../../models/loto/loto-standard.model";
import { LotoStandardService } from "../loto/loto-standard.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { LotoPointDto } from "../../models/loto/loto-point.model";
import { LotoPointService } from "../loto/loto-point.service";
import { FileDto } from "../../models/file/file.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentLotoStandardService{

    private lotoStandardService = inject(LotoStandardService);
    private lotoPointService = inject(LotoPointService);
    private destroyRef = inject(DestroyRef);

    constructor(){
      this.loadStandardsFromServer();
    }

    private allStandards = new BehaviorSubject<LotoStandardDto[]>([]);
    allStandards$ = this.allStandards.asObservable();

    private currentStandardSubject = new BehaviorSubject<LotoStandardDto | null>(null);
    currentStandard$ = this.currentStandardSubject.asObservable();

    private currentLotoPointSubject = new BehaviorSubject<LotoPointDto | null>(null);
    currentLotoPoint$ = this.currentLotoPointSubject.asObservable();

    private currentFilesSubject = new BehaviorSubject<FileDto[]>([]);
    currentFiles$ = this.currentFilesSubject.asObservable();

    private currentStandardFilesSubject = new BehaviorSubject<FileDto[]>([]);
    currentStandardFiles$ = this.currentStandardFilesSubject.asObservable();

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
          const standardDto = new LotoStandardDto({...standard});
          const currentStandards = this.allStandards.getValue();
          const existingStandardIndex = currentStandards.findIndex(s => s.id === standard.id);
          
          if (existingStandardIndex === -1) {
            // If the standard doesn't exist, add it to the array
            this.allStandards.next([...currentStandards, standardDto]);
          } else {
            // If the standard exists, update it in the array
            const updatedStandards = [...currentStandards];
            updatedStandards[existingStandardIndex] = standardDto;
            this.allStandards.next(updatedStandards);
          }
          
          // Always update the current standard
          this.currentStandardSubject.next(standardDto);
          this.setCurrentLotoPoint(lotoPoint);
          this.loadCurrentStandardFiles(standardDto.id);
        }),
        catchError((error) => {
          console.error('Error adding LOTO point to standard:', error);
          return of(null);
        })
      ).subscribe();
    }

    removeLotoPointFromStandard(lotoPointId: number) {
      const lotoStandardId = this.currentStandardSubject.getValue()?.id;
      if (!lotoStandardId) {
        console.error('No current LOTO standard selected');
        return;
      }
    
      this.lotoStandardService.removeLotoPointFromStandard(lotoPointId, lotoStandardId).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<LotoStandardDto>) => response.responseData),
        tap((standard: LotoStandardDto) => {
          const standardDto = new LotoStandardDto({...standard});
          const currentStandards = this.allStandards.getValue();
          const existingStandardIndex = currentStandards.findIndex(s => s.id === standard.id);
          
          if (existingStandardIndex !== -1) {
            // If the standard exists, update it in the array
            const updatedStandards = [...currentStandards];
            updatedStandards[existingStandardIndex] = standardDto;
            this.allStandards.next(updatedStandards);
          }
          
          // Always update the current standard
          this.currentStandardSubject.next(standardDto);
          this.loadCurrentStandardFiles(standardDto.id);
        }),
        catchError((error) => {
          console.error('Error removing LOTO point from standard:', error);
          return of(null);
        })
      ).subscribe();
    }

    setCurrentStandard(lotoStandardId: number) {
      if (lotoStandardId === null || lotoStandardId === 0) {
        this.currentStandardSubject.next(new LotoStandardDto());
      } else {
        this.lotoStandardService.getLotoStandardById(lotoStandardId).pipe(
          takeUntilDestroyed(this.destroyRef),
          map((response: SpringApiResponse<LotoStandardDto>) => response.responseData),
          catchError((error) => {
            console.error('Error fetching LOTO standard:', error);
            return of(null);
          })
        ).subscribe((standard: LotoStandardDto | null) => {
          if (standard) {
            this.currentStandardSubject.next(new LotoStandardDto(standard));
            this.loadCurrentStandardFiles(standard.id);
          } else {
            this.currentStandardSubject.next(new LotoStandardDto());
          }
        });
      }
    }

    getCurrentStandard(): Observable<LotoStandardDto | null> {
        return this.currentStandard$;
    }

    getCurrentLotoPoint(): Observable<LotoPointDto | null> {
      return this.currentLotoPoint$;
    }

    setCurrentLotoPoint(lotoPoint: LotoPointDto | null) {
      this.currentLotoPointSubject.next(lotoPoint);
      if (lotoPoint) {
        this.loadCurrentFiles(lotoPoint.id);
      } else {
        this.clearCurrentFileLinks();
      }
    }

    getCurrentFiles(): Observable<FileDto[]> {
      return this.currentFiles$;
    }

    getCurrentStandardFiles(): Observable<FileDto[]> {
      return this.currentStandardFiles$;
    }

    loadCurrentFiles(lotoPointId: number) {
      this.lotoPointService.getRelatedFiles(lotoPointId).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<FileDto[]>) => response.responseData),
        tap((files: FileDto[]) => {
          this.currentFilesSubject.next([...files]);
        }),
        catchError((error) => {
          console.error('Error fetching LOTO point file links:', error);
          this.currentFilesSubject.next([]);
          return of([]);
        })
      ).subscribe()
    }

    loadCurrentStandardFiles(lotoStandardId: number) {
      this.lotoStandardService.getRelatedFiles(lotoStandardId).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<FileDto[]>) => response.responseData),
        tap((files: FileDto[]) => {
          this.currentStandardFilesSubject.next([...files]);
        }),
        catchError((error) => {
          console.error('Error fetching LOTO standard file links:', error);
          this.currentStandardFilesSubject.next([]);
          return of([]);
        })
      ).subscribe();
    }

    addFileToCurrentStandardFiles(fileDto: FileDto) {
      const currentFiles = this.currentStandardFilesSubject.getValue();
      const fileExists = currentFiles.some(file => file.id === fileDto.id);
    
      if (!fileExists) {
        // If the file doesn't exist, add it to the array
        this.currentStandardFilesSubject.next([...currentFiles, fileDto]);
      } else {
        // If the file already exists, you might want to update it
        const updatedFiles = currentFiles.map(file => 
          file.id === fileDto.id ? fileDto : file
        );
        this.currentStandardFilesSubject.next(updatedFiles);
      }
    
      // console.log(`File ${fileExists ? 'updated' : 'added'} in current standard files:`, fileDto);
    }

    removeFileFromCurrentStandardFiles(fileId: number) {
      const currentFiles = this.currentStandardFilesSubject.getValue();
      const updatedFiles = currentFiles.filter(file => file.id!== fileId);
      this.currentStandardFilesSubject.next(updatedFiles);
    }

    clearCurrentFileLinks() {
      this.currentFilesSubject.next([]);
    }
}