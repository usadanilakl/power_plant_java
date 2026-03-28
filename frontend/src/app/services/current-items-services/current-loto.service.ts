import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { LotoService } from "../loto/loto.service";
import { BehaviorSubject, catchError, EMPTY, map, Observable, of, tap } from "rxjs";
import { LotoDto } from "../../models/loto/loto.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { SpringPaginatedResponse } from "../../models/api/spring-pagenated.response.model";
import { LotoPointDto } from "../../models/loto/loto-point.model";
import { FileDto } from "../../models/file/file.model";
import { LotoPointService } from "../loto/loto-point.service";
import { PrintableFormService } from "../forms/printable-form.service";
import { PrintableFormDto } from "../../models/forms/printable-form.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentLotoService{
    private lotoService = inject(LotoService);
    private lotoPointService = inject(LotoPointService);
    private printableFormService = inject(PrintableFormService);
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

    private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    paperForm$ = this.paperFormSubject.asObservable();
  
    isPaperViewActive = signal<boolean>(false);
    selectedItem = toSignal(this.currentLotoSubject.asObservable(), { initialValue: new LotoDto() });

    constructor() {
        this.loadLotosFromServer();
        this.loadPaperForm();
    }

    private normalizeLoto(item: Partial<LotoDto> | null | undefined): LotoDto {
      return item ? LotoDto.fromJson(item) : new LotoDto();
    }

    private normalizeLotos(items: Partial<LotoDto>[] | null | undefined): LotoDto[] {
      return (items ?? []).map(item => this.normalizeLoto(item));
    }

    private normalizePaperForm(item: Partial<PrintableFormDto> | null | undefined): PrintableFormDto {
      return item ? PrintableFormDto.fromJson(item) : new PrintableFormDto();
    }

    private loadLotosFromServer() {
        this.lotoService.getLotos().pipe(
            takeUntilDestroyed(this.destroyRef),
            map((response: SpringPaginatedResponse<LotoDto>) => this.normalizeLotos(response.responseData.content || []))
        ).subscribe((lotos: LotoDto[]) => {
            this.allLotosSubject.next(lotos);
        });
    }
    private loadPaperForm() {
        this.printableFormService.getPrimaryFormByType('Loto').pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
                console.error('Error loading paper form:', err);
                return of(null);
            })
        ).subscribe(response => {
            if (response && response.responseData) {
                this.paperFormSubject.next(this.normalizePaperForm(response.responseData));
                // console.log('Paper form loaded:', response.responseData);
            }
        });
    }

    switchFormView() {
        this.isPaperViewActive.set(!this.isPaperViewActive());
    }

    setCurrentLoto(loto: LotoDto | null) {
      if(loto && loto.id && loto.id!=0){
        this.setCurrentLotoById(loto.id);
      }else{
        this.currentLotoSubject.next(new LotoDto());
      }
    }

    setCurrentLotoById(id: number) {
        this.lotoService.getLotoById(id.toString()).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<LotoDto>) => this.normalizeLoto(response.responseData))
      ).subscribe((lotoFromServer: LotoDto) => {
        if(lotoFromServer){
          const lotoDto = this.normalizeLoto(lotoFromServer);
          this.currentLotoSubject.next(lotoDto);
          this.loadCurrentLotoFiles(lotoDto.id);
        }
      });
    }

    addLotoPointToCurrentLoto(pointId: number) {
        // Add the point to the current loto
        if(this.currentLotoSubject.value) {
            // Save the changes to the server
            this.lotoService.addLotoPointToLoto(pointId, this.currentLotoSubject.value.id).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe((response: SpringApiResponse<LotoDto>) => {
                // Update the current loto
                const receivedLoto = this.normalizeLoto(response.responseData);
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
              const receivedLoto = this.normalizeLoto(response.responseData);
              this.updateLotoInList(receivedLoto);
              this.currentLotoSubject.next(receivedLoto);
              this.loadCurrentLotoFiles(receivedLoto.id);
          });
      }
    }

    addLotoToList(loto: LotoDto) {
      const currentLotos = this.allLotosSubject.value;
      this.allLotosSubject.next([...currentLotos, loto]);
    }

    removeLotoFromList(id: number) {
      const currentLotos = this.allLotosSubject.value;
      this.allLotosSubject.next(currentLotos.filter(l => l.id !== id));
    }

    deleteLoto(id: number) {
      this.lotoService.deleteLoto(id.toString()).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error deleting LOTO:', error);
          return EMPTY;
        })
      ).subscribe(() => {
        this.loadLotosFromServer();
        this.currentLotoSubject.next(null);
      });
    }

    updateLotoInList(loto: LotoDto) {
        const currentLotos = this.allLotosSubject.value;
        const updatedLotos = currentLotos.map(l => l.id === loto.id? loto : l);
        this.allLotosSubject.next(updatedLotos);
    }

    updateLotosInList(lotos: LotoDto[]) {
      const currentLotos = this.allLotosSubject.value;
      const updatedLotos = currentLotos.map(l => {
        const foundLoto = lotos.find(loto => loto.id === l.id);
        return foundLoto ? foundLoto : l;
      });
      this.allLotosSubject.next(updatedLotos);
    }

    processLotoChanges(lotoDto: LotoDto) {
      if(!lotoDto) return;
      const lotoIdDto = new LotoDto(lotoDto).toIdModel();
      this.lotoService.updateLoto(lotoIdDto).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((response: SpringApiResponse<LotoDto>) => {
        if(response){
            const receivedLoto = this.normalizeLoto(response.responseData);
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
              updatedStandards[existingStandardIndex] = this.normalizeLoto(response.responseData);
              this.allLotosSubject.next(updatedStandards);
            }

            this.currentLotoSubject.next(this.normalizeLoto(response.responseData));
            this.loadCurrentLotoFiles(currentStandardId);
          }
        }),
        catchError((error) => {
          console.error('Error reordering LOTO points:', error);
          return of(null);
        })
      ).subscribe();
    }

    
    importLotos(file: File) {
      this.lotoService.importLotos(file).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error importing LOTOs:', error);
          return of(null);
        })
      ).subscribe(response => {
        if (response?.responseData) {
          const current = this.allLotosSubject.value;
          const imported = this.normalizeLotos(response.responseData);
          this.allLotosSubject.next([...imported, ...current]);
        }
      });
    }

    save(form: LotoDto[]) {
      if (!form.length) {
        console.error('No LOTOs provided');
        return;
      }
      this.lotoService.save(form).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if(response && response.responseData){
            this.updateLotosInList(this.normalizeLotos(response.responseData));
          }
        }),
        catchError((error) => {
          console.error('Error saving LOTOs:', error);
          return of(null);
        })
      ).subscribe();
    }


}
