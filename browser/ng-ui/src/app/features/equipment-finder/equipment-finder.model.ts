/**
 * Wire types for the Equipment Finder (`/api/pwa/secured/equipment-finder`).
 */

/** How the words in one filter box combine. */
export type FilterMode = 'AND' | 'OR';

/**
 * One filter box: a bucket of words plus how they combine. Each word matches as a substring, so
 * "cnd" and "455" both hit the tag "1CND455" — which is the point of splitting a typed phrase into
 * words rather than searching for it whole.
 */
export interface FinderFilter {
  terms: string[];
  mode: FilterMode;
}

/**
 * A finder query. Boxes combine with AND (an item must satisfy all of them); the words inside a box
 * combine by that box's own mode. Empty boxes are ignored rather than matching everything.
 */
export interface FinderRequest {
  location?: FinderFilter;
  eqType?: FinderFilter;
  specificLocation?: FinderFilter;
  tagNumber?: FinderFilter;
  description?: FinderFilter;
  limit?: number;
  /**
   * Drop the unreferenced-equipment half of the search. Set by callers that can only act on a LOTO
   * point — attaching to a standard or permit — where equipment rows are unselectable noise that
   * would also eat into the row cap.
   */
  lotoPointsOnly?: boolean;
}

/**
 * One result row. `type` uses the same vocabulary as the QR resolver, so tapping a row hands the
 * type + id straight to `QrApiService.resolveItem`. Equipment appears only when no LOTO point
 * references it.
 */
export interface FinderItem {
  type: 'lotoPoint' | 'equipment';
  id: number;
  tagNumber?: string;
  description?: string;
  location?: string;
  eqType?: string;
  specificLocation?: string;
  hasDrawing: boolean;
}

/** Counts are of the FULL match set, so the list can admit when it is showing a truncated view. */
export interface FinderResult {
  items: FinderItem[];
  lotoPointMatches: number;
  equipmentMatches: number;
  truncated: boolean;
}

/**
 * The five boxes, in the order the form shows them.
 *
 * `suggest` marks the two backed by a Value list (Location, Equipment type). Those still accept any
 * text — the dropdown is a shortcut to a known name, not a constraint, because the plant's data has
 * plenty of rows whose location was typed rather than picked.
 */
export const FINDER_FIELDS = [
  { key: 'location', label: 'Location', placeholder: 'e.g. boiler, turbine deck', suggest: true },
  { key: 'eqType', label: 'Equipment type', placeholder: 'e.g. valve, breaker', suggest: true },
  { key: 'specificLocation', label: 'Specific location', placeholder: 'e.g. elev 20, north wall', suggest: false },
  { key: 'tagNumber', label: 'Tag number', placeholder: 'e.g. cnd 455', suggest: false },
  { key: 'description', label: 'Description', placeholder: 'e.g. feedwater pump', suggest: false },
] as const;

export type FinderFieldKey = typeof FINDER_FIELDS[number]['key'];
