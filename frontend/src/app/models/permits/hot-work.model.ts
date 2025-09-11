
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { WorkRequestDto } from './work-request.model';


export class HotWorkMeasures {
  areaIsClean: boolean = false;
  flammablesAreSecured: boolean = false;
  noCombustibleDustOrDebrisPresent: boolean = false;
  radiativeHeatPreventiveMeasuresAreTaken: boolean = false;
  vesselsArePurged: boolean = false;
  openingsAreCovered: boolean = false;
  ductVentilationIsSecured: boolean = false;
  lockOutIsCompleted: boolean = false;
  communicationIsEstablished: boolean = false;
  fireWatchIsAwareOfDuties: boolean = false;
  fireExtinguisherPresent: boolean = false;
  fireProtectionIsInService: boolean = false;

  constructor(data: Partial<HotWorkMeasures> = {}) {
    Object.assign(this, data);
  }
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
    this.meterModel = data.meterModel ?? "RKI GX-3R PRO";
    this.meterNum = data.meterNum ?? null;
    this.specialInstructions = data.specialInstructions ?? null;
    this.measures = data.measures ?? new HotWorkMeasures();
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
      meterModel: json.meterModel || "RKI GX-3R PRO",
      meterNum: json.meterNum || null,
      specialInstructions: json.specialInstructions || null,
      measures: json.measures || new HotWorkMeasures(),
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
      'meterModel', 'meterNum', 'specialInstructions', 'measures'
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
        type: 'text',
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
      measures: { name: 'measures', label: 'Safety Measures', type: 'checkbox-group', initialValue: dto.measures, options: HotWorkDto.getHwMeasuresOptions(dto.measures) },
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
  
    static generatePermitFromRequest(request: WorkRequestDto): HotWorkDto{
      return new HotWorkDto({
        date: request.dateOfWorkToBePerformed?.split('T')[0],
        foreman: request.requestedBy,
        location: request.location,
        workScope: request.workScope,
        fireWatch: request.fireWatch
      });
    }

    static formatLabel(key: string): string {
      const result = key.replace(/([A-Z])/g, ' $1');
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  
    static getHwMeasuresOptions(measures: HotWorkMeasures | null): Option[] {
      if(!measures) return [];
      // Get all keys from the hazards object in a type-safe way
      const hazardKeys = Object.keys(measures) as (keyof HotWorkMeasures)[];
  
      // Map over the keys to create the desired FormOption structure
      return hazardKeys.map(key => {
        return {
          label: this.formatLabel(key), // 'highTemp' -> 'High Temp'
          value: measures[key]    // The boolean value (true/false)
        };
      });
    }
}