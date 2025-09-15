import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormField } from '../../models/ui/form-field.model';
import { Container } from '../../features/form-designer/printable-form-designer/printable-form-designer.component';

@Injectable({
  providedIn: 'root'
})
export class FormBuilderService {
  private formFieldsSubject = new BehaviorSubject<FormField[]>([]);
  formFields$: Observable<FormField[]> = this.formFieldsSubject.asObservable();

  private formContainersSubject = new BehaviorSubject<Container[]>([]);
  formContainers$: Observable<Container[]> = this.formContainersSubject.asObservable();

  constructor() {}

  addField(field: FormField) {
    const currentFields = this.formFieldsSubject.value;
    this.formFieldsSubject.next([...currentFields, field]);
  }

  updateField(index: number, field: FormField) {
    const currentFields = this.formFieldsSubject.value;
    currentFields[index] = field;
    this.formFieldsSubject.next([...currentFields]);
  }

  removeField(index: number) {
    const currentFields = this.formFieldsSubject.value;
    currentFields.splice(index, 1);
    this.formFieldsSubject.next([...currentFields]);
  }

  getFormFields(): FormField[] {
    return this.formFieldsSubject.value;
  }

  setFormFields(fields: FormField[]) {
    this.formFieldsSubject.next(fields);
  }

  // Add methods for saving and loading form designs
  saveFormDesign(designName: string) {
    const design = {
      name: designName,
      fields: this.getFormFields()
    };
    // Implement saving logic (e.g., to localStorage or backend)
  }

  loadFormDesign(designName: string) {
    // Implement loading logic
    // this.setFormFields(loadedFields);
  }





  // Form Container Methods
  addContainer(container: Container) {
    const currentContainers = this.formContainersSubject.value;
    this.formContainersSubject.next([...currentContainers, container]);
  }

  updateContainer(index: number, container: Container) {
    const currentContainers = this.formContainersSubject.value;
    currentContainers[index] = container;
    this.formContainersSubject.next([...currentContainers]);
  }

  removeContainer(index: number) {
    const currentContainers = this.formContainersSubject.value;
    currentContainers.splice(index, 1);
    this.formContainersSubject.next([...currentContainers]);
  }

  getFormContainers(): Container[] {
    return this.formContainersSubject.value;
  }

  setFormContainers(containers: Container[]) {
    this.formContainersSubject.next(containers);
  }

}