import { Vector3 } from 'three';

/** Equipment kinds — each maps to a primitive (and later, an optional GLB model) + a connection-point template. */
export type ThreeEquipmentType =
  | 'tank' | 'pump' | 'valve' | 'pipe' | 'turbine' | 'transformer'
  | 'generator' | 'sensor' | 'control_panel' | 'box';

/** A connection point (nozzle / flange / port) on a piece of equipment — the anchor the layout engine snaps to. */
export interface ConnectionPoint {
  id: string;                // e.g. 'InletConn', 'DischargeConn'
  name?: string;
  position: Vector3;         // LOCAL, relative to the equipment origin (size-aware — produced by the factory/template)
  direction: Vector3;        // outward normal (which way the nozzle faces)
}

/** A LOGICAL link between two connection points — the topology (no geometry of its own). This is the same graph
 *  the 2D flow sim + pipe ports capture, and what the layout engine uses to place equipment. */
export interface EquipmentConnection {
  id: string;
  sourceEquipmentId: string;
  sourcePointId: string;
  targetEquipmentId: string;
  targetPointId: string;
  connectionTypeId: string;  // e.g. 'process-flow', 'electrical', 'shaft'
  metadata?: Record<string, any>;
}

/** Place this equipment RELATIVE to another by aligning its own connection point to the other's — so you enter
 *  connectivity, not 50k absolute coordinates. */
export interface PlacementData {
  fromEquipmentId: string;
  externalConnectionPoint: string;  // the OTHER equipment's point id
  ownConnectionPoint: string;        // this equipment's point id
}

/** One piece of equipment in the 3D scene. Mirrors the 2D PhysicalObject + the extra fields 3D needs
 *  (depth, height, rotation, elevation-via-position.y, connection-based placement). */
export interface ThreeEquipmentInt {
  id: string;
  name: string;
  type: ThreeEquipmentType;
  size: { width: number; height: number; depth: number };
  /** Absolute world position (an ANCHOR), OR left undefined and computed by the layout engine from `placement`. */
  position?: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  material?: { color?: string; metalness?: number; roughness?: number };
  status?: 'online' | 'offline' | 'maintenance' | 'fault';
  metadata?: { assetTag?: string; manufacturer?: string; [k: string]: any };
  parentId?: string;         // physical hierarchy (matches the 2D tree)
  placement?: PlacementData; // when set, `position` is derived from the connection
}
