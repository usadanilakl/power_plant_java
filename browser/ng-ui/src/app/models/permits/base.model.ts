import { Column } from "../inputs/column.model";
import { FormField } from "../inputs/form-field.model";


export interface IBaseModel {
  id: number;
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
  id: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<T> = {}) {
    this.id = data.id as number; 
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
   * When implemented in a derived class, returns the complete list of Column definitions for the model.
   * This method is responsible for mapping model properties to their table column representations.
   */
  abstract getTableColumns(): Column[];

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

  /**
   * Returns a list of table columns for the model, with an option to filter for a specific subset of columns.
   * This method contains the reusable filtering logic.
   * @param options An optional object that can contain an array of column IDs to include.
   * @returns An array of Column objects.
   */
  toTableColumns(options?: { columns?: string[] }): Column[] {
    const allTableColumns = this.getTableColumns();

    if (options?.columns) {
      // If a columns array is provided, filter the columns to include only those specified by id.
      return allTableColumns.filter(column => options.columns!.includes(column.id));
    }

    // Otherwise, return all table columns.
    return allTableColumns;
  }
}