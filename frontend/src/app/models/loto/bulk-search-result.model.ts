export interface LotoPointDtoLight {
  id: number;
  unit: string;
  tagged: string;
  tagNumber: string;
  description: string;
  specificLocation: string;
  normalPosition: string;
  isolatedPosition: string;
  oldId: string;
  objectType: string;
  zeroEnergyMethod: string;
}

export interface BulkSearchMatchDto {
  detectedTag: string;
  matchType: 'FULL' | 'PARTIAL';
  matchingPoints: LotoPointDtoLight[];
}

export interface BulkSearchResultDto {
  searchText: string;
  exactMatches: BulkSearchMatchDto[];
  duplicateMatches: BulkSearchMatchDto[];
  partialMatches: BulkSearchMatchDto[];
  notFound: string[];
  totalDetectedTags: number;
}
