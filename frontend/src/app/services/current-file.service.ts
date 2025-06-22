import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FileDto } from '../models/file/file.model';
import { EquipmentDto } from '../models/equipment/equipment.model';

@Injectable({
  providedIn: 'root'
})
export class CurrentFileService {
    private currentFileSubject = new BehaviorSubject<FileDto | null>(null);
    currentFile$: Observable<FileDto | null> = this.currentFileSubject.asObservable();

    private elementsSubject = new BehaviorSubject<EquipmentDto[]>([]);
    elements$ = this.elementsSubject.asObservable();

    setCurrentFile(file: FileDto | null): void {
        this.currentFileSubject.next(file);
          
        // Extract elements from the points field
        const elements: EquipmentDto[] = file?.points || [];
        this.elementsSubject.next(elements);
    }

    getCurrentFile(): FileDto | null {
        return this.currentFileSubject.getValue();
    }

    getElements(): Observable<EquipmentDto[]> {
        return this.elements$;
    }

    clearCurrentFile(): void {
        this.currentFileSubject.next(null);
        this.elementsSubject.next([]);
    }
}