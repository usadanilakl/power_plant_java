import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EquipmentDto } from '../../models/equipment/equipment.model';
import { EquipmentService } from '../equipment.service';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { Shape } from '../../models/shape.model';
import { LotoPointService } from '../loto/loto-point.service';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { DataPresetDto } from '../../models/equipment/data-preset.model';

@Injectable({
  providedIn: 'root'
})
export class CurrentEquipmentService {

    private equipmentService = inject(EquipmentService);
    private lotoPointService = inject(LotoPointService);

    constructor() { }

    private allShapesSubject = new BehaviorSubject<Shape[]>([]);
    allShapes$ = this.allShapesSubject.asObservable();

    //shape comes from client-side
    private shapeSubject = new BehaviorSubject<Shape | null>(null);
    currentShape$ = this.shapeSubject.asObservable();

    //using id from shape object Equipment will be fetched from backend
    private currentEquipmentSubject = new BehaviorSubject<EquipmentDto | null>(null);
    currentEquipment$: Observable<EquipmentDto | null> = this.currentEquipmentSubject.asObservable();

    //Equipment object contains loto points
    private lotoPointSubject = new BehaviorSubject<LotoPointDto[]>([]);
    lotoPoints$ = this.lotoPointSubject.asObservable();

    //Using tag-number and description of current equipment search db for related equipment
    private relatedEquipmentSubject = new BehaviorSubject<EquipmentDto[]>([]);
    relatedEquipment$ = this.relatedEquipmentSubject.asObservable();

    //Using tag-number and description of current equipment search db for related loto points
    private relatedLotoPointsSubject = new BehaviorSubject<LotoPointDto[]>([]);
    relatedLotoPoints$ = this.relatedLotoPointsSubject.asObservable();

    private currentPresetDataSubject = new BehaviorSubject<EquipmentDto>(new EquipmentDto());
    currentPresetData$: Observable<EquipmentDto> = this.currentPresetDataSubject.asObservable();

    setCurrentShape(shape: Shape | null): void {
      this.shapeSubject.next(shape);
      if (shape && shape.id) {
        this.fetchEquipmentById(shape.id);
      } else {
        this.clearCurrentEquipment();
      }
    }
    
    setCurrentShapeWithId(shapeId: number | null): void {
      if (shapeId === null) {
        this.setCurrentShape(null);
        return;
      }
    
      // Find the shape with the given ID from the current shapes
      const shape = this.allShapesSubject.getValue()?.find(s => s.id === shapeId) || null;
    
      if (shape) {
        this.setCurrentShape(shape);
      } else {
        // If the shape is not found in the current set, create a minimal shape object
        // const minimalShape: Shape = { id: shapeId, type: 'rectangle' };
        // this.setCurrentShape(minimalShape);
      }
    
      // Fetch the equipment data regardless of whether we found the shape or not
      this.fetchEquipmentById(shapeId);
    }

    private fetchEquipmentById(id: number): void {
      this.equipmentService.getEquipmentById(id).subscribe(
        response => {
          if (response.responseData) {
            this.setCurrentEquipment(response.responseData);
          }
        },
        error => {
          console.error('Error fetching equipment:', error);
          this.clearCurrentEquipment();
        }
      );
    }

    setCurrentEquipment(eq: EquipmentDto | null): void {
      this.currentEquipmentSubject.next(new EquipmentDto(eq || new EquipmentDto()));
      if (eq) {
        this.lotoPointSubject.next(eq.lotoPoints);
        this.fetchRelatedEquipmentAndLotoPoints(eq);
      } else {
        this.clearCurrentEquipment();
      }
    }

    private fetchRelatedEquipmentAndLotoPoints(equipment: EquipmentDto): void {
      if(!equipment ||!equipment.tagNumber || equipment.tagNumber.trim()==='') {
        this.relatedEquipmentSubject.next([]);
        this.relatedLotoPointsSubject.next([]);
        return;
      }
      const equipmentSearchCriteria: SearchCriteria = {
        type: 'global',
        query: equipment.tagNumber,
        filters: {
          'tagNumber': equipment.tagNumber,
          'description': equipment.description
        },
        page: 1
      };
    
      this.equipmentService.searchEqByBaseTagNumber(equipmentSearchCriteria, 1, 50).subscribe(
        response => {
          if (response.responseData) {
            this.relatedEquipmentSubject.next(response.responseData.content);
            console.log('Related equipment fetched successfully:', response.responseData.content);
          }
        },
        error => console.error('Error fetching related equipment:', error)
      );
    
      // Fetch related LOTO points
      const lotoPointSearchCriteria: SearchCriteria = {
        type: 'global',
        query: equipment.tagNumber,
        filters: {
          'tagNumber': equipment.tagNumber,
          'description': equipment.description
        },
        page: 1
      };
    
      this.lotoPointService.searchLpByBaseTagNumber(lotoPointSearchCriteria, 50).subscribe(
        response => {
          if (response.responseData) {
            this.relatedLotoPointsSubject.next(response.responseData.content);
            console.log('Related LOTO points fetched successfully:', response.responseData.content);
          }
        },
        error => console.error('Error fetching related LOTO points:', error)
      );
    }

    getCurrentEquipment(): Observable<EquipmentDto | null> {
        return this.currentEquipment$;
    }

    getlotoPoints(): Observable<LotoPointDto[]> {
        return this.lotoPoints$;
    }

    getRelatedEquipment(): Observable<EquipmentDto[]> {
        return this.relatedEquipment$;
    }

    getRelatedLotoPoints(): Observable<LotoPointDto[]> {
        return this.relatedLotoPoints$;
    }

    getAllShapes(): Observable<Shape[]> {
      return this.allShapesSubject.asObservable();
    }

    setAllShapes(shapes: Shape[]): void {
      this.allShapesSubject.next(shapes);
    }

    setCurrentPresetData(data: EquipmentDto): void {
      this.currentPresetDataSubject.next(data);
    }
    getCurrentPresetData(): Observable<EquipmentDto> {
      return this.currentPresetData$;
    }

    clearCurrentEquipment(): void {
        this.currentEquipmentSubject.next(null);
        this.lotoPointSubject.next([]);
        this.relatedEquipmentSubject.next([]);
        this.relatedLotoPointsSubject.next([]);
    }
}