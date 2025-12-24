import { BaseModel } from '../base/base.model';
import { ValueModel } from '../value.model';
import { LotoPointModel } from './loto-point.model';

export interface ZeroEnergyModel extends BaseModel {
  method: string;
  templateLotoPoint: LotoPointModel;
  zeroEnergyTemplate: ValueModel;
}

export interface ZeroEnergyIdModel extends Omit<ZeroEnergyModel, 'reference'> {
  referenceId: number;
}
