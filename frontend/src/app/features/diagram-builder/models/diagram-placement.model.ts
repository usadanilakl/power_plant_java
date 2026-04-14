// --- DiagramPlacement: an item placed on a diagram canvas ---

export interface DiagramPlacement {
  id: number;

  // Optional provenance to the template/library item this instance came from
  simEquipmentId?: number;
  name?: string;
  description?: string;
  simRole?: string;
  simParamsJson?: string;
  sourceEntityType?: string;
  sourceEntityId?: number;

  // Position on this diagram
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;

  // Visual overrides (optional — falls back to SimEquipment defaults)
  color?: string;
  fillColor?: string;
  lineWidth?: number;
  label?: string;
  zIndex?: number;
  locked?: boolean;
  groupId?: string;

  // Inline shapes (text, annotations, plain shapes — no SimEquipment)
  inline?: boolean;
  type?: 'rectangle' | 'circle' | 'line' | 'text' | 'symbol';

  // Inline line endpoints
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;

  // Inline text
  text?: string;
  fontSize?: number;
  fontFamily?: string;

  // Inline symbol (legacy — before SimEquipment existed)
  symbolId?: string;
  svgPath?: string;
  originalWidth?: number;
  originalHeight?: number;

  // Inline circle
  radius?: number;

  // Legacy entity linking (backward compat — will migrate to SimEquipment)
  linkedEntityId?: number;
  linkedEntityType?: string;
}

// --- DiagramConnection: a connection between two placements ---

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left';

export interface DiagramConnection {
  id: number;
  sourcePlacementId: number;
  targetPlacementId: number;
  sourceAnchor: AnchorPosition;
  targetAnchor: AnchorPosition;

  // Pipe template provenance + per-connection instance data
  pipeTemplateId?: number;
  pipeName?: string;
  pipeParamsJson?: string;

  // Multi-port support (e.g., 3-way valve port A/B)
  sourcePort?: string;
  targetPort?: string;

  waypoints?: { x: number; y: number }[];
  lineStyle?: 'solid' | 'dashed';
  lineWidth?: number;
  color?: string;
}

// --- Anchor point for hit testing ---

export interface AnchorPoint {
  x: number;
  y: number;
  position: AnchorPosition;
  placementId: number;
}

// --- Versioned diagram data envelope ---

export interface DiagramData {
  schemaVersion: 1;
  placements: DiagramPlacement[];
  connections: DiagramConnection[];
}

// --- Tool and alignment types ---

export type DiagramToolType =
  | 'select'
  | 'draw-rectangle'
  | 'draw-circle'
  | 'draw-line'
  | 'draw-text'
  | 'place-symbol'
  | 'place-equipment'
  | 'draw-connection';

export type AlignmentType = 'left' | 'right' | 'top' | 'bottom' | 'h-center' | 'v-center';
export type DistributeType = 'horizontal' | 'vertical';
