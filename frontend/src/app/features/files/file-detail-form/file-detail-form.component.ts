import { Component, OnInit, DestroyRef, signal, computed, Output, EventEmitter, input, output, inject } from '@angular/core';
import { ReactiveFormComponent } from '../../../shared/reactive-form/reactive-form.component';
import { CurrentValueService } from '../../../services/current-value.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Option } from '../../../models/option.model';
import { Validators } from '@angular/forms';
import { CurrentFileService } from '../../../services/current-file.service';
import { FileDto } from '../../../models/file/file.model';

@Component({
  selector: 'app-file-detail-form',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './file-detail-form.component.html',
  styleUrl: './file-detail-form.component.css'
})
export class FileDetailFormComponent implements OnInit {

  currentFileService = inject(CurrentFileService);
  currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  values = input<any>({});
  openImage = output<void>();
  formSubmit = output<any>();
  formDelete = output<void>();

  private fileTypeOptions = signal<Option[]>([]);
  private systemOptions = signal<Option[]>([]);
  private vendorOptions = signal<Option[]>([]);

  selectedFileFromService = toSignal(this.currentFileService.currentFile$, { initialValue: new FileDto() });
  entity = computed(() => this.values() ?? this.selectedFileFromService());
  
  fields = computed(() => [
    { name: 'name', label: 'File Name', type: 'text', validators: [Validators.required] },
    { name: 'fileType', label: 'File Type', type: 'select', options: this.fileTypeOptions(), validators: [Validators.required] },
    { name: 'vendor', label: 'Vendor', type: 'select', options: this.vendorOptions(), validators: [Validators.required] },
    { name: 'fileNumber', label: 'File Numbers', type: 'multi-input', validators: [Validators.required] },
    // { name: 'relatedSystems', label: 'Systems', type: 'multi-select', options: this.systemOptions(), validators: [Validators.required], question: { type: 'text', content: "You can select multipla systems"} as Question },
    { name: 'file', label: 'File', type: 'file' },
    { name: 'overrideFile', label: 'If File already exists, then:', type: 'radio-group', options: [{ value: 'true', label: 'Override' }, { value: 'false', label: 'Revision' }], validators: [Validators.required] },
    { 
        name: 'isVerified', 
        label: 'Is Verified', 
        type: 'select', 
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ]
      }
  ]);

  isFormReady = signal(false);
  isAddValueMenuOpen = signal(false);
  isValueEditMenuOpen = signal(false);
  selectedCategoryName = signal('');

  isProcessingFile = this.currentFileService.isProcessingFile;

  
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

    if(!this.entity()) return;
    const formDataToSend = new FormData();
    this.isProcessingFile.set(true);
  
    // Extract file from formData and remove it from the object
    let file: File | null = null;
    if (formData.file instanceof File) {
      file = formData.file;
      delete formData.file; // Remove file from formData
    }
  
    // Append the file if it exists
    if (file) {
      formDataToSend.append('file', file);
    }

      // Extract the override/revision checkbox value
      const overrideFile = formData.overrideFile;
      delete formData.overrideFile; // Remove it from formData as it's not part of the FileDto
  
    // Continue with the rest of your logic...
    // Merge the existing item data with the new form data
    const updatedItem = { ...this.entity(), ...formData };
  
    // Append the JSON data
    formDataToSend.append('fileDto', new Blob([JSON.stringify(new FileDto(updatedItem).toIdModel())], {
      type: "application/json"
    }));

      // Append the override/revision flag
      formDataToSend.append('overrideFile', overrideFile);
    
  
    // Update in the backend
    this.currentFileService.saveFile(formDataToSend).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isProcessingFile.set(false);
        this.formSubmit.emit(formData);
      },
      error: (error) => {
        console.error('Error saving file:', error);
        this.isProcessingFile.set(false);
      }
    });
  }

  onFormDelete() {
    this.formDelete.emit();
  }

  onOpenImage() {
    this.openImage.emit();
  }
}
