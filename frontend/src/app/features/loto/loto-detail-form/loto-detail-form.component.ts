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
    } else {
      this.lotoPointsFilter$.next([]);  // Emit an empty array when there's no selected item
    }
  }
  
  get selectedItem(): LotoDto | null {
    return this._selectedItem;
  }

  @Output() openImageEvent = new EventEmitter<void>();
  @Output() formSubmitEvent = new EventEmitter<any>();
  @Output() formDeleteEvent = new EventEmitter<void>();

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
      { name: 'socNum', label: 'LOTO Number', type: 'text', validators: [Validators.required] },
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
    if (this.formSubmit) {
      this.formSubmit(formData);
    }
    console.log('Form submitted:', formData);
    this.formSubmitEvent.emit(formData);
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
      console.log('Selected points:', updatedPoints);
    }
  }
  
  onRemovePoint(pointId: number) {
    const currentPoints = this.selectedLotoPointsSubject.value;
    const updatedPoints = currentPoints.filter(p => p.id !== pointId);
    this.selectedLotoPointsSubject.next(updatedPoints);
    console.log('Selected points after removal:', updatedPoints);
  }

  onSaveSelectedPoints() {
    const selectedPoints = this.selectedLotoPointsSubject.value;
    console.log('Saving selected points:', selectedPoints);
    // Implement your save logic here
    this.isAddPointsPopupOpen = false;
  }

  onCloseModal() {
    this.isAddPointsPopupOpen = false;
  }
}