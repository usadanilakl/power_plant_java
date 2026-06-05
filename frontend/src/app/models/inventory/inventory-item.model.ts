import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { RfFormField } from '../ui/form-field.model';

export interface InventoryItemModel extends BaseModel {
  title: string;
  description: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  itemTypeId: number | null;
  itemTypeName: string;
  statusId: number | null;
  statusName: string;
  locationId: number | null;
  locationName: string;
  qrToken: string;
  currentLocation: string;
  currentHolderName: string;
  currentHolderEmail: string;
  lastCheckedOutAt: string;
  sharepointId: string;
  localUuid: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
  attachmentCount: number;
  usageCount: number;
}

export type InventoryItemFieldName = keyof InventoryItemModel;

export class InventoryItemDto extends BaseDto implements InventoryItemModel {
  title: string;
  description: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  itemTypeId: number | null;
  itemTypeName: string;
  statusId: number | null;
  statusName: string;
  locationId: number | null;
  locationName: string;
  qrToken: string;
  currentLocation: string;
  currentHolderName: string;
  currentHolderEmail: string;
  lastCheckedOutAt: string;
  sharepointId: string;
  localUuid: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
  attachmentCount: number;
  usageCount: number;

  constructor(data: Partial<InventoryItemModel> = {}) {
    super(data);
    this.title = data.title || '';
    this.description = data.description || '';
    this.serialNumber = data.serialNumber || '';
    this.manufacturer = data.manufacturer || '';
    this.model = data.model || '';
    this.itemTypeId = data.itemTypeId ?? null;
    this.itemTypeName = data.itemTypeName || '';
    this.statusId = data.statusId ?? null;
    this.statusName = data.statusName || '';
    this.locationId = data.locationId ?? null;
    this.locationName = data.locationName || '';
    this.qrToken = data.qrToken || '';
    this.currentLocation = data.currentLocation || '';
    this.currentHolderName = data.currentHolderName || '';
    this.currentHolderEmail = data.currentHolderEmail || '';
    this.lastCheckedOutAt = data.lastCheckedOutAt || '';
    this.sharepointId = data.sharepointId || '';
    this.localUuid = data.localUuid || '';
    this.submitterName = data.submitterName || '';
    this.submitterEmail = data.submitterEmail || '';
    this.submitterPhone = data.submitterPhone || '';
    this.createdBy = data.createdBy || '';
    this.dateCreated = data.dateCreated || '';
    this.dateModified = data.dateModified || '';
    this.attachmentCount = data.attachmentCount || 0;
    this.usageCount = data.usageCount || 0;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      title: this.title,
      description: this.description,
      serialNumber: this.serialNumber,
      manufacturer: this.manufacturer,
      model: this.model,
      itemTypeId: this.itemTypeId,
      itemTypeName: this.itemTypeName,
      statusId: this.statusId,
      statusName: this.statusName,
      locationId: this.locationId,
      locationName: this.locationName,
      qrToken: this.qrToken,
      currentLocation: this.currentLocation,
      currentHolderName: this.currentHolderName,
      currentHolderEmail: this.currentHolderEmail,
      sharepointId: this.sharepointId,
      localUuid: this.localUuid,
      submitterName: this.submitterName,
      submitterEmail: this.submitterEmail,
      submitterPhone: this.submitterPhone,
    };
  }

  static override fromJson(json: any): InventoryItemDto {
    if (!json) return new InventoryItemDto();
    return new InventoryItemDto({
      id: json.id || 0,
      name: json.name || '',
      title: json.title || '',
      description: json.description || '',
      serialNumber: json.serialNumber || '',
      manufacturer: json.manufacturer || '',
      model: json.model || '',
      itemTypeId: json.itemTypeId ?? null,
      itemTypeName: json.itemTypeName || '',
      statusId: json.statusId ?? null,
      statusName: json.statusName || '',
      locationId: json.locationId ?? null,
      locationName: json.locationName || '',
      qrToken: json.qrToken || '',
      currentLocation: json.currentLocation || '',
      currentHolderName: json.currentHolderName || '',
      currentHolderEmail: json.currentHolderEmail || '',
      lastCheckedOutAt: json.lastCheckedOutAt || '',
      sharepointId: json.sharepointId || '',
      localUuid: json.localUuid || '',
      submitterName: json.submitterName || '',
      submitterEmail: json.submitterEmail || '',
      submitterPhone: json.submitterPhone || '',
      createdBy: json.createdBy || '',
      dateCreated: json.dateCreated || '',
      dateModified: json.dateModified || '',
      attachmentCount: json.attachmentCount || 0,
      usageCount: json.usageCount || 0,
    });
  }

  static toTableColumns(fields?: InventoryItemFieldName[]): Column[] {
    const allColumns: Column[] = [
      {
        id: 'itemTypeName',
        header: 'Type',
        accessorKey: 'itemTypeName',
      },
      {
        id: 'statusName',
        header: 'Status',
        accessorKey: 'statusName',
        conditionalStyling: (item: any, _col: Column): { [key: string]: string } => {
          if (item.statusName === 'Available') return { 'background-color': 'var(--status-complete)', color: 'var(--primary-text)' };
          if (item.statusName === 'Checked Out') return { 'background-color': 'var(--status-in-progress)', color: 'var(--primary-text)' };
          if (item.statusName === 'Missing') return { 'background-color': 'var(--status-attention)', color: 'var(--primary-text)' };
          if (item.statusName === 'Retired') return { 'background-color': 'var(--status-not-processed)', color: 'var(--primary-text)' };
          return {} as { [key: string]: string };
        }
      },
      { id: 'title', header: 'Name', accessorKey: 'title' },
      { id: 'serialNumber', header: 'Serial #', accessorKey: 'serialNumber' },
      { id: 'manufacturer', header: 'Manufacturer', accessorKey: 'manufacturer' },
      { id: 'model', header: 'Model', accessorKey: 'model' },
      { id: 'currentHolderName', header: 'Held By', accessorKey: 'currentHolderName' },
      { id: 'currentLocation', header: 'Current Location', accessorKey: 'currentLocation' },
      { id: 'locationName', header: 'Home Location', accessorKey: 'locationName' },
      { id: 'qrToken', header: 'QR', accessorKey: 'qrToken' },
      {
        id: 'attachmentCount',
        header: 'Files',
        accessorFn: (item: any) => item.attachmentCount > 0 ? `\u{1F4CE} ${item.attachmentCount}` : ''
      },
      {
        id: 'usageCount',
        header: 'Uses',
        accessorFn: (item: any) => item.usageCount > 0 ? String(item.usageCount) : ''
      },
      { id: 'createdBy', header: 'Created By', accessorKey: 'createdBy' },
      { id: 'dateCreated', header: 'Date Created', accessorKey: 'dateCreated' },
    ];

    if (fields && fields.length > 0) {
      return allColumns.filter(col => fields.includes(col.id as InventoryItemFieldName));
    }
    return allColumns;
  }

  static toFormFields(
    dto?: InventoryItemDto,
    fields?: InventoryItemFieldName[],
    options?: { typeOptions?: { value: any; label: string }[]; statusOptions?: { value: any; label: string }[] }
  ): RfFormField[] {
    const d = dto || new InventoryItemDto();
    const typeOptions = options?.typeOptions ?? [];
    const statusOptions = options?.statusOptions ?? [];
    const allFields: RfFormField[] = [
      typeOptions.length > 0
        ? { name: 'itemTypeName', label: 'Type', type: 'select', options: typeOptions, initialValue: d.itemTypeName }
        : { name: 'itemTypeName', label: 'Type', type: 'text', initialValue: d.itemTypeName },
      statusOptions.length > 0
        ? { name: 'statusName', label: 'Status', type: 'select', options: statusOptions, initialValue: d.statusName }
        : { name: 'statusName', label: 'Status', type: 'text', initialValue: d.statusName },
      { name: 'title', label: 'Name', type: 'text', initialValue: d.title },
      { name: 'description', label: 'Description', type: 'textarea', initialValue: d.description },
      { name: 'serialNumber', label: 'Serial Number', type: 'text', initialValue: d.serialNumber },
      { name: 'manufacturer', label: 'Manufacturer', type: 'text', initialValue: d.manufacturer },
      { name: 'model', label: 'Model', type: 'text', initialValue: d.model },
      { name: 'locationName', label: 'Home Location', type: 'text', initialValue: d.locationName },
      { name: 'currentLocation', label: 'Current Location', type: 'text', initialValue: d.currentLocation },
      { name: 'submitterName', label: 'Submitter Name', type: 'text', initialValue: d.submitterName },
      { name: 'submitterEmail', label: 'Submitter Email', type: 'text', initialValue: d.submitterEmail },
      { name: 'submitterPhone', label: 'Submitter Phone', type: 'text', initialValue: d.submitterPhone },
    ];

    if (fields && fields.length > 0) {
      return allFields.filter(f => fields.includes(f.name as InventoryItemFieldName));
    }
    return allFields;
  }
}
