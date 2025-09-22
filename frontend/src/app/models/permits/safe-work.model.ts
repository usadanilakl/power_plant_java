import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { WorkRequestDto } from './work-request.model';


export class SwHazards {
  highTemp: boolean = false;
  highPressure: boolean = false;
  energized: boolean = false;
  storedEnergy: boolean = false;
  eyeHazard: boolean = false;
  egressAccess: boolean = false;
  ergonomicHazard: boolean = false;
  fallingObject: boolean = false;
  highNoise: boolean = false;
  dustParticulate: boolean = false;
  combustibleDust: boolean = false;
  fireHazard: boolean = false;
  hotSurface: boolean = false;
  slippery: boolean = false;
  ventilationRequired: boolean = false;
  lightingRestrictions: boolean = false;
  chemicalExposure: boolean = false;
  liftingHazard: boolean = false;
  handTraps: boolean = false;
  heatColdStress: boolean = false;
  elevatedSurface: boolean = false;
  environmental: boolean = false;
  weatherHazards: boolean = false;
  weatherHazardDescription: string = '';
  other: boolean = false;
  otherDescription: string = '';

  constructor(data: Partial<SwHazards> = {}) {
    Object.assign(this, data);
  }
}

export class SwPermits {
  lotoRequired: boolean = false;
  confinedSpace: boolean = false;
  hotWork: boolean = false;
  ventingPurging: boolean = false;
  jha: boolean = false;
  gasTesting: boolean = false;
  excavationPermit: boolean = false;
  energizedPermit: boolean = false;
  other: boolean = false;

  constructor(data: Partial<SwPermits> = {}) {
    Object.assign(this, data);
  }
}

export class SwPpe {
  hardhat: boolean = false;
  safetyGlasses: boolean = false;
  hearingProtection: boolean = false;
  boots: boolean = false;
  fallProtection: boolean = false;
  gfi: boolean = false;
  respirator: boolean = false;
  dustMask: boolean = false;
  gloves: boolean = false;
  iceCleats: boolean = false;
  acidSuit: boolean = false;
  barricade: boolean = false;
  faceShield: boolean = false;
  gasMonitor: boolean = false;
  arcFlashPpe: boolean = false;
  weldingJacket: boolean = false;
  weldingShield: boolean = false;
  weldingGloves: boolean = false;
  purgingVentilation: boolean = false;
  other: boolean = false;
  dummyCheckbox: string = '';

  constructor(data: Partial<SwPpe> = {}) {
    Object.assign(this, data);
  }
}

export type SafeWorkFieldName = keyof SafeWorkModel;

export interface SafeWorkModel extends BaseModel {
  date: string | null;
  time: string | null;
  companyPerson: string | null;
  location: string | null;
  workScope: string | null;
  specialInstructions: string | null;
  requestedBy: string | null;
  hazards: SwHazards | null;
  permits: SwPermits | null;
  ppe: SwPpe | null;
}

export class SafeWorkDto extends BaseDto implements SafeWorkModel {
  date: string | null;
  time: string | null;
  companyPerson: string | null;
  location: string | null;
  workScope: string | null;
  specialInstructions: string | null;
  requestedBy: string | null;
  hazards: SwHazards | null;
  permits: SwPermits | null;
  ppe: SwPpe | null;

