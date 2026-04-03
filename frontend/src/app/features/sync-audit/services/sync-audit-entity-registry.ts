import { Column } from '../../../models/column.model';

export interface SyncAuditEntityConfig {
  entityType: string;
  label: string;
  columns: Column[];
}

const SYNC_STATUS_COLUMNS: Column[] = [
  {
    id: '_syncLocal', header: 'Local', accessorKey: '_syncLocal', width: 60,
    accessorFn: (item: any) => item._syncLocal ? 'Yes' : 'No',
    conditionalStyling: (item: any) => item._syncLocal
      ? { 'color': '#81c784' }
      : { 'color': '#ef5350' },
  },
  {
    id: '_syncServer', header: 'Server', accessorKey: '_syncServer', width: 60,
    accessorFn: (item: any) => item._syncServer ? 'Yes' : 'No',
    conditionalStyling: (item: any) => item._syncServer
      ? { 'color': '#81c784' }
      : { 'color': '#ef5350' },
  },
  {
    id: '_syncStatus', header: 'Sync Status', accessorKey: '_syncStatus', width: 120,
    conditionalStyling: (item: any) => {
      switch (item._syncStatus) {
        case 'IN_SYNC': return { 'color': '#81c784' };
        case 'LOCAL_ONLY': return { 'color': '#64b5f6' };
        case 'SERVER_ONLY': return { 'color': '#ffb74d' };
        case 'STALE_LOCAL': return { 'color': '#ffb74d' };
        case 'STALE_SERVER': return { 'color': '#ce93d8' };
        default: return { 'color': '#999' };
      }
    },
  },
];

const DEFAULT_COLUMNS: Column[] = [
  { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
  { id: 'name', header: 'Name', accessorKey: 'name' },
  { id: 'dateCreated', header: 'Created', accessorKey: 'dateCreated', width: 160 },
  { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
];

const ENTITY_CONFIGS: SyncAuditEntityConfig[] = [
  {
    entityType: 'Equipment', label: 'Equipment',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
      { id: 'system', header: 'System', accessorKey: 'system' },
      { id: 'location', header: 'Location', accessorKey: 'location' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'LotoPoint', label: 'LOTO Points',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
      { id: 'system', header: 'System', accessorKey: 'system' },
      { id: 'isolationMethod', header: 'Isolation Method', accessorKey: 'isolationMethod' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'LotoStandard', label: 'LOTO Standards',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'description', header: 'Description', accessorKey: 'description' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'Loto', label: 'LOTO Permits',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'permitStatus', header: 'Status', accessorKey: 'permitStatus' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'SafeWork', label: 'Safe Works',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'date', header: 'Date', accessorKey: 'date' },
      { id: 'location', header: 'Location', accessorKey: 'location' },
      { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'HotWork', label: 'Hot Works',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'date', header: 'Date', accessorKey: 'date' },
      { id: 'location', header: 'Location', accessorKey: 'location' },
      { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'ConfinedSpace', label: 'Confined Spaces',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'date', header: 'Date', accessorKey: 'date' },
      { id: 'space', header: 'Space', accessorKey: 'space' },
      { id: 'workScope', header: 'Work Scope', accessorKey: 'workScope' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'WorkRequest', label: 'Work Requests',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'requestedBy', header: 'Requested By', accessorKey: 'requestedBy' },
      { id: 'company', header: 'Company', accessorKey: 'company' },
      { id: 'location', header: 'Location', accessorKey: 'location' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'Jha', label: 'JHAs',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'description', header: 'Description', accessorKey: 'description' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'DailyPermitPackage', label: 'Daily Permit Packages',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'date', header: 'Date', accessorKey: 'date' },
      { id: 'shift', header: 'Shift', accessorKey: 'shift' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'JobLog', label: 'Job Logs',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'FileObject', label: 'Files',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'extensions', header: 'Extensions', accessorKey: 'extensions' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'Instrument', label: 'Instruments',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'tagNumber', header: 'Tag Number', accessorKey: 'tagNumber' },
      { id: 'description', header: 'Description', accessorKey: 'description' },
      { id: 'currentStatus', header: 'Status', accessorKey: 'currentStatus' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'InstrumentLog', label: 'Instrument Logs',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'instrumentTagNumber', header: 'Tag Number', accessorKey: 'instrumentTagNumber' },
      { id: 'status', header: 'Status', accessorKey: 'status' },
      { id: 'date', header: 'Date', accessorKey: 'date' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'Category', label: 'Categories',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'Value', label: 'Values',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'User', label: 'Users',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'username', header: 'Username', accessorKey: 'username' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'EnergizedWorkPermit', label: 'Energized Work Permits',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'ExcavationPermit', label: 'Excavation Permits',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'VentingPermit', label: 'Venting Permits',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'permitNumber', header: 'Permit #', accessorKey: 'permitNumber' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'Comment', label: 'Comments',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'text', header: 'Text', accessorKey: 'text' },
      { id: 'entityType', header: 'Entity Type', accessorKey: 'entityType' },
      { id: 'entityId', header: 'Entity ID', accessorKey: 'entityId' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'EmailCorrespondence', label: 'Email Correspondence',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'subject', header: 'Subject', accessorKey: 'subject' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
  {
    entityType: 'Conversation', label: 'Conversations',
    columns: [
      { id: 'id', header: 'ID', accessorKey: 'id', width: 80 },
      { id: 'title', header: 'Title', accessorKey: 'title' },
      { id: 'dateModified', header: 'Modified', accessorKey: 'dateModified', width: 160 },
    ]
  },
];

const ENTITY_CONFIG_MAP = new Map<string, SyncAuditEntityConfig>(
  ENTITY_CONFIGS.map(c => [c.entityType, c])
);

export function getEntityConfig(entityType: string): SyncAuditEntityConfig {
  return ENTITY_CONFIG_MAP.get(entityType) ?? {
    entityType,
    label: entityType,
    columns: DEFAULT_COLUMNS,
  };
}

export function getEntityLabel(entityType: string): string {
  return ENTITY_CONFIG_MAP.get(entityType)?.label ?? entityType;
}

export function getEntityColumns(entityType: string): Column[] {
  const base = ENTITY_CONFIG_MAP.get(entityType)?.columns ?? DEFAULT_COLUMNS;
  return [...base, ...SYNC_STATUS_COLUMNS];
}
