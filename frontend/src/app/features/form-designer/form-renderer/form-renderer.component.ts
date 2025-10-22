
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
    const formDef = this.formDefinition();
    const formData = this.formData();
    if (!formDef || !formData) {
      return formDef;
    }
    return this.processFormArrays(formDef, formData);
  });

  pages = computed(() => {
    const allContainers = this.formDefinition()?.formContainers ?? [];
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
onArrayItemAdded(event: { index: number, fieldName: string }): void {
  // The FormArray has already been updated by nested-form-input
  // We just need to create the new page with containers
  // this.addPageForArrayItem(event.index, event.fieldName);
}

/**
 * Handles when an item is removed from a form array
 */
onArrayItemRemoved(event: { index: number, fieldName: string }): void {
  // The FormArray has already been updated by nested-form-input
  // We just need to remove the associated page
  // this.removePageForArrayItem(event.index, event.fieldName);
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





  //Nested form controls:
  private itemsPerContainer = 0;
  
  private calculateItemsPerContainer(parentContainer: FormContainerDto, nestedForm: PrintableFormDto) {
    const pixelsPerInch = this.pixelsPerInch;
    const parentContainerHeight = parentContainer.size?.height ?? 0;
    const nestedFormHeight = (nestedForm.size?.height ?? 1.5) * pixelsPerInch;
    this.itemsPerContainer = Math.floor(parentContainerHeight / nestedFormHeight);
  }
  
  addPageForArrayItem(itemIndex: number, arrayFieldName: string) {
    const currentDefinition = this.formDefinition();
    if (!currentDefinition) return;
  
    const parentContainer = this.findParentContainer(currentDefinition, arrayFieldName);
    if (!parentContainer) return;
  
    const nestedForm = (parentContainer.content as FormField).nestedForm;
    if (!nestedForm) return;
  
    this.calculateItemsPerContainer(parentContainer, nestedForm);
  
    const containerIndex = Math.floor(itemIndex / this.itemsPerContainer);
    const itemIndexInContainer = itemIndex % this.itemsPerContainer;
  
    let targetContainer = this.findOrCreateContainer(currentDefinition, arrayFieldName, containerIndex);
  
    // Add the new item to the target container
    this.addItemToContainer(targetContainer, nestedForm, itemIndexInContainer);
  
    // Update the form definition
    this.updateFormDefinition(currentDefinition);
  }
  
  removePageForArrayItem(itemIndex: number, arrayFieldName: string) {
    const currentDefinition = this.formDefinition();
    if (!currentDefinition) return;
  
    const parentContainer = this.findParentContainer(currentDefinition, arrayFieldName);
    if (!parentContainer) return;
  
    const nestedForm = (parentContainer.content as FormField).nestedForm;
    if (!nestedForm) return;
  
    this.calculateItemsPerContainer(parentContainer, nestedForm);
  
    const containerIndex = Math.floor(itemIndex / this.itemsPerContainer);
    const itemIndexInContainer = itemIndex % this.itemsPerContainer;
  
    let targetContainer = this.findContainer(currentDefinition, arrayFieldName, containerIndex);
    if (!targetContainer) return;
  
    // Remove the item from the target container
    this.removeItemFromContainer(targetContainer, itemIndexInContainer);
  
    // Check if we need to consolidate containers
    this.consolidateContainers(currentDefinition, arrayFieldName);
  
    // Update the form definition
    this.updateFormDefinition(currentDefinition);
  }
  
  private findParentContainer(definition: PrintableFormDto, arrayFieldName: string): FormContainerDto | undefined {
    return definition.formContainers?.find(container => 
      container.contentType === 'repeatingSection' && 
      this.isFormField(container.content) && 
      (container.content as FormField).name === arrayFieldName
    );
  }
  
  private findOrCreateContainer(definition: PrintableFormDto, arrayFieldName: string, containerIndex: number): FormContainerDto {
    let container = this.findContainer(definition, arrayFieldName, containerIndex);
    if (!container) {
      container = this.createNewContainer(definition, arrayFieldName, containerIndex);
      definition.formContainers?.push(container);
    }
    return container;
  }
  
  private findContainer(definition: PrintableFormDto, arrayFieldName: string, containerIndex: number): FormContainerDto | undefined {
    return definition.formContainers?.find(container => 
      container.contentType === 'repeatingSection' && 
      this.isFormField(container.content) && 
      (container.content as FormField).name === arrayFieldName &&
      container.pageNumber === containerIndex + 1
    );
  }
  
  private createNewContainer(definition: PrintableFormDto, arrayFieldName: string, containerIndex: number): FormContainerDto {
    // Create a new container based on the parent container's properties
    const parentContainer = this.findParentContainer(definition, arrayFieldName);
    return new FormContainerDto({
      ...parentContainer,
      id: Date.now(), // Generate a new ID
      pageNumber: containerIndex + 1,
      position: { x: parentContainer?.position?.x ?? 0, y: 0 }, // Reset Y position for new page
      content: {
        ...(parentContainer?.content as FormField),
        initialValue: [] // Reset initial value for new container
      }
    });
  }
  
  private addItemToContainer(container: FormContainerDto, nestedForm: PrintableFormDto, itemIndex: number) {
    if (container.contentType !== 'repeatingSection' || !this.isFormField(container.content)) {
      console.error('Invalid container type for adding items');
      return;
    }
  
    const formField = container.content as FormField;
    if (!Array.isArray(formField.initialValue)) {
      formField.initialValue = [];
    }
  
    // Create a new item based on the nestedForm structure
    const newItem: any = {};
    nestedForm.formContainers?.forEach(nestedContainer => {
      if (this.isFormField(nestedContainer.content)) {
        const fieldName = (nestedContainer.content as FormField).name;
        newItem[fieldName] = null; // Or set a default value if needed
      }
    });
  
    // Add the new item to the formField's initialValue array
    formField.initialValue.push(newItem);
  
    // Adjust the positions of existing items if necessary
    this.adjustItemPositions(container, itemIndex);
  }
  
  private adjustItemPositions(container: FormContainerDto, startIndex: number) {
    if (container.contentType !== 'repeatingSection' || !this.isFormField(container.content)) {
      return;
    }
  
    const formField = container.content as FormField;
    const nestedForm = formField.nestedForm;
    if (!nestedForm) return;
  
    const itemHeight = (nestedForm.size?.height ?? 0) * this.pixelsPerInch;
    
    // Instead of adjusting child containers, we'll adjust the positions of the items within the formField
    if (Array.isArray(formField.initialValue)) {
      for (let i = startIndex; i < formField.initialValue.length; i++) {
        // Adjust the Y position of each item
        const item = formField.initialValue[i];
        if (item && typeof item === 'object') {
          if (!item.position) item.position = { x: 0, y: 0 };
          item.position.y = i * itemHeight;
        }
      }
    }
  }
  
  private removeItemFromContainer(container: FormContainerDto, itemIndex: number) {
    if (container.contentType !== 'repeatingSection' || !this.isFormField(container.content)) {
      console.error('Invalid container type for removing items');
      return;
    }
  
    const formField = container.content as FormField;
    if (formField.type === 'form-array' && Array.isArray(formField.initialValue)) {
      formField.initialValue.splice(itemIndex, 1);
    }
  
    // Adjust positions of remaining items
    this.adjustItemPositions(container, itemIndex);
  }
  
  private consolidateContainers(definition: PrintableFormDto, arrayFieldName: string) {
    const containers = definition.formContainers?.filter(container => 
      container.contentType === 'repeatingSection' && 
      this.isFormField(container.content) && 
      (container.content as FormField).name === arrayFieldName
    );
  
    if (!containers || containers.length <= 1) return;
  
    const totalItems = containers.reduce((sum, container) => {
      const formField = container.content as FormField;
      return sum + (Array.isArray(formField.initialValue) ? formField.initialValue.length : 0);
    }, 0);
  
    const requiredContainers = Math.ceil(totalItems / this.itemsPerContainer);
  
    // Remove excess containers
    if (containers.length > requiredContainers) {
      definition.formContainers = definition.formContainers?.filter(container => 
        container.contentType !== 'repeatingSection' || 
        !this.isFormField(container.content) || 
        (container.content as FormField).name !== arrayFieldName ||
        containers.indexOf(container) < requiredContainers
      );
    }
  }
  
  private updateFormDefinition(updatedDefinition: PrintableFormDto) {
    this.formDefinition.set(updatedDefinition);
    this.formDefinitionChange.emit(updatedDefinition);
  }

  private initializeAndOrganizeContainers() {
    const currentDefinition = this.formDefinition();
    if (!currentDefinition) return;
  
    const updatedContainers: FormContainerDto[] = [];
  
    currentDefinition.formContainers?.forEach(container => {
      if (container.contentType === 'repeatingSection' && this.isFormField(container.content)) {
        const formField = container.content as FormField;
        if (formField.type === 'form-array') {
          this.organizeRepeatingSection(currentDefinition, container, formField, updatedContainers);
        } else {
          updatedContainers.push(container);
        }
      } else {
        updatedContainers.push(container);
      }
    });
  
    currentDefinition.formContainers = updatedContainers;
    console.log('Form definition before update: ', this.formDefinitionInput());
    this.updateFormDefinition(currentDefinition);
  }
  
  private organizeRepeatingSection(
    currentDefinition: PrintableFormDto, 
    container: FormContainerDto, 
    formField: FormField, 
    updatedContainers: FormContainerDto[]
  ) {
    const arrayFieldName = formField.name;
    const arrayData = this.getNestedValue(this.formData(), arrayFieldName) || [];
  
    this.calculateItemsPerContainer(container, formField.nestedForm!);
  
    const requiredContainers = Math.ceil(arrayData.length / this.itemsPerContainer);
  
    console.log(`Organizing containers for ${arrayFieldName}. Total items: ${arrayData.length}, Items per container: ${this.itemsPerContainer}, Required containers: ${requiredContainers}`);
  
    for (let i = 0; i < requiredContainers; i++) {
      let containerToUpdate = this.findContainer(currentDefinition, arrayFieldName, i);
      if (!containerToUpdate) {
        containerToUpdate = this.createNewContainer(currentDefinition, arrayFieldName, i);
      }
      this.updateContainerItems(containerToUpdate, arrayData, i);
      updatedContainers.push(containerToUpdate);
    }
  
    // Remove any excess containers
    const existingContainers = currentDefinition.formContainers?.filter(c => 
      c.contentType === 'repeatingSection' && 
      this.isFormField(c.content) && 
      (c.content as FormField).name === arrayFieldName
    ) || [];
  
    for (let i = requiredContainers; i < existingContainers.length; i++) {
      const index = currentDefinition.formContainers?.indexOf(existingContainers[i]);
      if (index !== undefined && index > -1) {
        currentDefinition.formContainers?.splice(index, 1);
      }
    }
  }
  
  private updateContainerItems(container: FormContainerDto, arrayData: any[], containerIndex: number) {
    if (container.contentType !== 'repeatingSection' || !this.isFormField(container.content)) {
      console.error('Invalid container type for updating items');
      return;
    }
  
    const formField = container.content as FormField;
    const startIndex = containerIndex * this.itemsPerContainer;
    const endIndex = Math.min((containerIndex + 1) * this.itemsPerContainer, arrayData.length);
    
    // Slice the correct portion of the array for this container
    const containerItems = arrayData.slice(startIndex, endIndex);
    
    // Update the formField's initialValue with the correct items for this container
    if (!Array.isArray(formField.initialValue)) {
      formField.initialValue = [];
    }
  
    // Clear existing items and add new ones
    formField.initialValue.length = 0;
    formField.initialValue.push(...containerItems);
  
    // Adjust positions of items within this container
    this.adjustItemPositions(container, 0);
  
    console.log(`Container ${containerIndex + 1} updated with items:`, formField.initialValue);
  }

  getContainerIndex(pageIndex: number, containerIndex: number): number {
    return this.pages().slice(0, pageIndex).reduce((sum, page) => sum + page.containers.length, 0) + containerIndex;
  }

  getItemsPerContainer(container: FormContainerDto): number {
    if (this.isFormField(container.content) && container.content.type === 'form-array') {
      return this.itemsPerContainer;
    }
    return 1;
  }


  // Nested Form Control 2
  // processFormArrays(){
  //   if (!this.formDefinition() ||!this.formDefinition()!.formContainers) {
  //     return;
  //   }

  //   const updatedFormDefinition = new PrintableFormDto({...this.formDefinition()});

  //   const repeatingSections = updatedFormDefinition.formContainers.filter(c => c.contentType === 'repeatingSection');
  //   repeatingSections.forEach(section => {
  //     const newContainers = this.processFormArray(section);
  //     const index = updatedFormDefinition.formContainers.indexOf(section);
  //     if (index > -1) {
  //       updatedFormDefinition.formContainers.splice(index, 1, ...newContainers);
  //     }
  //   });
  //   this.formDefinition.set(updatedFormDefinition);
  // }

  // private processFormArray(section: FormContainerDto): FormContainerDto[] {

  //   const formField = section.content as FormField;
  //   const key = formField.name;
  //   const formArrayData = this.getNestedValue(this.formData(), key);
  //   if(!this.formData() || !formArrayData) throw new Error(`No data found for key "${key}"`);

  //   const mainFormPageHight = this.formDefinition()!.size.height * this.pixelsPerInch;
  //   const repeatingSectionContainerHeight = section.size?.height?? 0;
  //   const pageNumber = section.pageNumber;

  //   const nestedForm = formField.nestedForm;
  //   const nestedFormHeight = (nestedForm.size?.height ?? 1.5) * this.pixelsPerInch;
  //   const firstPageRoom = mainFormPageHight - section.position.y-10;
  //   const fullPageRoom = mainFormPageHight - 20;

  //   const firstPageCapacity = Math.floor(firstPageRoom / nestedFormHeight);
  //   const fullPageCapacity = Math.floor(fullPageRoom / nestedFormHeight);
  //   let containersNeeded;
  //   if(formArrayData.length <= firstPageCapacity){
  //     containersNeeded = 1;
  //   } else {
  //     const remainingItems = formArrayData.length - firstPageCapacity;
  //     const fullPageContainersNeeded = Math.ceil(remainingItems / fullPageCapacity);
  //     containersNeeded = 1 + fullPageContainersNeeded;
  //   }
  //   const readyContainers: FormContainerDto[] = [];

  //   for(let i = 0; i < containersNeeded; i++){
  //     const newContainer = new FormContainerDto({...section});
  //     let startIndex: number;
  //     let endIndex: number;

  //     if(i === 0) {
  //       startIndex = 0;
  //       endIndex = Math.min(firstPageCapacity - 1, formArrayData.length - 1);
  //       newContainer.pageNumber = pageNumber;
  //     } else {
  //       startIndex = firstPageCapacity + (i - 1) * fullPageCapacity;
  //       endIndex = Math.min(startIndex + fullPageCapacity - 1, formArrayData.length - 1);
  //       newContainer.pageNumber = (pageNumber ?? 1) + i;
  //       newContainer.position = { ...newContainer.position, y: 10 }; // Reset Y position for new page
  //       newContainer.size = { ...newContainer.size, height: fullPageRoom };
  //     }

      
  //     (newContainer.content as FormField).arrayIndexRange = { start: startIndex, end: endIndex };
  //     readyContainers.push(newContainer);
  //   }


  //   return readyContainers;
    
  // }



  processFormArrays(formDef: PrintableFormDto, formData: any): PrintableFormDto {
    if (!formDef.formContainers) {
      return formDef;
    }
  
    const updatedFormDefinition = new PrintableFormDto({ ...formDef });
    let newContainers = [...updatedFormDefinition.formContainers];
  
    const repeatingSections = updatedFormDefinition.formContainers.filter(
      c => c.contentType === 'repeatingSection' && this.isFormField(c.content)
    );
  
    repeatingSections.forEach(sectionContainer => {
      const processedSectionContainers = this.processFormArray(sectionContainer, formData);
      const index = newContainers.findIndex(c => c.id === sectionContainer.id);
      if (index > -1) {
        newContainers.splice(index, 1, ...processedSectionContainers);
      }
    });
  
    updatedFormDefinition.formContainers = newContainers;
    return updatedFormDefinition;
  }
  
  private processFormArray(sectionContainer: FormContainerDto, formData: any): FormContainerDto[] {
    if (!this.isFormField(sectionContainer.content)) {
      return [sectionContainer];
    }
  
    const field = sectionContainer.content as FormField;
    const nestedForm = field.nestedForm;
    if (!nestedForm) {
      return [sectionContainer];
    }
  
    const dataArray = this.getNestedValue(formData, field.name) ?? [];
  
    // If there's no data, create one empty container for the section
    if (dataArray.length === 0) {
      const emptyContainer = new FormContainerDto({
        ...sectionContainer,
        contentType: 'formField',
        content: {
          ...nestedForm,
          name: `${field.name}_0`,
          type: 'nestedForm',
        }
      });
      (emptyContainer.content as FormField).arrayIndexRange = { start: 0, end: -1 }; // Indicate empty
      return [emptyContainer];
    }
  
    const { firstPageCapacity, fullPageCapacity } = this.calculateCapacities(sectionContainer, nestedForm);
  
    if (firstPageCapacity === 0 && fullPageCapacity === 0) {
      console.error("Cannot render repeating section, as item height is zero or larger than page height.", sectionContainer);
      return [sectionContainer]; // Avoid infinite loop
    }
  
    const generatedContainers: FormContainerDto[] = [];
    let itemsProcessed = 0;
    let containerIndex = 0;
  
    // First page container
    if (itemsProcessed < dataArray.length) {
      const newContainer = new FormContainerDto({ ...sectionContainer });
      const itemsOnThisPage = Math.min(firstPageCapacity, dataArray.length);
      newContainer.pageNumber = sectionContainer.pageNumber;
      (newContainer.content as FormField).arrayIndexRange = { start: itemsProcessed, end: itemsProcessed + itemsOnThisPage - 1 };
      generatedContainers.push(newContainer);
      itemsProcessed += itemsOnThisPage;
      containerIndex++;
    }
  
    // Subsequent full-page containers
    while (itemsProcessed < dataArray.length) {
      const newContainer = new FormContainerDto({ ...sectionContainer });
      const itemsOnThisPage = Math.min(fullPageCapacity, dataArray.length - itemsProcessed);
      if (itemsOnThisPage <= 0) break; // Safety break
  
      newContainer.pageNumber = (sectionContainer.pageNumber ?? 1) + containerIndex;
      newContainer.position = { ...newContainer.position, y: 10 }; // Reset Y for new page
      (newContainer.content as FormField).arrayIndexRange = { start: itemsProcessed, end: itemsProcessed + itemsOnThisPage - 1 };
      generatedContainers.push(newContainer);
      itemsProcessed += itemsOnThisPage;
      containerIndex++;
    }
  
    return generatedContainers;
  }
  
  private calculateCapacities(sectionContainer: FormContainerDto, nestedForm: PrintableFormDto): { firstPageCapacity: number, fullPageCapacity: number } {
    const pageHeight = (this.formDefinition()?.size.height ?? 11) * this.pixelsPerInch;
    const itemHeight = (nestedForm.size?.height ?? 1.5) * this.pixelsPerInch;
  
    if (itemHeight <= 0) {
      return { firstPageCapacity: 0, fullPageCapacity: 0 };
    }
  
    const firstPageRoom = pageHeight - (sectionContainer.position.y ?? 10) - 10;
    const fullPageRoom = pageHeight - 20;
  
    const firstPageCapacity = Math.max(0, Math.floor(firstPageRoom / itemHeight));
    const fullPageCapacity = Math.max(0, Math.floor(fullPageRoom / itemHeight));
  
    return { firstPageCapacity, fullPageCapacity };
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