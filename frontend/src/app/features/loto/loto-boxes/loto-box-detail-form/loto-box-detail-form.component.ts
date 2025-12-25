import { Component, Output, EventEmitter, Input, OnInit, DestroyRef} from '@angular/core';
import { DetailsFormComponent } from '../../../../shared/details-form/details-form.component';
import { SharedDataService } from '../../../../services/shared-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';
import { ValueDto } from '../../../../models/value.model';
import { Option } from '../../../../models/option.model';
import { Validators } from '@angular/forms';
import { ImageCarouselComponent } from "../../../../shared/image/image-carusel/image-carousel.component";
import { CommonModule  } from '@angular/common';
import { LotoBoxDto } from '../../../../models/loto/loto-box.model';
import { NonNullablePipe } from "../../../../pipes/nonNullable.pipe";

@Component({
  selector: 'app-loto-lotoBox-detail-form',
  standalone: true,
  imports: [DetailsFormComponent, ImageCarouselComponent, CommonModule, NonNullablePipe],
  templateUrl: './loto-box-detail-form.component.html',
  styleUrl: './loto-box-detail-form.component.css'
})
export class LotoBoxDetailFormComponent implements OnInit {
  @Input() values: any = {};
  @Input() formSubmit!: (data: any) => void;
  @Input() formDelete!: () => void;
  private _selectedItem: LotoBoxDto | null = null;

  @Input() set selectedItem(value: LotoBoxDto | null) {
    this._selectedItem = value;
    if (value) {
      // this.initializeFilters();
    } else {
      // this.lotoFilter$.next([]);  // Emit an empty array when there's no selected item
    }
  }

  get selectedItem(): LotoBoxDto | null {
    return this._selectedItem;
  }

  @Output() formSubmitEvent = new EventEmitter<any>();
  @Output() formDeleteEvent = new EventEmitter<void>();

  private lotoAccessoryStatusOptions = new BehaviorSubject<Option[]>([]);


  fields: any[] = [];
  isFormReady = false;

  constructor(
    private sharedDataService: SharedDataService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    forkJoin({
      lotoAccessoryStatuses: this.loadOptions(this.sharedDataService.loadLotoAccessoryStatuses()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(({ lotoAccessoryStatuses }) => {
        this.lotoAccessoryStatusOptions.next(lotoAccessoryStatuses);
      }),
      finalize(() => {
        this.initializeFields();
        this.isFormReady = true;
      }),
      catchError(error => {
        console.error('Error loading form data:', error);
        return of({ lotoAccessoryStatuses: [] });
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
      { name: 'number', label: 'Box Number', type: 'number', validators: [Validators.required] },
      { name: 'lotoAccessoryStatus', label: 'LOTO Accessory Status', type: 'select', options: this.lotoAccessoryStatusOptions },
      // Add more fields as needed for LotoBox
    ];
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
}
