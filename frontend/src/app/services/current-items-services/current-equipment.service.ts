import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EquipmentDto } from '../../models/equipment/equipment.model';
import { EquipmentService } from '../equipment.service';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { RectangleShape, Shape } from '../../models/shape.model';
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

    private resizeDetectorSubject = new BehaviorSubject<Shape | null>(null);
    resizeDetector$ = this.resizeDetectorSubject.asObservable();

    private shapeRightClickDetectorSubject = new BehaviorSubject<Shape | null>(null);
    shapeRightClickDetector$ = this.shapeRightClickDetectorSubject.asObservable();

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
    
    private currentLotoPointPresetDataSubject = new BehaviorSubject<LotoPointDto>(new LotoPointDto());
    currentLotoPointPresetData$: Observable<LotoPointDto> = this.currentLotoPointPresetDataSubject.asObservable();

    private normalizeEquipment(item: Partial<EquipmentDto> | null | undefined): EquipmentDto {
      return item ? EquipmentDto.fromJson(item) : new EquipmentDto();
    }

    private normalizeEquipments(items: Partial<EquipmentDto>[] | null | undefined): EquipmentDto[] {
      return (items ?? []).map(item => this.normalizeEquipment(item));
    }

    private normalizeLotoPoints(items: Partial<LotoPointDto>[] | null | undefined): LotoPointDto[] {
      return (items ?? []).map(item => LotoPointDto.fromJson(item));
    }

    setCurrentShape(shape: Shape | null): void {
      if(shape === null) {
        const currentShape = this.shapeSubject.getValue();
        if(currentShape && currentShape.id === 0){
          // Remove the current shape from allShapes
          const allShapes = this.allShapesSubject.getValue();
          const updatedShapes = allShapes.filter(s => s !== currentShape);
          // Create a new array to ensure change detection
          this.allShapesSubject.next([...updatedShapes]);
        }
      }
      this.shapeSubject.next(shape);
      if (shape && shape.id) {
        this.fetchEquipmentById(shape.id);
      } else {
        this.clearCurrentEquipment();
      }
    }

    removeShapeFromArray(shapeToRemove: RectangleShape): void {
      const allShapes = this.allShapesSubject.getValue();
      const updatedShapes = allShapes.filter(shape => 
        !this.areShapesEqual(shape as RectangleShape, shapeToRemove)
      );
      // Create a new array to ensure change detection
      this.allShapesSubject.next([...updatedShapes]);
      // console.log('currently selected shape is: ', this.shapeSubject.getValue());
    }
    
    private areShapesEqual(shape1: RectangleShape, shape2: RectangleShape): boolean {
      return shape1.x === shape2.x &&
             shape1.y === shape2.y &&
             shape1.width === shape2.width &&
             shape1.height === shape2.height;
    }

    updateCurrentShape(updatedShape: Shape): void {
      const currentShape = this.shapeSubject.getValue();
      
      // Update the current shape
      this.shapeSubject.next(updatedShape);
    
      // Update or replace the shape in the allShapes array
      const allShapes = this.allShapesSubject.getValue();
      let updatedShapes: Shape[];
    
      if (currentShape && currentShape.id === 0) {
        // Remove the temporary shape and add the new one
        updatedShapes = allShapes.filter(shape => shape.id !== 0);
        updatedShapes.push(updatedShape);
      } else {
        // Update existing shape
        updatedShapes = allShapes.map(shape => 
          shape.id === updatedShape.id ? updatedShape : shape
        );
      }
      
      // Create a new array to ensure change detection
      this.allShapesSubject.next([...updatedShapes]);
    
      // Fetch the corresponding equipment if the shape has a valid ID
      if (updatedShape.id && updatedShape.id !== 0) {
        this.fetchEquipmentById(updatedShape.id);
      } else {
        this.clearCurrentEquipment();
      }
    }

    setResizeDetector(resizedShape: Shape): void {
      this.resizeDetectorSubject.next(resizedShape);
    }

    getRezizeDetector(): Observable<Shape | null> {
      return this.resizeDetector$;
    }

    setShapeRightClickDetector(clickedShape: Shape | null): void {
      this.shapeRightClickDetectorSubject.next(clickedShape);
    }

    getShapeRightClickDetector(): Observable<Shape | null> {
      return this.shapeRightClickDetector$;
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

    setCurrentShapeWithIds(equipmentIdList: number[]): void {
      if (equipmentIdList === null || equipmentIdList.length === 0) {
        this.setCurrentShape(null);
        return;
      }
      const shape = this.allShapesSubject.getValue()?.find(s => equipmentIdList.includes(s.id)) || null;
    
      if (shape) {
        this.setCurrentShape(shape);
        this.fetchEquipmentById(shape.id);
      } else {
        // If the shape is not found in the current set, create a minimal shape object
        // const minimalShape: Shape = { id: shapeId, type: 'rectangle' };
        // this.setCurrentShape(minimalShape);
      }
    }

    private fetchEquipmentById(id: number): void {
      this.equipmentService.getEquipmentById(id).subscribe(
        response => {
          if (response.responseData) {
            this.setCurrentEquipment(this.normalizeEquipment(response.responseData));
          }
        },
        error => {
          console.error('Error fetching equipment:', error);
          this.clearCurrentEquipment();
        }
      );
    }

    setCurrentEquipment(eq: EquipmentDto | null): void {
      const normalizedEquipment = eq ? this.normalizeEquipment(eq) : null;
      this.currentEquipmentSubject.next(normalizedEquipment);
      if (normalizedEquipment) {
        if(normalizedEquipment.lotoPoints)this.lotoPointSubject.next(this.normalizeLotoPoints(normalizedEquipment.lotoPoints));
        else this.lotoPointSubject.next([new LotoPointDto()]);
        this.fetchRelatedEquipmentAndLotoPoints(normalizedEquipment);
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
          'tagNumber': equipment.tagNumber || '',
          'description': equipment.description || ''
        },
        page: 1
      };
    
      this.equipmentService.searchEqByBaseTagNumber(equipmentSearchCriteria, 1, 50).subscribe(
        response => {
          if (response.responseData) {
            this.relatedEquipmentSubject.next(this.normalizeEquipments(response.responseData.content));
          }
        },
        error => console.error('Error fetching related equipment:', error)
      );
    
      // Fetch related LOTO points
      const lotoPointSearchCriteria: SearchCriteria = {
        type: 'global',
        query: equipment.tagNumber,
        filters: {
          'tagNumber': equipment.tagNumber || '',
          'description': equipment.description || ''
        },
        page: 1
      };
    
      this.lotoPointService.searchLpByBaseTagNumber(lotoPointSearchCriteria, 50).subscribe(
        response => {
          if (response.responseData) {
            this.relatedLotoPointsSubject.next(this.normalizeLotoPoints(response.responseData.content));
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

    addShapeToAllShapes(shape: Shape): void {
      this.allShapesSubject.getValue()?.push(shape);
      this.allShapesSubject.next(this.allShapesSubject.getValue() || []);
    }

    setCurrentPresetData(data: EquipmentDto): void {
      // console.log('Current presetData', data);
      this.currentPresetDataSubject.next(data);
    }
    
    getCurrentPresetData(): Observable<EquipmentDto> {
      return this.currentPresetData$;
    }

    getCurrentPresetDataValue(): EquipmentDto {
      return this.currentPresetDataSubject.getValue();
    }
    
    getCurrentPresetLotoPointData(): Observable<LotoPointDto> {
      return this.currentLotoPointPresetData$;
    }
    
    getCurrentPresetLotoPointValue(): LotoPointDto {
      return this.currentLotoPointPresetDataSubject.getValue();
    }
    
    setCurrentPresetLpData(arg0: LotoPointDto) {
      // console.log('Current presetLpData', arg0);
      this.currentLotoPointPresetDataSubject.next(arg0);
    }

    clearCurrentEquipment(): void {
        this.currentEquipmentSubject.next(null);
        this.lotoPointSubject.next([]);
        this.relatedEquipmentSubject.next([]);
        this.relatedLotoPointsSubject.next([]);
    }


}
