/**
 * Base shape interface for all drawable elements on the image.
 * NOTE: Equipment entity is NO LONGER used for shape identification.
 * Equipment entity only holds coordinates and connects LotoPoint with File.
 * Shapes are managed independently with their own IDs.
 */
export interface RfBaseShape {
  id: number; // Independent shape ID, NOT linked to Equipment ID
  fileId: number; // ID of the file this shape belongs to
  type: string;
  color: string;
  originalPictureWidth: number;
  originalPictureHeight: number;
  originalWidth: number;
  originalHeight: number;
  isSelected: boolean;
  isBulkSelected: boolean;
  currentImgWidth: number;
  currentImgHeigth: number;
  scaleToCurrentImage: number;
}

export interface RfRectangleShape extends RfBaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface RfCircleShape extends RfBaseShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface RfLineShape extends RfBaseShape {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface RfTextShape extends RfBaseShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

export interface RfImageShape extends RfBaseShape {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'image';
  imageUrl: string;
  imageData?: string; // Base64 encoded image data
  rotation?: number;
  // aspectRatio: number; // width/height ratio to maintain proportions
}
export interface SVGSymbolShape extends RfBaseShape {
  type: 'svg-symbol';
  symbolId: string;
  svgPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

/**
 * Off-page reference / continuation arrow on a P&ID that points at another file.
 * Distinct type from svg-symbol so click handlers can route a connector to
 * "navigate to target file" instead of "open equipment dialog" without an
 * id-namespace trick. The shape id is the FileConnector entity id directly —
 * collision-safe because handlers check {@code type === 'file-connector'} first.
 */
export interface FileConnectorShape extends RfBaseShape {
  type: 'file-connector';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  /** symbolId from PIDSymbolsService (e.g. 'off-page-connector'). */
  symbolId: string;
  /** Cached SVG path so render doesn't have to re-resolve the symbol catalog. */
  svgPath: string;
  /** Target file id — click navigates here. */
  targetFileId: number;
  /** Display label (derived from targetFileNumber if entity.label is null). */
  label: string;
  /** Optional reciprocal connector — used to highlight back-pointer on arrival. */
  counterpartConnectorId: number | null;
  /** Whether the canvas should draw the {@link label} inside the shape.
   *  Defaults to false on the renderer — opt-in via the connector edit dialog. */
  showLabel: boolean;
  /** Pairing identifier carried through so the info window can display it
   *  without a separate fetch. Canvas rendering doesn't use it. */
  pairKey: string | null;
}

export type RfShape =
  | RfRectangleShape
  | RfCircleShape
  | RfLineShape
  | RfTextShape
  | RfImageShape
  | SVGSymbolShape
  | FileConnectorShape;
