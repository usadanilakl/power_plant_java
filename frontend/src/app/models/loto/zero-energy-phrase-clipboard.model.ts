import { ZeroEnergyModel } from './zero-energy.model';

export interface IZeroEnergyPhraseClipboard
  extends Omit<
    ZeroEnergyModel,
    | 'id'
  > {}

export class ZeroEnergyPhraseClipboardItem implements IZeroEnergyPhraseClipboard {
  objectType: string = 'ZeroEnergyPhrase';
  name: string = '';
  isVerified: boolean = false;
  method: string = '';
  zeroEnergyTemplate: any = null;
  templateEquipment: any[] = [];
  templateEquipmentIds: number[] = [];

  constructor(data: Partial<ZeroEnergyModel> = {}) {
    this.objectType = 'ZeroEnergyPhrase';
    this.name = data.name || '';
    this.isVerified = data.isVerified || false;
    this.method = data.method || '';
    this.zeroEnergyTemplate = data.zeroEnergyTemplate
      ? { id: data.zeroEnergyTemplate.id, name: data.zeroEnergyTemplate.name }
      : null;
    this.templateEquipment = data.templateEquipment || [];
    this.templateEquipmentIds = data.templateEquipmentIds || [];
  }
}
