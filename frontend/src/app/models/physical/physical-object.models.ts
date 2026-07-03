import { MaximoServiceRequest, MaximoWorkOrder } from '../maximo/maximo.models';

/** The PhysicalObject type ladder (a label = color + rough level; not structurally enforced). */
export const PO_TYPE_OPTIONS = ['PLANT', 'SECTION', 'SYSTEM', 'SKID', 'EQUIPMENT', 'LOCATION'] as const;

/** One color per type — used for hierarchy dots AND plant-map box fills. Single source of truth. */
export const PO_TYPE_COLORS: Record<string, string> = {
  PLANT: '#26C6DA', SECTION: '#42A5F5', SYSTEM: '#66BB6A',
  SKID: '#FFA726', EQUIPMENT: '#AB47BC', LOCATION: '#8D6E63',
};

/** Resolve a node type to its color, with a neutral fallback. */
export function poColor(type: string | null | undefined): string {
  return PO_TYPE_COLORS[type ?? ''] ?? '#78909C';
}

/** One node of the plant hierarchy (mirrors backend PhysicalObjectDto — flat, with parentId). */
export interface PhysicalObjectNode {
  id: number;
  name: string;
  type: string | null;          // PLANT | SECTION | SYSTEM | SKID | EQUIPMENT | LOCATION
  tagNumber: string | null;
  description: string | null;
  specificLocation: string | null;
  maximoSiteid: string | null;
  maximoLocation: string | null;
  maximoAssetnum: string | null;
  maximoType: string | null;
  parentId: number | null;
  floorIndex: number | null;
  diagramId: number | null;   // the node's blank schematic canvas (get-or-created)
  hasChildren: boolean;
}

/** WOs + SRs for a node's Maximo link (backend NgMaximoController.PhysicalObjectMaximoTab). */
export interface PhysicalObjectMaximoTab {
  assetnum: string | null;
  location: string | null;
  workOrders: MaximoWorkOrder[];
  serviceRequests: MaximoServiceRequest[];
}

/** Tag↔asset match stats for one local entity group (LotoPoint or Equipment). */
export interface TagGroupStats {
  distinct: number;
  exactMatched: number;
  looseMatched: number;      // exact OR separator-insensitive
  sampleUnmatched: string[];
}

/** Result of the tag↔asset match probe (backend NgPhysicalObjectController.TagMatchProbe). */
export interface TagMatchProbe {
  equipmentAssetNodes: number;
  loto: TagGroupStats;
  equipment: TagGroupStats;
}

/** A System value a node belongs to (backend SystemRef) — the cross-cutting functional axis. */
export interface SystemRef {
  id: number;
  name: string;
}

/** A work area bound to a node — its safety-profile summary (backend WorkAreaRef). */
export interface WorkAreaRef {
  id: number;
  name: string | null;
  description: string | null;
  areaType: string | null;
  lotoCount: number;
}

/** A work area option for the link picker (from /ng/work-areas/get-all). */
export interface WorkAreaOption {
  id: number;
  name: string;
  description?: string | null;
}

/** A file bound to a node — the binder's "Documents" (backend LinkedFileDto). */
export interface LinkedFile {
  id: number;
  name: string | null;
  fileNumber: string | null;
  fileLink: string | null;
  extension: string | null;
}

/** Create/patch payload for a local-owned node (builder). */
export interface NodeWriteRequest {
  name?: string;
  type?: string;
  parentId?: number | null;
  tagNumber?: string;
  description?: string;
  specificLocation?: string;
  floorIndex?: number | null;
}

/** Summary returned by the reseed endpoint. */
export interface PhysicalObjectSeedResult {
  site: string;
  locations: number;
  locationsCreated: number;
  assets: number;
  assetsCreated: number;
  orphanAssets: number;
  totalNodes: number;
}
