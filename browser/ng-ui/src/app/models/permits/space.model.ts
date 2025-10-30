import { BaseModel, IBaseModel } from "./base.model";
import { Column } from "../inputs/column.model";
import { FormField } from "../inputs/form-field.model";
import { SpacePa } from "./space-pa.model";


export interface ISpace extends IBaseModel {
  sharepointId: number;
  space: string;
  co: number;
  oxygen: number;
  lel: number;
  h2s: number;
  nh3: number;
  testerName: string;
  lastStatusChange: string;
  meterSerialNumber: string;
}

export class Space extends BaseModel<ISpace> implements ISpace {
  sharepointId: number;
  space: string;
  co: number;
  oxygen: number;
  lel: number;
  h2s: number;
  nh3: number;
  testerName: string;
  lastStatusChange: string;
  meterSerialNumber: string;

  constructor(data: Partial<ISpace> = {}) {
    super(data);
    this.sharepointId = data.sharepointId ?? 0;
    this.space = data.space ?? '';
    this.co = data.co ?? 1000;
    this.oxygen = data.oxygen ?? 1000;
    this.lel = data.lel ?? 1000;
    this.h2s = data.h2s ?? 1000;
    this.nh3 = data.nh3 ?? 1000;
    this.testerName = data.testerName ?? '';
    this.lastStatusChange = data.lastStatusChange ?? '';
    this.meterSerialNumber = data.meterSerialNumber ?? '';
  }

  getFormFields(): FormField[] {
    return [
      { name: 'space', label: 'Space', type: 'text', initialValue: this.space },
      { name: 'co', label: 'CO', type: 'text', initialValue: this.co },
      { name: 'oxygen', label: 'Oxygen', type: 'text', initialValue: this.oxygen },
      { name: 'lel', label: 'LEL', type: 'text', initialValue: this.lel },
      { name: 'h2s', label: 'H2S', type: 'text', initialValue: this.h2s },
      { name: 'nh3', label: 'NH3', type: 'text', initialValue: this.nh3 },
      { name: 'testerName', label: 'Tester Name', type: 'text', initialValue: this.testerName },
      { name: 'meterSerialNumber', label: 'Meter Serial Number', type: 'text', initialValue: this.meterSerialNumber },
    ];
  }

  getTableColumns(): Column[] {
    return [
      { id: 'space', header: 'Space', accessorKey: 'space' },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        conditionalStyling: (item: ISpace) => this.getStyleByStatus(item.status)
      },
      { id: 'co', header: 'CO', accessorKey: 'co' },
      { id: 'oxygen', header: 'Oxygen', accessorKey: 'oxygen' },
      { id: 'lel', header: 'LEL', accessorKey: 'lel' },
      { id: 'h2s', header: 'H2S', accessorKey: 'h2s' },
      { id: 'nh3', header: 'NH3', accessorKey: 'nh3' },
      { id: 'testerName', header: 'Tester', accessorKey: 'testerName' },
      { id: 'meterSerialNumber', header: 'Meter S/N', accessorKey: 'meterSerialNumber' },
      {
        id: 'updatedAt',
        header: 'Last Updated',
        accessorFn: (item: ISpace) => new Date(item.updatedAt).toLocaleString()
      },
    ];
  }

  getStyleByStatus(status: string): { backgroundColor: string; color: string } {
    switch (status) {
      case 'safe':
        return { backgroundColor: '#4caf50', color: '#fff' };
      case 'caution':
        return { backgroundColor: '#ffeb3b', color: '#000' };
      case 'danger':
        return { backgroundColor: '#f44336', color: '#fff' };
      default:
        return { backgroundColor: '#f1f1f1', color: '#000' };
    }
  }

  convertToPaModel(): SpacePa {
    return new SpacePa({
      ID: this.sharepointId,
      Space: this.space,
      Status: this.status,
      Co: this.co,
      Oxygen: this.oxygen,
      Lel: this.lel,
      H2s: this.h2s,
      Nh3: this.nh3,
      TesterName: this.testerName,
      LastStatusChange: this.lastStatusChange,
      MeterSerialNumber: this.meterSerialNumber,
    });
  }
  
  convertToPaOutgoingModel() {
    return{
      Space: this.space,
      Status: this.status || 'Inactive'
    }
  }

  getEmailBody(): string {
    const paModel = this.convertToPaModel();
    const fieldLabels: { [key: string]: string } = {
      space: 'Space',
      status: 'Status',
      co: 'CO',
      oxygen: 'Oxygen',
      lel: 'LEL',
      h2s: 'H2S',
      nh3: 'NH3',
      testerName: 'Tester Name',
      lastStatusChange: 'Last Status Change',
      meterSerialNumber: 'Meter Serial Number'
    };

    let body = '';
    for (const key in paModel) {
      if (Object.prototype.hasOwnProperty.call(paModel, key)) {
        const label = fieldLabels[key] || key;
        const value = (paModel as any)[key];
        if (value) {
          body += `${label}: ${value}\n`;
        }
      }
    }
    return body;
  }
}