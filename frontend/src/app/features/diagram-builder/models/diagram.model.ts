import { DiagramConnection, DiagramElement } from './diagram-shape.model';

export interface DiagramDto {
  id?: number;
  name?: string;
  description?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  shapesJson?: string;
  connectionsJson?: string;
  gridSize?: number;
  createdBy?: string;
  dateCreated?: string;
  dateModified?: string;
  deleted?: boolean;
}

export interface DiagramData {
  shapes: DiagramElement[];
  connections: DiagramConnection[];
}

export function parseDiagramData(dto: DiagramDto): DiagramData {
  let shapes: DiagramElement[] = [];
  let connections: DiagramConnection[] = [];
  try {
    if (dto.shapesJson) shapes = JSON.parse(dto.shapesJson);
  } catch { /* empty */ }
  try {
    if (dto.connectionsJson) connections = JSON.parse(dto.connectionsJson);
  } catch { /* empty */ }
  return { shapes, connections };
}

export function serializeDiagramData(data: DiagramData): { shapesJson: string; connectionsJson: string } {
  return {
    shapesJson: JSON.stringify(data.shapes),
    connectionsJson: JSON.stringify(data.connections),
  };
}
