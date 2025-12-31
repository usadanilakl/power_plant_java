import { BaseModel } from '../base/base.model';
import { ValueModel } from '../value.model';
import { EquipmentModel } from '../equipment/equipment.model';

export interface ZeroEnergyModel extends BaseModel {
  method: string;
  zeroEnergyTemplate: ValueModel;
  templateEquipment: EquipmentModel[];
  templateEquipmentIds: number[];
}

export interface ZeroEnergyIdModel extends Omit<ZeroEnergyModel, 'zeroEnergyTemplate' | 'templateEquipment'> {
  zeroEnergyTemplateId: number | null;
  templateEquipmentIds: number[];
}
