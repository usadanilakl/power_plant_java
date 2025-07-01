import { Component, OnInit, DestroyRef, signal, computed, Output, EventEmitter, input, output } from '@angular/core';
import { ReactiveFormComponent } from '../../../shared/reactive-form/reactive-form.component';
import { CurrentValueService } from '../../../services/current-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Option } from '../../../models/option.model';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-file-detail-form',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './file-detail-form.component.html',
  styleUrl: './file-detail-form.component.css'
})
export class FileDetailFormComponent implements OnInit {
  values = input<any>({});
  openImage = output<void>();
  formSubmit = output<any>();
  formDelete = output<void>();

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
    this.currentValueService.getOptionsByCategory(category).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => {
      console.log('Options loaded in file detail form:', options);
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

  onOpenImage() {
    this.openImage.emit();
  }
}
