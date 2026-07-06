import { EquipmentConnection, ThreeEquipmentInt } from '../models/three-equipment.model';

/**
 * A small sample plant so the 3D view has something to render — and to SHOW exactly what data 3D needs:
 *  - most items are ANCHORS (explicit position) — a hand-laid layout;
 *  - a couple are placed by CONNECTION (no position — the layout engine derives it from a nozzle alignment);
 *  - `SAMPLE_CONNECTIONS` is the logical topology (drawn as links), the same graph the 2D flow sim captures.
 * This is the shape you'd map your PhysicalObject + placement + connection data into.
 */
export const SAMPLE_PLANT: ThreeEquipmentInt[] = [
  { id: 'tank-1', name: 'Condensate Tank', type: 'tank', size: { width: 4, height: 6, depth: 4 },
    position: { x: -14, y: 3, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, status: 'online', metadata: { assetTag: 'TK-101' } },
  { id: 'pump-1', name: 'Condensate Pump A', type: 'pump', size: { width: 2, height: 2, depth: 3 },
    position: { x: -7, y: 1, z: -2 }, rotation: { x: 0, y: 0, z: 0 }, status: 'online', metadata: { assetTag: 'PU-201' } },
  { id: 'pump-2', name: 'Condensate Pump B', type: 'pump', size: { width: 2, height: 2, depth: 3 },
    position: { x: -7, y: 1, z: 3 }, rotation: { x: 0, y: 0, z: 0 }, status: 'maintenance', metadata: { assetTag: 'PU-202' } },
  { id: 'turbine-1', name: 'Steam Turbine', type: 'turbine', size: { width: 9, height: 3, depth: 3 },
    position: { x: 3, y: 1.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, status: 'online', metadata: { assetTag: 'TB-301' } },
  { id: 'gen-1', name: 'Generator', type: 'generator', size: { width: 5, height: 3, depth: 3 },
    position: { x: 13, y: 1.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, status: 'online', metadata: { assetTag: 'GN-401' } },
  { id: 'xfmr-1', name: 'Main Transformer', type: 'transformer', size: { width: 3, height: 4, depth: 3 },
    position: { x: 13, y: 2, z: 8 }, rotation: { x: 0, y: 0, z: 0 }, status: 'online', metadata: { assetTag: 'TX-501' } },
  { id: 'panel-1', name: 'Control Panel', type: 'control_panel', size: { width: 2, height: 2.2, depth: 0.6 },
    position: { x: 3, y: 1.1, z: -7 }, rotation: { x: 0, y: 0, z: 0 }, status: 'online', metadata: { assetTag: 'CP-601' } },

  // Placed by CONNECTION (no position) — the layout engine derives it by aligning this valve's inlet to the pump discharge:
  { id: 'valve-1', name: 'Pump A Discharge Valve', type: 'valve', size: { width: 1, height: 1, depth: 1 },
    rotation: { x: 0, y: 0, z: 0 }, status: 'online', metadata: { assetTag: 'VV-210' },
    placement: { fromEquipmentId: 'pump-1', externalConnectionPoint: 'DischargeConn', ownConnectionPoint: 'InletConn' } },
  { id: 'sensor-1', name: 'Discharge PT', type: 'sensor', size: { width: 0.6, height: 0.6, depth: 0.6 },
    rotation: { x: 0, y: 0, z: 0 }, status: 'online', metadata: { assetTag: 'PT-211' },
    placement: { fromEquipmentId: 'valve-1', externalConnectionPoint: 'TopConn', ownConnectionPoint: 'InletConn' } },
];

/** Logical topology (process/electrical/shaft) — drawn as links so the connectivity is visible. */
export const SAMPLE_CONNECTIONS: EquipmentConnection[] = [
  { id: 'c1', connectionTypeId: 'process-flow', sourceEquipmentId: 'tank-1', sourcePointId: 'OutletConn', targetEquipmentId: 'pump-1', targetPointId: 'SuctionConn' },
  { id: 'c2', connectionTypeId: 'process-flow', sourceEquipmentId: 'tank-1', sourcePointId: 'OutletConn', targetEquipmentId: 'pump-2', targetPointId: 'SuctionConn' },
  { id: 'c3', connectionTypeId: 'process-flow', sourceEquipmentId: 'pump-1', sourcePointId: 'DischargeConn', targetEquipmentId: 'turbine-1', targetPointId: 'InletConn' },
  { id: 'c4', connectionTypeId: 'shaft', sourceEquipmentId: 'turbine-1', sourcePointId: 'OutletConn', targetEquipmentId: 'gen-1', targetPointId: 'InletConn' },
  { id: 'c5', connectionTypeId: 'electrical', sourceEquipmentId: 'gen-1', sourcePointId: 'OutletConn', targetEquipmentId: 'xfmr-1', targetPointId: 'InletConn' },
];
