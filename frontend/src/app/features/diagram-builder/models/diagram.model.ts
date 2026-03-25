import { DiagramPlacement, DiagramConnection, DiagramData } from './diagram-placement.model';

export interface DiagramDto {
  id?: number;
  name?: string;
  description?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  shapesJson?: string;
  connectionsJson?: string;
  gridSize?: number;
  contextFileId?: number;
  contextFileName?: string;
  createdBy?: string;
  dateCreated?: string;
  dateModified?: string;
  deleted?: boolean;
}

/**
 * Normalize diagram JSON to the current DiagramData schema.
 * Handles legacy formats (pre-schemaVersion) and future migrations.
 * Called once on load — all downstream code only sees DiagramData v1.
 */
export function normalizeDiagramData(dto: DiagramDto): DiagramData {
  let rawShapes: any;
  let rawConnections: any;

  try { rawShapes = JSON.parse(dto.shapesJson || '[]'); } catch { rawShapes = []; }
  try { rawConnections = JSON.parse(dto.connectionsJson || '[]'); } catch { rawConnections = []; }

  // Current format: { schemaVersion: 1, placements: [...], connections: [...] }
  if (rawShapes && !Array.isArray(rawShapes) && rawShapes.schemaVersion) {
    return rawShapes as DiagramData;
  }

  // Legacy format: shapesJson is a raw array of DiagramBaseShape objects
  return migrateLegacyToV1(
    Array.isArray(rawShapes) ? rawShapes : [],
    Array.isArray(rawConnections) ? rawConnections : []
  );
}

function migrateLegacyToV1(shapes: any[], connections: any[]): DiagramData {
  return {
    schemaVersion: 1,
    placements: shapes.map((s: any) => ({
      id: s.id,
      inline: true,
      x: s.x, y: s.y, width: s.width, height: s.height,
      rotation: s.rotation, color: s.color, fillColor: s.fillColor,
      lineWidth: s.lineWidth, label: s.label, zIndex: s.zIndex,
      locked: s.locked, groupId: s.groupId,
      type: s.type,
      // Line endpoints
      startX: s.startX, startY: s.startY, endX: s.endX, endY: s.endY,
      // Text
      text: s.text, fontSize: s.fontSize, fontFamily: s.fontFamily,
      // Symbol
      symbolId: s.symbolId, svgPath: s.svgPath,
      originalWidth: s.originalWidth, originalHeight: s.originalHeight,
      // Circle
      radius: s.radius,
      // Legacy linked entity → carried forward as inline metadata
      ...(s.linkedEntityId ? {
        // These are non-standard fields on DiagramPlacement but won't break anything
      } : {}),
    } as DiagramPlacement)),
    connections: connections.map((c: any) => ({
      id: c.id,
      sourcePlacementId: c.sourceShapeId ?? c.sourcePlacementId,
      targetPlacementId: c.targetShapeId ?? c.targetPlacementId,
      sourceAnchor: c.sourceAnchor,
      targetAnchor: c.targetAnchor,
      waypoints: c.waypoints,
      lineStyle: c.lineStyle,
      lineWidth: c.lineWidth,
      color: c.color,
    } as DiagramConnection)),
  };
}

/**
 * Serialize DiagramData for persistence.
 * Stores the full envelope (with schemaVersion) in shapesJson.
 * connectionsJson is left empty — connections are inside the envelope.
 */
export function serializeDiagramData(data: DiagramData): { shapesJson: string; connectionsJson: string } {
  return {
    shapesJson: JSON.stringify(data),
    connectionsJson: '', // connections are inside the DiagramData envelope now
  };
}
