import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { RfFormField } from '../ui/form-field.model';

export interface FieldListItemModel extends BaseModel {
  title: string;
  notes: string;
  dateObserved: string;
  timeObserved: string;
  specificLocation: string;
  listTypeId: number | null;
  listTypeName: string;
  statusId: number | null;
  statusName: string;
  locationId: number | null;
  locationName: string;
  equipmentId: number | null;
  equipmentTag: string;
  lotoPointId: number | null;
  sharepointId: string;
  localUuid: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
}

export type FieldListItemFieldName = keyof FieldListItemModel;

export class FieldListItemDto extends BaseDto implements FieldListItemModel {
  title: string;
  notes: string;
  dateObserved: string;
  timeObserved: string;
  specificLocation: string;
  listTypeId: number | null;
  listTypeName: string;
  statusId: number | null;
  statusName: string;
  locationId: number | null;
  locationName: string;
  equipmentId: number | null;
  equipmentTag: string;
  lotoPointId: number | null;
  sharepointId: string;
  localUuid: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;

  constructor(data: Partial<FieldListItemModel> = {}) {
    super(data);
    this.title = data.title || '';
    this.notes = data.notes || '';
    this.dateObserved = data.dateObserved || '';
    this.timeObserved = data.timeObserved || '';
    this.specificLocation = data.specificLocation || '';
    this.listTypeId = data.listTypeId ?? null;
    this.listTypeName = data.listTypeName || '';
    this.statusId = data.statusId ?? null;
    this.statusName = data.statusName || '';
    this.locationId = data.locationId ?? null;
    this.locationName = data.locationName || '';
    this.equipmentId = data.equipmentId ?? null;
    this.equipmentTag = data.equipmentTag || '';
    this.lotoPointId = data.lotoPointId ?? null;
    this.sharepointId = data.sharepointId || '';
    this.localUuid = data.localUuid || '';
    this.submitterName = data.submitterName || '';
    this.submitterEmail = data.submitterEmail || '';
    this.submitterPhone = data.submitterPhone || '';
    this.createdBy = data.createdBy || '';
    this.dateCreated = data.dateCreated || '';
    this.dateModified = data.dateModified || '';
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      title: this.title,
      notes: this.notes,
      dateObserved: this.dateObserved,
      timeObserved: this.timeObserved,
      specificLocation: this.specificLocation,
      listTypeId: this.listTypeId,
      listTypeName: this.listTypeName,
      statusId: this.statusId,
      statusName: this.statusName,
      locationId: this.locationId,
      locationName: this.locationName,
      equipmentId: this.equipmentId,
      equipmentTag: this.equipmentTag,
      lotoPointId: this.lotoPointId,
      sharepointId: this.sharepointId,
      localUuid: this.localUuid,
      submitterName: this.submitterName,
      submitterEmail: this.submitterEmail,
      submitterPhone: this.submitterPhone,
    };
  }

  static override fromJson(json: any): FieldListItemDto {
    if (!json) return new FieldListItemDto();
    return new FieldListItemDto({
      id: json.id || 0,
      name: json.name || '',
      title: json.title || '',
      notes: json.notes || '',
      dateObserved: json.dateObserved || '',
      timeObserved: json.timeObserved || '',
      specificLocation: json.specificLocation || '',
      listTypeId: json.listTypeId ?? null,
      listTypeName: json.listTypeName || '',
      statusId: json.statusId ?? null,
      statusName: json.statusName || '',
      locationId: json.locationId ?? null,
      locationName: json.locationName || '',
      equipmentId: json.equipmentId ?? null,
      equipmentTag: json.equipmentTag || '',
      lotoPointId: json.lotoPointId ?? null,
      sharepointId: json.sharepointId || '',
      localUuid: json.localUuid || '',
      submitterName: json.submitterName || '',
      submitterEmail: json.submitterEmail || '',
      submitterPhone: json.submitterPhone || '',
      createdBy: json.createdBy || '',
      dateCreated: json.dateCreated || '',
      dateModified: json.dateModified || '',
    });
  }

  static toTableColumns(fields?: FieldListItemFieldName[]): Column[] {
    const allColumns: Column[] = [
      {
        id: 'listTypeName',
        header: 'List Type',
        accessorKey: 'listTypeName',
        conditionalStyling: (item: any, _col: Column): { [key: string]: string } => {
          if (item.listTypeName === 'Insulation Removal') return { 'background-color': 'var(--status-attention)', color: 'white' };
          if (item.listTypeName === 'Leaks') return { 'background-color': 'var(--status-error)', color: 'white' };
          if (item.listTypeName === 'Winterization') return { 'background-color': 'var(--status-info)', color: 'white' };
          return {} as { [key: string]: string };
        }
      },
      {
        id: 'statusName',
        header: 'Status',
        accessorKey: 'statusName',
        conditionalStyling: (item: any, _col: Column): { [key: string]: string } => {
          if (item.statusName === 'Open') return { 'background-color': 'var(--status-attention)', color: 'white' };
          if (item.statusName === 'In Progress') return { 'background-color': 'var(--status-info)', color: 'white' };
          if (item.statusName === 'Resolved') return { 'background-color': 'var(--status-complete)', color: 'white' };
          if (item.statusName === 'Closed') return { 'background-color': 'var(--status-neutral)', color: 'white' };
          return {} as { [key: string]: string };
        }
      },
      { id: 'title', header: 'Title', accessorKey: 'title' },
      {
        id: 'dateObserved',
        header: 'Date / Time',
        accessorFn: (item: any) => {
          const d = item.dateObserved || '';
          const t = item.timeObserved || '';
          return t ? `${d} ${t}` : d;
        }
      },
      { id: 'locationName', header: 'Location', accessorKey: 'locationName' },
      { id: 'specificLocation', header: 'Specific Location', accessorKey: 'specificLocation' },
      { id: 'equipmentTag', header: 'Equipment', accessorKey: 'equipmentTag' },
      { id: 'submitterName', header: 'Submitter', accessorKey: 'submitterName' },
      { id: 'notes', header: 'Notes', accessorKey: 'notes' },
      { id: 'createdBy', header: 'Created By', accessorKey: 'createdBy' },
      { id: 'dateCreated', header: 'Date Created', accessorKey: 'dateCreated' },
    ];

    if (fields && fields.length > 0) {
      return allColumns.filter(col => fields.includes(col.id as FieldListItemFieldName));
    }
    return allColumns;
  }

  static toFormFields(dto?: FieldListItemDto, fields?: FieldListItemFieldName[]): RfFormField[] {
    const d = dto || new FieldListItemDto();
    const allFields: RfFormField[] = [
      { name: 'listTypeName', label: 'List Type', type: 'text', initialValue: d.listTypeName },
      { name: 'statusName', label: 'Status', type: 'text', initialValue: d.statusName },
      { name: 'title', label: 'Title', type: 'text', initialValue: d.title },
      { name: 'notes', label: 'Notes', type: 'textarea', initialValue: d.notes },
      { name: 'dateObserved', label: 'Date Observed', type: 'date', initialValue: d.dateObserved },
      { name: 'timeObserved', label: 'Time Observed', type: 'time', initialValue: d.timeObserved },
      { name: 'locationName', label: 'Location', type: 'text', initialValue: d.locationName },
      { name: 'specificLocation', label: 'Specific Location', type: 'text', initialValue: d.specificLocation },
      { name: 'equipmentTag', label: 'Equipment / Loto Point Tag', type: 'text', initialValue: d.equipmentTag },
      { name: 'submitterName', label: 'Submitter Name', type: 'text', initialValue: d.submitterName },
      { name: 'submitterEmail', label: 'Submitter Email', type: 'text', initialValue: d.submitterEmail },
      { name: 'submitterPhone', label: 'Submitter Phone', type: 'text', initialValue: d.submitterPhone },
    ];

    if (fields && fields.length > 0) {
      return allFields.filter(f => fields.includes(f.name as FieldListItemFieldName));
    }
    return allFields;
  }
}
