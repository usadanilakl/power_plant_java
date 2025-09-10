
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';

export type WorkRequestFieldName = keyof WorkRequestModel;

export interface WorkRequestModel extends BaseModel {
  dateOfWorkToBePerformed: string | null;
  timeOfWorkToBePerformed: string | null;
  requestedBy: string | null;
  company: string | null;
  location: string | null;
  affectedEquipment: string | null;
  workScope: string | null;
  isHotWorkRequired: boolean | null;
  foreman: string | null;
  fireWatch: string | null;
  isLotoRequired: boolean | null;
  isConfinedSpaceEntryRequired: boolean | null;
  space: string | null;
  sharepointId: string | null;
}

export class WorkRequestDto extends BaseDto implements WorkRequestModel {
  dateOfWorkToBePerformed: string | null;
  timeOfWorkToBePerformed: string | null;
  requestedBy: string | null;
  company: string | null;
  location: string | null;
  affectedEquipment: string | null;
  workScope: string | null;
  isHotWorkRequired: boolean | null;
  foreman: string | null;
  fireWatch: string | null;
  isLotoRequired: boolean | null;
  isConfinedSpaceEntryRequired: boolean | null;
  space: string | null;
  sharepointId: string | null;

  constructor(data: Partial<WorkRequestModel> = {}) {
    super(data);
    this.dateOfWorkToBePerformed = data.dateOfWorkToBePerformed ?? null;
    this.timeOfWorkToBePerformed = data.timeOfWorkToBePerformed ?? null;
    this.requestedBy = data.requestedBy ?? null;
    this.company = data.company ?? null;
    this.location = data.location ?? null;
    this.affectedEquipment = data.affectedEquipment ?? null;
    this.workScope = data.workScope ?? null;
    this.isHotWorkRequired = data.isHotWorkRequired ?? null;
    this.foreman = data.foreman ?? null;
    this.fireWatch = data.fireWatch ?? null;
    this.isLotoRequired = data.isLotoRequired ?? null;
    this.isConfinedSpaceEntryRequired = data.isConfinedSpaceEntryRequired ?? null;
    this.space = data.space ?? null;
    this.sharepointId = data.sharepointId ?? null;
  }

  // Serialization method
  override toJson(): any {
    return {
      ...super.toJson(),
      dateOfWorkToBePerformed: this.dateOfWorkToBePerformed,
      timeOfWorkToBePerformed: this.timeOfWorkToBePerformed,
      requestedBy: this.requestedBy,
      company: this.company,
      location: this.location,
      affectedEquipment: this.affectedEquipment,
      workScope: this.workScope,
      isHotWorkRequired: this.isHotWorkRequired,
      foreman: this.foreman,
      fireWatch: this.fireWatch,
      isLotoRequired: this.isLotoRequired,
      isConfinedSpaceEntryRequired: this.isConfinedSpaceEntryRequired,
      space: this.space,
      sharepointId: this.sharepointId,
    };
  }

  // Deserialization method (static)
  static override fromJson(json: any): WorkRequestDto {
    return new WorkRequestDto({
      ...super.fromJson(json),
      dateOfWorkToBePerformed: json.dateOfWorkToBePerformed || null,
      timeOfWorkToBePerformed: json.timeOfWorkToBePerformed || null,
      requestedBy: json.requestedBy || null,
      company: json.company || null,
      location: json.location || null,
      affectedEquipment: json.affectedEquipment || null,
      workScope: json.workScope || null,
      isHotWorkRequired: json.isHotWorkRequired || null,
      foreman: json.foreman || null,
      fireWatch: json.fireWatch || null,
      isLotoRequired: json.isLotoRequired || null,
      isConfinedSpaceEntryRequired: json.isConfinedSpaceEntryRequired || null,
      space: json.space || null,
      sharepointId: json.sharepointId || null,
    });
  }

