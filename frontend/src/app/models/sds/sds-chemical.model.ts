import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { RfFormField } from '../ui/form-field.model';

export interface SdsChemicalModel extends BaseModel {
  names: string;
  primaryName: string;
  locations: string;
  statusId: number | null;
  statusName: string;
  bookNumber: number | null;
  sectionNumber: number | null;
  notes: string;
  processedByName: string;
  processedByEmail: string;
  processedAt: string;
  lastAuditedAt: string;
  sharepointId: string;
  localUuid: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
  attachmentCount: number;
}

export type SdsChemicalFieldName = keyof SdsChemicalModel;

export class SdsChemicalDto extends BaseDto implements SdsChemicalModel {
  names: string;
  primaryName: string;
  locations: string;
  statusId: number | null;
  statusName: string;
  bookNumber: number | null;
  sectionNumber: number | null;
  notes: string;
  processedByName: string;
  processedByEmail: string;
  processedAt: string;
  lastAuditedAt: string;
  sharepointId: string;
  localUuid: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
  attachmentCount: number;

  constructor(data: Partial<SdsChemicalModel> = {}) {
    super(data);
    this.names = data.names || '';
    this.primaryName = data.primaryName || '';
    this.locations = data.locations || '';
    this.statusId = data.statusId ?? null;
    this.statusName = data.statusName || '';
    this.bookNumber = data.bookNumber ?? null;
    this.sectionNumber = data.sectionNumber ?? null;
    this.notes = data.notes || '';
    this.processedByName = data.processedByName || '';
    this.processedByEmail = data.processedByEmail || '';
    this.processedAt = data.processedAt || '';
    this.lastAuditedAt = data.lastAuditedAt || '';
    this.sharepointId = data.sharepointId || '';
    this.localUuid = data.localUuid || '';
    this.submitterName = data.submitterName || '';
    this.submitterEmail = data.submitterEmail || '';
    this.submitterPhone = data.submitterPhone || '';
    this.createdBy = data.createdBy || '';
    this.dateCreated = data.dateCreated || '';
    this.dateModified = data.dateModified || '';
    this.attachmentCount = data.attachmentCount || 0;
  }

