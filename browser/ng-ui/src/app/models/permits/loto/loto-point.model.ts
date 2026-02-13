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
      { name: 'tagNumber', label: 'Tag Number', type: 'text', initialValue: this.tagNumber, placeholder: 'e.g. LOTO-001' },
      { name: 'description', label: 'Description', type: 'textarea', initialValue: this.description, placeholder: 'e.g. Main Power Breaker for Unit 1' },
      { name: 'specificLocation', label: 'Specific Location', type: 'text', initialValue: this.specificLocation, placeholder: 'e.g. MCC-A, Cubicle 3' },
      { name: 'generalLocation', label: 'General Location', type: 'text', initialValue: this.generalLocation, placeholder: 'e.g. Turbine Hall' },
      { name: 'normalPosition', label: 'Normal Position', type: 'text', initialValue: this.normalPosition, placeholder: 'e.g. Closed' },
      { name: 'isolatedPosition', label: 'Isolated Position', type: 'text', initialValue: this.isolatedPosition, placeholder: 'e.g. Open' },
      { name: 'zeroEnergyMethod', label: 'Zero Energy Method', type: 'text', initialValue: this.zeroEnergyMethod, placeholder: 'e.g. Lockout/Tagout' },
      { name: 'currentPosition', label: 'Current Position', type: 'text', initialValue: this.currentPosition, placeholder: 'e.g. Open' },
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
        accessorFn: (item: ILotoPoint) => new Date(item.updatedAt).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'short', timeStyle: 'short' })
      },
    ];
  }

  static getTestDataArray(): LotoPoint[] {
    return [
      new LotoPoint({
        id: 1,
        status: 'active',
        createdAt: new Date('2023-10-01T10:00:00Z'),
        updatedAt: new Date('2023-10-10T12:30:00Z'),
        tagNumber: 'LOTO-001',
        description: 'Main Power Breaker for Unit 1',
        specificLocation: 'MCC-A, Cubicle 3',
        generalLocation: 'Turbine Hall',
        normalPosition: 'Closed',
        isolatedPosition: 'Open',
        zeroEnergyMethod: 'Lockout/Tagout',
        currentPosition: 'Open',
      }),
      new LotoPoint({
        id: 2,
        status: 'active',
        createdAt: new Date('2023-11-05T08:00:00Z'),
        updatedAt: new Date('2023-11-15T14:00:00Z'),
        tagNumber: 'LOTO-002',
        description: 'Steam Inlet Valve SV-101',
        specificLocation: 'Boiler Feedwater Pump Area',
        generalLocation: 'Boiler House',
        normalPosition: 'Open',
        isolatedPosition: 'Closed',
        zeroEnergyMethod: 'Chain and Lock',
        currentPosition: 'Closed',
      }),
      new LotoPoint({
        id: 3,
        status: 'pending',
        createdAt: new Date('2024-01-20T09:30:00Z'),
        updatedAt: new Date('2024-01-20T09:30:00Z'),
        tagNumber: 'LOTO-003',
        description: 'Cooling Tower Fan Motor',
        specificLocation: 'Cooling Tower 2, Motor B',
        generalLocation: 'Switchyard',
        normalPosition: 'Running',
        isolatedPosition: 'Off',
        zeroEnergyMethod: 'Breaker Lockout',
        currentPosition: 'Off',
      }),
    ];
  }
  static getTestData(): LotoPoint {
    const randomId = Math.floor(Math.random() * 1000) + 1;
    const statuses = ['active', 'inactive', 'pending'];
    const positions = ['Open', 'Closed', 'Tripped'];
    const methods = ['Lockout', 'Tagout', 'Block', 'Vent'];
    const buildings = ['Turbine Hall', 'Boiler House', 'Control Room', 'Switchyard'];

    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomTag = `TAG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];

    const now = new Date();
    const randomPastDate = new Date(now.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 30); // within last 30 days

    return new LotoPoint({
      id: randomId,
      status: randomStatus,
      createdAt: randomPastDate,
      updatedAt: new Date(randomPastDate.getTime() + Math.random() * (now.getTime() - randomPastDate.getTime())),
      tagNumber: randomTag,
      description: `Isolate pump P-${randomId}`,
      specificLocation: `Panel ${randomId}, Breaker ${Math.floor(Math.random() * 20)}`,
      generalLocation: randomBuilding,
      normalPosition: positions[Math.floor(Math.random() * positions.length)],
      isolatedPosition: positions[Math.floor(Math.random() * positions.length)],
      zeroEnergyMethod: methods[Math.floor(Math.random() * methods.length)],
      currentPosition: positions[Math.floor(Math.random() * positions.length)],
    });
  }
}
