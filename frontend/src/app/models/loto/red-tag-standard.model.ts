/**
 * Client-side models for Red Tag standards — the digitized LOTO standards
 * imported from the external Red Tag system. See the backend
 * `RedTagStandard` entity and `red-tag-standards-plan.md`.
 */

/** One isolation-device row of a Red Tag standard table. */
export interface RedTagStandardRow {
  rowNumber: number;
  tagType: string;
  description: string;
  /** Device tag — the key matched against LotoPoint.tagNumber. */
  pnid: string;
  isolatedPosition: string;
  normalPosition: string;
}

/** A digitized Red Tag standard. */
export interface RedTagStandard {
  id: number;
  name: string;
  unit: string;
  rows: RedTagStandardRow[];
  /** Source screenshot, base64 PNG — render via a data URI. */
  sourceImageBase64?: string | null;
  /** Set once a native LotoStandard has been generated from this one. */
  generatedStandardId?: number | null;
  importNotes?: string | null;
  dateCreated?: string;
  dateModified?: string;
}

/** Per-row reconciliation result against the LOTO point database. */
export interface RedTagPointMatch {
  row: RedTagStandardRow;
  status: 'MATCHED' | 'MULTIPLE' | 'NONE';
  matches: MatchedPoint[];
}

/** Lightweight LOTO point summary returned by the matches endpoint. */
export interface MatchedPoint {
  id: number;
  tagNumber: string;
  description: string;
}

/** Result of the manual seed import. */
export interface RedTagImportResult {
  created: number;
  skipped: number;
  createdNames: string[];
  skippedNames: string[];
}
