import { BaseModel } from '../base/base.model';
import { ValueModel } from '../value.model';
import { LotoPointModel } from './loto-point.model';

export interface ZeroEnergyModel extends BaseModel {
  method: string;
  templateLotoPoints: LotoPointModel[]; // Array of LOTO points to fill placeholders
  zeroEnergyTemplate: ValueModel; // The phrase template with placeholders
}

export interface ZeroEnergyIdModel extends Omit<ZeroEnergyModel, 'reference'> {
  referenceId: number;
}
