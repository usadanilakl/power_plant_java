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
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { NonNullablePipe } from "../../../pipes/nonNullable.pipe";

@Component({
  selector: 'app-loto-point-detail-form',
  standalone: true,
  imports: [DetailsFormComponent, ImageCarouselComponent, CommonModule, NonNullablePipe],
  templateUrl: './loto-point-detail-form.component.html',
  styleUrl: './loto-point-detail-form.component.css'
})
export class LotoPointDetailFormComponent implements OnInit {
  @Input() values: any = {};
  @Input() formSubmit!: (data: any) => void;
  @Input() formDelete!: () => void;
  @Input() openImage!: () => void;
  @Input() imageUrls$: Observable<string[]> = new Observable<string[]>();
  private _selectedItem: LotoPointDto | null = null;
  
  @Input() set selectedItem(value: LotoPointDto | null) {
    this._selectedItem = value;
    if (value) {
      this.initializeFilters();
    } else {
      this.equipmentFilter$.next([]);  // Emit an empty array when there's no selected item
    }
  }
  
  get selectedItem(): LotoPointDto | null {
    return this._selectedItem;
  }
  

  @Output() openImageEvent = new EventEmitter<void>();
  @Output() formSubmitEvent = new EventEmitter<any>();
  @Output() formDeleteEvent = new EventEmitter<void>();

  private isoPosOptions = new BehaviorSubject<Option[]>([]);
  private normPosOptions = new BehaviorSubject<Option[]>([]);
  equipmentFilter$ = new BehaviorSubject<{ key: string; filterFn: (value: any) => boolean }[]>([]);

  fields: any[] = [];
  isFormReady = false;

  constructor(
    private sharedDataService: SharedDataService,
    private destroyRef: DestroyRef
  ) {}
  
  ngOnInit() {
    forkJoin({
      isoPositions: this.loadOptions(this.sharedDataService.loadIsoPositions()),
      normPositions: this.loadOptions(this.sharedDataService.loadNormPositions()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(({ isoPositions, normPositions }) => {
        this.isoPosOptions.next(isoPositions);
        this.normPosOptions.next(normPositions);
      }),
      finalize(() => {
        this.initializeFields();
        this.isFormReady = true;
      }),
      catchError(error => {
        console.error('Error loading form data:', error);
        return of({ isoPositions: [], normPositions: [], equipment: [] });
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
      { name: 'tagNumber', label: 'Tag Number', type: 'text', validators: [Validators.required] },
      { name: 'description', label: 'Description', type: 'text', validators: [Validators.required] },
      { name: 'unit', label: 'Unit', type: 'text' },
      { name: 'tagged', label: 'Tagged', type: 'text' },
      { name: 'isoPos', label: 'Isolated Position', type: 'select', options: this.isoPosOptions },
      { name: 'normPos', label: 'Normal Position', type: 'select', options: this.normPosOptions },
      { name: 'specificLocation', label: 'Specific Location', type: 'text' },
      { name: 'standard', label: 'Standard', type: 'text' },
      { name: 'generalLocation', label: 'General Location', type: 'text' },
      // { name: 'equipmentList', label: 'Equipment', type: 'multi-select', options: this.equipmentOptions },
    ];
  }

  private initializeFilters() {
    const newFilter = [
      {
        key: 'lotoPoints',
        filterFn: (value: LotoPointDto[]) => {
          return value.some(lotoPoint => lotoPoint.id === this._selectedItem?.id);
        }
      }
    ];
    this.equipmentFilter$.next(newFilter);
  }

  onFormSubmit(formData: any) {
    if (this.formSubmit) {
      this.formSubmit(formData);
    }
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
}