/** Mirrors backend dto/physical/PhysicalObjectAggregate + PhysicalObjectDto. */

export interface PhysicalObjectNode {
  id: number;
  name: string | null;
  type: string | null;
  tagNumber: string | null;
  description: string | null;
  specificLocation: string | null;
  maximoSiteid: string | null;
  maximoLocation: string | null;
  maximoAssetnum: string | null;
  maximoType: string | null;
  parentId: number | null;
  floorIndex: number | null;
  diagramId: number | null;
  hasChildren: boolean;
  local: boolean;
  maximoLinked: boolean;
}

export interface LinkedFileRef {
  id: number;
  name: string | null;
  fileNumber: string | null;
  fileLink: string | null;
  extension: string | null;
}

export interface LotoPointRef {
  id: number;
  tagNumber: string | null;
  description: string | null;
  type: string | null;
  normalPosition: string | null;
  isolatedPosition: string | null;
  specificLocation: string | null;
}

export interface WorkAreaRef {
  id: number;
  name: string | null;
  description: string | null;
  areaType: string | null;
  lotoCount: number;
}

export interface SystemRef {
  id: number;
  name: string | null;
}

export interface ObjectLog {
  id: number;
  content: string | null;
  author: string | null;
  createdAt: string | null;
  needsAttention: boolean;
}

export interface MaximoFacet {
  available: boolean;
  assetnum: string | null;
  location: string | null;
  workOrders: any[];
  serviceRequests: any[];
}

export interface PhysicalObjectAggregate {
  node: PhysicalObjectNode;
  breadcrumb: PhysicalObjectNode[];
  files: LinkedFileRef[];
  lotoPoints: LotoPointRef[];
  workAreas: WorkAreaRef[];
  systems: SystemRef[];
  logs: ObjectLog[];
  maximo: MaximoFacet;
}
