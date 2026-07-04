/**
 * Curated equipment glyphs for the plant map. The SVG path strings are lifted from the shared
 * PIDSymbolsService (pure, Pixi-free coordinates) so a box can *look like* what it is — a pump, valve, tank —
 * without pulling in the simulator or its 351-symbol library. A glyph is the equipment KIND (orthogonal to the
 * PhysicalObject hierarchy type). `kind:'pipe'` renders a color-coded capsule instead of a path.
 */
export interface PlantGlyph {
  key: string;
  label: string;
  kind: 'box' | 'pipe' | 'path';
  path?: string;   // for kind:'path' — drawn in a viewW×viewH viewBox
  viewW?: number;
  viewH?: number;
}

export const PLANT_GLYPHS: PlantGlyph[] = [
  { key: 'none', label: 'None', kind: 'box' },
  { key: 'valve', label: 'Valve', kind: 'path', viewW: 40, viewH: 20,
    path: 'M 0,10 L 12,2 L 20,10 L 12,18 Z M 40,10 L 28,2 L 20,10 L 28,18 Z M 20,10 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0' },
  { key: 'pump', label: 'Pump', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 10,20 L 30,20 M 25,15 L 30,20 L 25,25' },
  { key: 'motor', label: 'Motor', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,20 L 37,20' },
  { key: 'fan', label: 'Fan', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 20,20 L 20,6 M 20,20 L 32,27 M 20,20 L 8,27' },
  { key: 'tank', label: 'Tank', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 8,4 L 32,4 M 8,4 a 12,4 0 0,0 0,8 M 32,4 a 12,4 0 0,1 0,8 M 8,12 L 8,34 M 32,12 L 32,34 M 8,34 a 12,4 0 0,0 24,0' },
  { key: 'vessel', label: 'Vessel', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 10,8 L 30,8 M 10,32 L 30,32 M 10,8 a 10,8 0 0,0 0,24 M 30,8 a 10,8 0 0,1 0,24 M 14,32 L 14,40 M 26,32 L 26,40' },
  { key: 'hx', label: 'Heat Exch.', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 4,10 L 36,10 L 36,30 L 4,30 Z M 10,14 L 30,26 M 10,26 L 30,14 M 0,20 L 4,20 M 36,20 L 40,20' },
  { key: 'compressor', label: 'Compressor', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 4,20 L 18,8 L 18,32 Z M 18,8 L 34,8 L 40,20 L 34,32 L 18,32' },
  { key: 'instrument', label: 'Instrument', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0' },
  { key: 'flange', label: 'Flange', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 4,20 L 16,20 M 24,20 L 36,20 M 16,8 L 16,32 M 24,8 L 24,32' },
  { key: 'tee', label: 'Tee', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 4,16 L 36,16 M 20,16 L 20,36' },
  { key: 'elbow', label: 'Elbow', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 20,4 L 20,20 L 36,20' },
  { key: 'reducer', label: 'Reducer', kind: 'path', viewW: 40, viewH: 40,
    path: 'M 4,10 L 4,30 L 36,17 L 36,23 Z' },
];

export const PLANT_GLYPH_BY_KEY = new Map(PLANT_GLYPHS.map(g => [g.key, g]));

/** Quick-pick service/fluid colors (water, air, steam, oil, fire, chem, condensate, neutral, gas). */
export const SERVICE_COLORS = [
  '#42A5F5', '#26C6DA', '#ECEFF1', '#FFA726', '#EF5350', '#AB47BC', '#66BB6A', '#8D6E63', '#FFEE58',
];

/**
 * A footprint is the plan-view SHAPE of an object (where it sits + how big it is) — the primitive of a
 * layout tool, orthogonal to the equipment badge (what it is). `run` is a pipe rack / pipe / cable-tray:
 * a capsule you draw along where it physically runs, thick or thin, horizontal or vertical.
 */
export type FootprintShape = 'rect' | 'round' | 'circle' | 'run';

export const FOOTPRINT_SHAPES: { key: FootprintShape; label: string }[] = [
  { key: 'rect', label: 'Rectangle — skids, rooms, buildings' },
  { key: 'round', label: 'Rounded — platforms, pads' },
  { key: 'circle', label: 'Round — tanks, vessels, silos' },
  { key: 'run', label: 'Pipe run — racks, pipes, trays' },
];

/** DiagramPlacement.type is overloaded to carry the footprint shape; older rows stored 'rectangle'. */
export function normFootprint(type?: string | null): FootprintShape {
  return type === 'round' || type === 'circle' || type === 'run' ? type : 'rect';
}

/** Translucent fill from a hex color (so a footprint reads by system/type color without hiding the map). */
export function hexToRgba(hex: string, alpha: number): string {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return `rgba(120,144,156,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
