
import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { Option } from '../option.model';
import { FormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { WorkRequestDto } from './work-request.model';

export class ConfinedSpaceHazards {
  oxygenDeficiency: boolean;
  flammableGas: boolean;
  combustibleDust: boolean;
  toxicGas: boolean;
  rotatingEquipment: boolean;
  electricalShock: boolean;
  entrapment: boolean;
  engulfment: boolean;
  heatStress: boolean;
  faceShield: boolean;
  gfcI: boolean;
  lowVoltageTools: boolean;
  explosionProofTools: boolean;
  nonSparkingTools: boolean;
  fallProtection: boolean;
  retrievalSystem: boolean;
  lifeLine: boolean;
  atmMeter: boolean;
  tripod: boolean;

  constructor(data: Partial<ConfinedSpaceHazards> = {}) {
    this.oxygenDeficiency = data.oxygenDeficiency ?? false;
    this.flammableGas = data.flammableGas ?? false;
    this.combustibleDust = data.combustibleDust ?? false;
    this.toxicGas = data.toxicGas ?? false;
    this.rotatingEquipment = data.rotatingEquipment ?? false;
    this.electricalShock = data.electricalShock ?? false;
    this.entrapment = data.entrapment ?? false;
    this.engulfment = data.engulfment ?? false;
    this.heatStress = data.heatStress ?? false;
    this.faceShield = data.faceShield ?? false;
    this.gfcI = data.gfcI ?? false;
    this.lowVoltageTools = data.lowVoltageTools ?? false;
    this.explosionProofTools = data.explosionProofTools ?? false;
    this.nonSparkingTools = data.nonSparkingTools ?? false;
    this.fallProtection = data.fallProtection ?? false;
    this.retrievalSystem = data.retrievalSystem ?? false;
    this.lifeLine = data.lifeLine ?? false;
    this.atmMeter = data.atmMeter ?? false;
    this.tripod = data.tripod ?? false;
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
  hazards: ConfinedSpaceHazards | null;
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
  hazards: ConfinedSpaceHazards | null;

  constructor(data: Partial<ConfinedSpaceModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.space = data.space ?? null;
    this.workScope = data.workScope ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.duration = data.duration ?? null;
    this.lotoNum = data.lotoNum ?? null;
    this.hotWorkNum = data.hotWorkNum ?? null;
    this.ventilation = data.ventilation ?? false;
    this.blankFlanged = data.blankFlanged ?? false;
    this.meterModel = data.meterModel ?? "RKI GX-3R PRO";
    this.meterNum = data.meterNum ?? null;
    this.calibrated = data.calibrated ?? false;
    this.hazards = data.hazards ?? new ConfinedSpaceHazards();
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
      hazards: this.hazards,
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
      hazards: json.hazards || new ConfinedSpaceHazards(),
    });
  }

  static isValidKey(key: string): key is keyof ConfinedSpaceModel {
    return [
      'id', 'date', 'time', 'space', 'workScope', 'issuedTo', 'duration',
      'lotoNum', 'hotWorkNum', 'ventilation', 'blankFlanged', 'meterModel',
      'meterNum', 'calibrated', 'hazards', 'isVerified', 'name', 'objectType'
    ].includes(key);
  }

  static toFormFields(
    dto: ConfinedSpaceDto,
    spaceOptions: Option[],
    fields: ConfinedSpaceFieldName[] = [
      'date', 'time', 'space', 'workScope', 'issuedTo', 'duration',
      'lotoNum', 'hotWorkNum', 'ventilation', 'blankFlanged', 'meterModel',
      'meterNum', 'calibrated', 'hazards'
    ]
  ): FormField[] {
    const allFields: { [key in ConfinedSpaceFieldName]: FormField } = {
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
      lotoNum: { 
        name: 'lotoNum', 
        label: 'LOTO Number', 
        type: 'text', 
        initialValue: dto.lotoNum 
      },
      hotWorkNum: { 
        name: 'hotWorkNum', 
        label: 'Hot Work Number', 
        type: 'text', 
        initialValue: dto.hotWorkNum 
      },
      ventilation: { 
        name: 'ventilation', 
        label: 'Ventilation', 
        type: 'checkbox', 
        initialValue: dto.ventilation 
      },
      blankFlanged: { 
        name: 'blankFlanged', 
        label: 'Blank Flanged', 
        type: 'checkbox', 
        initialValue: dto.blankFlanged 
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
      hazards: { name: 'hazards', label: 'Hazards', type: 'checkbox-group', initialValue: dto.hazards, options: ConfinedSpaceDto.getHazardOptions(dto.hazards) },
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
        isVerified: { 
            id: 'isVerified', 
            header: 'Verified', 
            accessorFn: (item: ConfinedSpaceDto) => item.isVerified ? 'Yes' : 'No'
        },
        name: { id: 'name', header: 'Name', accessorKey: 'name' },
        objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' }
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
          value: hazards[key]    // The boolean value (true/false)
        };
      });
    }
}