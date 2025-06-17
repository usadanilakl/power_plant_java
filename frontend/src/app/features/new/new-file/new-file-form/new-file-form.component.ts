import { Component, DestroyRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';
import { SharedDataService } from '../../../../services/shared-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValueDto } from '../../../../models/value.model';
import { Option } from '../../../../models/option.model';
import { DetailsFormComponent } from "../../../../shared/details-form/details-form.component";

@Component({
  selector: 'app-new-file-form',
  imports: [DetailsFormComponent],
  templateUrl: './new-file-form.component.html',
  styleUrl: './new-file-form.component.css'
})
export class NewFileFormComponent implements OnInit {
  @Input() values: any = {};
  @Input() formSubmit!: (data: any) => void;
  @Input() formDelete!: () => void;
  @Input() openImage!: () => void;

  @Output() formSubmitEvent = new EventEmitter<{ formData: any }>();
  @Output() formDeleteEvent = new EventEmitter<void>();
  @Output() openImageEvent = new EventEmitter<void>();

  private fileTypeOptions = new BehaviorSubject<Option[]>([]);
  private systemOptions = new BehaviorSubject<Option[]>([]);
  private vendorOptions = new BehaviorSubject<Option[]>([]);
  private fileInput: File | null = null;
  
  fields: any[] = [];
  isFormReady = false;

  constructor(
    private sharedDataService: SharedDataService,
    private destroyRef: DestroyRef
  ) {}
  
  ngOnInit() {
    forkJoin({
      fileTypes: this.loadOptions(this.sharedDataService.loadFileTypes()),
      systems: this.loadOptions(this.sharedDataService.loadSystems()),
      vendors: this.loadOptions(this.sharedDataService.loadVendors()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(({ fileTypes, systems, vendors }) => {
        this.fileTypeOptions.next(fileTypes);
        this.systemOptions.next(systems);
        this.vendorOptions.next(vendors);
      }),
      finalize(() => {
        this.initializeFields();
        this.isFormReady = true;
      }),
      catchError(error => {
        console.error('Error loading form data:', error);
        return of({ fileTypes: [], systems: [] });
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
      { name: 'name', label: 'File Name', type: 'text', validators : [Validators.minLength(10)] },
      { name: 'type', label: 'File Type', type: 'select', options: this.fileTypeOptions },
      { name: 'vendor', label: 'Vendor', type: 'select', options: this.vendorOptions },
      { name: 'fileNumber', label: 'File Numbers', type: 'multi-input' },
      { name: 'systems', label: 'Systems', type: 'multi-select', options: this.systemOptions },
      { name: 'file', label: 'File', type: 'file' },
    ];
  }


  onFormSubmit(formData: any) {
    if (this.formSubmit) {
      this.formSubmit(formData);
    }
    this.formSubmitEvent.emit({formData});
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
