import { BaseDto, BaseModel } from '../base/base.model';
import { ValueDto, ValueModel } from '../value.model';
import { EquipmentDto, EquipmentModel } from '../equipment/equipment.model';

export interface ZeroEnergyModel extends BaseModel {
  method: string;
  zeroEnergyTemplate: ValueModel;
  templateEquipment: EquipmentModel[];
  templateEquipmentIds: number[];
}

export interface ZeroEnergyIdModel extends Omit<ZeroEnergyModel, 'zeroEnergyTemplate' | 'templateEquipment'> {
  zeroEnergyTemplateId: number | null;
  templateEquipmentIds: number[];
  editShared?: boolean;
}

export class ZeroEnergyDto extends BaseDto implements ZeroEnergyModel {
  method = '';
  zeroEnergyTemplate = new ValueDto();
  templateEquipment: EquipmentDto[] = [];
  templateEquipmentIds: number[] = [];

  constructor(data: Partial<ZeroEnergyModel> = {}) {
    super(data);
    
    this.method = data.method ?? '';
    this.zeroEnergyTemplate = this.toValueDto(data.zeroEnergyTemplate);
    this.templateEquipment = this.toEquipmentDtos(data.templateEquipment);
    this.templateEquipmentIds = data.templateEquipmentIds ?? [];
  }

  private toValueDto(data?: any): ValueDto {
    if(data instanceof ValueDto) return data;
  if (typeof data === 'number') return new ValueDto({ id: data });
    return data instanceof ValueDto ? data : new ValueDto(data ?? {});
  }

  private toEquipmentDtos(data?: any[]): EquipmentDto[] {
    return Array.isArray(data) 
      ? data.map(item => item instanceof EquipmentDto ? item : new EquipmentDto(item))
      : [];
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      method: this.method,
      zeroEnergyTemplate: this.zeroEnergyTemplate?.toJson?.() ?? this.zeroEnergyTemplate,
      templateEquipment: this.templateEquipment.map(item => item.toJson()),
      templateEquipmentIds: this.templateEquipmentIds,
    };
  }

  static override fromJson(json: any): ZeroEnergyDto {
    if (!json) {
      return new ZeroEnergyDto();
    }

    return new ZeroEnergyDto({
      ...super.fromJson(json),
      method: json.method ?? '',
      zeroEnergyTemplate: json.zeroEnergyTemplate ? ValueDto.fromJson(json.zeroEnergyTemplate) : new ValueDto(),
      templateEquipment: Array.isArray(json.templateEquipment)
        ? json.templateEquipment.map((item: any) => EquipmentDto.fromJson(item))
        : [],
      templateEquipmentIds: json.templateEquipmentIds ?? [],
    });
  }
}


