import { BaseDto, BaseModel } from '../base/base.model';
import { LotoDto } from './loto.model';
import { ValueDto } from '../value.model';
import { BasePermitDto, BasePermitModel } from '../base/base-permit.model';
import { LockDto } from './lock.model';

export interface LotoBoxModel extends BasePermitModel {
  number: number;
  loto: LotoDto | null;
  lotoAccessoryStatus: ValueDto;
  ledStripId: number | null;
  rangeStart: number | null;
  rangeEnd: number | null;
  description: string;

  setSize: number;
  active: boolean;
  portable: boolean;
  homeLocks: LockDto[];

  // Flat display fields for assigned LOTO
  lotoId: number | null;
  lotoPermitNumber: string | null;
  lotoEquipmentSystem: string | null;
  lotoStatus: string | null;
  lotoWorkScope: string | null;
  /** External Red Tag Enterprise LOTO number the operator set via Red Tag Bypass. */
  lotoRedTagNum: string | null;

  // LED status fields (not persisted, from LED status API)
  r?: number;
  g?: number;
  b?: number;
  brightness?: number;
  strip?: number;
  manualOverride?: boolean; // If true, ignore loto status for LED color
}

export class LotoBoxDto extends BasePermitDto implements LotoBoxModel {
  number: number;
  loto: LotoDto | null;
  lotoAccessoryStatus: ValueDto;
  ledStripId: number | null;
  rangeStart: number | null;
  rangeEnd: number | null;
  description: string;

  setSize: number;
  active: boolean;
  portable: boolean;
  homeLocks: LockDto[];

  lotoId: number | null;
  lotoPermitNumber: string | null;
  lotoEquipmentSystem: string | null;
  lotoStatus: string | null;
  lotoWorkScope: string | null;
  lotoRedTagNum: string | null;

  // LED status fields
  r?: number;
  g?: number;
  b?: number;
  brightness?: number;
  strip?: number;
  manualOverride?: boolean;

  constructor(data: Partial<LotoBoxModel> = {}, isNested: boolean = false) {
    super(data);
    this.number = data.number ?? 0;
    this.loto = isNested ? null : (data.loto ? new LotoDto({...data.loto, lotoBox: null}) : null);
    this.lotoAccessoryStatus = data.lotoAccessoryStatus ? new ValueDto(data.lotoAccessoryStatus) : new ValueDto();
    this.ledStripId = data.ledStripId ?? null;
    this.rangeStart = data.rangeStart ?? null;
    this.rangeEnd = data.rangeEnd ?? null;
    this.description = data.description ?? '';
    this.setSize = data.setSize ?? 0;
    this.active = data.active ?? true;
    this.portable = data.portable ?? false;
    this.homeLocks = data.homeLocks ?? [];
    this.lotoId = data.lotoId ?? null;
    this.lotoPermitNumber = data.lotoPermitNumber ?? null;
    this.lotoEquipmentSystem = data.lotoEquipmentSystem ?? null;
    this.lotoStatus = data.lotoStatus ?? null;
    this.lotoWorkScope = data.lotoWorkScope ?? null;
    this.lotoRedTagNum = data.lotoRedTagNum ?? null;
    this.r = data.r;
    this.g = data.g;
    this.b = data.b;
    this.brightness = data.brightness;
    this.strip = data.strip;
    this.manualOverride = data.manualOverride ?? false;
  }

  // Override toJson method
  override toJson(): any {
    return {
      ...super.toJson(),
      number: this.number,
      loto: this.loto?.toJson(),
      lotoAccessoryStatus: this.lotoAccessoryStatus.toJson(),
      ledStripId: this.ledStripId,
      rangeStart: this.rangeStart,
      rangeEnd: this.rangeEnd,
      description: this.description,
      setSize: this.setSize,
      active: this.active,
      portable: this.portable,
      lotoId: this.lotoId,
      lotoPermitNumber: this.lotoPermitNumber,
      lotoEquipmentSystem: this.lotoEquipmentSystem,
      lotoStatus: this.lotoStatus,
      lotoWorkScope: this.lotoWorkScope,
      lotoRedTagNum: this.lotoRedTagNum,
    };
  }

  // Override fromJson method
  static override fromJson(json: any, isNested: boolean = false): LotoBoxDto {
    if (!json) {
      console.warn('Received null or undefined json in LotoBoxDto.fromJson');
      return new LotoBoxDto();
    }

    return new LotoBoxDto({
      ...super.fromJson(json),
      number: json.number,
      loto: isNested ? null : (json.loto ? LotoDto.fromJson({...json.loto, lotoBox: null}) : null),
      lotoAccessoryStatus: ValueDto.fromJson(json.lotoAccessoryStatus),
      ledStripId: json.ledStripId,
      rangeStart: json.rangeStart,
      rangeEnd: json.rangeEnd,
      description: json.description,
      setSize: json.setSize ?? 0,
      active: json.active ?? true,
      portable: json.portable ?? false,
      homeLocks: Array.isArray(json.homeLocks) ? json.homeLocks.map((l: any) => LockDto.fromJson(l)) : [],
      lotoId: json.lotoId ?? null,
      lotoPermitNumber: json.lotoPermitNumber ?? null,
      lotoEquipmentSystem: json.lotoEquipmentSystem ?? null,
      lotoStatus: json.lotoStatus ?? null,
      lotoWorkScope: json.lotoWorkScope ?? null,
      lotoRedTagNum: json.lotoRedTagNum ?? null,
      r: json.r,
      g: json.g,
      b: json.b,
      brightness: json.brightness,
      strip: json.strip,
      manualOverride: json.manualOverride
    }, isNested);
  }
}