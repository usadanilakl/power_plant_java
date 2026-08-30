/**
 * The permits map payload — what `GET /ng/work-areas/permit-map` returns.
 *
 * <p>Placement happens on the server (see `NgPermitMapService`) so the map and anything else that
 * needs to know where a permit is answer from one implementation. The client only draws.
 */

/** The map layers, in the order they are offered. */
export const PERMIT_MAP_LAYERS = ['WR', 'SW', 'HW', 'CS', 'LOTO'] as const;
export type PermitMapLayer = (typeof PERMIT_MAP_LAYERS)[number];

/** Which rule placed an item — see `NgPermitMapService` for the ladder. */
export type PermitMapMatch = 'AREA' | 'TEXT' | 'PACKAGE' | 'STANDARD' | null;

export interface PermitMapArea {
  id: number;
  name: string;
  /** The map shape this area is drawn as, or null when nobody has drawn one yet. */
  shapeId: number | null;
}

export interface PermitMapItem {
  layer: PermitMapLayer;
  id: number;
  /** Every area this item touches. Usually one; a LOTO spanning two packages can be in both. */
  workAreaIds: number[];
  matchedBy: PermitMapMatch;
  /**
   * The daily package this belongs to. Safe Work / Hot Work / Confined Space have no page of
   * their own that takes an id, so the package builder is where they are opened.
   */
  packageId: number | null;
  permitNumber: string | null;
  title: string | null;
  status: string | null;
  date: string | null;
  company: string | null;
  person: string | null;
  /** Location text exactly as entered, so a wrong TEXT match is diagnosable on sight. */
  location: string | null;
}

export interface PermitMapPayload {
  areas: PermitMapArea[];
  items: PermitMapItem[];
  /** Items that matched no area at all. Shown, never silently dropped. */
  unplaced: PermitMapItem[];
}

/** Display metadata per layer. Colours double as the shape fill when a single layer is shown. */
export const PERMIT_MAP_LAYER_META: Record<PermitMapLayer, { label: string; short: string; color: string }> = {
  WR: { label: 'Work Requests', short: 'WR', color: '#3b82f6' },
  SW: { label: 'Safe Work', short: 'SW', color: '#22c55e' },
  HW: { label: 'Hot Work', short: 'HW', color: '#f97316' },
  CS: { label: 'Confined Space', short: 'CS', color: '#eab308' },
  LOTO: { label: 'LOTO', short: 'LO', color: '#a855f7' },
};

/** How each placement rule is explained to the operator, weakest last. */
export const PERMIT_MAP_MATCH_LABEL: Record<Exclude<PermitMapMatch, null>, string> = {
  AREA: 'Area assigned on the record',
  TEXT: 'Matched from location text',
  PACKAGE: 'Inherited from its daily package',
  STANDARD: 'From the LOTO standard’s constant areas',
};

/** One record to place, as the assign endpoint identifies it. */
export interface PermitMapAssignRef {
  layer: PermitMapLayer;
  id: number;
}

export interface PermitMapAssignResult {
  assigned: number;
  workAreaId: number;
  workAreaName: string;
}
