import { Option } from '../option.model';
import { ValidatorFn, Validators } from '@angular/forms';

export type DataPresetFieldName = keyof DataPresetModel;

export interface DataPresetFormField {
  name: string;
  label: string;
  type: 'text' | 'select';
  validators?: ValidatorFn[];
  options?: Option[];
  initialValue?: any;
}

export interface DataPresetModel {
  system: Option | null;
  location: Option | null;
  vendor: Option | null;
  eqType: Option | null;
  tagNumber: string;
  description: string;
}

export class DataPresetDto implements DataPresetModel {
  system: Option | null;
  location: Option | null;
  vendor: Option | null;
  eqType: Option | null;
  tagNumber: string;
  description: string;

  constructor(data: Partial<DataPresetModel> = {}) {
    this.system = data.system || null;
    this.location = data.location || null;
    this.vendor = data.vendor || null;
    this.eqType = data.eqType || null;
    this.tagNumber = data.tagNumber || '';
    this.description = data.description || '';
  }

  toJson(): any {
    return {
      system: this.system,
      location: this.location,
      vendor: this.vendor,
      eqType: this.eqType,
      tagNumber: this.tagNumber,
      description: this.description
    };
  }

  static fromJson(json: any): DataPresetDto {
    if (!json) {
      console.warn('Received null or undefined json in DataPresetDto.fromJson');
      return new DataPresetDto();
    }

    return new DataPresetDto({
      system: json.system,
      location: json.location,
      vendor: json.vendor,
      eqType: json.eqType,
      tagNumber: json.tagNumber || '',
      description: json.description || ''
    });
  }

  static isValidKey(key: string): key is keyof DataPresetModel {
    const validKeys: (keyof DataPresetModel)[] = [
      'system', 'location', 'vendor', 'eqType', 'tagNumber', 'description'
    ];
    return validKeys.includes(key as keyof DataPresetModel);
  }

  static toFormFields(
    dto: DataPresetDto,
    systemOptions: Option[],
    locationOptions: Option[],
    vendorOptions: Option[],
    eqTypeOptions: Option[],
    fields: DataPresetFieldName[] = ['system', 'location', 'vendor', 'eqType', 'tagNumber', 'description']
  ): DataPresetFormField[] {
    const allFields: { [key in DataPresetFieldName]: DataPresetFormField } = {
      system: {
        name: 'system',
        label: 'System',
        type: 'select',
        options: systemOptions,
        initialValue: dto.system?.value || null
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: locationOptions,
        initialValue: dto.location?.value || null
      },
      vendor: {
        name: 'vendor',
        label: 'Vendor',
        type: 'select',
        options: vendorOptions,
        initialValue: dto.vendor?.value || null
      },
      eqType: {
        name: 'eqType',
        label: 'Equipment Type',
        type: 'select',
        options: eqTypeOptions,
        initialValue: dto.eqType?.value || null
      },
      tagNumber: {
        name: 'tagNumber',
        label: 'Tag Number',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.tagNumber
      },
      description: {
        name: 'description',
        label: 'Description',
        type: 'text',
        validators: [Validators.required],
        initialValue: dto.description
      }
    };

    return fields.map(fieldName => allFields[fieldName]);
  }
}