
import { Component, computed, DestroyRef, effect, inject, input, Input, OnInit, output, signal, Signal } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrintableFormDto } from '../../../models/forms/printable-form.model';
import { FormContainerDto } from '../../../models/forms/form-container.model';
import { FormField } from '../../../models/ui/form-field.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PrintService } from '../../../services/ui/print.service';
import { FormContainerRendererComponent } from "./form-container-renderer/form-container-renderer.component";

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormContainerRendererComponent],
  templateUrl: './form-renderer.component.html',
  styleUrl: './form-renderer.component.css'
})
export class FormRendererComponent implements OnInit{
  formDefinitionInput = input<PrintableFormDto | null>(null);
  @Input() formData: Signal<any> = signal<any | null>(null);
  // formData = input<any | null>(null);
  readOnly = input<boolean>(false);
  
  formSubmit = output<any>();
  formChange = output<any>();
  formDelete = output<number>();
  formDefinitionChange = output<PrintableFormDto>();
  addItem = output<void>();

  formDefinition = signal<PrintableFormDto | null>(this.formDefinitionInput());
  private formArrayChanged = signal(0);
  private addingItem = signal(false);

  form: FormGroup;
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private printService = inject(PrintService);

  containers = computed(() => {
    const originalContainers = this.processedFormDefinition()?.formContainers ?? [];
    return originalContainers.map(container => {
      if (container.contentType === 'formField' && this.isFormField(container.content)) {
        const field = container.content as FormField;
        return new FormContainerDto({
          ...container,
          content: {
            ...field,
            label: ''
          }
        });
      }
      return container;
    });
  }); 

  fields = computed<FormField[]>(() => {
    return this.containers()
      .filter(c => (c.contentType === 'formField' || c.contentType === 'repeatingSection') && this.isFormField(c.content))
      .map(c => c.content as FormField);
  });
  
  processedFormDefinition = computed(() => {
    this.formArrayChanged(); 
    const formTemplate = this.processFormArrays();
    return formTemplate;
  });

  pages = computed(() => {
    const allContainers = this.processedFormDefinition()?.formContainers ?? [];
    if (allContainers.length === 0) {
      return [{ pageNumber: 1, containers: [] }];
    }

    const pagesMap = new Map<number, FormContainerDto[]>();
    allContainers.forEach(container => {
      const pageNum = container.pageNumber ?? 1;
      if (!pagesMap.has(pageNum)) {
        pagesMap.set(pageNum, []);
      }
      pagesMap.get(pageNum)!.push(container);
    });

    return Array.from(pagesMap.entries())
      .map(([pageNumber, containers]) => ({ pageNumber, containers }))
      .sort((a, b) => a.pageNumber - b.pageNumber);
  });

  sheetSize = computed(() => this.formDefinition()?.size ?? { width: 8.5, height: 11 });
  pixelsPerInch = 96;

  constructor() {
    this.form = this.fb.group({});

    this.formDefinition.set(this.formDefinitionInput());
    
    effect(() => {
      const newFormDefinition = this.formDefinitionInput();
      if (newFormDefinition !== this.formDefinition() && !this.addingItem()) {
        this.formDefinition.set(this.formDefinitionInput());
        this.createForm();
      }
      this.addingItem.set(false);
    });

    effect(() => {
      const data = this.formData();
      if (data && this.form) {
        this.form.patchValue(data, { emitEvent: false });
        this.createForm();
        
      }
    });
  }

  ngOnInit(): void {
    // this.processFormArrays();
  }

  // createForm() {
  //   const group: { [key: string]: any } = {};
  //   // const formFields = this.fields();
  //   const formFields = this.getAllFormFields();

  //   // formFields.forEach(field => {
  //   //   if (field && field.name) {
  //   //     if (field.type === 'form-array') {
  //   //     const currentFormValue = this.form?.value;
  //   //     const dataSource = currentFormValue && Object.keys(currentFormValue).length > 0 
  //   //       ? currentFormValue 
  //   //       : this.formData();
        
  //   //     const arrayData = this.getNestedValue(dataSource, field.name) || [];
  //   //       const formArray = this.fb.array(
  //   //         arrayData.map((item: any) => this.createArrayItem(field.fields ?? [], item))
  //   //       );
  //   //       this.setNestedControl(group, field.name, formArray);
  //   //     } else {
  //   //       let value = this.getNestedValue(this.formData(), field.name);

  //   //       if (field.type === 'file') {
  //   //         value = null;
  //   //       } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
  //   //         value = value || [];
  //   //       } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
  //   //         value = value.id;
  //   //       }

  //   //       this.setNestedControl(group, field.name, new FormControl(value, []));
  //   //     }
  //   //   }
  //   // });

  // formFields.forEach(field => {
  //   if (field && field.name) {
  //     if (field.type === 'form-array') {
  //       // Check if FormArray already exists
  //       const existingArray = this.form?.get(field.name) as FormArray;
        
