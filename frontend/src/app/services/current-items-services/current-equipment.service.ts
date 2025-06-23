import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EquipmentDto } from '../../models/equipment/equipment.model';
import { EquipmentService } from '../equipment.service';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { Shape } from '../../models/shape.model';
import { LotoPointService } from '../loto/loto-point.service';
import { SearchCriteria } from '../../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root'
})
export class CurrentEquipmentService {

    private equipmentService = inject(EquipmentService);
    private lotoPointService = inject(LotoPointService);

    constructor() { }

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

    setCurrentShape(shape: Shape | null): void {
      this.shapeSubject.next(shape);
      if (shape && shape.id) {
        this.fetchEquipmentById(shape.id);
      } else {
        this.clearCurrentEquipment();
      }
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
      this.currentEquipmentSubject.next(eq);
      if (eq) {
        this.lotoPointSubject.next(eq.lotoPoints);
        this.fetchRelatedEquipmentAndLotoPoints(eq);
      } else {
        this.clearCurrentEquipment();
      }
    }

    private fetchRelatedEquipmentAndLotoPoints(equipment: EquipmentDto): void {
      // Fetch related equipment
      const equipmentSearchCriteria: SearchCriteria = {
        type: 'global',
        query: equipment.tagNumber,
        filters: {
          'tagNumber': equipment.tagNumber,
          'description': equipment.description
        },
        page: 1
      };
    
      this.equipmentService.searchEquipment(equipmentSearchCriteria, 1, 50).subscribe(
        response => {
          if (response.responseData) {
            // this.relatedEquipmentSubject.next(response.responseData.content);
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
    
      this.lotoPointService.searchLotoPoints(lotoPointSearchCriteria, 50).subscribe(
        response => {
          if (response.responseData) {
            // this.relatedLotoPointsSubject.next(response.responseData.content);
            console.log('Related LOTO points fetched successfully:', response.responseData.content);
          }
        },
        error => console.error('Error fetching related LOTO points:', error)
      );
    }

    getCurrentEquipment(): EquipmentDto | null {
        return this.currentEquipmentSubject.getValue();
    }

    getlotoPoints(): Observable<LotoPointDto[]> {
        return this.lotoPoints$;
    }

    clearCurrentEquipment(): void {
        this.currentEquipmentSubject.next(null);
        this.lotoPointSubject.next([]);
    }
}