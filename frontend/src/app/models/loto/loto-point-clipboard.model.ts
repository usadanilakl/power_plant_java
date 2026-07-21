import { ValueDto } from '../value.model';
import { FileDto } from '../file/file.model';
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
    | 'fluid'
    | 'characteristicsJson'
    | 'fileIds'
    | 'lotos'
    | 'equipmentIdList'
    | 'id'
    | 'zeroEnergyMethod'
    // Pictures have their own attach/detach UX and cross-machine sync path;
    // clipboard copy/paste of the "picture set" of a LOTO point isn't a
    // meaningful operation (each picture is a plant-taken photo of a real
    // isolation point, not something to be duplicated onto a new point).
    | 'pictures'
    // pidCount is a read-only derived value populated by list endpoints;
    // not meaningful to copy between points.
    | 'pidCount'
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
  modelFile: FileDto | null = null;

  constructor(data: Partial<LotoPointModel> = {}) {
    Object.assign(this, data);
  }
}
