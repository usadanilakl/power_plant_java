import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, take } from 'rxjs';
import { FileDto } from '../models/file/file.model';
import { EquipmentDto } from '../models/equipment/equipment.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { LotoPointDto } from '../models/loto/loto-point.model';

@Injectable({
  providedIn: 'root'
})
export class CurrentFileService {
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

    private equipmentNotSelectedByDefault = ['connector', 'instrument', 'line'];


    setCurrentFile(file: FileDto | null): void {
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

    setElementsToRender(elements: EquipmentDto[]): void {
        this.elementsToRenderSubject.next(elements);
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
      // Update elementsSubject
      this.elementsSubject.pipe(
        take(1),
        map(equipmentList => equipmentList.map(item => 
          item.id === updatedEquipment.id ? updatedEquipment : item
        ))
      ).subscribe(updatedList => {
        this.elementsSubject.next(updatedList);
      });
    
      // Update elementsToRender$
      this.elementsToRender$.pipe(
        take(1),
        map(equipmentList => equipmentList.map(item => 
          item.id === updatedEquipment.id ? updatedEquipment : item
        ))
      ).subscribe(updatedList => {
        this.elementsToRenderSubject.next(updatedList);
      });
    
      // Update the current file if it exists
      const currentFile = this.currentFileSubject.getValue();
      if (currentFile && currentFile.points) {
        const updatedPoints = currentFile.points.map(item => 
          item.id === updatedEquipment.id ? updatedEquipment : item
        );
        this.currentFileSubject.next(new FileDto({...currentFile, points: updatedPoints}));
      }
    }

    private filterByEquipmentType(exclude: string[]): EquipmentDto[] {
      const currentElements = this.elementsSubject.getValue();
      return currentElements.filter(element => 
        element && element.eqType && element.eqType.name && 
        !exclude.includes(element.eqType.name.toLowerCase())
      );
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