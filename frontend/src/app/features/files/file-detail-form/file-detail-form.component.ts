// import { Component, Output, EventEmitter, Input, OnInit, DestroyRef} from '@angular/core';
// import { DetailsFormComponent } from '../../../shared/details-form/details-form.component';
// import { SharedDataService } from '../../../services/shared-data.service';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';
// import { ValueDto } from '../../../models/value.model';
// import { Option } from '../../../models/option.model';
// import { Validators } from '@angular/forms';

// @Component({
//   selector: 'app-file-detail-form',
//   standalone: true,
//   imports: [DetailsFormComponent],
//   templateUrl: './file-detail-form.component.html',
//   styleUrl: './file-detail-form.component.css'
// })
// export class FileDetailFormComponent implements OnInit {
//   @Input() values: any = {};
//   @Input() formSubmit!: (data: any) => void;
//   @Input() formDelete!: () => void;
//   @Input() openImage!: () => void;

//   @Output() formSubmitEvent = new EventEmitter<{ formData: any }>();
//   @Output() formDeleteEvent = new EventEmitter<void>();
//   @Output() openImageEvent = new EventEmitter<void>();

//   private fileTypeOptions = new BehaviorSubject<Option[]>([]);
//   private systemOptions = new BehaviorSubject<Option[]>([]);
//   private vendorOptions = new BehaviorSubject<Option[]>([]);
//   private fileInput: File | null = null;
  
//   fields: any[] = [];
//   isFormReady = false;

//   constructor(
//     private sharedDataService: SharedDataService,
//     private destroyRef: DestroyRef
//   ) {}
  
//   ngOnInit() {
//     forkJoin({
//       fileTypes: this.loadOptions(this.sharedDataService.loadFileTypes()),
//       systems: this.loadOptions(this.sharedDataService.loadSystems()),
//       vendors: this.loadOptions(this.sharedDataService.loadVendors()),
//     }).pipe(
//       takeUntilDestroyed(this.destroyRef),
//       tap(({ fileTypes, systems, vendors }) => {
//         this.fileTypeOptions.next(fileTypes);
//         this.systemOptions.next(systems);
//         this.vendorOptions.next(vendors);
//       }),
//       finalize(() => {
//         this.initializeFields();
//         this.isFormReady = true;
//       }),
//       catchError(error => {
//         console.error('Error loading form data:', error);
//         return of({ fileTypes: [], systems: [] });
//       })
//     ).subscribe();
//   }
  
//   private loadOptions(source: Observable<ValueDto[]>): Observable<Option[]> {
//     return source.pipe(
//       map(items => items.map(item => new ValueDto(item).toOption())),
//       catchError(error => {
//         console.error('Error loading options:', error);
//         return of([]);
//       })
//     );
//   }

//   private initializeFields() {
//     this.fields = [
//       { name: 'name', label: 'File Name', type: 'text', validators : [Validators.minLength(10)] },
//       { name: 'fileType', label: 'File Type', type: 'select', options: this.fileTypeOptions },
//       { name: 'vendor', label: 'Vendor', type: 'select', options: this.vendorOptions },
//       { name: 'fileNumber', label: 'File Numbers', type: 'multi-input' },
//       { name: 'systems', label: 'Systems', type: 'multi-select', options: this.systemOptions },
//       { name: 'file', label: 'File', type: 'file' },
//       { name: 'overrideFile', label: 'If File already exists, then:', type: 'radio-group', options: [{ value: 'true', label: 'Override' }, { value: 'false', label: 'Revision' }] },
//     ];
//   }


//   onFormSubmit(formData: any) {
//     if (this.formSubmit) {
//       this.formSubmit(formData);
//     }
//     this.formSubmitEvent.emit({formData});
//   }

//   onFormDelete() {
//     if (this.formDelete) {
//       this.formDelete();
//     }
//     this.formDeleteEvent.emit();
//   }

//   onOpenImage() {
//     if (this.openImage) {
//       this.openImage();
//     }
//     this.openImageEvent.emit();
//   }
// }

import { Component, Input, OnInit, DestroyRef, signal, computed, Output, EventEmitter } from '@angular/core';
import { ReactiveFormComponent } from '../../../shared/reactive-form/reactive-form.component';
import { CurrentValueService } from '../../../services/current-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Option } from '../../../models/option.model';
import { Validators } from '@angular/forms';
import { map } from 'rxjs';
import { AddValueFormComponent } from '../../values/add-value-form/add-value-form.component';
import { ValuesComponent } from '../../values/values.component';

@Component({
  selector: 'app-file-detail-form',
  standalone: true,
  imports: [ReactiveFormComponent, AddValueFormComponent, ValuesComponent],
  templateUrl: './file-detail-form.component.html',
  styleUrl: './file-detail-form.component.css'
})
export class FileDetailFormComponent implements OnInit {
  @Input() values: any = {};
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formDelete = new EventEmitter<void>();

  private fileTypeOptions = signal<Option[]>([]);
  private systemOptions = signal<Option[]>([]);
  private vendorOptions = signal<Option[]>([]);
  
  fields = computed(() => [
    { name: 'name', label: 'File Name', type: 'text', validators: [Validators.minLength(10)] },
    { name: 'fileType', label: 'File Type', type: 'select', options: this.fileTypeOptions() },
    { name: 'vendor', label: 'Vendor', type: 'select', options: this.vendorOptions() },
    { name: 'fileNumber', label: 'File Numbers', type: 'multi-input' },
    { name: 'systems', label: 'Systems', type: 'multi-select', options: this.systemOptions() },
    { name: 'file', label: 'File', type: 'file' },
    { name: 'overrideFile', label: 'If File already exists, then:', type: 'radio-group', options: [{ value: 'true', label: 'Override' }, { value: 'false', label: 'Revision' }] },
  ]);

  isFormReady = signal(false);
  isAddValueMenuOpen = signal(false);
  isValueEditMenuOpen = signal(false);
  selectedCategoryName = signal('');

  constructor(
    private currentValueService: CurrentValueService,
    private destroyRef: DestroyRef
  ) {}
  
  ngOnInit() {
    this.loadOptions('fileType', this.fileTypeOptions);
    this.loadOptions('system', this.systemOptions);
    this.loadOptions('vendor', this.vendorOptions);
  }

  private loadOptions(category: string, optionsSignal: ReturnType<typeof signal<Option[]>>) {
    this.currentValueService.getValuesByCategory(category).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(values => values.map(v => ({ value: v.id, label: v.name })))
    ).subscribe(options => {
      optionsSignal.set(options);
      this.checkFormReady();
    });
  }

  private checkFormReady() {
    if (this.fileTypeOptions().length > 0 && 
        this.systemOptions().length > 0 && 
        this.vendorOptions().length > 0) {
      this.isFormReady.set(true);
    }
  }

  onFormSubmit(formData: any) {
    this.formSubmit.emit(formData);
  }

  onFormDelete() {
    this.formDelete.emit();
  }
}
