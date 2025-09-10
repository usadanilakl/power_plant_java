import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';


export interface SwHazards {
  highTemp: boolean;
  highPressure: boolean;
  energized: boolean;
  storedEnergy: boolean;
  eyeHazard: boolean;
  egressAccess: boolean;
  ergonomicHazard: boolean;
  fallingObject: boolean;
  highNoise: boolean;
  dustParticulate: boolean;
  combustibleDust: boolean;
  fireHazard: boolean;
  hotSurface: boolean;
  slippery: boolean;
  ventilationRequired: boolean;
  lightingRestrictions: boolean;
  chemicalExposure: boolean;
  liftingHazard: boolean;
  handTraps: boolean;
  heatColdStress: boolean;
  elevatedSurface: boolean;
  environmental: boolean;
}


export interface SwPermits {
  lotoRequired: boolean;
  confinedSpace: boolean;
  hotWork: boolean;
  ventingPurging: boolean;
  jha: boolean;
  gasTesting: boolean;
  excavationPermit: boolean;
  energizedPermit: boolean;
}


export interface SwPpe {
  hardhat: boolean;
  safetyGlasses: boolean;
  hearingProtection: boolean;
  boots: boolean;
  fallProtection: boolean;
  gfi: boolean;
  respirator: boolean;
  dustMask: boolean;
  gloves: boolean;
  iceCleats: boolean;
  acidSuit: boolean;
  barricade: boolean;
  faceShield: boolean;
  gasMonitor: boolean;
  arcFlashPpe: boolean;
  weldingJacket: boolean;
  weldingShield: boolean;
  weldingGloves: boolean;
  purgingVentilation: boolean;
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
    this.hazards = data.hazards ?? null;
    this.permits = data.permits ?? null;
    this.ppe = data.ppe ?? null;
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
      date: json.date || null,
      time: json.time || null,
      companyPerson: json.companyPerson || null,
      location: json.location || null,
      workScope: json.workScope || null,
      specialInstructions: json.specialInstructions || null,
      requestedBy: json.requestedBy || null,
      hazards: json.hazards || null,
      permits: json.permits || null,
      ppe: json.ppe || null,
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
      'specialInstructions', 'requestedBy'
    ]
  ): FormField[] {
    const allFields: { [key in SafeWorkFieldName]: FormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      date: { 
        name: 'date', 
        label: 'Date', 
        type: 'date', 
        validators: [Validators.required], 
        initialValue: dto.date 
      },
      time: { 
        name: 'time', 
        label: 'Time', 
        type: 'time', 
        validators: [Validators.required], 
        initialValue: dto.time 
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
      hazards: { name: 'hazards', label: 'Hazards', type: 'checkbox', initialValue: dto.hazards },
      permits: { name: 'permits', label: 'Permits', type: 'checkbox', initialValue: dto.permits },
      ppe: { name: 'ppe', label: 'PPE', type: 'checkbox', initialValue: dto.ppe },
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
}