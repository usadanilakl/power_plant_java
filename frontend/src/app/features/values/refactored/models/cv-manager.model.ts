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
