import { Component, computed, DestroyRef, inject, OnInit, Signal, signal, ViewChild } from '@angular/core';
import { PdfDisplayIframeComponent } from '../../shared/pdf-dislplay-iframe/pdf-dislplay-iframe.component';
import { CurrentLotoService } from '../../services/current-items-services/current-loto.service';
import { CurrentEquipmentService } from '../../services/current-items-services/current-equipment.service';
import { FileService } from '../../services/file.service';
import { LotoPointService } from '../../services/loto/loto-point.service';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { FileDto } from '../../models/file/file.model';
import { Shape } from '../../models/shape.model';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { EquipmentDto } from '../../models/equipment/equipment.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FloatingMenuComponent } from "../../shared/menu/floating-menu/floating-menu.component";
import { EquipmentDetailsComponent } from "../equipment/equipment-details/equipment-details.component";
import { ImageCarouselComponent } from "../../shared/image/image-carusel/image-carousel.component";
import { ImageZoomInteractiveComponent } from "../../shared/image/image-zoom-interactive/image-zoom-interactive.component";

@Component({
  selector: 'app-loto',
  imports: [FloatingMenuComponent, EquipmentDetailsComponent, ImageCarouselComponent, ImageZoomInteractiveComponent, PdfDisplayIframeComponent],
  templateUrl: './loto.component.html',
  styleUrl: './loto.component.css'
})
export class LotoComponent implements OnInit  {

  @ViewChild('pdfDisplay') pdfDisplay!: PdfDisplayIframeComponent;
  
  currentLotoService = inject(CurrentLotoService);
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
    return null;
  });

  currenLotoPointFiles = signal<FileDto[]>([]);
  currentStandardFiles = signal<FileDto[]>([]);
  selectedItemIds = signal<number[]>([]);
  isShapeDetailsOpen = signal<boolean>(false);
  selectedShape = signal<Shape | null>(null);
  singleSelectedItemId = computed(() => {
    const currentPoint = this._currentLotoPoint();
    console.log('singleSelectedItemId: ', currentPoint?.equipmentIdList);
    if (currentPoint && currentPoint.equipmentIdList && currentPoint.equipmentIdList.length > 0) {
      return currentPoint.equipmentIdList[0];
    }
    return null;
  });

  private elementsSubject = new BehaviorSubject<EquipmentDto[]>([]);
  elements = this.elementsSubject.asObservable();

  currentFileLink = computed(() => {
    const links = this.currenLotoPointFiles();
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
  currentFileLinks = computed(() => {
    const links = this.currentStandardFiles();
    if (links.length > 0) {
      // console.log('currentFileLinks: ', links);
      return links.map(fileDto => fileDto.fileLink);
    }
    return [];
  });
  currentLotoPointFileLinks = computed(() => {
    const links = this.currenLotoPointFiles();
    if (links.length > 0) {
      // console.log('currentFileLinks: ', links);
      return links.map(fileDto => fileDto.fileLink);
    }
    return [];
  });



  constructor() { }
  ngOnInit(): void {
    this.currentLotoService.getCurrentLotoPoint().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(lotoPoint => {
      this.currentLotoPoint.set(lotoPoint);
    });

    this.currentLotoService.getCurrentLotoPointFiles().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(files => {
      this.currenLotoPointFiles.set(files);
    });

    

    this.currentLotoService.getCurrentLotoFiles().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(files => {
      // console.log('currentStandardFiles: ', files);
      this.currentStandardFiles.set(files);
    });

    this.currentLotoService.currentLoto$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(standard => {
      if (standard) {
        console.log('currentLotoFiles: ', standard.lotoPoints);
        const lotoPoints: LotoPointDto[] = Array.isArray(standard.lotoPoints) ? [...standard.lotoPoints] : [];
        this.selectedItemIds.set([
          ...lotoPoints.flatMap(lotoPoint => lotoPoint.equipmentIdList || [])
                       .filter((id): id is number => id !== null && id !== undefined)
        ]);
        console.log('selectedItemIds: ', this.selectedItemIds());
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
  
  private getFileByLink(fileLink: string): Observable<FileDto | null> {
    return this.fileService.getFileByLink(fileLink).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(response => {
        if (response && response.responseData) {
          const elements = response.responseData.points;
          this.elementsSubject.next(elements);
          return response.responseData;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching equipment:', error);
        return of(null);
      })
    );
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
      this.currentLotoService.addLotoPointToCurrentLoto(lotoPoint.id);
  }

  fetchAndShowImageByLink(link: string) {
    this.getFileByLink(link).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(file => {
      if (file) {
        this.currenLotoPointFiles.set([file]);
        const elements = file.points;
        if (elements && elements.length > 0) {
          this.elementsSubject.next(elements);
        }
      }
    });
  }

  showFile(file: FileDto){
    if (file) {
      this.currenLotoPointFiles.set([file]);
      const elements = file.points;
      if (elements && elements.length > 0) {
        this.elementsSubject.next(elements);
      }
    }
  }

}
