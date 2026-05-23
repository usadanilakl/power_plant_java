import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, Subject, tap } from 'rxjs';
import { FileDto } from '../models/file/file.model';
import { EquipmentDto } from '../models/equipment/equipment.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { LotoPointDto } from '../models/loto/loto-point.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FileService } from './file.service';
import { EquipmentService } from './equipment.service';
import { RfLotoPointApiService } from '../features/loto-points/refactored/services/rf-loto-point-api.service';
import { RfFileApiService } from '../features/files/refactored/services/rf-file-api.service';
import { SyncUpdateService } from './sync/sync-update.service';

@Injectable({
  providedIn: 'root'
})
export class CurrentFileService {
    private fileService = inject(FileService);
    private equipmentService = inject(EquipmentService);
    private lotoPointApiService = inject(RfLotoPointApiService);
    private fileApiService = inject(RfFileApiService);
    private syncUpdateService = inject(SyncUpdateService);
    private destroyRef = inject(DestroyRef);
    private currentFileSubject = new BehaviorSubject<FileDto | null>(null);
    currentFile$: Observable<FileDto | null> = this.currentFileSubject.asObservable();

    private elementsSubject = new BehaviorSubject<EquipmentDto[]>([]);
    elements$ = this.elementsSubject.asObservable();

    private elementsToRenderSubject = new BehaviorSubject<EquipmentDto[]>([]);
    elementsToRender$ = this.elementsToRenderSubject.asObservable();

    private associatedLotoPointsSubject = new BehaviorSubject<LotoPointDto[]>([]);
    associatedLotoPoints$ = this.associatedLotoPointsSubject.asObservable();
    
    private uniqueEquipmentTypesSubject = new BehaviorSubject<string[]>([]);
    uniqueEquipmentTypes$ = this.uniqueEquipmentTypesSubject.asObservable();

    private equipmentNotSelectedByDefault = [];

    /**
     * File types loaded dynamically from the actual FileObject data via
     * GET /ng/files/distinct-types. This returns every fileType.name that has at
     * least one FileObject, so it matches what the table column filter shows.
     */
    private fileTypesSubject = new BehaviorSubject<string[]>([]);
    fileTypes$ = this.fileTypesSubject.asObservable();
    get fileTypes(): string[] {
      return this.fileTypesSubject.getValue();
    }

    private fileMapByTypeSubject = new BehaviorSubject<Map<string, FileDto[]>>(new Map());
    fileMapByType$ = this.fileMapByTypeSubject.asObservable();
    filesLoadedSubject = new BehaviorSubject<boolean>(false);
    filesLoaded$ = this.filesLoadedSubject.asObservable();
    private filesUpdtedSubject = new Subject<void>();
    filesUpdated$ = this.filesUpdtedSubject.asObservable();

    

    isProcessingFile = signal(false);
    
    constructor() {
      // Load file types from the actual data (distinct fileType.name values
      // across all FileObjects), NOT from the Value category table — the latter
      // only contains a subset of entries and misses types created directly on
      // FileObjects.
      this.loadDistinctFileTypes();

      // Refresh the type list when FileObject entities change via sync (a new
      // file with a previously-unseen fileType may have arrived).
      this.syncUpdateService.getEntityTypeUpdates$('FileObject').pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => this.loadDistinctFileTypes());

