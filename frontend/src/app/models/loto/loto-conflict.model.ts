import { LotoPointDto } from './loto-point.model';

export type ConflictType =
  | 'DUPLICATE_TAG'
  | 'NO_EQUIPMENT'
  | 'NO_ZERO_ENERGY'
  | 'NO_CHARACTERISTICS'
  | 'MISSING_COUNTERPART';

export interface ConflictSummary {
  duplicateTagCount: number;
  noEquipmentCount: number;
  noZeroEnergyCount: number;
  noCharacteristicsCount: number;
  missingCounterpartCount: number;
  totalConflictCount: number;
}

export interface DuplicateGroup {
  normalizedTag: string;
  points: LotoPointDto[];
}

export interface MergeRequest {
  keepId: number;
  removeId?: number;
  removeIds?: number[];
}

export interface ConflictSearchRequest {
  conflictType: ConflictType;
  groupBy?: string;
  page: number;
  pageSize: number;
}

export const CONFLICT_TYPE_LABELS: Record<ConflictType, string> = {
  DUPLICATE_TAG: 'Duplicate Tags',
  NO_EQUIPMENT: 'No Equipment',
  NO_ZERO_ENERGY: 'No Zero Energy',
  NO_CHARACTERISTICS: 'No Characteristics',
  MISSING_COUNTERPART: 'Missing Counterpart',
};

export const CONFLICT_TYPE_ICONS: Record<ConflictType, string> = {
  DUPLICATE_TAG: 'content_copy',
  NO_EQUIPMENT: 'link_off',
  NO_ZERO_ENERGY: 'flash_off',
  NO_CHARACTERISTICS: 'info_outline',
  MISSING_COUNTERPART: 'compare_arrows',
};
