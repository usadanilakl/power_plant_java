
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';


export interface HotWorkMeasures {
  areaIsClean: boolean;
  flammablesAreSecured: boolean;
  noCombustibleDustOrDebrisPresent: boolean;
  radiativeHeatPreventiveMeasuresAreTaken: boolean;
  vesselsArePurged: boolean;
  openingsAreCovered: boolean;
  ductVentilationIsSecured: boolean;
  lockOutIsCompleted: boolean;
  communicationIsEstablished: boolean;
  fireWatchIsAwareOfDuties: boolean;
  fireExtinguisherPresent: boolean;
  fireProtectionIsInService: boolean;
}

export type HotWorkFieldName = keyof HotWorkModel;

export interface HotWorkModel extends BaseModel {
  date: string | null;
  location: string | null;
  workScope: string | null;
  foreman: string | null;
  fireWatch: string | null;
  meterModel: string | null;
  meterNum: string | null;
  specialInstructions: string | null;
  measures: HotWorkMeasures | null;
}

export class HotWorkDto extends BaseDto implements HotWorkModel {
  date: string | null;
  location: string | null;
  workScope: string | null;
  foreman: string | null;
  fireWatch: string | null;
  meterModel: string | null;
  meterNum: string | null;
  specialInstructions: string | null;
  measures: HotWorkMeasures | null;

  constructor(data: Partial<HotWorkModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.location = data.location ?? null;
    this.workScope = data.workScope ?? null;
    this.foreman = data.foreman ?? null;
    this.fireWatch = data.fireWatch ?? null;
    this.meterModel = data.meterModel ?? null;
    this.meterNum = data.meterNum ?? null;
    this.specialInstructions = data.specialInstructions ?? null;
    this.measures = data.measures ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      date: this.date,
      location: this.location,
      workScope: this.workScope,
      foreman: this.foreman,
      fireWatch: this.fireWatch,
      meterModel: this.meterModel,
      meterNum: this.meterNum,
      specialInstructions: this.specialInstructions,
      measures: this.measures,
    };
  }

  static override fromJson(json: any): HotWorkDto {
    return new HotWorkDto({
      ...super.fromJson(json),
      date: json.date || null,
      location: json.location || null,
      workScope: json.workScope || null,
      foreman: json.foreman || null,
      fireWatch: json.fireWatch || null,
      meterModel: json.meterModel || null,
      meterNum: json.meterNum || null,
      specialInstructions: json.specialInstructions || null,
      measures: json.measures || null,
    });
  }

  static isValidKey(key: string): key is keyof HotWorkModel {
    return [
      'id', 'date', 'location', 'workScope', 'foreman', 'fireWatch',
      'meterModel', 'meterNum', 'specialInstructions', 'measures',
      'isVerified', 'name', 'objectType'
    ].includes(key);
  }

  static toFormFields(
    dto: HotWorkDto,
    locationOptions: Option[],
    fields: HotWorkFieldName[] = [
      'date', 'location', 'workScope', 'foreman', 'fireWatch',
      'meterModel', 'meterNum', 'specialInstructions'
    ]
  ): FormField[] {
    const allFields: { [key in HotWorkFieldName]: FormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      date: { 
        name: 'date', 
        label: 'Date', 
        type: 'date', 
        validators: [Validators.required], 
        initialValue: dto.date 
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'select',
        options: locationOptions,
        validators: [Validators.required],
        initialValue: dto.location
      },
      workScope: { 
        name: 'workScope', 
        label: 'Work Scope', 
        type: 'textarea', 
        validators: [Validators.required], 
        initialValue: dto.workScope 
      },
      foreman: { 
        name: 'foreman', 
        label: 'Foreman', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.foreman 
      },
      fireWatch: { 
        name: 'fireWatch', 
        label: 'Fire Watch', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.fireWatch 
      },
      meterModel: { 
        name: 'meterModel', 
        label: 'Meter Model', 
        type: 'text', 
        initialValue: dto.meterModel 
      },
      meterNum: { 
        name: 'meterNum', 
        label: 'Meter Number', 
        type: 'text', 
        initialValue: dto.meterNum 
      },
      specialInstructions: { 
        name: 'specialInstructions', 
        label: 'Special Instructions', 
        type: 'textarea', 
        initialValue: dto.specialInstructions 
      },
      measures: { name: 'measures', label: 'Safety Measures', type: 'checkbox', initialValue: dto.measures },
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

  static toTableColumns(fields: HotWorkFieldName[] = ['date', 'location', 'workScope', 'foreman', 'fireWatch']): Column[] {
    const allColumns: { [key in HotWorkFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      foreman: { id: 'foreman', header: 'Foreman', accessorKey: 'foreman' },
      fireWatch: { id: 'fireWatch', header: 'Fire Watch', accessorKey: 'fireWatch' },
      meterModel: { id: 'meterModel', header: 'Meter Model', accessorKey: 'meterModel' },
      meterNum: { id: 'meterNum', header: 'Meter Number', accessorKey: 'meterNum' },
      specialInstructions: { id: 'specialInstructions', header: 'Special Instructions', accessorKey: 'specialInstructions' },
      measures: { 
        id: 'measures', 
        header: 'Safety Measures', 
        accessorFn: (item: HotWorkDto) => item.measures ? 'Yes' : 'No'
      },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: HotWorkDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) => 
            item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' }
      },
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }
}