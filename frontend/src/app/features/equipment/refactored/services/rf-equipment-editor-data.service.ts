
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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
      tap(equipment => {
        this.stateService.setSelectedEquipment(equipment);
      }),
      map(equipment => this.getPrimaryFile(equipment)),
      tap(file => {
        if (!file || !file.id) {
          throw new Error('No file associated with this equipment');
        }
      }),
      map(file => file!.id!),
      catchError(error => {
        this.stateService.setError(error.message || 'Failed to load equipment');
        this.stateService.setLoading(false);
        return throwError(() => error);
      }),
      // Load file and all equipment on that file
      tap(fileId => this.loadFileAndEquipment(fileId).subscribe())
    );
  }

  /**
   * Load file details and all equipment on that file
   */
  private loadFileAndEquipment(fileId: number): Observable<void> {
    return forkJoin({
      file: this.fileService.getFileById(fileId),
      equipment: this.fileService.getEquipmentByFileId(fileId)
    }).pipe(
      tap(result => {
        this.stateService.setCurrentFile(result.file);
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
   * Get the primary file for an equipment (PID > HT ISO > Parent's file)
   */
  private getPrimaryFile(equipment: EquipmentDto): FileDto | null {
    if (equipment.pid && equipment.pid.length > 0) {
      return equipment.pid[0];
    }
    
    if (equipment.htIso) {
      return equipment.htIso;
    }

    if (equipment.parentEquipment) {
      return this.getPrimaryFile(equipment.parentEquipment);
    }

    return null;
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
    return this.lotoPointService.deleteLotoPoint(lotoPointId+"").pipe(
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
