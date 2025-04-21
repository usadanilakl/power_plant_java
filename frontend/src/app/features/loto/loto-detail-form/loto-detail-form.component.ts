import { Component, Output, EventEmitter, Input, OnInit, DestroyRef} from '@angular/core';
import { DetailsFormComponent } from '../../../shared/details-form/details-form.component';
import { SharedDataService } from '../../../services/shared-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';
import { ValueDto } from '../../../models/value.model';
import { Option } from '../../../models/option.model';
import { Validators } from '@angular/forms';
import { ImageCarouselComponent } from "../../../shared/image/image-carusel/image-carousel.component";
import { CommonModule  } from '@angular/common';
import { LotoDto } from '../../../models/loto/loto.model';
import { NonNullablePipe } from "../../../pipes/nonNullable.pipe";
import { PopupComponent } from "../../../shared/popup/popup.component";
import { LotoPointTableComponent } from "../../loto-points/loto-point-table/loto-point-table.component";
import { LotoPointDto } from '../../../models/loto/loto-point.model';

@Component({
  selector: 'app-loto-detail-form',
  standalone: true,
  imports: [DetailsFormComponent, ImageCarouselComponent, CommonModule, NonNullablePipe, PopupComponent, LotoPointTableComponent],
  templateUrl: './loto-detail-form.component.html',
  styleUrl: './loto-detail-form.component.css'
})
export class LotoDetailFormComponent implements OnInit {
  @Input() values: any = {};
  @Input() formSubmit!: (data: any) => void;
  @Input() formDelete!: () => void;
  @Input() openImage!: () => void;
  @Input() imageUrls$: Observable<string[]> = new Observable<string[]>();
  private _selectedItem: LotoDto | null = null;
  
  @Input() set selectedItem(value: LotoDto | null) {
    this._selectedItem = value;
    if (value) {
      this.initializeFilters();
      // Initialize selectedLotoPointsSubject with current LOTO points
      this.selectedLotoPointsSubject.next(value.lotoPoints || []);
    } else {
      this.lotoPointsFilter$.next([]);
      this.selectedLotoPointsSubject.next([]);
    }
  }
  
  get selectedItem(): LotoDto | null {
    return this._selectedItem;
  }

  @Output() openImageEvent = new EventEmitter<void>();
  @Output() formSubmitEvent = new EventEmitter<any>();
  @Output() formDeleteEvent = new EventEmitter<void>();
  @Output() lotoUpdated = new EventEmitter<LotoDto>();

  private lotoStatusOptions = new BehaviorSubject<Option[]>([]);
  lotoPointsFilter$ = new BehaviorSubject<{ key: string; filterFn: (value: any) => boolean }[]>([]);

  fields: any[] = [];
  isFormReady = false;

  isAddPointsPopupOpen = false;
  private selectedLotoPointsSubject = new BehaviorSubject<LotoPointDto[]>([]);
  selectedLotoPoints$ = this.selectedLotoPointsSubject.asObservable();

  constructor(
    private sharedDataService: SharedDataService,
    private destroyRef: DestroyRef
  ) {
    this.onSelectPoint = this.onSelectPoint.bind(this);
    this.onRemovePoint = this.onRemovePoint.bind(this);
  }
  
  ngOnInit() {
    forkJoin({
      lotoStatuses: this.loadOptions(this.sharedDataService.loadPermitStatuses()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(({ lotoStatuses }) => {
        this.lotoStatusOptions.next(lotoStatuses);
      }),
      finalize(() => {
        this.initializeFields();
        this.isFormReady = true;
      }),
      catchError(error => {
        console.error('Error loading form data:', error);
        return of({ lotoStatuses: [] });
      })
    ).subscribe();
  }
  
  private loadOptions(source: Observable<ValueDto[]>): Observable<Option[]> {
    return source.pipe(
      map(items => items.map(item => new ValueDto(item).toOption())),
      catchError(error => {
        console.error('Error loading options:', error);
        return of([]);
      })
    );
  }

  private initializeFields() {
    this.fields = [
      { name: 'docNum', label: 'LOTO Number', type: 'text', validators: [Validators.required] },
      { name: 'workScope', label: 'Scope of work', type: 'text', validators: [Validators.required] },
      { name: 'status.name', label: 'Status', type: 'select', options: this.lotoStatusOptions },
      { name: 'requestor.name', label: 'Start Date', type: 'date' },
      { name: 'controlAuthority.name', label: 'End Date', type: 'date' }
    ];
  }

  private initializeFilters() {
    const lotoPointsToInclude = this.selectedItem?.lotoPoints.map(lotoPoint => lotoPoint.id);
    const newFilter = [
      {
        key: 'lotoPoints',
        filterFn: (value: LotoDto[]) => {
          return value.some(loto => lotoPointsToInclude?.includes(loto.id));
        }
      }
    ];
    this.lotoPointsFilter$.next(newFilter);
  }

  onFormSubmit(formData: any) {
    // The selectedItem already contains the updated LOTO points
    const updatedFormData = {
      ...formData,
      lotoPoints: this.selectedItem?.lotoPoints || []
    };
  
    if (this.formSubmit) {
      this.formSubmit(updatedFormData);
    }
    console.log('Form submitted:', updatedFormData);
    this.formSubmitEvent.emit(updatedFormData);
  }

  onFormDelete() {
    if (this.formDelete) {
      this.formDelete();
    }
    this.formDeleteEvent.emit();
  }

  onOpenImage() {
    if (this.openImage) {
      this.openImage();
    }
    this.openImageEvent.emit();
  }

  onAddPoints(){
    this.isAddPointsPopupOpen=true;
  }

  

  onSelectPoint(point: LotoPointDto) {
    const currentPoints = this.selectedLotoPointsSubject.value;
    if (!currentPoints.some(p => p.id === point.id)) {
      const updatedPoints = [...currentPoints, point];
      this.selectedLotoPointsSubject.next(updatedPoints);
    }
  }
  
  onRemovePoint(pointId: number) {
    const currentPoints = this.selectedLotoPointsSubject.value;
    const updatedPoints = currentPoints.filter(p => p.id !== pointId);
    this.selectedLotoPointsSubject.next(updatedPoints);
  }

  
  onSaveSelectedPoints() {
    const selectedPoints = this.selectedLotoPointsSubject.value;
    console.log('Saving selected points:', selectedPoints);
  
    if (this.selectedItem) {
      // Update the selectedItem with the new LOTO points
      this.selectedItem.lotoPoints = selectedPoints;
  
      console.log('Updated LOTO points:', this.selectedItem.lotoPoints);
  
      // Emit an event to notify the parent component of the update
      this.lotoUpdated.emit(this.selectedItem);
    } else {
      console.error('No LOTO item selected');
    }
  
    this.isAddPointsPopupOpen = false;
  }

  onCloseModal() {
    this.isAddPointsPopupOpen = false;
  }

  

  addOnDoubleClick = (item: any) => {
    console.log('Double clicked item:', item);
    this.onSelectPoint(item);
  }

  removeOnDoubleClick = (item: any) => {
    console.log('Double clicked item:', item);
    this.onRemovePoint(item.id);
  }
  
  onItemRightClick = (item: any, event: MouseEvent) => {
    console.log('Right clicked item:', item, 'at position:', event.clientX, event.clientY);
    // Implement your right-click logic here, e.g., opening a context menu
  }
  
  onItemMiddleClick = (item: any, event: MouseEvent) => {
    console.log('Middle clicked item:', item);
    // Implement your middle-click logic here
  }
}