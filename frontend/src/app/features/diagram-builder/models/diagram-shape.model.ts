export interface DiagramBaseShape {
  id: number;
  type: 'rectangle' | 'circle' | 'line' | 'text' | 'symbol';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color?: string;
  fillColor?: string;
  lineWidth?: number;
  zIndex?: number;
  locked?: boolean;
  label?: string;
  groupId?: string;
}

export interface DiagramRectangleShape extends DiagramBaseShape {
  type: 'rectangle';
}

export interface DiagramCircleShape extends DiagramBaseShape {
  type: 'circle';
  radius?: number;
}

export interface DiagramLineShape extends DiagramBaseShape {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface DiagramTextShape extends DiagramBaseShape {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface DiagramSymbolShape extends DiagramBaseShape {
  type: 'symbol';
  symbolId: string;
  svgPath: string;
  originalWidth?: number;
  originalHeight?: number;
}

export type DiagramElement =
  | DiagramRectangleShape
  | DiagramCircleShape
  | DiagramLineShape
  | DiagramTextShape
  | DiagramSymbolShape;

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left';

export interface DiagramConnection {
  id: number;
  sourceShapeId: number;
  targetShapeId: number;
  sourceAnchor: AnchorPosition;
  targetAnchor: AnchorPosition;
  waypoints?: { x: number; y: number }[];
  lineStyle?: 'solid' | 'dashed';
  lineWidth?: number;
  color?: string;
}

export interface AnchorPoint {
  x: number;
  y: number;
  position: AnchorPosition;
  shapeId: number;
}

export type DiagramToolType =
  | 'select'
  | 'draw-rectangle'
  | 'draw-circle'
  | 'draw-line'
  | 'draw-text'
  | 'place-symbol'
  | 'draw-connection';

export type AlignmentType =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'h-center'
  | 'v-center';

export type DistributeType = 'horizontal' | 'vertical';
