/**
 * Base shape interface for all drawable elements on the image.
 * NOTE: Equipment entity is NO LONGER used for shape identification.
 * Equipment entity only holds coordinates and connects LotoPoint with File.
 * Shapes are managed independently with their own IDs.
 */
export interface RfBaseShape {
  id: number; // Independent shape ID, NOT linked to Equipment ID
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

export type RfShape =
  | RfRectangleShape
  | RfCircleShape
  | RfLineShape
  | RfTextShape
  | RfImageShape
  | SVGSymbolShape;
