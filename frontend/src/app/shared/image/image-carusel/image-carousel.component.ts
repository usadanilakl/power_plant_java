import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, inject, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, map, Observable, of, Subscription } from 'rxjs';
import { PopupComponent } from "../../popup/popup.component";
import { ImageZoomInteractiveComponent } from '../image-zoom-interactive/image-zoom-interactive.component';
import { FileService } from '../../../services/file.service';
import { FileDto } from '../../../models/file/file.model';
import { EquipmentDto } from '../../../models/equipment/equipment.model';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [CommonModule, PopupComponent],
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.css']
})
export class ImageCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() images: string[] | Observable<string[]> = [];
  @Output() imageClick = new EventEmitter<string>();
  @Input() equipmentFilter: { key: string; filterFn: (value: any) => boolean }[] = [];
  @ViewChild('carousel') carouselRef!: ElementRef;

  displayImages: string[] = [];

  private startX: number = 0;
  private scrollLeftPosition: number = 0;
  isImagePopupOpen = false;
  selectedImage$: Observable<FileDto | null> | null = null;
  elements$: Observable<EquipmentDto[]> | null = null;
  ImageZoomInteractiveComponent = ImageZoomInteractiveComponent;
  private imagesSubscription: Subscription | null = null;
  fileService = inject(FileService);

  ngOnInit() {
    if (this.images instanceof Observable) {
      this.imagesSubscription = this.images.subscribe(imageArray => {
        this.displayImages = imageArray;
      });
    } else {
      this.displayImages = this.images;
    }
  }

  ngOnDestroy() {
    if (this.imagesSubscription) {
      this.imagesSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['equipmentFilter']) {
      // console.log('Equipment filter changed:', this.equipmentFilter);
      // Apply the filter or do whatever you need with the new filter
    }
  }

  ngAfterViewInit() {
    this.setupTouchEvents();
  }

  onImageClick(image: string) {
    if (this.imageClick.observers.length > 0) {
      // If there are subscribers to the imageClick event, emit the event
      this.imageClick.emit(image);
    } else {
      // If no subscribers, use the default popup behavior
      this.selectedImage$ = this.getFullFileDto(image);
      this.filterEquipment();
      this.isImagePopupOpen = true;
    }
  }

  private getFullFileDto(image: string): Observable<FileDto | null> {
    return this.fileService.getFileByUrl(image).pipe(
      map(response => response.responseData),
      catchError(error => {
        console.error('Error fetching file:', error);
        return of(null);
      })
    );
  }

  private filterEquipment(): void {
    if (this.selectedImage$) {
      this.elements$ = this.selectedImage$.pipe(
        map(file => {
          let points = file?.points || [];
          if (this.equipmentFilter.length > 0) {
            points = points.filter(equipment => 
              this.equipmentMatchesAllFilters(equipment, this.equipmentFilter)
            );
          }
          return points;
        })
      );
    } else {
      this.elements$ = of([]);
    }
  }
  
  private equipmentMatchesAllFilters(equipment: EquipmentDto, filters: { key: string; filterFn: (value: any) => boolean }[]): boolean {
    return filters.every(filter => filter.filterFn((equipment as any)[filter.key]));
  }

  scrollToLeft() {
    this.carouselRef.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollToRight() {
    this.carouselRef.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
  }

  private setupTouchEvents() {
    const carousel = this.carouselRef.nativeElement;

    carousel.addEventListener('touchstart', (e: TouchEvent) => {
      this.startX = e.touches[0].pageX - carousel.offsetLeft;
      this.scrollLeftPosition = carousel.scrollLeft;
    });

    carousel.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.startX) return;
      const x = e.touches[0].pageX - carousel.offsetLeft;
      const walk = (x - this.startX) * 2;
      carousel.scrollLeft = this.scrollLeftPosition - walk;
    });

    carousel.addEventListener('touchend', () => {
      this.startX = 0;
    });
  }
}