import { IBaseModel, BaseModel } from "../base.model";
import { FormField } from "../../inputs/form-field.model";
import { Column } from "../../inputs/column.model";

export interface ILotoPoint extends IBaseModel {
  tagNumber: string | null;
  description: string | null;
  specificLocation: string | null;
  generalLocation: string | null;
  normalPosition: string | null;
  isolatedPosition: string | null;
  zeroEnergyMethod: string | null;
  currentPosition: string | null;
}

export class LotoPoint extends BaseModel<ILotoPoint> implements ILotoPoint {
  tagNumber: string | null;
  description: string | null;
  specificLocation: string | null;
  generalLocation: string | null;
  normalPosition: string | null;
  isolatedPosition: string | null;
  zeroEnergyMethod: string | null;
  currentPosition: string | null;

  constructor(data: Partial<ILotoPoint> = {}) {
    super(data);
    this.tagNumber = data.tagNumber ?? '';
    this.description = data.description ?? '';
    this.specificLocation = data.specificLocation ?? '';
    this.generalLocation = data.generalLocation ?? '';
    this.normalPosition = data.normalPosition ?? '';
    this.isolatedPosition = data.isolatedPosition ?? '';
    this.zeroEnergyMethod = data.zeroEnergyMethod ?? '';
    this.currentPosition = data.currentPosition?? '';
  }

  getFormFields(): FormField[] {
    return [
      { name: 'tagNumber', label: 'Tag Number', type: 'text', initialValue: this.tagNumber },
      { name: 'description', label: 'Description', type: 'textarea', initialValue: this.description },
      { name: 'specificLocation', label: 'Specific Location', type: 'text', initialValue: this.specificLocation },
      { name: 'generalLocation', label: 'General Location', type: 'text', initialValue: this.generalLocation },
      { name: 'normalPosition', label: 'Normal Position', type: 'text', initialValue: this.normalPosition },
      { name: 'isolatedPosition', label: 'Isolated Position', type: 'text', initialValue: this.isolatedPosition },
      { name: 'zeroEnergyMethod', label: 'Zero Energy Method', type: 'text', initialValue: this.zeroEnergyMethod },
      { name: 'currentPosition', label: 'Current Position', type: 'text', initialValue: this.currentPosition },
    ];
  }

  getTableColumns(): Column[] {
    return [
      { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
      { id: 'description', header: 'Description', accessorKey: 'description' },
      { id: 'specificLocation', header: 'Specific Location', accessorKey: 'specificLocation' },
      { id: 'generalLocation', header: 'General Location', accessorKey: 'generalLocation' },
      { id: 'normalPosition', header: 'Normal Position', accessorKey: 'normalPosition' },
      { id: 'isolatedPosition', header: 'Isolated Position', accessorKey: 'isolatedPosition' },
      { id: 'zeroEnergyMethod', header: 'Zero Energy Method', accessorKey: 'zeroEnergyMethod' },
      { id: 'currentPosition', header: 'Current Position', accessorKey: 'currentPosition' },
      {
        id: 'updatedAt',
        header: 'Last Updated',
        accessorFn: (item: ILotoPoint) => new Date(item.updatedAt).toLocaleDateString()
      },
    ];
  }
  static getTestData(): LotoPoint {
    return new LotoPoint({
      id: 1,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      tagNumber: 'ABC123',
      description: 'LOTO Point 1',
      specificLocation: 'Location 1',
      generalLocation: 'General Location 1',
      normalPosition: 'Normal Position 1',
      isolatedPosition: 'Isolated Position 1',
      zeroEnergyMethod: 'Zero Energy Method 1',
      currentPosition: 'Current Position 1',
    });
  }
}