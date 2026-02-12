import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../../../models/base/base.model';
import { FormField } from '../../../models/ui/form-field.model';
import { FormContainerDto, FormContainerModel } from './form-container.model';
import { Column } from '../../../models/column.model';

export type PrintableFormFieldName = keyof PrintableFormModel;

export interface PrintableFormModel extends BaseModel {
  formContainers: FormContainerModel[];
  size: { width: number; height: number };
  formType: string;
  isPrimary: boolean;
}

export class PrintableFormDto extends BaseDto implements PrintableFormModel {
  formContainers: FormContainerDto[];
  size: { width: number; height: number };
  formType: string;
  isPrimary: boolean;

  constructor(data: Partial<PrintableFormModel> = {}) {
    super(data);
    this.formContainers = data.formContainers?.map(fc => new FormContainerDto(fc)) ?? [];
    this.size = data.size ?? { width: 8.5, height: 11 };
    this.formType = data.formType || '';
    this.isPrimary = data.isPrimary ?? false;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      formContainers: this.formContainers.map(fc => fc.toJson()),
      size: this.size ?? { width: 8.5, height: 11 },
      formType: this.formType || '',
      isPrimary: this.isPrimary ?? false,
    };
  }

  static override fromJson(json: any): PrintableFormDto {
    return new PrintableFormDto({
      ...super.fromJson(json),
      formContainers: Array.isArray(json.formContainers)
        ? json.formContainers.map((fc: any) => FormContainerDto.fromJson(fc))
        : [],
      size: json.size ?? { width: 8.5, height: 11 },
      formType: json.formType || '',
      isPrimary: json.isPrimary ?? false,
    });
  }

  static isValidKey(key: string): key is PrintableFormFieldName {
    return [
      'id', 'name', 'objectType', 'isVerified',
      'formContainers', 'size', 'formType',
    ].includes(key);
  }

  static toFormFields(
    dto: PrintableFormDto,
    fields: PrintableFormFieldName[] = ['name', 'formType', 'isPrimary']
  ): FormField[] {
    const allFields: { [key in PrintableFormFieldName]: FormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      name: {
        name: 'name',
        label: 'Form Name',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.name ?? '',
      },
      formType: {
        name: 'formType',
        label: 'Form Type',
        type: 'select',
        validators: [Validators.required],
        initialValue: dto.formType,
        options: [
          { value: 'SafeWork', label: 'Safe Work' },
          { value: 'HotWork', label: 'Hot Work' },
          { value: 'ConfinedSpace', label: 'Confined Space' },
          { value: 'WorkRequest', label: 'Work Request' },
          { value: 'Loto', label: 'LOTO' },
          { value: 'Jha', label: 'JHA' },
          { value: 'JobStep', label: 'Job Step' },
        ],
      },
      isVerified: {
        name: 'isVerified',
        label: 'Is Verified',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        initialValue: dto.isVerified?.toString(),
      },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType },
      formContainers: { name: 'formContainers', label: 'Form Containers', type: 'text' },
      size: { name: 'size', label: 'Size', type: 'text' },
      isPrimary: { name: 'isPrimary', label: 'Primary', type: 'checkbox', initialValue: dto.isPrimary ?? false },
    };

    return fields.map(fieldName => allFields[fieldName]);
  }

  static toTableColumns(fields: PrintableFormFieldName[] = ['name', 'formType', 'isVerified']): Column[] {
    const allColumns: { [key in PrintableFormFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      name: { id: 'name', header: 'Form Name', accessorKey: 'name' },
      formType: { id: 'formType', header: 'Form Type', accessorKey: 'formType' },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: PrintableFormDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: any) =>
          item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' },
      },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
      formContainers: { id: 'formContainers', header: 'Form Containers', accessorKey: 'formContainers' },
      size: { id: 'size', header: 'Size', accessorKey: 'size' },
      isPrimary: { id: 'isPrimary', header: 'Primary', accessorKey: 'isPrimary' },
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }

  addFormContainer(formContainer: FormContainerDto) {
    this.formContainers.push(formContainer);
  }

  removeFormContainer(formContainer: FormContainerDto) {
    this.formContainers = this.formContainers.filter(fc => fc.id !== formContainer.id);
  }
}