  constructor(data: Partial<SafeWorkModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.companyPerson = data.companyPerson ?? null;
    this.location = data.location ?? null;
    this.workScope = data.workScope ?? null;
    this.specialInstructions = data.specialInstructions ?? null;
    this.requestedBy = data.requestedBy ?? null;
    this.hazards = data.hazards ?? new SwHazards();
    this.permits = data.permits ?? new SwPermits();
    this.ppe = data.ppe ?? new SwPpe();
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      date: this.date,
      time: this.time,
      companyPerson: this.companyPerson,
      location: this.location,
      workScope: this.workScope,
      specialInstructions: this.specialInstructions,
      requestedBy: this.requestedBy,
      hazards: this.hazards,
      permits: this.permits,
      ppe: this.ppe,
    };
  }

  static override fromJson(json: any): SafeWorkDto {
    return new SafeWorkDto({
      ...super.fromJson(json),
      date: json.date|| null,
      time: json.time || null,
      companyPerson: json.companyPerson || null,
      location: json.location || null,
      workScope: json.workScope || null,
      specialInstructions: json.specialInstructions || null,
      requestedBy: json.requestedBy || null,
      hazards: json.hazards || new SwHazards(),
      permits: json.permits || new SwPermits(),
      ppe: json.ppe || new SwPpe(),
    });
  }

  static isValidKey(key: string): key is keyof SafeWorkModel {
    return [
      'id', 'date', 'time', 'companyPerson', 'location', 'workScope',
      'specialInstructions', 'requestedBy', 'hazards', 'permits', 'ppe',
      'isVerified', 'name', 'objectType'
    ].includes(key);
  }

  static toFormFields(
    dto: SafeWorkDto,
    locationOptions: Option[],
    fields: SafeWorkFieldName[] = [
      'date', 'time', 'companyPerson', 'location', 'workScope',
      'specialInstructions', 'requestedBy', 'hazards', 'permits', 'ppe'
    ]
  ): FormField[] {
    const allFields: { [key in SafeWorkFieldName]: FormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      date: { 
        name: 'date', 
        label: 'Date', 
        type: 'date', 
        validators: [Validators.required], 
        initialValue: dto.date ?? new Date().toISOString().split('T')[0]
      },
      time: { 
        name: 'time', 
        label: 'Time', 
        type: 'time', 
        validators: [Validators.required], 
        initialValue: dto.time  ?? new Date().toTimeString().slice(0, 5)
      },
      companyPerson: { 
        name: 'companyPerson', 
        label: 'Company Person', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.companyPerson 
      },
      location: {
        name: 'location',
        label: 'Location',
        type: 'text',
        // type: 'multi-select',
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
      specialInstructions: { 
        name: 'specialInstructions', 
        label: 'Special Instructions', 
        type: 'textarea', 
        initialValue: dto.specialInstructions 
      },
      requestedBy: { 
        name: 'requestedBy', 
        label: 'Requested By', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.requestedBy 
      },
      hazards: { 
        name: 'hazards', 
        label: 'Hazards', 
        type: 'checkbox-group', 
        options: SafeWorkDto.getHazardOptions(dto.hazards) || [],
      },
      permits: { name: 'permits', label: 'Permits', type: 'checkbox-group', initialValue: dto.permits, options: SafeWorkDto.getPermitOptions(dto.permits) || [] },
      ppe: { name: 'ppe', label: 'PPE', type: 'checkbox-group', initialValue: dto.ppe, options: SafeWorkDto.getPpeOptions(dto.ppe) || [] },
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

  static toTableColumns(fields: SafeWorkFieldName[] = ['date', 'time', 'companyPerson', 'location', 'workScope', 'requestedBy']): Column[] {
    const allColumns: { [key in SafeWorkFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      time: { id: 'time', header: 'Time', accessorKey: 'time' },
      companyPerson: { id: 'companyPerson', header: 'Company Person', accessorKey: 'companyPerson' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      specialInstructions: { id: 'specialInstructions', header: 'Special Instructions', accessorKey: 'specialInstructions' },
      requestedBy: { id: 'requestedBy', header: 'Requested By', accessorKey: 'requestedBy' },
      hazards: { 
        id: 'hazards', 
        header: 'Hazards', 
        accessorFn: (item: SafeWorkDto) => item.hazards ? 'Yes' : 'No'
      },
      permits: { 
        id: 'permits', 
        header: 'Permits', 
        accessorFn: (item: SafeWorkDto) => item.permits ? 'Yes' : 'No'
      },
      ppe: { 
        id: 'ppe', 
        header: 'PPE', 
        accessorFn: (item: SafeWorkDto) => item.ppe ? 'Yes' : 'No'
      },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
      isVerified: {
        id: 'isVerified',
        header: 'Verified',
        accessorFn: (item: SafeWorkDto) => item.isVerified ? 'Yes' : 'No',
        conditionalStyling: (item: any, column: Column) => 
            item.isVerified ? { 'background-color': '#90EE90' } : { 'background-color': '#FFCCCB' }
      },
    };

    return fields.map(fieldName => allColumns[fieldName]);
  }

  static generatePermitFromRequest(request: WorkRequestDto): SafeWorkDto{
    return new SafeWorkDto({
      // date: request.dateOfWorkToBePerformed?.split("T")[0],
      date: request.dateOfWorkToBePerformed?.split('T')[0] ?? null,
      time: request.timeOfWorkToBePerformed,
      companyPerson: request.company + "/" + request.requestedBy,
      location: request.location,
      workScope: request.workScope,
      requestedBy: request.requestedBy
    });
  }

  static formatLabel(key: string): string {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  static getHazardOptions(hazards: SwHazards | null): Option[] {
    if(!hazards) return [];
    // Get all keys from the hazards object in a type-safe way
    const hazardKeys = Object.keys(hazards) as (keyof SwHazards)[];

    // Map over the keys to create the desired FormOption structure
    return hazardKeys.map(key => {
      return {
        label: this.formatLabel(key), // 'highTemp' -> 'High Temp'
        key:key,
        value: hazards[key]    // The boolean value (true/false)
      };
    });
  }

  static getPpeOptions(ppe: SwPpe | null): Option[] {
    if(!ppe) return [];
    // Get all keys from the hazards object in a type-safe way
    const hazardKeys = Object.keys(ppe) as (keyof SwPpe)[];

    // Map over the keys to create the desired FormOption structure
    return hazardKeys.map(key => {
      return {
        label: this.formatLabel(key), // 'highTemp' -> 'High Temp'
        key:key,
        value: ppe[key]    // The boolean value (true/false)
      };
    });
  }

  static getPermitOptions(permits: SwPermits | null): Option[] {
    if(!permits) return [];
    // Get all keys from the hazards object in a type-safe way
    const hazardKeys = Object.keys(permits) as (keyof SwPermits)[];

    // Map over the keys to create the desired FormOption structure
    return hazardKeys.map(key => {
      return {
        label: this.formatLabel(key), // 'highTemp' -> 'High Temp'
        key:key,
        value: permits[key]    // The boolean value (true/false)
      };
    });
  }
}