

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { EquipmentService } from '../../../../services/equipment.service';
import { FileService } from '../../../../services/file.service';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { FileDto } from '../../../../models/file/file.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfEquipmentEditorStateService } from './rf-equipment-editor-state.service';
import { LotoPointService } from '../../../../services/loto/loto-point.service';

@Injectable()
export class RfEquipmentEditorDataService {
  private equipmentService = inject(EquipmentService);
  private fileService = inject(FileService);
  private lotoPointService = inject(LotoPointService);
  private stateService = inject(RfEquipmentEditorStateService);

  /**
   * Load equipment and its associated file
   */
  loadEquipmentAndFile(equipmentId: number): Observable<void> {
    this.stateService.setLoading(true);
    this.stateService.setError(null);

    return this.equipmentService.getEquipmentById(equipmentId).pipe(
      tap(response => {
        const equipment = response?.responseData ? new EquipmentDto(response.responseData) : null;
        if (equipment) {
          this.stateService.setSelectedEquipment(equipment);
        }
      }),
      switchMap(response => {
        const equipment = response?.responseData ? new EquipmentDto(response.responseData) : null;
        if (!equipment) {
          throw new Error('Equipment not found');
        }
        return this.getPrimaryFile(equipment);
      }),
      tap(file => {
        if (!file || !file.id) {
          throw new Error('No file associated with this equipment');
        }
      }),
      switchMap(file => this.loadFileAndEquipment(file!.id!)),
      catchError(error => {
        this.stateService.setError(error.message || 'Failed to load equipment');
        this.stateService.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load file details and all equipment on that file
   */
  private loadFileAndEquipment(fileId: number): Observable<void> {
    return forkJoin({
      file: this.fileService.getFileById(fileId.toString()).pipe(
        map(response => response?.responseData ? new FileDto(response.responseData) : null)
      ),
      equipment: this.fileService.getEquipmentByFileId(fileId).pipe(
        map(response => {
          if (response?.responseData) {
            // Handle both array and paginated response
            const data = Array.isArray(response.responseData) 
              ? response.responseData 
              : response.responseData || [];
            return data.map((eq: any) => new EquipmentDto(eq));
          }
          return [];
        })
      )
    }).pipe(
      tap(result => {
        if (result.file) {
          this.stateService.setCurrentFile(result.file);
        }
        this.stateService.setAllEquipment(result.equipment || []);
        this.stateService.setLoading(false);
      }),
      map(() => void 0),
      catchError(error => {
        this.stateService.setError('Failed to load file data');
        this.stateService.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get the primary file for an equipment
   * Returns an Observable that resolves to FileDto or null
   */
  private getPrimaryFile(equipment: EquipmentDto): Observable<FileDto | null> {
    // If mainFileObject exists, return it immediately
    if (equipment.mainFileObject) {
      return of(new FileDto(equipment.mainFileObject));
    }
    
    // If mainFileId exists, fetch the file from the server
    if (equipment.mainFileId) {
      return this.fileService.getFileById(equipment.mainFileId.toString()).pipe(
        map(response => response?.responseData ? new FileDto(response.responseData) : null),
        catchError(error => {
          console.error('Error fetching file by mainFileId:', error);
          return of(null);
        })
      );
    }

    // No file found
    return of(null);
  }

  /**
   * Update equipment coordinates
   */
  updateEquipmentCoordinates(equipment: EquipmentDto): Observable<any> {
    return this.equipmentService.updateEquipment(equipment).pipe(
      tap(response => {
        if (response?.responseData) {
          this.stateService.updateEquipmentInList(new EquipmentDto(response.responseData));
        }
      }),
      catchError(error => {
        console.error('Error updating equipment:', error);
        return of(null);
      })
    );
  }

  /**
   * Update a loto point
   */
  updateLotoPoint(lotoPoint: LotoPointDto): Observable<any> {
    return this.lotoPointService.updateLotoPoint(lotoPoint).pipe(
      tap(response => {
        if (response?.responseData) {
          this.stateService.updateLotoPointInEquipment(new LotoPointDto(response.responseData));
        }
      }),
      catchError(error => {
        console.error('Error updating loto point:', error);
        return of(null);
      })
    );
  }

  /**
   * Delete a loto point
   */
  deleteLotoPoint(lotoPointId: number): Observable<any> {
    return this.lotoPointService.deleteLotoPoint(lotoPointId.toString()).pipe(
      tap(response => {
        if (response) {
          this.stateService.removeLotoPointFromEquipment(lotoPointId);
        }
      }),
      catchError(error => {
        console.error('Error deleting loto point:', error);
        return of(null);
      })
    );
  }

  /**
   * Create a new loto point
   */
  createLotoPoint(lotoPoint: LotoPointDto): Observable<any> {
    return this.lotoPointService.createLotoPoint(lotoPoint).pipe(
      tap(response => {
        if (response?.responseData) {
          const newLotoPoint = new LotoPointDto(response.responseData);
          this.stateService.updateLotoPointInEquipment(newLotoPoint);
        }
      }),
      catchError(error => {
        console.error('Error creating loto point:', error);
        return of(null);
      })
    );
  }
}