  //       // ALWAYS reuse existing FormArray if it exists, regardless of pristine state
  //       // This prevents recreating the array after removals
  //       if (existingArray) {
  //         this.setNestedControl(group, field.name, existingArray);
  //         console.log('Reusing existing FormArray:', field.name, existingArray.value);
  //         return;
  //       }
        
  //       // Only create new FormArray if it doesn't exist
  //       const dataSource = this.formData();
  //       const arrayData = this.getNestedValue(dataSource, field.name) || [];
  //       console.log('Creating new FormArray with data:', arrayData);
        
  //       const formArray = this.fb.array(
  //         arrayData.map((item: any) => this.createArrayItem(field.fields ?? [], item))
  //       );
  //       this.setNestedControl(group, field.name, formArray);
  //     } else {
  //       let value = this.getNestedValue(this.formData(), field.name);

  //       if (field.type === 'file') {
  //         value = null;
  //       } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
  //         value = value || [];
  //       } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
  //         value = value.id;
  //       }

  //       this.setNestedControl(group, field.name, new FormControl(value, []));
  //     }
  //   }
  // });

  //   this.form = this.fb.group(group);
    
  //   this.form.valueChanges.pipe(
  //     debounceTime(1000),
  //     distinctUntilChanged(),
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(currentValue => {
  //     const originalData = this.formData() || {};
  //     const formValue = this.form.value;
  //     const mergedData = this.deepMerge(originalData, formValue);
  //     this.formChange.emit(mergedData);
  //   });
  //   console.log('Form created:', this.form);
  // }

  // private setNestedControl(group: { [key: string]: any }, path: string, control: any) {
  //   const parts = path.split('.');
  //   let current = group;
    
  //   for (let i = 0; i < parts.length - 1; i++) {
  //     const part = parts[i];
  //     if (!current[part]) {
  //       current[part] = this.fb.group({});
  //     }
  //     current = current[part];
  //   }
    
  //   current[parts[parts.length - 1]] = control;
  // }

  
  createForm() {
    const group: { [key: string]: any } = {};
    const formFields = this.getAllFormFields();
  
    formFields.forEach(field => {
      if (field && field.name) {
        if (field.type === 'form-array') {
          const existingArray = this.form?.get(field.name) as FormArray;
          
          if (existingArray) {
            this.setNestedControl(group, field.name, existingArray);
            return;
          }
          
          const dataSource = this.formData();
          const arrayData = this.getNestedValue(dataSource, field.name) || [];
          const fields = this.getFormFieldsFromFormTemplate(field.nestedForm)

          const formArray = this.fb.array(
            arrayData.map((item: any) => this.createArrayItem(fields ?? [], item))
          );
          this.setNestedControl(group, field.name, formArray);
        } else {
          let value = this.getNestedValue(this.formData(), field.name);
  
          if (field.type === 'file') {
            value = null;
          } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
            value = value || [];
          } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
            value = value.id;
          }
  
          this.setNestedControl(group, field.name, new FormControl(value, []));
        }
      }
    });
  
    // Convert nested plain objects to FormGroups recursively
    this.form = this.fb.group(this.convertToFormGroup(group));
    
    this.form.valueChanges.pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(currentValue => {
      const originalData = this.formData() || {};
      const formValue = this.form.value;
      const mergedData = this.deepMerge(originalData, formValue);
      this.formChange.emit(mergedData);
    });
  }

  private convertToFormGroup(obj: any): any {
    const result: any = {};
    
    for (const key in obj) {
      if (obj[key] instanceof FormControl || obj[key] instanceof FormArray) {
        result[key] = obj[key];
      } else if (obj[key] instanceof FormGroup) {
        result[key] = obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = this.fb.group(this.convertToFormGroup(obj[key]));
      } else {
        result[key] = obj[key];
      }
    }
    
    return result;
  }
  
