import { DiagramConnection, AnchorPosition } from './diagram-placement.model';

/**
 * DTO matching the backend DiagramConnectionDto.
 */
export interface DiagramConnectionDto {
  id?: number;           // JPA ID (stable for sync)
  diagramId?: number;
  localId?: number;      // in-diagram sequential ID

  sourcePlacementLocalId?: number;
  targetPlacementLocalId?: number;
  sourceAnchor?: string;
  targetAnchor?: string;

  sourcePort?: string;
  targetPort?: string;

  pipeTemplateId?: number;
  pipeName?: string;
  pipeParamsJson?: string;

  waypointsJson?: string;
  lineStyle?: string;
  lineWidth?: number;
  color?: string;

  // Audit
  createdBy?: string;
  dateCreated?: string;
  dateModified?: string;
  deleted?: boolean;
}

/** Convert a backend DTO to the in-memory DiagramConnection used by the canvas. */
export function dtoToConnection(dto: DiagramConnectionDto): DiagramConnection {
  let waypoints: { x: number; y: number }[] | undefined;
  if (dto.waypointsJson) {
    try { waypoints = JSON.parse(dto.waypointsJson); } catch { waypoints = undefined; }
  }

  return {
    id: dto.localId ?? dto.id ?? 0,
    sourcePlacementId: dto.sourcePlacementLocalId ?? 0,
    targetPlacementId: dto.targetPlacementLocalId ?? 0,
    sourceAnchor: (dto.sourceAnchor ?? 'right') as AnchorPosition,
    targetAnchor: (dto.targetAnchor ?? 'left') as AnchorPosition,
    sourcePort: dto.sourcePort,
    targetPort: dto.targetPort,
    pipeTemplateId: dto.pipeTemplateId,
    pipeName: dto.pipeName,
    pipeParamsJson: dto.pipeParamsJson,
    waypoints,
    lineStyle: dto.lineStyle as any,
    lineWidth: dto.lineWidth,
    color: dto.color,
  };
}

/** Convert an in-memory DiagramConnection to a DTO for the backend. */
export function connectionToDto(c: DiagramConnection, diagramId?: number): DiagramConnectionDto {
  return {
    diagramId,
    localId: c.id,
    sourcePlacementLocalId: c.sourcePlacementId,
    targetPlacementLocalId: c.targetPlacementId,
    sourceAnchor: c.sourceAnchor,
    targetAnchor: c.targetAnchor,
    sourcePort: c.sourcePort,
    targetPort: c.targetPort,
    pipeTemplateId: c.pipeTemplateId,
    pipeName: c.pipeName,
    pipeParamsJson: c.pipeParamsJson,
    waypointsJson: c.waypoints ? JSON.stringify(c.waypoints) : undefined,
    lineStyle: c.lineStyle,
    lineWidth: c.lineWidth,
    color: c.color,
  };
}
