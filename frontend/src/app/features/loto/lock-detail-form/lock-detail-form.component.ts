import { Component, Output, EventEmitter, Input, OnInit, DestroyRef} from '@angular/core';
import { DetailsFormComponent } from '../../../shared/details-form/details-form.component';
import { SharedDataService } from '../../../services/shared-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';
import { ValueDto } from '../../../models/value.model';
import { Option } from '../../../models/option.model';
import { Validators } from '@angular/forms';
import { CommonModule  } from '@angular/common';
import { LockDto } from '../../../models/loto/lock.model';

@Component({
  selector: 'app-lock-detail-form',
  standalone: true,
  imports: [DetailsFormComponent, CommonModule],
  templateUrl: './lock-detail-form.component.html',
  styleUrl: './lock-detail-form.component.css'
})
export class LockDetailFormComponent implements OnInit {
  @Input() values: any = {};
  @Input() formSubmit!: (data: any) => void;
  @Input() formDelete!: () => void;
  @Input() openImage!: () => void;
  private _selectedItem: LockDto | null = null;

  @Input() set selectedItem(value: LockDto | null) {
    this._selectedItem = value;
    if (value) {
      // this.initializeFilters();
    } else {
      // this.lockFilter$.next([]);  // Emit an empty array when there's no selected item
    }
  }

  get selectedItem(): LockDto | null {
    return this._selectedItem;
  }

  @Output() openImageEvent = new EventEmitter<void>();
  @Output() formSubmitEvent = new EventEmitter<any>();
  @Output() formDeleteEvent = new EventEmitter<void>();

  private lockStatusOptions = new BehaviorSubject<Option[]>([]);

  fields: any[] = [];
  isFormReady = false;

  constructor(
    private sharedDataService: SharedDataService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    forkJoin({
      lockStatuses: this.loadOptions(this.sharedDataService.loadLotoAccessoryStatuses()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(({ lockStatuses }) => {
        this.lockStatusOptions.next(lockStatuses);
      }),
      finalize(() => {
        this.initializeFields();
        this.isFormReady = true;
      }),
      catchError(error => {
        console.error('Error loading form data:', error);
        return of({ lockStatuses: [] });
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
      { name: 'number', label: 'Lock Number', type: 'number', validators: [Validators.required] },
      { name: 'status', label: 'Lock Status', type: 'select', options: this.lockStatusOptions },
      // Add more fields as needed for Lock
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