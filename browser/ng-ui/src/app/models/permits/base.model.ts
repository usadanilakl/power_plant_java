import { FormField } from "../inputs/form-field.model";


export interface IBaseModel {
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * An abstract base class for data models that can be represented as a collection of form fields.
 * It provides a generic way to generate and filter form fields.
 * @template T The interface representing the structure of the model.
 */
export abstract class BaseModel<T extends IBaseModel> implements IBaseModel {
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<T> = {}) {
    this.status = data.status ?? 'new';
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  /**
   * When implemented in a derived class, returns the complete list of FormField definitions for the model.
   * This method is responsible for mapping model properties to their form field representations.
   */
  abstract getFormFields(): FormField[];

  /**
   * Returns a list of form fields for the model, with an option to filter for a specific subset of fields.
   * This method contains the reusable filtering logic.
   * @param options An optional object that can contain an array of field names to include.
   * @returns An array of FormField objects.
   */
  toFormFields(options?: { fields?: (keyof T)[] }): FormField[] {
    const allFormFields = this.getFormFields();

    if (options?.fields) {
      // If a fields array is provided, filter the form fields to include only those specified.
      return allFormFields.filter(field => options.fields!.includes(field.name as keyof T));
    }

    // Otherwise, return all form fields.
    return allFormFields;
  }
}