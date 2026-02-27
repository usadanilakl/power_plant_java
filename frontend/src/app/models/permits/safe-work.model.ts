import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { WorkRequestDto } from './work-request.model';
import { ValueDto } from '../value.model';


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
  lotoDescription: string = '';
  confinedSpace: boolean = false;
  confinedSpaceDescription: string = '';
  hotWork: boolean = false;
  hotWorkDescription: string = '';
  ventingPurging: boolean = false;
  ventingPurgingDescription: string = '';
  jha: boolean = true;
  gasTesting: boolean = false;
  excavationPermit: boolean = false;
  energizedPermit: boolean = false;
  other: boolean = false;
  otherDescription: string = '';

  constructor(data: Partial<SwPermits> = {}) {
    Object.assign(this, data);
  }
}

export class SwPpe {
  hardhat: boolean = true;
  safetyGlasses: boolean = true;
  hearingProtection: boolean = true;
  boots: boolean = true;
  fallProtection: boolean = false;
  gfi: boolean = false;
  respirator: boolean = false;
  dustMask: boolean = false;
  gloves: boolean = true;
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
  otherDescription: string = '';
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
  permitStatus: ValueDto;
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
  permitStatus: ValueDto;

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
    this.permitStatus = data.permitStatus ?? new ValueDto();
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
      permitStatus: this.permitStatus?.toJson() ?? null,
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
      permitStatus: ValueDto.fromJson(json.permitStatus),
    });
  }

  static isValidKey(key: string): key is keyof SafeWorkModel {
    return [
      'id', 'date', 'time', 'companyPerson', 'location', 'workScope',
      'specialInstructions', 'requestedBy',
      'isVerified', 'name', 'objectType',
      ...Object.keys(SafeWorkDto.getHazardFields(null)), 
      ...Object.keys(SafeWorkDto.getPermitFields(null)),
      ...Object.keys(SafeWorkDto.getPpeFields(null))
    ].includes(key);
  }

  static toFormFields(
    dto: SafeWorkDto,
    locationOptions: Option[] = [],
    fields: (SafeWorkFieldName | 'workArea')[] = [
      'workArea', 'location', 'date', 'time', 'companyPerson', 'workScope',
      'specialInstructions', 'requestedBy',
      ...Object.keys(SafeWorkDto.getHazardFields(null)) as SafeWorkFieldName[],
      ...Object.keys(SafeWorkDto.getPermitFields(null)) as SafeWorkFieldName[],
      ...Object.keys(SafeWorkDto.getPpeFields(null)) as SafeWorkFieldName[]
    ]
  ): FormField[] {
    const ppeFields = SafeWorkDto.getPpeFields(dto.ppe);
    const permitFields = SafeWorkDto.getPermitFields(dto.permits);
    const hazardFields = SafeWorkDto.getHazardFields(dto.hazards);
    const allFields: { [key: string]: FormField } = {
      id: { name: 'id', label: 'ID', type: 'text', initialValue: dto.id },
      workArea: {
        name: 'workArea',
        label: 'Work Area',
        type: 'work-area-select',
        initialValue: (dto as any).workArea?.id ?? null,
        context: { viewMode: 'map', fallbackText: dto.location },
      },
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
      },isVerified: { 
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
      objectType: { name: 'objectType', label: 'Object Type', type: 'text', initialValue: dto.objectType },
      ...ppeFields,
      ...permitFields,
      ...hazardFields
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
      permitStatus: {
        id: 'permitStatus',
        header: 'Status',
        accessorFn: (item: SafeWorkDto) => item.permitStatus?.name || ''
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

  static getHazardFields(hazardsDto: SwHazards | null): { [key: string]: FormField } {
    const hazards = hazardsDto || new SwHazards();
    const group = { label: 'Hazards', orientation: 'horizontal' } as const;
    return {
      'hazards.highTemp': { name: 'hazards.highTemp', label: 'High Temp', type: 'checkbox', initialValue: hazards.highTemp, group: group },
      'hazards.highPressure': { name: 'hazards.highPressure', label: 'High Pressure', type: 'checkbox', initialValue: hazards.highPressure, group: group },
      'hazards.energized': { name: 'hazards.energized', label: 'Energized', type: 'checkbox', initialValue: hazards.energized, group: group },
      'hazards.storedEnergy': { name: 'hazards.storedEnergy', label: 'Stored Energy', type: 'checkbox', initialValue: hazards.storedEnergy, group: group },
      'hazards.eyeHazard': { name: 'hazards.eyeHazard', label: 'Eye Hazard', type: 'checkbox', initialValue: hazards.eyeHazard, group: group },
      'hazards.egressAccess': { name: 'hazards.egressAccess', label: 'Egress/Access', type: 'checkbox', initialValue: hazards.egressAccess, group: group },
      'hazards.ergonomicHazard': { name: 'hazards.ergonomicHazard', label: 'Ergonomic Hazard', type: 'checkbox', initialValue: hazards.ergonomicHazard, group: group },
      'hazards.fallingObject': { name: 'hazards.fallingObject', label: 'Falling Object', type: 'checkbox', initialValue: hazards.fallingObject, group: group },
      'hazards.highNoise': { name: 'hazards.highNoise', label: 'High Noise', type: 'checkbox', initialValue: hazards.highNoise, group: group },
      'hazards.dustParticulate': { name: 'hazards.dustParticulate', label: 'Dust/Particulate', type: 'checkbox', initialValue: hazards.dustParticulate, group: group },
      'hazards.combustibleDust': { name: 'hazards.combustibleDust', label: 'Combustible Dust', type: 'checkbox', initialValue: hazards.combustibleDust, group: group },
      'hazards.fireHazard': { name: 'hazards.fireHazard', label: 'Fire Hazard', type: 'checkbox', initialValue: hazards.fireHazard, group: group },
      'hazards.hotSurface': { name: 'hazards.hotSurface', label: 'Hot Surface', type: 'checkbox', initialValue: hazards.hotSurface, group: group },
      'hazards.slippery': { name: 'hazards.slippery', label: 'Slippery', type: 'checkbox', initialValue: hazards.slippery, group: group },
      'hazards.ventilationRequired': { name: 'hazards.ventilationRequired', label: 'Ventilation Required', type: 'checkbox', initialValue: hazards.ventilationRequired, group: group },
      'hazards.lightingRestrictions': { name: 'hazards.lightingRestrictions', label: 'Lighting Restrictions', type: 'checkbox', initialValue: hazards.lightingRestrictions, group: group },
      'hazards.chemicalExposure': { name: 'hazards.chemicalExposure', label: 'Chemical Exposure', type: 'checkbox', initialValue: hazards.chemicalExposure, group: group },
      'hazards.liftingHazard': { name: 'hazards.liftingHazard', label: 'Lifting Hazard', type: 'checkbox', initialValue: hazards.liftingHazard, group: group },
      'hazards.handTraps': { name: 'hazards.handTraps', label: 'Hand Traps', type: 'checkbox', initialValue: hazards.handTraps, group: group },
      'hazards.heatColdStress': { name: 'hazards.heatColdStress', label: 'Heat/Cold Stress', type: 'checkbox', initialValue: hazards.heatColdStress, group: group },
      'hazards.elevatedSurface': { name: 'hazards.elevatedSurface', label: 'Elevated Surface', type: 'checkbox', initialValue: hazards.elevatedSurface, group: group },
      'hazards.environmental': { name: 'hazards.environmental', label: 'Environmental', type: 'checkbox', initialValue: hazards.environmental, group: group },
      'hazards.other': { name: 'hazards.other', label: 'Other', type: 'checkbox', initialValue: hazards.other, group: group },
      'hazards.otherDescription': { name: 'hazards.otherDescription', label: 'Other Description', type: 'text', initialValue: hazards.otherDescription, group: group },
    };
  }


  static getPermitFields(permitsDto: SwPermits | null): { [key: string]: FormField } {
    const permits = permitsDto || new SwPermits();
    const group = { label: 'Permits', orientation: 'horizontal' } as const;
    return {
      'permits.lotoRequired': { name: 'permits.lotoRequired', label: 'LOTO Required', type: 'checkbox', initialValue: permits.lotoRequired, group: group },
      'permits.lotoDescription': { name: 'permits.lotoDescription', label: 'LOTO Description', type: 'text', initialValue: permits.lotoDescription, group: group },
      'permits.confinedSpace': { name: 'permits.confinedSpace', label: 'Confined Space', type: 'checkbox', initialValue: permits.confinedSpace, group: group },
      'permits.confinedSpaceDescription': { name: 'permits.confinedSpaceDescription', label: 'Confined Space Description', type: 'text', initialValue: permits.confinedSpaceDescription, group: group },
      'permits.hotWork': { name: 'permits.hotWork', label: 'Hot Work', type: 'checkbox', initialValue: permits.hotWork, group: group },
      'permits.hotWorkDescription': { name: 'permits.hotWorkDescription', label: 'Hot Work Description', type: 'text', initialValue: permits.hotWorkDescription, group: group },
      'permits.ventingPurging': { name: 'permits.ventingPurging', label: 'Venting/Purging', type: 'checkbox', initialValue: permits.ventingPurging, group: group },
      'permits.ventingPurgingDescription': { name: 'permits.ventingPurgingDescription', label: 'Venting/Purging Description', type: 'text', initialValue: permits.ventingPurgingDescription, group: group },
      'permits.jha': { name: 'permits.jha', label: 'JHA', type: 'checkbox', initialValue: permits.jha, group: group },
      'permits.gasTesting': { name: 'permits.gasTesting', label: 'Gas Testing', type: 'checkbox', initialValue: permits.gasTesting, group: group },
      'permits.excavationPermit': { name: 'permits.excavationPermit', label: 'Excavation Permit', type: 'checkbox', initialValue: permits.excavationPermit, group: group },
      'permits.energizedPermit': { name: 'permits.energizedPermit', label: 'Energized Permit', type: 'checkbox', initialValue: permits.energizedPermit, group: group },
      'permits.other': { name: 'permits.other', label: 'Other', type: 'checkbox', initialValue: permits.other, group: group },
      'permits.otherDescription': { name: 'permits.otherDescription', label: 'Other Description', type: 'text', initialValue: permits.otherDescription, group: group },
    };
  }
  
  static getPpeFields(ppeDto: SwPpe | null): { [key: string]: FormField } {
    const ppe = ppeDto || new SwPpe();
    const group = { label: 'PPE', orientation: 'horizontal' } as const;
    return {
      'ppe.hardhat': { name: 'ppe.hardhat', label: 'Hardhat', type: 'checkbox', initialValue: ppe.hardhat, group: group },
      'ppe.safetyGlasses': { name: 'ppe.safetyGlasses', label: 'Safety Glasses', type: 'checkbox', initialValue: ppe.safetyGlasses, group: group },
      'ppe.hearingProtection': { name: 'ppe.hearingProtection', label: 'Hearing Protection', type: 'checkbox', initialValue: ppe.hearingProtection, group: group },
      'ppe.boots': { name: 'ppe.boots', label: 'Boots', type: 'checkbox', initialValue: ppe.boots, group: group },
      'ppe.fallProtection': { name: 'ppe.fallProtection', label: 'Fall Protection', type: 'checkbox', initialValue: ppe.fallProtection, group: group },
      'ppe.gfi': { name: 'ppe.gfi', label: 'GFI', type: 'checkbox', initialValue: ppe.gfi, group: group },
      'ppe.respirator': { name: 'ppe.respirator', label: 'Respirator', type: 'checkbox', initialValue: ppe.respirator, group: group },
      'ppe.dustMask': { name: 'ppe.dustMask', label: 'Dust Mask', type: 'checkbox', initialValue: ppe.dustMask, group: group },
      'ppe.gloves': { name: 'ppe.gloves', label: 'Gloves', type: 'checkbox', initialValue: ppe.gloves, group: group },
      'ppe.iceCleats': { name: 'ppe.iceCleats', label: 'Ice Cleats', type: 'checkbox', initialValue: ppe.iceCleats, group: group },
      'ppe.acidSuit': { name: 'ppe.acidSuit', label: 'Acid Suit', type: 'checkbox', initialValue: ppe.acidSuit, group: group },
      'ppe.barricade': { name: 'ppe.barricade', label: 'Barricade', type: 'checkbox', initialValue: ppe.barricade, group: group },
      'ppe.faceShield': { name: 'ppe.faceShield', label: 'Face Shield', type: 'checkbox', initialValue: ppe.faceShield, group: group },
      'ppe.gasMonitor': { name: 'ppe.gasMonitor', label: 'Gas Monitor', type: 'checkbox', initialValue: ppe.gasMonitor, group: group },
      'ppe.arcFlashPpe': { name: 'ppe.arcFlashPpe', label: 'Arc Flash PPE', type: 'checkbox', initialValue: ppe.arcFlashPpe, group: group },
      'ppe.weldingJacket': { name: 'ppe.weldingJacket', label: 'Welding Jacket', type: 'checkbox', initialValue: ppe.weldingJacket, group: group },
      'ppe.weldingShield': { name: 'ppe.weldingShield', label: 'Welding Shield', type: 'checkbox', initialValue: ppe.weldingShield, group: group },
      'ppe.weldingGloves': { name: 'ppe.weldingGloves', label: 'Welding Gloves', type: 'checkbox', initialValue: ppe.weldingGloves, group: group },
      'ppe.purgingVentilation': { name: 'ppe.purgingVentilation', label: 'Purging Ventilation', type: 'checkbox', initialValue: ppe.purgingVentilation, group: group },
      'ppe.other': { name: 'ppe.other', label: 'Other', type: 'checkbox', initialValue: ppe.other, group: group },
      'ppe.otherDescription': { name: 'ppe.otherDescription', label: 'Other Description', type: 'text', initialValue: ppe.otherDescription, group: group },
    };
  }

}