import { RfCategoryDto, RfValueDto } from './rf-value.model';

export interface CategoryWithCountDto {
  id: number;
  name: string;
  alias: string;
  valueCount: number;
}

export interface DuplicateCategoryDto {
  name: string;
  categories: RfCategoryDto[];
}

export interface DuplicateValueDto {
  name: string;
  categoryName: string;
  categoryId: number;
  values: RfValueDto[];
}

export interface ValueWithDependenciesDto {
  value: RfValueDto;
  equipmentCount: number;
  fileCount: number;
  lotoPointCount: number;
  equipmentSamples: string[];
  fileSamples: string[];
}

export interface MergeRequest {
  keepId: number;
  duplicateIds: number[];
}

export interface CategoryCreateRequest {
  name: string;
  alias?: string;
}

export interface CategoryUpdateRequest {
  name?: string;
  alias?: string;
}

export interface ValueCreateRequest {
  categoryId: number;
  name: string;
  alias?: string;
}

export interface ValueUpdateRequest {
  name: string;
  alias?: string;
}

export interface ValueMoveRequest {
  valueId: number;
  targetCategoryId: number;
}

// ── Cross-category orphan dedup ────────────────────────────────────────────
//
// An "orphan" Value shares a name with a canonical Value inside a target
// Category, but lives outside that Category (uncategorized or in a different
// one). Entities still point at the orphan via ManyToOne FKs, which is why
// dropdowns appear empty — the loader only returns Values inside the matched
// Category. The dedup tool merges orphans into the canonical via the existing
// `mergeValues` primitive.

export interface OrphanValueDto {
  orphan: RfValueDto;
  canonical: RfValueDto;
  referenceCount: number;
}

export interface DedupOperationDto {
  orphanId: number;
  orphanName: string;
  canonicalId: number;
  canonicalName: string;
  referenceCount: number;
  /** `dry-run`, `merged`, or `error: <message>`. */
  status: string;
}

export interface DedupOrphansResultDto {
  dryRun: boolean;
  categoryAlias: string;
  orphanCount: number;
  totalReferencesAffected: number;
  operations: DedupOperationDto[];
}
