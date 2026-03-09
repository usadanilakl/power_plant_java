import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { FormField } from '../ui/form-field.model';
import { Validators } from '@angular/forms';

export type InstrumentFieldName = keyof InstrumentModel;

export interface InstrumentModel extends BaseModel {
  tagNumber: string | null;
  description: string | null;
  vendor: string | null;
  location: string | null;
  type: string | null;
  currentStatus: string | null;
  lastUpdatedDate: string | null;
  lastUpdatedTime: string | null;
  lastUpdatedBy: string | null;
  lastComment: string | null;
  sharepointId: string | null;
  localUuid: string | null;
}

export class InstrumentDto extends BaseDto implements InstrumentModel {
  tagNumber: string | null;
  description: string | null;
  vendor: string | null;
  location: string | null;
  type: string | null;
  currentStatus: string | null;
  lastUpdatedDate: string | null;
  lastUpdatedTime: string | null;
  lastUpdatedBy: string | null;
  lastComment: string | null;
  sharepointId: string | null;
  localUuid: string | null;

  constructor(data: Partial<InstrumentModel> = {}) {
    super(data);
    this.tagNumber = data.tagNumber ?? null;
    this.description = data.description ?? null;
    this.vendor = data.vendor ?? null;
    this.location = data.location ?? null;
    this.type = data.type ?? null;
    this.currentStatus = data.currentStatus ?? null;
    this.lastUpdatedDate = data.lastUpdatedDate ?? null;
    this.lastUpdatedTime = data.lastUpdatedTime ?? null;
    this.lastUpdatedBy = data.lastUpdatedBy ?? null;
    this.lastComment = data.lastComment ?? null;
    this.sharepointId = data.sharepointId ?? null;
    this.localUuid = data.localUuid ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      tagNumber: this.tagNumber,
      description: this.description,
      vendor: this.vendor,
      location: this.location,
      type: this.type,
      currentStatus: this.currentStatus,
      lastUpdatedDate: this.lastUpdatedDate,
      lastUpdatedTime: this.lastUpdatedTime,
      lastUpdatedBy: this.lastUpdatedBy,
      lastComment: this.lastComment,
      sharepointId: this.sharepointId,
      localUuid: this.localUuid,
    };
  }

  static override fromJson(json: any): InstrumentDto {
    return new InstrumentDto({
      ...super.fromJson(json),
      tagNumber: json.tagNumber || null,
      description: json.description || null,
      vendor: json.vendor || null,
      location: json.location || null,
      type: json.type || null,
      currentStatus: json.currentStatus || null,
      lastUpdatedDate: json.lastUpdatedDate || null,
      lastUpdatedTime: json.lastUpdatedTime || null,
      lastUpdatedBy: json.lastUpdatedBy || null,
      lastComment: json.lastComment || null,
      sharepointId: json.sharepointId || null,
      localUuid: json.localUuid || null,
    });
  }

  static toFormFields(): FormField[] {
    return [
      { name: 'tagNumber', label: 'Tag Number', type: 'text', validators: [Validators.required] },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'vendor', label: 'Vendor', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'type', label: 'Type', type: 'text' },
    ];
  }

  static toTableColumns(fields: InstrumentFieldName[] = ['tagNumber', 'description', 'currentStatus', 'lastUpdatedDate', 'lastUpdatedBy', 'location', 'type']): Column[] {
    const allColumns: { [key in InstrumentFieldName]: Column } = {
      id: { id: 'id', header: 'ID', accessorKey: 'id' },
      tagNumber: { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
      description: { id: 'description', header: 'Description', accessorKey: 'description' },
      vendor: { id: 'vendor', header: 'Vendor', accessorKey: 'vendor' },
      location: { id: 'location', header: 'Location', accessorKey: 'location' },
      type: { id: 'type', header: 'Type', accessorKey: 'type' },
      currentStatus: {
        id: 'currentStatus',
        header: 'Status',
        accessorKey: 'currentStatus',
        conditionalStyling: (item: any, column: Column) => {
          if (item.currentStatus === 'Normal Operation') return { 'background-color': 'var(--status-complete)', 'color': 'var(--primary-text)' };
          if (item.currentStatus === 'In Progress') return { 'background-color': 'var(--status-attention)', 'color': 'var(--primary-text)' };
          if (item.currentStatus === 'Disconnected/Removed') return { 'background-color': 'var(--status-not-processed)', 'color': 'var(--primary-text)' };
          return { 'background-color': '', 'color': '' };
        }
      },
      lastUpdatedDate: { id: 'lastUpdatedDate', header: 'Last Updated', accessorKey: 'lastUpdatedDate' },
      lastUpdatedTime: { id: 'lastUpdatedTime', header: 'Time', accessorKey: 'lastUpdatedTime' },
      lastUpdatedBy: { id: 'lastUpdatedBy', header: 'Updated By', accessorKey: 'lastUpdatedBy' },
      lastComment: { id: 'lastComment', header: 'Last Comment', accessorKey: 'lastComment' },
      sharepointId: { id: 'sharepointId', header: 'SP ID', accessorKey: 'sharepointId' },
      localUuid: { id: 'localUuid', header: 'UUID', accessorKey: 'localUuid' },
      name: { id: 'name', header: 'Name', accessorKey: 'name' },
      objectType: { id: 'objectType', header: 'Object Type', accessorKey: 'objectType' },
      isVerified: { id: 'isVerified', header: 'Verified', accessorKey: 'isVerified' },
    };
    return fields.map(fieldName => allColumns[fieldName]);
  }
}
