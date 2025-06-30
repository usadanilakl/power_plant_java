import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, take } from 'rxjs';
import { FileDto } from '../models/file/file.model';
import { EquipmentDto } from '../models/equipment/equipment.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

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
      // console.log('Filtering elements by type:', exclude);
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
    
      // Create a new FileDto instance
      const newFile = new FileDto({
        ...currentFile,
        extension: extension,
        fileLink: this.updateFileLink(currentFile.fileLink, currentFile.extension, extension)
      });
    
      // Update the current file
      this.currentFileSubject.next(newFile);
    }
    
    private updateFileLink(fileLink: string, oldExtension: string, newExtension: string): string {
      // Ensure the old extension is at the end of the file link
      if (!fileLink.endsWith(oldExtension)) {
        console.warn('Current file link does not end with the expected extension');
        return fileLink;
      }
    
      return fileLink.replaceAll(oldExtension, newExtension);
    }

}