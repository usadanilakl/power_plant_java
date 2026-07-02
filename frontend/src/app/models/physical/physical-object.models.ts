import { MaximoServiceRequest, MaximoWorkOrder } from '../maximo/maximo.models';

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