  private setNestedControl(group: { [key: string]: any }, path: string, control: any) {
    const parts = path.split('.');
    let current = group;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {}; // Just create plain object, will be converted later
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = control;
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
 
  


private createArrayItem(fields: FormField[], data: any = {}): FormGroup {
  const group: { [key: string]: any } = {};

  fields.forEach(field => {
    const value = this.getNestedValue(data, field.name) ?? field.initialValue ?? '';
    this.setNestedControl(group, field.name, new FormControl(value, field.validators || []));
  });

  return this.fb.group(this.convertToFormGroup(group));
}

  // private createArrayItem(fields: FormField[], data: any = {}): FormGroup {
  //   const group = this.fb.group({});
  //   fields.forEach(field => {
  //     const value = data[field.name] ?? field.initialValue ?? '';
  //     group.addControl(field.name, this.fb.control(value, field.validators));
  //   });
  //   return group;
  // }



  

/**
 * Handles when a new item is added to a form array
 */
onArrayItemAdded(formGroup: FormGroup): void {
  setTimeout(() => {
    this.formArrayChanged.update(val => val + 1);
  }, 0);
  // this.addItem.emit();

}

/**
 * Handles when an item is removed from a form array
 */
onArrayItemRemoved(event: { index: number, fieldName: string }): void {
  const formArray = this.form.get(event.fieldName) as FormArray;
  if (formArray && event.index >= 0 && event.index < formArray.length) {
    formArray.removeAt(event.index);

    const originalData = this.formData() || {};
    const formValue = this.form.value;
    const mergedData = this.deepMerge(originalData, formValue);
    this.formChange.emit(mergedData);

    setTimeout(() => {
      this.formArrayChanged.update(val => val + 1);
    }, 0);
  }
}

  private getAllFormFields(): FormField[] {
    const containers = this.formDefinition()?.formContainers ?? [];
    return containers
      .filter(c => (c.contentType === 'formField' || c.contentType === 'repeatingSection') && this.isFormField(c.content))
      .map(c => c.content as FormField);
  }

  private getFormFieldsFromFormTemplate(template: PrintableFormDto): FormField[] {
    const containers = template?.formContainers ?? [];
    return containers
      .filter(c => (c.contentType === 'formField' || c.contentType === 'repeatingSection') && this.isFormField(c.content))
      .map(c => c.content as FormField);
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  isFormField(content: any): content is FormField {
    return content && typeof content === 'object' && 'type' in content && 'name' in content;
  }

  onSubmit() {
    if (this.form.valid) {
      const originalData = this.formData() || {};
      const formValue = this.form.value;
      const mergedData = this.deepMerge(originalData, formValue);
      this.formSubmit.emit(mergedData);
    }
  }

  print(): void {
    if (this.formDefinition()) {
      const originalData = this.formData() || {};
      const formValue = this.form.value;
      const mergedData = this.deepMerge(originalData, formValue);
      this.printService.printForm(this.formDefinition()!, mergedData);
    }
  }


  // Nested Form Control 2
  processFormArrays(){
    if (!this.formDefinition() ||!this.formDefinition()!.formContainers) {
      return;
    }

    const updatedFormDefinition = new PrintableFormDto({...this.formDefinition()});

    const repeatingSections = updatedFormDefinition.formContainers.filter(c => c.contentType === 'repeatingSection');
    repeatingSections.forEach(section => {
      const newContainers = this.processFormArray(section);
      const index = updatedFormDefinition.formContainers.indexOf(section);
      if (index > -1) {
        updatedFormDefinition.formContainers.splice(index, 1, ...newContainers);
      }
    });
    return updatedFormDefinition;
  }

  private processFormArray(section: FormContainerDto): FormContainerDto[] {

    const formField = section.content as FormField;
    const key = formField.name;
    const dataSource = this.form && this.form.value ? this.form.value : this.formData();
    const formArrayData = this.getNestedValue(dataSource, key) ?? [];
    // if(!this.formData() || !formArrayData) throw new Error(`No data found for key "${key}"`);

    const mainFormPageHight = this.formDefinition()!.size.height * this.pixelsPerInch;
    const repeatingSectionContainerHeight = section.size?.height?? 0;
    const pageNumber = section.pageNumber;

    const nestedForm = formField.nestedForm;
    const nestedFormHeight = (nestedForm.size?.height ?? 1.5) * this.pixelsPerInch;
    const firstPageRoom = mainFormPageHight - section.position.y-10;
    const fullPageRoom = mainFormPageHight - 20;

    const firstPageCapacity = Math.floor(firstPageRoom / nestedFormHeight);
    const fullPageCapacity = Math.floor(fullPageRoom / nestedFormHeight);
    let containersNeeded;
    if(formArrayData.length <= firstPageCapacity){
      containersNeeded = 1;
    } else {
      const remainingItems = formArrayData.length - firstPageCapacity;
      const fullPageContainersNeeded = Math.ceil(remainingItems / fullPageCapacity);
      containersNeeded = 1 + fullPageContainersNeeded;
    }
    const readyContainers: FormContainerDto[] = [];

    for(let i = 0; i < containersNeeded; i++){
      const newContainer = new FormContainerDto({
        ...section,
        content: JSON.parse(JSON.stringify(section.content)) // Deep copy content
      });
      let startIndex: number;
      let endIndex: number;

      if(i === 0) {
        startIndex = 0;
        endIndex = Math.min(firstPageCapacity, formArrayData.length);
        newContainer.pageNumber = pageNumber;
      } else {
        startIndex = firstPageCapacity + (i - 1) * fullPageCapacity;
        endIndex = Math.min(startIndex + fullPageCapacity, formArrayData.length);
        newContainer.pageNumber = (pageNumber ?? 1) + i;
        newContainer.position = { ...newContainer.position, y: 10 };
        newContainer.size = { ...newContainer.size, height: fullPageRoom };
      }

      
      (newContainer.content as FormField).arrayIndexRange = { start: startIndex, end: endIndex };
      readyContainers.push(newContainer);
    }

    return readyContainers;
    
  }




}
