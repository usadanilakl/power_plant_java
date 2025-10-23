
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
  readOnly = input<boolean>(false);
  
  formSubmit = output<any>();
  formChange = output<any>();
  formDelete = output<number>();
  formDefinitionChange = output<PrintableFormDto>(); // New output for form definition changes

  formDefinition = signal<PrintableFormDto | null>(this.formDefinitionInput());
  private formArrayChanged = signal(0);

  form: FormGroup;
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private printService = inject(PrintService);

  containers = computed(() => {
    const originalContainers = this.formDefinition()?.formContainers ?? [];
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
  
  processedFormDefinition = computed(() => {
    this.formArrayChanged(); 
    return this.processFormArrays();
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
      if (newFormDefinition !== this.formDefinition()) {
        this.formDefinition.set(this.formDefinitionInput());
        console.log('Form definition changed:', newFormDefinition);
        this.createForm();
        // this.initializeAndOrganizeContainers();
        // this.processFormArrays();
      }
    });

    effect(() => {
      console.log('FormDef: ', this.processedFormDefinition())
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

  createForm() {
    const group: { [key: string]: any } = {};
    const formFields = this.getAllFormFields();

    formFields.forEach(field => {
      if (field && field.name) {
        if (field.type === 'form-array') {
          const arrayData = this.getNestedValue(this.formData(), field.name) || [];
          const formArray = this.fb.array(
            arrayData.map((item: any) => this.createArrayItem(field.fields ?? [], item))
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

    this.form = this.fb.group(group);
    
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
  

/**
 * Handles when a new item is added to a form array
 */
onArrayItemAdded(): void {
  this.formArrayChanged.update(val => val + 1);
}

/**
 * Handles when an item is removed from a form array
 */
onArrayItemRemoved(event: { index: number, fieldName: string }): void {
  this.formArrayChanged.update(val => val + 1);
}

  
  


  private createArrayItem(fields: FormField[], data: any = {}): FormGroup {
    const group = this.fb.group({});
    fields.forEach(field => {
      const value = data[field.name] ?? field.initialValue ?? '';
      group.addControl(field.name, this.fb.control(value, field.validators));
    });
    return group;
  }

  private getAllFormFields(): FormField[] {
    const containers = this.formDefinition()?.formContainers ?? [];
    return containers
      .filter(c => (c.contentType === 'formField' || c.contentType === 'repeatingSection') && this.isFormField(c.content))
      .map(c => c.content as FormField);
  }

  private setNestedControl(group: { [key: string]: any }, path: string, control: any) {
    const parts = path.split('.');
    let current = group;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = this.fb.group({});
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = control;
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
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
    // this.formDefinition.set(updatedFormDefinition);
    console.log('Updated form definition:', updatedFormDefinition);
    return updatedFormDefinition;
  }

  private processFormArray(section: FormContainerDto): FormContainerDto[] {

    const formField = section.content as FormField;
    const key = formField.name;
    const formArrayData = this.getNestedValue(this.formData(), key);
    if(!this.formData() || !formArrayData) throw new Error(`No data found for key "${key}"`);

    console.log('Processing form array:', formArrayData);

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

    console.log(`Processed form array for section "${key}":`, readyContainers);

    return readyContainers;
    
  }




}


// import { Component, computed, DestroyRef, effect, ElementRef, inject, Input, input, OnChanges, output, Renderer2, signal, Signal, SimpleChanges } from '@angular/core';
// import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { FormField } from '../../../models/ui/form-field.model';
// import { FormContainerDto } from '../../../models/forms/form-container.model';
// import { PrintableFormDto } from '../../../models/forms/printable-form.model';
// import { CommonModule } from '@angular/common';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { debounceTime, distinctUntilChanged, Observable, of, startWith } from 'rxjs';
// import { PrintService } from '../../../services/ui/print.service';
// import { FormContainerRendererComponent } from "./form-container-renderer/form-container-renderer.component";

// @Component({
//   selector: 'app-form-renderer',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, FormContainerRendererComponent],
//   templateUrl: './form-renderer.component.html',
//   styleUrl: './form-renderer.component.css'
// })
// export class FormRendererComponent {
//   formDefinition = input<PrintableFormDto | null>(null);
//   @Input() formData: Signal<any> = signal<any | null>(null);
//   readOnly = input<boolean>(false);
//   // formData = input<any | null>(null);
//   formSubmit = output<any>();
//   formChange = output<any>();
//   formDelete = output<number>();

//   form: FormGroup;
//   private fb = inject(FormBuilder);
//   private destroyRef = inject(DestroyRef);
//   private renderer = inject(Renderer2);
//   private el = inject(ElementRef);
//   private printService = inject(PrintService);

//   // Use computed signals for easier template binding
//   // containers = computed(() => this.formDefinition()?.formContainers ?? []);
//   containers = computed(() => {
//     const originalContainers = this.formDefinition()?.formContainers ?? [];
//     return originalContainers.map(container => {
//       if (container.contentType === 'formField' && this.isFormField(container.content)) {
//         const field = container.content as FormField;
//         return new FormContainerDto({
//           ...container,
//           content: {
//             ...field,
//             label: ''
//           }
//         });
//       }
//       return container;
//     });
//   });

//   pages = computed(() => {
//     const allContainers = this.formDefinition()?.formContainers ?? [];
//     if (allContainers.length === 0) {
//       return [{ pageNumber: 1, containers: [] }];
//     }

//     const pagesMap = new Map<number, FormContainerDto[]>();
//     allContainers.forEach(container => {
//       const pageNum = container.pageNumber ?? 1;
//       if (!pagesMap.has(pageNum)) {
//         pagesMap.set(pageNum, []);
//       }
//       pagesMap.get(pageNum)!.push(container);
//     });

//     return Array.from(pagesMap.entries())
//       .map(([pageNumber, containers]) => ({ pageNumber, containers }))
//       .sort((a, b) => a.pageNumber - b.pageNumber);
//   });

//   sheetSize = computed(() => this.formDefinition()?.size ?? { width: 8.5, height: 11 });
//   pixelsPerInch = 96;

//   // constructor() {
//   //   this.form = this.fb.group({});
//   // }

//   constructor() {
//     this.form = this.fb.group({});
//     effect(() => {
//       this.formDefinition(); // re-run when form definition changes
//       this.createForm();
//     });

//     effect(() => {
//       const data = this.formData(); // re-run when form data changes
//       if (data && this.form) {
//         this.form.patchValue(data, { emitEvent: false });
//       }
//     });
//   }


//   createForm() {
//     const group: { [key: string]: any } = {};
//     const formFields = this.getAllFormFields();

//     formFields.forEach(field => {
//       if (field && field.name) {
//           if (field.type === 'form-array') {
//             // Handle FormArray
//             console.log('Handling FormArray:', field);
//             const arrayData = this.getNestedValue(this.formData(), field.name) || [];
//             const formArray = this.fb.array(
//               arrayData.map((item: any) => this.createArrayItem(field.fields ?? [], item))
//             );
//             this.setNestedControl(group, field.name, formArray);

//           } else{
//           let value = this.getNestedValue(this.formData(), field.name);

//           if (field.type === 'file') {
//             value = null;
//           } else if (field.type === 'checkbox-group' || field.type === 'multi-select' || field.type === 'multi-input') {
//             value = value || [];
//           } else if (field.type === 'select' && typeof value === 'object' && value !== null) {
//             // Assuming the object has an 'id' property to be used as the form value
//             value = value.id;
//           }

//           // Use the new helper to create nested structure
//           this.setNestedControl(group, field.name, new FormControl(value, []));
//         }
//       }
//     });

//     this.form = this.fb.group(group);
    
//     this.form.valueChanges.pipe(
//       debounceTime(1000), // Wait for 300ms of inactivity before emitting
//       distinctUntilChanged(), // Only emit if the value has changed
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(currentValue => {
//       // console.log('Form value changed: ', currentValue);
//       const originalData = this.formData() || {};
//       const formValue = this.form.value;
//       const mergedData = this.deepMerge(originalData, formValue);
//       this.formChange.emit(mergedData);
//     });

//     console.log('Form created: ', this.form);
//   }

//   private createArrayItem(fields: FormField[], data: any = {}): FormGroup {
//     console.log('Creating array item with fields:', fields);
//     console.log('Data for array item:', data);
//     const group = this.fb.group({});
//     fields.forEach(field => {
//       const value = data[field.name] ?? field.initialValue ?? '';
//       group.addControl(field.name, this.fb.control(value, field.validators));
//     });
//     return group;
//   }

//   getFormArray(name: string): FormArray {
//     return this.form.get(name) as FormArray;
//   }

//   addArrayItem(arrayName: string, fields: FormField[]) {
//     const formArray = this.getFormArray(arrayName);
//     if (formArray) {
//       formArray.push(this.createArrayItem(fields));
//       this.form.markAsDirty();
//     }
//   }

//   removeArrayItem(arrayName: string, index: number) {
//     const formArray = this.getFormArray(arrayName);
//     if (formArray) {
//       formArray.removeAt(index);
//       this.form.markAsDirty();
//     }
//   }

//   private setNestedControl(group: { [key: string]: any }, path: string, control: FormControl | FormArray) {
//     const pathParts = path.split('.');
//     let currentGroup: any = group;

//     for (let i = 0; i < pathParts.length - 1; i++) {
//       const part = pathParts[i];
//       if (!currentGroup[part]) {
//         currentGroup[part] = this.fb.group({});
//       }
//       currentGroup = currentGroup[part];
//     }

//     const lastPart = pathParts[pathParts.length - 1];
//     if (currentGroup instanceof FormGroup) {
//       currentGroup.addControl(lastPart, control);
//     } else {
//       currentGroup[lastPart] = control;
//     }
//   }

//   getFormControl(path: string): FormControl {
//     const control = this.form.get(path);
//     if (!control) {
//       // Return a dummy control to avoid template errors if the control doesn't exist yet
//       return new FormControl();
//     }
//     console.log('Found control:', control);
//     return control as FormControl;
//   }

//   getFormControlValue(name: string | null): Observable<any> {
//     if (!name) {
//       return of(''); // Return an observable of an empty string if name is null
//     }
//     const control = this.form.get(name);
//     const value = this.getNestedValue(this.formData(), name);
//     if (!control) {
//       return of(value); // Return an observable of an empty string if control not found
//     }
//     // This is the key: return the valueChanges observable
//     // startWith ensures the initial value is displayed immediately
//     return control.valueChanges.pipe(startWith(control.value));
//   }

//   private getAllFormFields(): FormField[] {
//     console.log('Containers:', this.containers());
//     return this.containers()
//       .filter(container => (container.contentType === 'formField' || container.contentType === 'repeatingSection') && this.isFormField(container.content))
//       .map(container => container.content as FormField);
//   }

//   private getNestedValue(obj: any, path: string): any {
//     if (!obj || !path) {
//       return null;
//     }
//     return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
//   }

//   getContainerStyles(container: FormContainerDto): any {
//     const styles: any = {
//       ...container.style,
//       position: 'absolute',
//       left: `${container.position.x}px`,
//       top: `${container.position.y}px`,
//       width: `${container.size.width}px`,
//       height: `${container.size.height}px`,
//     };

//     if (this.isFormField(container.content) && container.content.style) {
//       Object.assign(styles, this.getContainerStyles(container));
//     }

//     return styles;
//   }

//   getContentStyles(container: FormContainerDto): any {
//     if (!container.contentStyle) {
//       return {};
//     }
//     const styles = { ...container.contentStyle };
//     if (styles.fontSize && typeof styles.fontSize === 'number') {
//       styles.fontSize = `${styles.fontSize}px`;
//     }
//     return styles;
//   }

//   getContentStyle(container: FormContainerDto): { [klass: string]: any; }|null|undefined {
//     return {
//       'display': 'flex',
//       'justify-content': container.style.justifyContent?? 'center',
//       'align-items': container.style.alignItems?? 'center',
//     }
//   }

//   isFormField(content: any): content is FormField {
//     return content && typeof content === 'object' && 'name' in content && 'type' in content;
//   }
  
//   isTextContainer(content: any): boolean{
//     return content && content.type && content.type === 'text';
//   }

//   isVariableContainer(content: any): boolean{
//     return content && content.type && content.type === 'variable';
//   }

//   asFormField(content: any): FormField {
//     if (this.isFormField(content)) {
//       return content;
//     }
//     // This is a type guard; actual return doesn't matter if isFormField is false.
//     // But for safety, we can return a non-FormField-like object.
//     return {} as FormField;
//   }

//   onSubmit() {
//     if (this.form.valid) {
//       const originalData = this.formData() || {};
//       const formValue = this.form.value;
//       const mergedData = this.deepMerge(originalData, formValue);

//       this.formSubmit.emit(mergedData);
//     } else {
//       this.form.markAllAsTouched();
//     }
//   }

//   private deepMerge(target: any, source: any): any {
//     const output = { ...target };
  
//     if (this.isObject(target) && this.isObject(source)) {
//       Object.keys(source).forEach(key => {
//         if (this.isObject(source[key])) {
//           if (!(key in target)) {
//             Object.assign(output, { [key]: source[key] });
//           } else {
//             output[key] = this.deepMerge(target[key], source[key]);
//           }
//         } else {
//           Object.assign(output, { [key]: source[key] });
//         }
//       });
//     }
  
//     return output;
//   }

//   private isObject(item: any): boolean {
//     return (item && typeof item === 'object' && !Array.isArray(item));
//   }
//   /**
//    * Hands off the form definition and current data to the PrintService
//    * to be rendered in the dedicated print layout component.
//    */
//   print(): void {
//     if (this.formDefinition()) {
//       const originalData = this.formData() || {};
//       const formValue = this.form.value;
//       const mergedData = this.deepMerge(originalData, formValue);
//       this.printService.printForm(this.formDefinition()!, mergedData);
//     }
//   }

// }