  /** "Book 1 / #23" or '' when not yet filed. */
  get address(): string {
    if (this.bookNumber == null && this.sectionNumber == null) return '';
    const book = this.bookNumber != null ? `Book ${this.bookNumber}` : 'Book —';
    const idx = this.sectionNumber != null ? `#${this.sectionNumber}` : '#—';
    return `${book} / ${idx}`;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      names: this.names,
      locations: this.locations,
      statusId: this.statusId,
      statusName: this.statusName,
      bookNumber: this.bookNumber,
      sectionNumber: this.sectionNumber,
      notes: this.notes,
      processedByName: this.processedByName,
      processedByEmail: this.processedByEmail,
      sharepointId: this.sharepointId,
      localUuid: this.localUuid,
      submitterName: this.submitterName,
      submitterEmail: this.submitterEmail,
      submitterPhone: this.submitterPhone,
    };
  }

  static override fromJson(json: any): SdsChemicalDto {
    if (!json) return new SdsChemicalDto();
    return new SdsChemicalDto({
      id: json.id || 0,
      name: json.name || '',
      names: json.names || '',
      primaryName: json.primaryName || '',
      locations: json.locations || '',
      statusId: json.statusId ?? null,
      statusName: json.statusName || '',
      bookNumber: json.bookNumber ?? null,
      sectionNumber: json.sectionNumber ?? null,
      notes: json.notes || '',
      processedByName: json.processedByName || '',
      processedByEmail: json.processedByEmail || '',
      processedAt: json.processedAt || '',
      lastAuditedAt: json.lastAuditedAt || '',
      sharepointId: json.sharepointId || '',
      localUuid: json.localUuid || '',
      submitterName: json.submitterName || '',
      submitterEmail: json.submitterEmail || '',
      submitterPhone: json.submitterPhone || '',
      createdBy: json.createdBy || '',
      dateCreated: json.dateCreated || '',
      dateModified: json.dateModified || '',
      attachmentCount: json.attachmentCount || 0,
    });
  }

  static toTableColumns(fields?: SdsChemicalFieldName[]): Column[] {
    const allColumns: Column[] = [
      {
        id: 'statusName',
        header: 'Status',
        accessorKey: 'statusName',
        conditionalStyling: (item: any, _col: Column): { [key: string]: string } => {
          if (item.statusName === 'Incoming') return { 'background-color': 'var(--status-incomplete)', color: 'var(--primary-text)' };
          if (item.statusName === 'Pending') return { 'background-color': 'var(--status-in-progress)', color: 'var(--primary-text)' };
          if (item.statusName === 'Filed') return { 'background-color': 'var(--status-complete)', color: 'var(--primary-text)' };
          if (item.statusName === 'Removed') return { 'background-color': 'var(--status-not-processed)', color: 'var(--primary-text)' };
          return {} as { [key: string]: string };
        }
      },
      { id: 'primaryName', header: 'Chemical', accessorKey: 'primaryName' },
      {
        id: 'address',
        header: 'Book / Section',
        accessorFn: (item: any) => {
          if (item.bookNumber == null && item.sectionNumber == null) return '';
          const book = item.bookNumber != null ? `Book ${item.bookNumber}` : 'Book —';
          const idx = item.sectionNumber != null ? `#${item.sectionNumber}` : '#—';
          return `${book} / ${idx}`;
        }
      },
      {
        id: 'locations',
        header: 'Locations',
        accessorFn: (item: any) => (item.locations || '').split(/\r?\n/).filter(Boolean).join(', ')
      },
      {
        id: 'attachmentCount',
        header: 'Files',
        accessorFn: (item: any) => item.attachmentCount > 0 ? `\u{1F4CE} ${item.attachmentCount}` : ''
      },
      { id: 'processedByName', header: 'Processed By', accessorKey: 'processedByName' },
      { id: 'createdBy', header: 'Created By', accessorKey: 'createdBy' },
      { id: 'dateCreated', header: 'Date Created', accessorKey: 'dateCreated' },
    ];

    if (fields && fields.length > 0) {
      return allColumns.filter(col => fields.includes(col.id as SdsChemicalFieldName));
    }
    return allColumns;
  }

  static toFormFields(dto?: SdsChemicalDto, fields?: SdsChemicalFieldName[]): RfFormField[] {
    const d = dto || new SdsChemicalDto();
    const allFields: RfFormField[] = [
      { name: 'names', label: 'Chemical Names / Aliases (one per line)', type: 'textarea', initialValue: d.names },
      { name: 'locations', label: 'Storage Locations (one per line)', type: 'textarea', initialValue: d.locations },
      { name: 'bookNumber', label: 'Book', type: 'number', initialValue: d.bookNumber },
      { name: 'sectionNumber', label: 'Section', type: 'number', initialValue: d.sectionNumber },
      { name: 'notes', label: 'Notes', type: 'textarea', initialValue: d.notes },
      { name: 'processedByName', label: 'Processed By', type: 'text', initialValue: d.processedByName },
      { name: 'processedByEmail', label: 'Processed By Email', type: 'text', initialValue: d.processedByEmail },
      { name: 'submitterName', label: 'Submitter Name', type: 'text', initialValue: d.submitterName },
      { name: 'submitterEmail', label: 'Submitter Email', type: 'text', initialValue: d.submitterEmail },
      { name: 'submitterPhone', label: 'Submitter Phone', type: 'text', initialValue: d.submitterPhone },
    ];

    if (fields && fields.length > 0) {
      return allFields.filter(f => fields.includes(f.name as SdsChemicalFieldName));
    }
    return allFields;
  }
}
