import { LotoPointModel } from '../loto-point.model';

export interface ZeroEnergyModel {
  id: number;
  description: string;
  reference: LotoPointModel;
}

export interface ZeroEnergyIdModel extends Omit<ZeroEnergyModel, 'reference'> {
  referenceId: number;
}
