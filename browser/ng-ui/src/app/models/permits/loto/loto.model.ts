import { IBaseModel, BaseModel } from "../base.model";
import { FormField } from "../../inputs/form-field.model";
import { Column } from "../../inputs/column.model";
import { LotoPoint } from "./loto-point.model";

export interface ILoto extends IBaseModel {
  lotoPoints: LotoPoint[];
  description: string;
}

export class Loto extends BaseModel<ILoto> implements ILoto {
  lotoPoints: LotoPoint[];
  description: string;

  constructor(data: Partial<ILoto> = {}) {
    super(data);
    this.description = data.description ?? '';
    this.lotoPoints = data.lotoPoints?.map(p => new LotoPoint(p)) ?? [];
  }

  getFormFields(): FormField[] {
    return [
      { name: 'description', label: 'Description', type: 'textarea', initialValue: this.description, placeholder: 'Describe the LOTO procedure' },
      {
        name: 'lotoPoints',
        label: 'LOTO Points',
        type: 'form-array',
        initialValue: this.lotoPoints,
        fields: new LotoPoint().getFormFields().map(({ initialValue, ...field }) => field) // Remove initialValue for sub-form
      }
    ];
  }

  getTableColumns(): Column[] {
    return [
      { id: 'description', header: 'Description', accessorKey: 'description' },
      {
        id: 'lotoPointsCount',
        header: 'LOTO Points',
        accessorFn: (item: ILoto) => item.lotoPoints.length+''
      },
      {
        id: 'updatedAt',
        header: 'Last Updated',
        accessorFn: (item: ILoto) => new Date(item.updatedAt).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'short', timeStyle: 'short' })
      },
    ];
  }

  static getTestData(): Loto {
    return new Loto({
      id: 1,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'Test LOTO',
      lotoPoints: LotoPoint.getTestDataArray()
    });
  }
}