  // Method to check if a key is valid for this model
  static isValidKey(key: string): key is keyof WorkRequestModel {
    return [
      'id', 'dateOfWorkToBePerformed', 'timeOfWorkToBePerformed', 'requestedBy',
      'company', 'location', 'affectedEquipment', 'workScope', 'isHotWorkRequired',
      'foreman', 'fireWatch', 'isLotoRequired', 'isConfinedSpaceEntryRequired',
      'space', 'sharepointId', 'isVerified', 'name', 'objectType'
    ].includes(key);
  }
  static toFormFields(
    dto: WorkRequestDto,
    companyOptions: Option[],
    locationOptions: Option[],
    fields: WorkRequestFieldName[] = [
      'dateOfWorkToBePerformed', 'timeOfWorkToBePerformed', 'requestedBy',
      'company', 'location', 'affectedEquipment', 'workScope', 'isHotWorkRequired',
      'foreman', 'fireWatch', 'isLotoRequired', 'isConfinedSpaceEntryRequired', 'space'
    ]
  ): FormField[] {
    const allFields: { [key in WorkRequestFieldName]: FormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      dateOfWorkToBePerformed: { 
        name: 'dateOfWorkToBePerformed', 
        label: 'Date of Work', 
        type: 'date', 
        validators: [Validators.required], 
        initialValue: dto.dateOfWorkToBePerformed 
      },
      timeOfWorkToBePerformed: { 
        name: 'timeOfWorkToBePerformed', 
        label: 'Time of Work', 
        type: 'time', 
        validators: [Validators.required], 
        initialValue: dto.timeOfWorkToBePerformed 
      },
      requestedBy: { 
        name: 'requestedBy', 
        label: 'Requested By', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.requestedBy 
      },
      company: {
        name: 'company',
        label: 'Company',
        type: 'select',
        options: companyOptions,
        validators: [Validators.required],
        initialValue: dto.company
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: locationOptions,
        validators: [Validators.required],
        initialValue: dto.location
      },
      affectedEquipment: { 
        name: 'affectedEquipment', 
        label: 'Affected Equipment', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.affectedEquipment 
      },
      workScope: { 
        name: 'workScope', 
        label: 'Work Scope', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.workScope 
      },
      isHotWorkRequired: { 
        name: 'isHotWorkRequired', 
        label: 'Is Hot Work Required', 
        type: 'checkbox', 
        initialValue: dto.isHotWorkRequired 
      },
      foreman: { 
        name: 'foreman', 
        label: 'Foreman Name', 
        type: 'text', 
        initialValue: dto.foreman 
      },
      fireWatch: { 
        name: 'fireWatch', 
        label: 'Fire-watch Name', 
        type: 'text', 
        initialValue: dto.fireWatch 
      },
      isLotoRequired: { 
        name: 'isLotoRequired', 
        label: 'Is LOTO Required', 
        type: 'checkbox', 
        initialValue: dto.isLotoRequired 
      },
      isConfinedSpaceEntryRequired: { 
        name: 'isConfinedSpaceEntryRequired', 
        label: 'Is Confined Space Entry Required', 
        type: 'checkbox', 
        initialValue: dto.isConfinedSpaceEntryRequired 
      },
      space: { 
        name: 'space', 
        label: 'Space to be entered', 
        type: 'text', 
        initialValue: dto.space 
      },
      sharepointId: { 
        name: 'sharepointId', 
        label: 'Sharepoint ID', 
        type: 'text', 
        initialValue: dto.sharepointId 
      },
      isVerified: { 
        name: 'isVerified', 
        label: 'Is Verified', 
        type: 'select', 
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ], 
        initialValue: dto.isVerified?.toString() 
      },
      name: { name: 'name', label: 'Name', type: 'text', initialValue: dto.name },
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType }
    };
  
    return fields.map(fieldName => allFields[fieldName]);
  }

  static toTableColumns(fields: WorkRequestFieldName[] = ['sharepointId','requestedBy', 'company', 'location', 'isHotWorkRequired', 'isLotoRequired', 'isConfinedSpaceEntryRequired']): Column[] {
    const allColumns: { [key in WorkRequestFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      dateOfWorkToBePerformed: { id: 'dateOfWorkToBePerformed', header: 'Date of Work', accessorKey: 'dateOfWorkToBePerformed' },
      timeOfWorkToBePerformed: { id: 'timeOfWorkToBePerformed', header: 'Time of Work', accessorKey: 'timeOfWorkToBePerformed' },
      requestedBy: { id: 'requestedBy', header: 'Requested By', accessorKey: 'requestedBy' },
      company: { id: 'company', header: 'Company', accessorKey: 'company' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      affectedEquipment: { id: 'affectedEquipment', header: 'Affected Equipment', accessorKey: 'affectedEquipment' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
        isHotWorkRequired: { 
        id: 'isHotWorkRequired', 
        header: 'Hot Work Required', 
        accessorFn: (item: WorkRequestDto) => item.isHotWorkRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) => 
            item.isHotWorkRequired ? { 'background-color': '#FFCCCB' } : { 'background-color': '' }
        },
      foreman: { id: 'foreman', header: 'Foreman', accessorKey: 'foreman' },
      fireWatch: { id: 'fireWatch', header: 'Fire Watch', accessorKey: 'fireWatch' },
        isLotoRequired: { 
        id: 'isLotoRequired', 
        header: 'LOTO Required', 
        accessorFn: (item: WorkRequestDto) => item.isLotoRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) => 
            item.isLotoRequired ? { 'background-color': '#FFCCCB' } : { 'background-color': '' }
        },
        isConfinedSpaceEntryRequired: { 
        id: 'isConfinedSpaceEntryRequired', 
        header: 'Confined Space Entry', 
        accessorFn: (item: WorkRequestDto) => item.isConfinedSpaceEntryRequired ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) => 
            item.isConfinedSpaceEntryRequired ? { 'background-color': '#FFCCCB' } : { 'background-color': '' }
        },
      space: { id: 'space', header: 'Space', accessorKey: 'space' },
      sharepointId: { 
        id: 'sharepointId', 
        header: 'Sharepoint ID', 
        accessorFn: (item: WorkRequestDto) => {
          if (!item.sharepointId) return '';
          const timestamp = item.sharepointId;
          const year = timestamp.slice(0, 4);
          const month = timestamp.slice(4, 6);
          const day = timestamp.slice(6, 8);
          const hour = timestamp.slice(8, 10);
          const minute = timestamp.slice(10, 12);
          const second = timestamp.slice(12, 14);
          return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }
      },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
        isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: WorkRequestDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) => 
            item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' }
        },
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }

}