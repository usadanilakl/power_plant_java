import { DiagramToolType } from './diagram-shape.model';

export interface DiagramCanvasConfig {
  canPan: boolean;
  canZoom: boolean;
  canSelectShapes: boolean;
  canMultiSelect: boolean;
  canDrawShapes: boolean;
  canEditShapes: boolean;
  canDeleteShapes: boolean;
  canDragShapes: boolean;
  canResizeShapes: boolean;
  canRotateShapes: boolean;
  canDrawConnections: boolean;
  showToolbar: boolean;
  showSymbolPalette: boolean;
  showGrid: boolean;
  showProperties: boolean;
  enabledTools: DiagramToolType[];
}

export const DIAGRAM_BUILDER_CONFIG: DiagramCanvasConfig = {
  canPan: true,
  canZoom: true,
  canSelectShapes: true,
  canMultiSelect: true,
  canDrawShapes: true,
  canEditShapes: true,
  canDeleteShapes: true,
  canDragShapes: true,
  canResizeShapes: true,
  canRotateShapes: true,
  canDrawConnections: true,
  showToolbar: true,
  showSymbolPalette: true,
  showGrid: true,
  showProperties: true,
  enabledTools: ['select', 'draw-rectangle', 'draw-circle', 'draw-line', 'draw-text', 'place-symbol', 'draw-connection'],
};

export const DIAGRAM_RENDERER_CONFIG: DiagramCanvasConfig = {
  canPan: true,
  canZoom: true,
  canSelectShapes: true,
  canMultiSelect: false,
  canDrawShapes: false,
  canEditShapes: false,
  canDeleteShapes: false,
  canDragShapes: false,
  canResizeShapes: false,
  canRotateShapes: false,
  canDrawConnections: false,
  showToolbar: false,
  showSymbolPalette: false,
  showGrid: false,
  showProperties: false,
  enabledTools: ['select'],
};
