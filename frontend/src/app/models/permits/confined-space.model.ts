
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { WorkRequestDto } from './work-request.model';
import { ValueDto } from '../value.model';

export class ConfinedSpaceHazards {
  oxygenDeficiency: boolean = false;
  flammableGas: boolean = false;
  combustibleDust: boolean = false;
  toxicGas: boolean = false;
  rotatingEquipment: boolean = false;
  electricalShock: boolean = false;
  entrapment: boolean = false;
  engulfment: boolean = false;
  heatStress: boolean = false;
  other: boolean = false;
  otherDescription: string = '';

  constructor(data: Partial<ConfinedSpaceHazards> = {}) {
    Object.assign(this, data);
  }
}


export class ConfinedSpacePpe {
  faceShield: boolean = false;
  fcfi: boolean = false;
  lovVoltageTools: boolean = false;
  explosionProofTools: boolean = false;
  nonSparkingTools: boolean = false;
  fallProtection: boolean = false;
  retrievalSystem: boolean = false;
  lifeline: boolean = false;
  personalAtmosphericMeter: boolean = true;
  tripod: boolean = false;
  other: boolean = false;
  otherDescription: string = '';

  constructor(data: Partial<ConfinedSpacePpe> = {}) {
    Object.assign(this, data);
  }
}

export class ConfinedSpacePrecautions {
  ventilation: boolean = false;
  blankFlanged: boolean = false;
  doubleBlockAndBleed: boolean = false;
  barriers: boolean = false;
  other: boolean = false;
  otherDescription: string = '';
  lockOutTagOut: string = '';
  hotWorkPermit: string = '';

  constructor(data: Partial<ConfinedSpacePrecautions> = {}) {
    Object.assign(this, data);
  }
}





export type ConfinedSpaceFieldName = keyof ConfinedSpaceModel;

export interface ConfinedSpaceModel extends BaseModel {
  date: string | null;
  time: string | null;
  space: string | null;
  workScope: string | null;
  issuedTo: string | null;
  duration: string | null;
  lotoNum: string | null;
  hotWorkNum: string | null;
  ventilation: boolean;
  blankFlanged: boolean;
  meterModel: string | null;
  meterNum: string | null;
  calibrated: boolean;
  oxygen: string | null;
  lel: string | null;
  hydrogenSulfide: string | null;
  carbonMonoxide: string | null;
  ammonia: string | null;
  timeOfSample: string | null;
  testerInitials: string | null;
  hazards: ConfinedSpaceHazards | null;
  ppe: ConfinedSpacePpe | null;
  precautions: ConfinedSpacePrecautions | null;
  permitStatus: ValueDto;
}

export class ConfinedSpaceDto extends BaseDto implements ConfinedSpaceModel {
  date: string | null;
  time: string | null;
  space: string | null;
  workScope: string | null;
  issuedTo: string | null;
  duration: string | null;
  lotoNum: string | null;
  hotWorkNum: string | null;
  ventilation: boolean;
  blankFlanged: boolean;
  meterModel: string | null;
  meterNum: string | null;
  calibrated: boolean;
  oxygen: string | null;
  lel: string | null;
  hydrogenSulfide: string | null;
  carbonMonoxide: string | null;
  ammonia: string | null;
  timeOfSample: string | null;
  testerInitials: string | null;
  hazards: ConfinedSpaceHazards | null;
  ppe: ConfinedSpacePpe | null;
  precautions: ConfinedSpacePrecautions | null;
  permitStatus: ValueDto;

