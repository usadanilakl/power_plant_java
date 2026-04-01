import { DiagramPlacement } from './diagram-placement.model';

/**
 * DTO matching the backend DiagramPlacementDto.
 * Carries a diagramId and maps localId ↔ DiagramPlacement.id.
 */
export interface DiagramPlacementDto {
  id?: number;           // JPA ID (stable for sync)
  diagramId?: number;
  localId?: number;      // in-diagram sequential ID

  // Simulation
  simRole?: string;
  simParamsJson?: string;
  simEquipmentId?: number;
  sourceEntityType?: string;
  sourceEntityId?: number;

  // Identity
  name?: string;
  description?: string;

  // Position
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;

  // Visual
  color?: string;
  fillColor?: string;
  lineWidth?: number;
  label?: string;
  zIndex?: number;
  locked?: boolean;
  groupId?: string;

  // Type
  type?: string;

  // Symbol
  symbolId?: string;
  svgPath?: string;
  originalWidth?: number;
  originalHeight?: number;

  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;

  // Circle
  radius?: number;

  // Line
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;

  // Audit
  createdBy?: string;
  dateCreated?: string;
  dateModified?: string;
  deleted?: boolean;
}

/** Convert a backend DTO to the in-memory DiagramPlacement used by the canvas. */
export function dtoToPlacement(dto: DiagramPlacementDto): DiagramPlacement {
  return {
    id: dto.localId ?? dto.id ?? 0,
    name: dto.name,
    description: dto.description,
    simRole: dto.simRole,
    simParamsJson: dto.simParamsJson,
    simEquipmentId: dto.simEquipmentId,
    sourceEntityType: dto.sourceEntityType,
    sourceEntityId: dto.sourceEntityId,
    x: dto.x ?? 0,
    y: dto.y ?? 0,
    width: dto.width ?? 100,
    height: dto.height ?? 100,
    rotation: dto.rotation,
    color: dto.color,
    fillColor: dto.fillColor,
    lineWidth: dto.lineWidth,
    label: dto.label,
    zIndex: dto.zIndex,
    locked: dto.locked,
    groupId: dto.groupId,
    type: dto.type as any,
    symbolId: dto.symbolId,
    svgPath: dto.svgPath,
    originalWidth: dto.originalWidth,
    originalHeight: dto.originalHeight,
    text: dto.text,
    fontSize: dto.fontSize,
    fontFamily: dto.fontFamily,
    radius: dto.radius,
    startX: dto.startX,
    startY: dto.startY,
    endX: dto.endX,
    endY: dto.endY,
  };
}

/** Convert an in-memory DiagramPlacement to a DTO for the backend. */
export function placementToDto(p: DiagramPlacement, diagramId?: number): DiagramPlacementDto {
  return {
    diagramId,
    localId: p.id,
    name: p.name,
    description: p.description,
    simRole: p.simRole,
    simParamsJson: p.simParamsJson,
    simEquipmentId: p.simEquipmentId,
    sourceEntityType: p.sourceEntityType,
    sourceEntityId: p.sourceEntityId,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    rotation: p.rotation,
    color: p.color,
    fillColor: p.fillColor,
    lineWidth: p.lineWidth,
    label: p.label,
    zIndex: p.zIndex,
    locked: p.locked,
    groupId: p.groupId,
    type: p.type,
    symbolId: p.symbolId,
    svgPath: p.svgPath,
    originalWidth: p.originalWidth,
    originalHeight: p.originalHeight,
    text: p.text,
    fontSize: p.fontSize,
    fontFamily: p.fontFamily,
    radius: p.radius,
    startX: p.startX,
    startY: p.startY,
    endX: p.endX,
    endY: p.endY,
  };
}
