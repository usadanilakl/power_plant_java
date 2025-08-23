import { Component, computed, DestroyRef, inject, OnInit, Signal, signal, ViewChild } from '@angular/core';
import { LotoStandardFormComponent } from "./loto-standard-form/loto-standard-form.component";
import { CurrentLotoStandardService } from '../../services/current-items-services/current-loto-standard.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { FileDto } from '../../models/file/file.model';
import { LotoPointService } from '../../services/loto/loto-point.service';
import { ImageZoomInteractiveComponent } from "../../shared/image/image-zoom-interactive/image-zoom-interactive.component";
import { PdfDisplayIframeComponent } from "../../shared/pdf-dislplay-iframe/pdf-dislplay-iframe.component";
import { BehaviorSubject, Observable } from 'rxjs';
import { EquipmentDto } from '../../models/equipment/equipment.model';
import { FileService } from '../../services/file.service';
import { Shape } from '../../models/shape.model';
import { FloatingMenuComponent } from "../../shared/menu/floating-menu/floating-menu.component";
import { EquipmentDetailsComponent } from "../equipment/equipment-details/equipment-details.component";
import { CurrentEquipmentService } from '../../services/current-items-services/current-equipment.service';

@Component({
  selector: 'app-loto-standard',
  imports: [LotoStandardFormComponent, ImageZoomInteractiveComponent, PdfDisplayIframeComponent, FloatingMenuComponent, EquipmentDetailsComponent],
  templateUrl: './loto-standard.component.html',
  styleUrl: './loto-standard.component.css'
})
export class LotoStandardComponent implements OnInit  {

  @ViewChild('pdfDisplay') pdfDisplay!: PdfDisplayIframeComponent;

  currentLotoStandardService = inject(CurrentLotoStandardService);
  currentEquipmentService = inject(CurrentEquipmentService);
  fileService = inject(FileService);
  lotoPointService = inject(LotoPointService);
  destroyRef = inject(DestroyRef);

  currentLotoPoint = signal<LotoPointDto | Signal<LotoPointDto> | null>(null);
  _currentLotoPoint = computed<LotoPointDto | null>(() => {
    const value = this.currentLotoPoint();
    if (!value) return null;
    if (value instanceof LotoPointDto) return value;
    if (typeof value === 'function') return value(); // This handles the Signal<LotoPointDto> case
    return null; // Add this as a fallback
  });

  currentFiles = signal<FileDto[]>([]);
  selectedItemIds = signal<number[]>([]);
  isShapeDetailsOpen = signal<boolean>(false);
  selectedShape = signal<Shape | null>(null);
  singleSelectedItemId = computed(() => {
    const currentPoint = this._currentLotoPoint();
    if (currentPoint && currentPoint.equipmentIdList && currentPoint.equipmentIdList.length > 0) {
      return currentPoint.equipmentIdList[0];
    }
    return null;
  });

  private elementsSubject = new BehaviorSubject<EquipmentDto[]>([]);
  elements = this.elementsSubject.asObservable();
  currentFileLink = computed(() => {
    const links = this.currentFiles();
    if (links.length > 0) {
      const fileDto = links[0];
      let link = fileDto.fileLink;
      if(fileDto.extensions.includes('jpg')){
        link = link.replaceAll('pdf','jpg');
        this.getFileElements(fileDto.id);
      } 
      if(this.pdfDisplay) this.pdfDisplay.updateUrl(link);
      return link;
    }
    return '';
  });



  constructor() { }

  ngOnInit(): void {
    this.currentLotoStandardService.getCurrentLotoPoint().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(lotoPoint => {
      this.currentLotoPoint.set(lotoPoint);
    });

    this.currentLotoStandardService.getCurrentFiles().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(files => {
      this.currentFiles.set(files);
    });

    this.currentLotoStandardService.getCurrentStandard().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(standard => {
      if (standard) {
        const lotoPoints: LotoPointDto[] = Array.isArray(standard.lotoPoints) ? [...standard.lotoPoints] : [];
        this.selectedItemIds.set([
          ...lotoPoints.flatMap(lotoPoint => lotoPoint.equipmentIdList || [])
                       .filter((id): id is number => id !== null && id !== undefined)
        ]);
      } else {
        this.selectedItemIds.set([]);
      }
    });
  }

  private getFileElements(fileId: number): void {
    this.fileService.getEquipmentByFileId(fileId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        if (response) {  // Assuming there's a 'success' property
          this.elementsSubject.next(response.responseData);
        }
      },
      error: (error) => {
        console.error('Error fetching equipment:', error);
        // Optionally, you can set an empty array or keep the previous state
        // this.elementsSubject.next([]);
      }
    });
  }

  showShapeDetails(shape: Shape | null): void {
    this.selectedShape.set(shape);
    if(shape && shape.id){
      this.currentEquipmentService.setCurrentShape(shape)
      this.isShapeDetailsOpen.set(true);
    }
  }

  closeShapeDetails(){
    this.selectedShape.set(null);
    this.isShapeDetailsOpen.set(false);
  }
  
  addLotoPointToStandard(lotoPoint: LotoPointDto) {
      this.currentLotoStandardService.addLotoPointToStandard(lotoPoint);
  }



}
