import { Component, OnInit, DestroyRef, signal, computed, Output, EventEmitter, input, output } from '@angular/core';
import { ReactiveFormComponent } from '../../../shared/reactive-form/reactive-form.component';
import { CurrentValueService } from '../../../services/current-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Option } from '../../../models/option.model';
import { Validators } from '@angular/forms';
import { Question } from '../../../models/ui/question.model';

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
    { name: 'name', label: 'File Name', type: 'text', validators: [Validators.required] },
    { name: 'fileType', label: 'File Type', type: 'select', options: this.fileTypeOptions(), validators: [Validators.required] },
    { name: 'vendor', label: 'Vendor', type: 'select', options: this.vendorOptions(), validators: [Validators.required] },
    { name: 'fileNumber', label: 'File Numbers', type: 'multi-input', validators: [Validators.required] },
    // { name: 'relatedSystems', label: 'Systems', type: 'multi-select', options: this.systemOptions(), validators: [Validators.required], question: { type: 'text', content: "You can select multipla systems"} as Question },
    { name: 'file', label: 'File', type: 'file' },
    { name: 'overrideFile', label: 'If File already exists, then:', type: 'radio-group', options: [{ value: 'true', label: 'Override' }, { value: 'false', label: 'Revision' }], validators: [Validators.required] },
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
    console.log("Form submitted: ", formData);
    this.formSubmit.emit(formData);
  }

  onFormDelete() {
    this.formDelete.emit();
  }

  onOpenImage() {
    this.openImage.emit();
  }
}