  constructor(data: Partial<ConfinedSpaceModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.space = data.space ?? null;
    this.workScope = data.workScope ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.duration = data.duration ?? '12 hours';
    this.lotoNum = data.lotoNum ?? null;
    this.hotWorkNum = data.hotWorkNum ?? null;
    this.ventilation = data.ventilation ?? false;
    this.blankFlanged = data.blankFlanged ?? false;
    this.meterModel = data.meterModel ?? "RKI GX-3R PRO";
    this.meterNum = data.meterNum ?? null;
    this.calibrated = data.calibrated ?? true;
    this.oxygen = data?.oxygen ?? null;
    this.lel = data?.lel ?? null;
    this.hydrogenSulfide = data?.hydrogenSulfide ?? null;
    this.carbonMonoxide = data?.carbonMonoxide ?? null;
    this.ammonia = data?.ammonia ?? null;
    this.timeOfSample = data?.timeOfSample ?? null;
    this.testerInitials = data?.testerInitials ?? null;
    this.hazards = data.hazards ?? new ConfinedSpaceHazards();
    this.ppe = data.ppe?? new ConfinedSpacePpe();
    this.precautions = data.precautions?? new ConfinedSpacePrecautions();
    this.permitStatus = data.permitStatus ?? new ValueDto();
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      date: this.date,
      time: this.time,
      space: this.space,
      workScope: this.workScope,
      issuedTo: this.issuedTo,
      duration: this.duration,
      lotoNum: this.lotoNum,
      hotWorkNum: this.hotWorkNum,
      ventilation: this.ventilation,
      blankFlanged: this.blankFlanged,
      meterModel: this.meterModel,
      meterNum: this.meterNum,
      calibrated: this.calibrated,
      oxygen: this.oxygen,
      lel: this.lel,
      hydrogenSulfide: this.hydrogenSulfide,
      carbonMonoxide: this.carbonMonoxide,
      ammonia: this.ammonia,
      hazards: this.hazards,
      ppe: this.ppe,
      precautions: this.precautions,
      permitStatus: this.permitStatus?.toJson() ?? null,
    };
  }

  static override fromJson(json: any): ConfinedSpaceDto {
    return new ConfinedSpaceDto({
      ...super.fromJson(json),
      date: json.date || null,
      time: json.time || null,
      space: json.space || null,
      workScope: json.workScope || null,
      issuedTo: json.issuedTo || null,
      duration: json.duration || null,
      lotoNum: json.lotoNum || null,
      hotWorkNum: json.hotWorkNum || null,
      ventilation: json.ventilation || false,
      blankFlanged: json.blankFlanged || false,
      meterModel: json.meterModel || "RKI GX-3R PRO",
      meterNum: json.meterNum || null,
      calibrated: json.calibrated || false,
      oxygen: json.oxygen || null,
      lel: json.lel || null,
      hydrogenSulfide: json.hydrogenSulfide || null,
      carbonMonoxide: json.carbonMonoxide || null,
      ammonia: json.ammonia || null,
      hazards: json.hazards || new ConfinedSpaceHazards(),
      ppe: json.ppe || new ConfinedSpacePpe(),
      precautions: json.precautions || new ConfinedSpacePrecautions(),
      permitStatus: ValueDto.fromJson(json.permitStatus),
    });
  }

  static isValidKey(key: string): key is keyof ConfinedSpaceModel {
    return [
      'id', 'date', 'time', 'space', 'workScope', 'issuedTo', 'duration',
      'lotoNum', 'hotWorkNum', 'ventilation', 'blankFlanged', 'meterModel',
      'meterNum', 'calibrated', 'hazards', 'isVerified', 'name', 'objectType', 'ppe', 'precautions'
    ].includes(key);
  }

  static toFormFields(
    dto: ConfinedSpaceDto,
    spaceOptions: Option[],
    fields: ConfinedSpaceFieldName[] = [
      'date', 'time', 'space', 'workScope', 'issuedTo', 'duration', 'meterModel',
      'meterNum', 'calibrated', 
      ...Object.keys(ConfinedSpaceDto.getHazardFields(null)) as ConfinedSpaceFieldName[],
      ...Object.keys(ConfinedSpaceDto.getPpeFields(null)) as ConfinedSpaceFieldName[],
      ...Object.keys(ConfinedSpaceDto.getPrecautionFields(null)) as ConfinedSpaceFieldName[]
    ]
  ): FormField[] {

    const hazardFields = ConfinedSpaceDto.getHazardFields(dto.hazards);
    const ppeFields = ConfinedSpaceDto.getPpeFields(dto.ppe);
    const precautionFields = ConfinedSpaceDto.getPrecautionFields(dto.precautions);
    const allFields: { [key: string]: FormField } = {
      
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
        initialValue: dto.time ?? new Date().toTimeString().slice(0, 5)
      },
      space: {
        name: 'space',
        label: 'Confined Space',
        type: 'text',
        options: spaceOptions,
        validators: [Validators.required],
        initialValue: dto.space
      },
      workScope: { 
        name: 'workScope', 
        label: 'Work Scope', 
        type: 'textarea', 
        validators: [Validators.required], 
        initialValue: dto.workScope 
      },
      issuedTo: { 
        name: 'issuedTo', 
        label: 'Issued To', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.issuedTo 
      },
      duration: { 
        name: 'duration', 
        label: 'Duration', 
        type: 'text', 
        validators: [Validators.required], 
        initialValue: dto.duration 
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
      calibrated: { 
        name: 'calibrated', 
        label: 'Calibrated', 
        type: 'checkbox', 
        initialValue: dto.calibrated 
      },
      oxygen: { name: 'oxygen', label: 'Oxygen', type: 'text', initialValue: dto.oxygen },
      lel: { name: 'lel', label: 'LEL', type: 'text', initialValue: dto.lel },
      hydrogenSulfide: { name: 'hydrogenSulfide', label: 'H2S', type: 'text', initialValue: dto.hydrogenSulfide },
      carbonMonoxide: { name: 'carbonMonoxide', label: 'CO', type: 'text', initialValue: dto.carbonMonoxide },
      ammonia: { name: 'ammonia', label: 'Ammonia', type: 'text', initialValue: dto.ammonia },
      timeOfSample: { name: 'timeOfSample', label: 'Time of Sample', type: 'time', initialValue: dto.timeOfSample },
      testerInitials: { name: 'testerInitials', label: 'Tester Initials', type: 'text', initialValue: dto.testerInitials },
      
      ...hazardFields,
      ...ppeFields,
      ...precautionFields,
    };
  
    return fields.map(fieldName => allFields[fieldName]);
  }

  static toTableColumns(fields: ConfinedSpaceFieldName[] = ['date', 'time', 'space', 'workScope', 'issuedTo', 'duration']): Column[] {
    const allColumns: { [key in ConfinedSpaceFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      time: { id: 'time', header: 'Time', accessorKey: 'time' },
      space: { id: 'space', header: 'Confined Space', accessorKey: 'space' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      issuedTo: { id: 'issuedTo', header: 'Issued To', accessorKey: 'issuedTo' },
      duration: { id: 'duration', header: 'Duration', accessorKey: 'duration' },
      lotoNum: { id: 'lotoNum', header: 'LOTO Number', accessorKey: 'lotoNum' },
      hotWorkNum: { id: 'hotWorkNum', header: 'Hot Work Number', accessorKey: 'hotWorkNum' },
      ventilation: { 
        id: 'ventilation', 
        header: 'Ventilation', 
        accessorFn: (item: ConfinedSpaceDto) => item.ventilation ? 'Yes' : 'No'
      },
      blankFlanged: { 
        id: 'blankFlanged', 
        header: 'Blank Flanged', 
        accessorFn: (item: ConfinedSpaceDto) => item.blankFlanged ? 'Yes' : 'No'
      },
      meterModel: { id: 'meterModel', header: 'Meter Model', accessorKey: 'meterModel' },
      meterNum: { id: 'meterNum', header: 'Meter Number', accessorKey: 'meterNum' },
      calibrated: { 
        id: 'calibrated', 
        header: 'Calibrated', 
        accessorFn: (item: ConfinedSpaceDto) => item.calibrated ? 'Yes' : 'No'
      },
      oxygen: { id: 'oxygen', header: 'Oxygen', accessorKey: 'oxygen' },
      lel: { id: 'lel', header: 'LEL', accessorKey: 'lel' },
      hydrogenSulfide: { id: 'hydrogenSulfide', header: 'H2S', accessorKey: 'hydrogenSulfide' },
      carbonMonoxide: { id: 'carbonMonoxide', header: 'CO', accessorKey: 'carbonMonoxide' },
      ammonia: { id: 'ammonia', header: 'Ammonia', accessorKey: 'ammonia' },
      timeOfSample: { id: 'timeOfSample', header: 'Time of Sample', accessorKey: 'timeOfSample' },
      testerInitials: { id: 'testerInitials', header: 'Tester Initials', accessorKey: 'testerInitials' },
      
        
      
        hazards: { 
            id: 'hazards',
            header: 'Hazards',
            accessorFn: (item: ConfinedSpaceDto) => {
            if (!item.hazards) return 'None';
            const activeHazards = Object.entries(item.hazards)
                .filter(([_, value]) => value)
                .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').trim());
            return activeHazards.length > 0 ? activeHazards.join(', ') : 'None';
            }
        },
      ppe: {
        id: 'ppe',
        header: 'PPE',
        accessorFn: (item: ConfinedSpaceDto) => {
          if (!item.ppe) return 'None';
          const activePpe = Object.entries(item.ppe)
            .filter(([_, value]) => value)
            .map(([key, _]) => ConfinedSpaceDto.formatLabel(key));
          return activePpe.length > 0 ? activePpe.join(', ') : 'None';
        }
      },
      precautions: {
        id: 'precautions',
        header: 'Precautions',
        accessorFn: (item: ConfinedSpaceDto) => {
          if (!item.precautions) return 'None';
          const activePrecautions = Object.entries(item.precautions)
            .filter(([_, value]) => value)
            .map(([key, _]) => ConfinedSpaceDto.formatLabel(key));
          return activePrecautions.length > 0 ? activePrecautions.join(', ') : 'None';
        }
      },
        
        isVerified: { 
            id: 'isVerified', 
            header: 'Verified', 
            accessorFn: (item: ConfinedSpaceDto) => item.isVerified ? 'Yes' : 'No'
        },
        name: { id: 'name', header: 'Name', accessorKey: 'name' },
        objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
        permitStatus: {
            id: 'permitStatus',
            header: 'Status',
            accessorFn: (item: ConfinedSpaceDto) => item.permitStatus?.name || ''
        }
        };

        return fields.map(fieldName => allColumns[fieldName]);
    }
      
    static generatePermitFromRequest(request: WorkRequestDto): ConfinedSpaceDto{
      return new ConfinedSpaceDto({
        date: request.dateOfWorkToBePerformed?.split('T')[0],
        issuedTo: request.requestedBy,
        space: request.space,
        workScope: request.workScope
      });
    }
    
    static formatLabel(key: string): string {
      const result = key.replace(/([A-Z])/g, ' $1');
      return result.charAt(0).toUpperCase() + result.slice(1);
    }
  
    static getHazardOptions(hazards: ConfinedSpaceHazards | null): Option[] {
      if(!hazards) return [];
      // Get all keys from the hazards object in a type-safe way
      const hazardKeys = Object.keys(hazards) as (keyof ConfinedSpaceHazards)[];
  
      // Map over the keys to create the desired FormOption structure
      return hazardKeys.map(key => {
        return {
          label: this.formatLabel(key), // 'highTemp' -> 'High Temp'
          key:key,
          value: hazards[key]    // The boolean value (true/false)
        };
      });
    }

    static getPpeOptions(ppe: ConfinedSpacePpe | null): Option[] {
      if(!ppe) return [];
      // Get all keys from the ppe object in a type-safe way
      const ppeKeys = Object.keys(ppe) as (keyof ConfinedSpacePpe)[];
  
      // Map over the keys to create the desired FormOption structure
      return ppeKeys.map(key => {
        return {
          label: this.formatLabel(key), // 'safetyGlasses' -> 'Safety Glasses'
          key: key,
          value: ppe[key]    // The boolean value (true/false)
        };
      });
    }

    static getPrecautionOptions(precautions: ConfinedSpacePrecautions | null): Option[] {
      if(!precautions) return [];
      // Get all keys from the precautions object in a type-safe way
      const precautionKeys = Object.keys(precautions) as (keyof ConfinedSpacePrecautions)[];
  
      // Map over the keys to create the desired FormOption structure
      return precautionKeys.map(key => {
        return {
          label: this.formatLabel(key),
          key: key,
          value: precautions[key]
        };
      });
    }


    static getHazardFields(hazardsDto: ConfinedSpaceHazards | null): { [key: string]: FormField } {
      const hazards = hazardsDto || new ConfinedSpaceHazards();
      const group = { label: 'Hazards', orientation: 'horizontal' } as const;
      return {
        'hazards.oxygenDeficiency': { 
          name: 'hazards.oxygenDeficiency', 
          label: 'Oxygen Deficiency', 
          type: 'checkbox', 
          initialValue: hazards.oxygenDeficiency,
          group: group,
        },
        'hazards.flammableGas': { name: 'hazards.flammableGas', label: 'Flammable Gas', type: 'checkbox', initialValue: hazards.flammableGas, group: group },
        'hazards.combustibleDust': { name: 'hazards.combustibleDust', label: 'Combustible Dust', type: 'checkbox', initialValue: hazards.combustibleDust, group: group },
        'hazards.toxicGas': { name: 'hazards.toxicGas', label: 'Toxic Gas', type: 'checkbox', initialValue: hazards.toxicGas, group: group },
        'hazards.rotatingEquipment': { name: 'hazards.rotatingEquipment', label: 'Rotating Equipment', type: 'checkbox', initialValue: hazards.rotatingEquipment, group: group },
        'hazards.electricalShock': { name: 'hazards.electricalShock', label: 'Electrical Shock', type: 'checkbox', initialValue: hazards.electricalShock, group: group },
        'hazards.entrapment': { name: 'hazards.entrapment', label: 'Entrapment', type: 'checkbox', initialValue: hazards.entrapment, group: group },
        'hazards.engulfment': { name: 'hazards.engulfment', label: 'Engulfment', type: 'checkbox', initialValue: hazards.engulfment, group: group },
        'hazards.heatStress': { name: 'hazards.heatStress', label: 'Heat Stress', type: 'checkbox', initialValue: hazards.heatStress, group: group },
        'hazards.other': { name: 'hazards.other', label: 'Other', type: 'checkbox', initialValue: hazards.other, group: group },
        'hazards.otherDescription': { name: 'hazards.otherDescription', label: 'Other Description', type: 'text', initialValue: hazards.otherDescription, group: group },
      };
    }

    static getPpeFields(ppeDto: ConfinedSpacePpe | null): { [key: string]: FormField } {
      const ppe = ppeDto || new ConfinedSpacePpe();
      const group = { label: 'PPE', orientation: 'horizontal' } as const;
      return {
        'ppe.faceShield': { name: 'ppe.faceShield', label: 'Face Shield', type: 'checkbox', initialValue: ppe.faceShield, group: group },
        'ppe.fcfi': { name: 'ppe.fcfi', label: 'FCFI', type: 'checkbox', initialValue: ppe.fcfi, group: group },
        'ppe.lovVoltageTools': { name: 'ppe.lovVoltageTools', label: 'Low Voltage Tools', type: 'checkbox', initialValue: ppe.lovVoltageTools, group: group },
        'ppe.explosionProofTools': { name: 'ppe.explosionProofTools', label: 'Explosion Proof Tools', type: 'checkbox', initialValue: ppe.explosionProofTools, group: group },
        'ppe.nonSparkingTools': { name: 'ppe.nonSparkingTools', label: 'Non-Sparking Tools', type: 'checkbox', initialValue: ppe.nonSparkingTools, group: group },
        'ppe.fallProtection': { name: 'ppe.fallProtection', label: 'Fall Protection', type: 'checkbox', initialValue: ppe.fallProtection, group: group },
        'ppe.retrievalSystem': { name: 'ppe.retrievalSystem', label: 'Retrieval System', type: 'checkbox', initialValue: ppe.retrievalSystem, group: group },
        'ppe.lifeline': { name: 'ppe.lifeline', label: 'Lifeline', type: 'checkbox', initialValue: ppe.lifeline, group: group },
        'ppe.personalAtmosphericMeter': { name: 'ppe.personalAtmosphericMeter', label: 'Personal Atmospheric Meter', type: 'checkbox', initialValue: ppe.personalAtmosphericMeter, group: group },
        'ppe.tripod': { name: 'ppe.tripod', label: 'Tripod', type: 'checkbox', initialValue: ppe.tripod, group: group },
        'ppe.other': { name: 'ppe.other', label: 'Other', type: 'checkbox', initialValue: ppe.other, group: group },
        'ppe.otherDescription': { name: 'ppe.otherDescription', label: 'Other Description', type: 'text', initialValue: ppe.otherDescription, group: group },
      };
    }

    static getPrecautionFields(precautionsDto: ConfinedSpacePrecautions | null): { [key: string]: FormField } {
      const precautions = precautionsDto || new ConfinedSpacePrecautions();
      const group = { label: 'Precautions', orientation: 'horizontal' } as const;
      return {
        'precautions.ventilation': { name: 'precautions.ventilation', label: 'Ventilation', type: 'checkbox', initialValue: precautions.ventilation, group: group },
        'precautions.blankFlanged': { name: 'precautions.blankFlanged', label: 'Blank/Flanged', type: 'checkbox', initialValue: precautions.blankFlanged, group: group },
        'precautions.doubleBlockAndBleed': { name: 'precautions.doubleBlockAndBleed', label: 'Double Block and Bleed', type: 'checkbox', initialValue: precautions.doubleBlockAndBleed, group: group },
        'precautions.barriers': { name: 'precautions.barriers', label: 'Barriers', type: 'checkbox', initialValue: precautions.barriers, group: group },
        'precautions.other': { name: 'precautions.other', label: 'Other', type: 'checkbox', initialValue: precautions.other, group: group },
        'precautions.otherDescription': { name: 'precautions.otherDescription', label: 'Other Description', type: 'text', initialValue: precautions.otherDescription, group: group },
        'precautions.lockOutTagOut': { name: 'precautions.lockOutTagOut', label: 'Lock Out/Tag Out', type: 'text', initialValue: precautions.lockOutTagOut, group: group },
        'precautions.hotWorkPermit': { name: 'precautions.hotWorkPermit', label: 'Hot Work Permit', type: 'text', initialValue: precautions.hotWorkPermit, group: group },
      };
    }

}