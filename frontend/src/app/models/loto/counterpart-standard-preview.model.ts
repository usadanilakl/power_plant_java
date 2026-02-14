import { LotoPointDto } from './loto-point.model';
import { LotoStandardDto } from './loto-standard.model';

export interface CounterpartItemDto {
  sourcePoint: LotoPointDto;
  counterpartPoint: LotoPointDto | null;
  category: 'confirmed' | 'suggested' | 'original' | 'non-counterpart';
  hasMultipleMatches: boolean;
  allMatches: LotoPointDto[] | null;
  sourceIndex: number;
}

export interface CounterpartStandardPreviewDto {
  sourceStandard: LotoStandardDto;
  sourceUnit: string;
  targetUnit: string;
  items: CounterpartItemDto[];
}
