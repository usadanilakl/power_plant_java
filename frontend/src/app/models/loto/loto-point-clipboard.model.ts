import { ValueDto } from '../value.model';
import { LotoPointModel } from './loto-point.model';
import { ZeroEnergyModel } from './zero-energy.model';

export interface ILotoPointClipboard
  extends Omit<
    LotoPointModel,
    | 'lotos'
    | 'equipmentList'
    | 'fileIds'
    | 'conflictStatus'
    | 'isUpdated'
    | 'oldId'
    | 'tagged'
    | 'standard'
    | 'normalPosition'
    | 'isolatedPosition'
    | 'fileIds'
    | 'lotos'
    | 'equipmentIdList'
    | 'id'
    | 'zeroEnergyMethod'
  > {}

export class LotoPointClipboardItem implements ILotoPointClipboard {
  name: string = '';
  objectType: string = '';
  unit: string | null = null;
  tagNumber: string | null = null;
  description: string | null = null;
  isoPos: ValueDto | null = null;
  normPos: ValueDto | null = null;
  specificLocation: string | null = null;
  generalLocation: string | null = null;
  isVerified: boolean = false;
  relatedLotoPointIds: number[] | null = null;
  location: ValueDto | null = null;
  eqType: ValueDto | null = null;
  zeroEnergy: ZeroEnergyModel | null = null;
  counterpartId: number | null = null;
  isLabeled: boolean | null = null;
  isLockable: boolean | null = null;
  isProcessed: boolean | null = null;
  processingStatus: ValueDto | null = null;

  constructor(data: Partial<LotoPointModel> = {}) {
    Object.assign(this, data);
  }
}
