/**
 * Mirrors backend records under {@code dto/files/clone/}.
 *
 * Wire format from {@code POST /ng/files/{id}/clone-to-unit}:
 * - status="created" → newFileId populated, summary + suggestions filled
 * - status="exists"  → existingCloneIds populated (warn the user, let them re-POST with force=true)
 * - status="error"   → error string explains why
 */
import { LotoPointDto } from '../loto/loto-point.model';

export interface CloneSummaryDto {
  equipmentCount: number;
  autoLinkedLotoCount: number;
  suggestionCount: number;
  reusedLotoCount: number;
  copiedDiskFiles: number;
}

export interface LotoSuggestionDto {
  newEquipmentId: number;
  sourceLotoPointId: number;
  suggested: LotoPointDto;
}

export interface CloneFileResultDto {
  status: 'created' | 'exists' | 'error';
  sourceFileId: number;
  /** New clone id when status='created'. */
  newFileId: number | null;
  /**
   * Files that already counterpart this one in some direction:
   * - clones OF this file (clonedFromId === sourceId)
   * - or this file's own source (when source is itself a clone)
   */
  existingCloneIds: number[];
  sourceUnit: string | null;
  targetUnit: string | null;
  summary: CloneSummaryDto | null;
  suggestions: LotoSuggestionDto[];
  error: string | null;
}

export interface AcceptedSuggestionItemDto {
  newEquipmentId: number;
  sourceLotoPointId: number;
  lotoPoint: LotoPointDto;
}

export interface AcceptSuggestionsRequestDto {
  items: AcceptedSuggestionItemDto[];
}

export interface AcceptSuggestionsResultDto {
  created: number;
  linkedCounterparts: number;
  errors: string[];
}

/** One candidate file for the "Set Counterpart File…" picker — ranked by score desc. */
export interface CounterpartCandidateDto {
  id: number;
  fileNumber: string | null;
  name: string | null;
  fileTypeName: string | null;
  vendorName: string | null;
  score: number;
  matchReason: string;
}

/** Result of importing equipment+loto from a linked counterpart into this file. */
export interface ImportFromCounterpartResultDto {
  status: 'created' | 'error';
  targetFileId: number;
  sourceFileId: number | null;
  deletedExistingCount: number;
  sourceUnit: string | null;
  targetUnit: string | null;
  summary: CloneSummaryDto | null;
  suggestions: LotoSuggestionDto[];
  error: string | null;
}
