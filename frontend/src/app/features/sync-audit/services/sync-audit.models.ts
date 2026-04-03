export interface SyncAuditEntityType {
  entityType: string;
  localCount: number;
  changeCount: number;
}

export interface FieldChangeEntry {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  originMachineId: string;
  originMachineName: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  relationshipType: string | null;
}

export interface FieldDiffEntry {
  fieldName: string;
  localValue: string | null;
  serverValue: string | null;
}

export interface SyncAuditComparison {
  entityType: string;
  entityId: number;
  localEntity: Record<string, string>;
  serverEntity: Record<string, string>;
  localChanges: FieldChangeEntry[];
  serverChanges: FieldChangeEntry[];
  diffs: FieldDiffEntry[];
  localExists: boolean;
  serverExists: boolean;
  serverReachable: boolean;
}
