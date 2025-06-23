export interface BaseShape {
  id: number;
  type: string;
  color: string;
  originalPictureWidth: number;
  originalPictureHeight: number;
  isSelected: boolean;
  currentImgWidth: number;
  currentImgHeigth: number;
  scaleToCurrentImage: number;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
}

export type Shape = RectangleShape | CircleShape | LineShape | TextShape;