      this.subscribeToEquipmentUpdates();
      this.subscribeToLotoPointUpdates();
    }

    /** Fetch distinct fileType names from the data and trigger file loading
     *  if the list has changed. */
    private loadDistinctFileTypes(): void {
      this.fileApiService.getDistinctFileTypes().pipe(
        takeUntilDestroyed(this.destroyRef),
        map(res => res.responseData ?? [])
      ).subscribe(types => {
        const current = this.fileTypesSubject.getValue();
        const changed = types.length !== current.length
          || types.some((t, i) => t !== current[i]);
        if (!changed && current.length > 0) return;
        this.fileTypesSubject.next(types);
        this.loadAllFilesByType();
      });
    }

    /**
     * Subscribe to equipment updates from EquipmentService
     * This ensures all components displaying equipment get updated when any component saves changes
     */
    private subscribeToEquipmentUpdates(): void {
      this.equipmentService.equipmentUpdated$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(updatedEquipment => {
          console.log('[CurrentFileService] Equipment updated:', updatedEquipment.id);
          this.updateEquipmentInList(updatedEquipment);
        });

      this.equipmentService.equipmentDeleted$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(deletedId => {
          console.log('[CurrentFileService] Equipment deleted:', deletedId);
          this.removeEquipmentFromList(deletedId);
        });
    }

    /**
     * Subscribe to LOTO point updates from RfLotoPointApiService
     * This ensures all components displaying LOTO points get updated when any component saves changes
     */
    private subscribeToLotoPointUpdates(): void {
      this.lotoPointApiService.lotoPointUpdated$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(updatedLotoPoint => {
          console.log('[CurrentFileService] LOTO point updated:', updatedLotoPoint.id);
          this.updateAssociatedLotoPoint(updatedLotoPoint);
        });

      this.lotoPointApiService.lotoPointDeleted$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(deletedId => {
          console.log('[CurrentFileService] LOTO point deleted:', deletedId);
          this.removeLotoPointFromEquipment(deletedId);
        });
    }

    /**
     * Remove LOTO point from all equipment lists by ID
     */
    private removeLotoPointFromEquipment(lotoPointId: number): void {
      const updateEquipmentList = (equipmentList: EquipmentDto[]): EquipmentDto[] => {
        return equipmentList.map(equipment => {
          if (equipment.lotoPoints?.some(lp => lp.id === lotoPointId)) {
            return new EquipmentDto({
              ...equipment,
              lotoPoints: equipment.lotoPoints.filter(lp => lp.id !== lotoPointId)
            });
          }
          return equipment;
        });
      };

      this.elementsSubject.next(updateEquipmentList(this.elementsSubject.getValue()));
      this.elementsToRenderSubject.next(updateEquipmentList(this.elementsToRenderSubject.getValue()));

      // Update the current file if it exists
      const currentFile = this.currentFileSubject.getValue();
      if (currentFile && currentFile.points) {
        const updatedPoints = updateEquipmentList(currentFile.points);
        this.currentFileSubject.next(new FileDto({...currentFile, points: updatedPoints}));
      }

      // Update associatedLotoPointsSubject
      const currentLotoPoints = this.associatedLotoPointsSubject.getValue();
      this.associatedLotoPointsSubject.next(currentLotoPoints.filter(lp => lp.id !== lotoPointId));
    }

    /**
     * Remove equipment from all lists by ID
     */
    private removeEquipmentFromList(equipmentId: number): void {
      // Update elementsSubject
      const currentElements = this.elementsSubject.getValue();
      const updatedElements = currentElements.filter(eq => eq.id !== equipmentId);
      this.elementsSubject.next(updatedElements);

      // Update elementsToRenderSubject
      const currentToRender = this.elementsToRenderSubject.getValue();
      const updatedToRender = currentToRender.filter(eq => eq.id !== equipmentId);
      this.elementsToRenderSubject.next(updatedToRender);

      // Update the current file if it exists
      const currentFile = this.currentFileSubject.getValue();
      if (currentFile && currentFile.points) {
        const updatedPoints = currentFile.points.filter(eq => eq.id !== equipmentId);
        this.currentFileSubject.next(new FileDto({...currentFile, points: updatedPoints}));
      }
    }
  
    private loadAllFilesByType(): void {
      const types = this.fileTypes;
      if (types.length === 0) {
        this.fileMapByTypeSubject.next(new Map());
        this.filesLoadedSubject.next(true);
        return;
      }
      const fileObservables = types.map(type =>
        this.fileService.getByFileType(type).pipe(
          map(response => ({ type, files: response.responseData }))
        )
      );

      forkJoin(fileObservables).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(results => {
        const fileMap = new Map<string, FileDto[]>();
        results.forEach(result => {
          fileMap.set(result.type, result.files);
        });
        this.fileMapByTypeSubject.next(fileMap);
        this.filesLoadedSubject.next(true);
      });
    }

    /**
     * Look up files by type. Case-insensitive — the map is keyed by the actual
     * DB fileType.name (e.g. "PID", "P&ID", "Electrical Panel Schedule"), so
     * callers passing legacy lowercase strings ('pid', 'elect') still work, and
     * substring matches (e.g. 'pid' matching 'P&ID') are allowed.
     */
    getFilesByType(type: string): FileDto[] {
      const map = this.fileMapByTypeSubject.getValue();
      // Exact key first
      if (map.has(type)) return map.get(type) ?? [];
      // Case-insensitive / substring fallback
      const lower = type.toLowerCase();
      for (const [key, files] of map.entries()) {
        if (key && key.toLowerCase().includes(lower)) {
          return files ?? [];
        }
      }
      return [];
    }

    /**
     * Public method to refresh all files from the server
     * Reloads all file types and notifies listeners
     */
    refreshFiles(): void {
      this.filesLoadedSubject.next(false);
      this.loadAllFilesByType();
    }

  

    setCurrentFile(file: FileDto | null): void {
        // If no file is provided, clear everything
        if (!file) {
            this.currentFileSubject.next(null);
            this.elementsSubject.next([]);
            this.uniqueEquipmentTypesSubject.next([]);
            this.updateElementsToRender(this.equipmentNotSelectedByDefault);
            return;
        }

        // Check if switching to a different file - clear equipment immediately
        const currentFileId = this.currentFileSubject.getValue()?.id;
        if (currentFileId && currentFileId !== file.id) {
            this.elementsSubject.next([]);
            this.elementsToRenderSubject.next([]);
        }

        // Check if file has incomplete data (missing points but has an ID)
        const isIncompleteDto = file.id && (!file.points || file.points.length === 0);

        if (isIncompleteDto) {
            // Update current file immediately (before async fetch) so components know which file we're on
            this.currentFileSubject.next(file);

            // Fetch the complete file data from server
            this.fileService.getFileById(file.id.toString()).pipe(
                takeUntilDestroyed(this.destroyRef),
                map(response => FileDto.fromJson(response.responseData))
            ).subscribe({
                next: (completeFile) => {
                    this.setFileData(completeFile);
                },
                error: (error) => {
                    console.error('Error fetching complete file data:', error);
                    // Fall back to using the incomplete file
                    this.setFileData(file);
                }
            });
        } else {
            // File already has complete data, use it directly
            this.setFileData(file);
        }
    }

    /**
     * Internal helper method to set file data and update all subjects
     */
    private setFileData(file: FileDto): void {
        this.currentFileSubject.next(file);

        // Extract elements from the points field
        const elements: EquipmentDto[] = file?.points || [];
        this.elementsSubject.next(elements);

        if (file && file.points) {
            const uniqueTypes = this.getUniqueEqTypes();
            this.uniqueEquipmentTypesSubject.next(uniqueTypes);
        } else {
            this.uniqueEquipmentTypesSubject.next([]);
        }

        this.updateElementsToRender(this.equipmentNotSelectedByDefault);
    }

    saveFile(formDataToSend: FormData): Observable<FileDto> {
      this.isProcessingFile.set(true);
      return this.fileService.updateFile(formDataToSend).pipe(
        map((response: SpringApiResponse<FileDto>) => FileDto.fromJson(response.responseData)),
        tap(updatedFile => {
            // Update the current file with the updated data
            this.setCurrentFile(updatedFile);
            this.updateMapByType(updatedFile.fileType.name ?? '', updatedFile);
            this.isProcessingFile.set(false);
        })
      );
    }

    /**
     * Update the file map by type and notify listeners
     * Public method to allow other services to trigger file list updates
     */
    updateMapByType(type: string, file: FileDto): void {
      const types = this.fileTypes;
      const matchedType = types.find(t => type.toLowerCase().includes(t.toLowerCase()));

      // Prefer a matching known type; if none match, fall back to the first available
      // type so the file still shows up somewhere. If no types are loaded yet, bail.
      const targetType = matchedType || types[0];
      if (!targetType) {
        return;
      }

      const currentFilesByType = this.getFilesByType(targetType);
      const updatedFilesByType = currentFilesByType.filter(f => f.id !== file.id);
      updatedFilesByType.push(file);

      const currentMap = this.fileMapByTypeSubject.getValue();
      const newMap = new Map(currentMap);
      newMap.set(targetType, updatedFilesByType);

      this.fileMapByTypeSubject.next(newMap);
      this.filesUpdtedSubject.next();
    }



    setElementsToRender(elements: EquipmentDto[]): void {
        this.elementsToRenderSubject.next(elements);
    }

    addElementToRenderedArray(element: EquipmentDto): void {
        const currentElements = this.elementsToRenderSubject.getValue();
        const updatedElements = [...currentElements, element];
        this.elementsToRenderSubject.next(updatedElements);
    }

    getCurrentFile(): FileDto | null {
        return this.currentFileSubject.getValue();
    }

    getElements(): Observable<EquipmentDto[]> {
        return this.elements$;
    }

    getUniqueEquipmentTypes(): Observable<string[]> {
        return this.uniqueEquipmentTypes$;
    }

    clearCurrentFile(): void {
        this.currentFileSubject.next(null);
        this.elementsSubject.next([]);
    }

    getElementsToRender(): Observable<EquipmentDto[]> {
        return this.elementsToRender$;
    }

    getAssociatedLotoPoints(): Observable<LotoPointDto[]> {
      return this.elementsToRender$.pipe(
        takeUntilDestroyed(this.destroyRef),
        map(items => items.flatMap(item => item.lotoPoints || [])),
        map(lotoPoints => lotoPoints.filter((point): point is LotoPointDto => point !== null && point !== undefined)),
        map(lotoPoints => {
          const uniqueMap = new Map<number, LotoPointDto>();
          lotoPoints.forEach(point => {
            if (!uniqueMap.has(point.id)) {
              uniqueMap.set(point.id, point);
            }
          });
          return Array.from(uniqueMap.values());
        })
      );
    }
  updateLocalLotoPoints(updatedLotoPoints: LotoPointDto[]): void {
    // console.log('Updating local LOTO points:', updatedLotoPoints);
  
    // Update associatedLotoPointsSubject
    const currentLotoPoints = this.associatedLotoPointsSubject.getValue();
    const updatedLotoPointsArray = currentLotoPoints.map(point => {
      const updatedPoint = updatedLotoPoints.find(up => up.id === point.id);
      return updatedPoint || point;
    });
    this.associatedLotoPointsSubject.next([...updatedLotoPointsArray]);
  
    // Update elementsToRenderSubject
    const currentElements = this.elementsToRenderSubject.getValue();
    const updatedElements = currentElements.map(element => {
      if (element.lotoPoints && element.lotoPoints.length > 0) {
        const updatedLotoPointsForElement = element.lotoPoints.map(lotoPoint => {
          const updatedPoint = updatedLotoPoints.find(up => up.id === lotoPoint.id);
          return updatedPoint || lotoPoint;
        });
        return new EquipmentDto({...element, lotoPoints: updatedLotoPointsForElement});
      }
      return element;
    });
    this.elementsToRenderSubject.next(updatedElements);
  
    // Update the current file if it exists
    const currentFile = this.currentFileSubject.getValue();
    if (currentFile && currentFile.points) {
      const updatedPoints = currentFile.points.map(point => {
        if (point.lotoPoints && point.lotoPoints.length > 0) {
          const updatedLotoPointsForPoint = point.lotoPoints.map(lotoPoint => {
            const updatedPoint = updatedLotoPoints.find(up => up.id === lotoPoint.id);
            return updatedPoint || lotoPoint;
          });
          return new EquipmentDto({...point, lotoPoints: updatedLotoPointsForPoint});
        }
        return point;
      });
      this.currentFileSubject.next(new FileDto({...currentFile, points: updatedPoints}));
    }
  }
    updateAssociatedLotoPoint(updatedLotoPoint: LotoPointDto): void {
      // Update associatedLotoPointsSubject
      this.associatedLotoPointsSubject.next(
        this.associatedLotoPointsSubject.getValue().map(point =>
          point.id === updatedLotoPoint.id ? updatedLotoPoint : point
        )
      );
    
      // Update elementsSubject and elementsToRenderSubject
      const updateEquipmentList = (equipmentList: EquipmentDto[]): EquipmentDto[] => {
        return equipmentList.map(equipment => {
          if (equipment.lotoPoints?.some(lp => lp.id === updatedLotoPoint.id)) {
            return new EquipmentDto({
              ...equipment,
              lotoPoints: equipment.lotoPoints.map(lp =>
                lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp
              )
            });
          }
          return equipment;
        });
      };
    
      this.elementsSubject.next(updateEquipmentList(this.elementsSubject.getValue()));
      this.elementsToRenderSubject.next(updateEquipmentList(this.elementsToRenderSubject.getValue()));
    
      // Update the current file if it exists
      const currentFile = this.currentFileSubject.getValue();
      if (currentFile && currentFile.points) {
        const updatedPoints = updateEquipmentList(currentFile.points);
        this.currentFileSubject.next(new FileDto({...currentFile, points: updatedPoints}));
      }
    }

    updateEquipmentInList(updatedEquipment: EquipmentDto) {
      const currentFileId = this.currentFileSubject.getValue()?.id;
      const equipmentFileId = updatedEquipment.mainFileId || updatedEquipment.mainFileObject?.id;

      // Only process if equipment belongs to current file
      if (currentFileId && equipmentFileId !== currentFileId) {
        return;
      }

      // Helper to update or add equipment in a list
      const updateOrAddEquipment = (equipmentList: EquipmentDto[]): EquipmentDto[] => {
        const existingIndex = equipmentList.findIndex(item => item.id === updatedEquipment.id);
        if (existingIndex >= 0) {
          // Update existing
          return equipmentList.map(item =>
            item.id === updatedEquipment.id ? updatedEquipment : item
          );
        } else {
          // Add new equipment
          return [...equipmentList, updatedEquipment];
        }
      };

      // Update elementsSubject
      const currentElements = this.elementsSubject.getValue();
      this.elementsSubject.next(updateOrAddEquipment(currentElements));

      // Update elementsToRender$
      const currentToRender = this.elementsToRenderSubject.getValue();
      this.elementsToRenderSubject.next(updateOrAddEquipment(currentToRender));

      // Update the current file if it exists
      const currentFile = this.currentFileSubject.getValue();
      if (currentFile && currentFile.points) {
        const updatedPoints = updateOrAddEquipment(currentFile.points);
        this.currentFileSubject.next(new FileDto({...currentFile, points: updatedPoints}));
      }
    }

    updateRenderedEquipment(updatedEquipment: EquipmentDto[]): void {
      // console.log('Updating rendered equipment:', updatedEquipment);
    
      // Update elementsToRenderSubject
      const currentElements = this.elementsToRenderSubject.getValue();
      const updatedElements = currentElements.map(element => {
        const updatedElement = updatedEquipment.find(ue => ue.id === element.id);
        return updatedElement || element;
      });
      this.elementsToRenderSubject.next(updatedElements);
    
      // Update elementsSubject
      const allElements = this.elementsSubject.getValue();
      const updatedAllElements = allElements.map(element => {
        const updatedElement = updatedEquipment.find(ue => ue.id === element.id);
        return updatedElement || element;
      });
      this.elementsSubject.next(updatedAllElements);
    
      // Update the current file if it exists
      const currentFile = this.currentFileSubject.getValue();
      if (currentFile && currentFile.points) {
        const updatedPoints = currentFile.points.map(point => {
          const updatedPoint = updatedEquipment.find(ue => ue.id === point.id);
          return updatedPoint || point;
        });
        this.currentFileSubject.next(new FileDto({...currentFile, points: updatedPoints}));
      }
    
      // Update associatedLotoPointsSubject
      const currentLotoPoints = this.associatedLotoPointsSubject.getValue();
      const updatedLotoPoints = currentLotoPoints.map(lotoPoint => {
        const updatedEquipmentWithLotoPoint = updatedEquipment.find(ue => 
          ue.lotoPoints && ue.lotoPoints.some(lp => lp.id === lotoPoint.id)
        );
        if (updatedEquipmentWithLotoPoint) {
          return updatedEquipmentWithLotoPoint.lotoPoints!.find(lp => lp.id === lotoPoint.id) || lotoPoint;
        }
        return lotoPoint;
      });
      this.associatedLotoPointsSubject.next(updatedLotoPoints);
    }
    private filterByEquipmentType(exclude: string[]): EquipmentDto[] {
      const currentElements = this.elementsSubject.getValue();
      return currentElements.filter(element => {
        if (!element) return false;

        // If equipment has no eqType or eqType.name, include it (don't filter it out)
        if (!element.eqType || !element.eqType.name) return true;

        // Only exclude if the type is in the exclude list
        return !exclude.includes(element.eqType.name.toLowerCase());
      });
    }
    
    // Public method for components to call
    updateElementsToRender(excludeTypes: string[]): void {
      const filteredElements = this.filterByEquipmentType(excludeTypes);
      this.elementsToRenderSubject.next(filteredElements);
    }

    private getUniqueEqTypes(): string[] {
      const elements = this.elementsSubject.getValue();
      const uniqueEqTypes = new Set(
        elements.map(el => {
          if (!el || !el.eqType || !el.eqType.name) {
            return 'Unknown';
          }
          return el.eqType.name;
        })
      );
      return Array.from(uniqueEqTypes);
    }
    
    switchFileFormat(extension: string): void {
      const currentFile = this.currentFileSubject.getValue();
      if (!currentFile) return;

      if(!currentFile.extensions.includes(extension)) return;

      const currentExtension: string = currentFile.fileLink.split('.').pop() || '';
    
      // Create a new FileDto instance
      const newFile = new FileDto({
        ...currentFile,
        extension: extension,
        fileLink: this.updateFileLink(currentFile.fileLink, currentExtension, extension)
      });
    
      // Update the current file
      this.currentFileSubject.next(newFile);
    }
    
    private updateFileLink(fileLink: string, oldExtension: string, newExtension: string): string {
      if (!fileLink.endsWith(oldExtension)) {
        console.warn('Current file link does not end with the expected extension');
        return fileLink;
      }
    
      return fileLink.replaceAll(oldExtension, newExtension);
    }

}