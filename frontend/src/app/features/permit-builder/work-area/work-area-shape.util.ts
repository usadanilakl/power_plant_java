import { RfRectangleShape, ShapeCountBadge } from '../../../shared/image/refactored/models/fr-shape.model';
import { WorkAreaMapShapeDto } from '../../../models/permits/work-area.model';

/**
 * Geometry of a stored work-area map shape, decoded.
 *
 * <p>Extracted so the work-area editor and the permits map read the same bytes the same way. The
 * two draw the same shapes over the same plant map; a second copy of the parser would let them
 * disagree about where an area is, which is the one thing a map must not do.
 */
export interface WorkAreaShapeGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  pictureWidth: number;
  pictureHeight: number;
}

const DEFAULT_GEOMETRY: WorkAreaShapeGeometry = {
  x: 0, y: 0, width: 100, height: 100, rotation: 0,
  pictureWidth: 1000, pictureHeight: 800,
};

/**
 * Decode a shape's `coordinates` and `originalPictureSize` strings.
 *
 * <p>`coordinates` is stored in two different shapes: real JSON, and a bare-key variant
 * (`{startX:0,startY:0,...}`) written by {@link workAreaShapeToCoordinates}. Both are in the
 * database, so both are read — the bare-key form is quoted up before parsing and the strict parse
 * is kept as a fallback for values that were already valid JSON and would be corrupted by the
 * quoting pass.
 */
export function parseWorkAreaShapeGeometry(shape: WorkAreaMapShapeDto): WorkAreaShapeGeometry {
  const parsed = tryParseCoordinates(shape.coordinates);
  const size = parsePictureSize(shape.originalPictureSize);

  return {
    x: parsed?.startX ?? parsed?.x ?? DEFAULT_GEOMETRY.x,
    y: parsed?.startY ?? parsed?.y ?? DEFAULT_GEOMETRY.y,
    width: parsed?.width ?? DEFAULT_GEOMETRY.width,
    height: parsed?.height ?? DEFAULT_GEOMETRY.height,
    rotation: parsed?.rotation ?? DEFAULT_GEOMETRY.rotation,
    pictureWidth: size?.width ?? DEFAULT_GEOMETRY.pictureWidth,
    pictureHeight: size?.height ?? DEFAULT_GEOMETRY.pictureHeight,
  };
}

/**
 * Build the RfShape the InteractiveImageComponent draws, in the given colour.
 *
 * `badge` is the single round index badge; `countBadges` are the per-category pills the permits
 * map uses. Both are optional and independent — the work-area editor passes neither.
 */
export function workAreaShapeToRf(
  shape: WorkAreaMapShapeDto,
  color: string,
  badge?: number | string,
  countBadges?: ShapeCountBadge[]
): RfRectangleShape {
  const g = parseWorkAreaShapeGeometry(shape);
  return {
    id: shape.id,
    fileId: 0,
    type: 'rectangle',
    color,
    originalPictureWidth: g.pictureWidth,
    originalPictureHeight: g.pictureHeight,
    originalWidth: g.width,
    originalHeight: g.height,
    isSelected: false,
    isBulkSelected: false,
    currentImgWidth: g.pictureWidth,
    currentImgHeigth: g.pictureHeight,
    scaleToCurrentImage: 1,
    x: g.x,
    y: g.y,
    width: g.width,
    height: g.height,
    rotation: g.rotation,
    ...(badge === undefined ? {} : { pointIndex: badge }),
    ...(countBadges?.length ? { countBadges } : {}),
  };
}

/** Serialise back to the bare-key format the existing rows use. */
export function workAreaShapeToCoordinates(rect: {
  x: number; y: number; width: number; height: number; rotation?: number;
}): string {
  return JSON.stringify({
    startX: rect.x,
    startY: rect.y,
    endX: rect.x + rect.width,
    endY: rect.y + rect.height,
    width: rect.width,
    height: rect.height,
    rotation: rect.rotation || 0,
  }).replace(/^"|"$/g, '').replace(/\\/g, '').replace(/"(\w+)":/g, '$1:');
}

interface RawCoordinates {
  startX?: number; startY?: number; x?: number; y?: number;
  width?: number; height?: number; rotation?: number;
}

function tryParseCoordinates(raw: string | null | undefined): RawCoordinates | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

function parsePictureSize(raw: string | null | undefined): { width: number; height: number } | null {
  const match = raw?.match(/width:(\d+),height:(\d+)/);
  if (!match) return null;
  return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
}
