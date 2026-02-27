
import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { FormField } from '../ui/form-field.model';
import { WorkAreaDto } from './work-area.model';

export type VentingPermitFieldName = keyof VentingPermitModel;

export interface VentingPermitModel extends BaseModel {
  date: string | null;
  time: string | null;
  location: string | null;
  issuedTo: string | null;
  workScope: string | null;
  redTagNum: string | null;
  permitNumber: string | null;
  workArea: WorkAreaDto | null;
}

export class VentingPermitDto extends BaseDto implements VentingPermitModel {
  date: string | null;
  time: string | null;
  location: string | null;
  issuedTo: string | null;
  workScope: string | null;
  redTagNum: string | null;
  permitNumber: string | null;
  workArea: WorkAreaDto | null;

  constructor(data: Partial<VentingPermitModel> = {}) {
    super(data);
    this.date = data.date ?? null;
    this.time = data.time ?? null;
    this.location = data.location ?? null;
    this.issuedTo = data.issuedTo ?? null;
    this.workScope = data.workScope ?? null;
    this.redTagNum = data.redTagNum ?? null;
    this.permitNumber = data.permitNumber ?? null;
    this.workArea = data.workArea ? new WorkAreaDto(data.workArea) : null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      date: this.date,
      time: this.time,
      location: this.location,
      issuedTo: this.issuedTo,
      workScope: this.workScope,
      redTagNum: this.redTagNum,
      permitNumber: this.permitNumber,
      workArea: this.workArea,
    };
  }

  static override fromJson(json: any): VentingPermitDto {
    if (!json) return new VentingPermitDto();
    return new VentingPermitDto({
      ...super.fromJson(json),
      date: json.date,
      time: json.time,
      location: json.location,
      issuedTo: json.issuedTo,
      workScope: json.workScope,
      redTagNum: json.redTagNum,
      permitNumber: json.permitNumber,
      workArea: json.workArea ? WorkAreaDto.fromJson(json.workArea) : null,
    });
  }

  static toFormFields(
    fields: VentingPermitFieldName[] = ['date', 'time', 'location', 'issuedTo', 'workScope']
  ): FormField[] {
    const allFields: { [key in VentingPermitFieldName]?: FormField } = {
      date: { name: 'date', label: 'Date', type: 'date' },
      time: { name: 'time', label: 'Time', type: 'time' },
      location: { name: 'location', label: 'Location', type: 'text' },
      issuedTo: { name: 'issuedTo', label: 'Issued To', type: 'text' },
      workScope: { name: 'workScope', label: 'Work Scope', type: 'textarea' },
      redTagNum: { name: 'redTagNum', label: 'Red Tag #', type: 'text' },
      permitNumber: { name: 'permitNumber', label: 'Permit Number', type: 'text', readonly: true },
    };
    return fields.map(f => allFields[f]).filter((f): f is FormField => f !== undefined);
  }

  static toTableColumns(
    fields: VentingPermitFieldName[] = ['id', 'permitNumber', 'date', 'location', 'issuedTo', 'workScope']
  ): Column[] {
    const allColumns: { [key in VentingPermitFieldName]?: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      date: { id: 'date', header: 'Date', accessorKey: 'date' },
      time: { id: 'time', header: 'Time', accessorKey: 'time' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      issuedTo: { id: 'issuedTo', header: 'Issued To', accessorKey: 'issuedTo' },
      workScope: { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      permitNumber: { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
    };
    return fields.map(f => allColumns[f]).filter((c): c is Column => c !== undefined);
  }

  static isValidKey(key: string): key is keyof VentingPermitModel {
    return ['id', 'name', 'objectType', 'isVerified', 'date', 'time', 'location',
      'issuedTo', 'workScope', 'redTagNum', 'permitNumber', 'workArea'].includes(key);
  }
}
