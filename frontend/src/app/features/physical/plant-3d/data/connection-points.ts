import { Vector3 } from 'three';
import { ConnectionPoint, ThreeEquipmentType } from '../models/three-equipment.model';

/**
 * Connection points (nozzles / flanges) for a piece of equipment, placed at its faces and scaled to its size.
 * This is the per-TYPE template the layout engine uses to place things by "align my nozzle to yours". Later this
 * is where GLB models would supply real nozzle positions (from `*Conn` empties) instead of these primitives.
 */
export function connectionPointsFor(
  type: ThreeEquipmentType,
  size: { width: number; height: number; depth: number },
): ConnectionPoint[] {
  const w = size.width / 2, h = size.height / 2, d = size.depth / 2;
  const cp = (id: string, pos: [number, number, number], dir: [number, number, number]): ConnectionPoint =>
    ({ id, position: new Vector3(pos[0], pos[1], pos[2]), direction: new Vector3(dir[0], dir[1], dir[2]).normalize() });
  switch (type) {
    case 'tank':
      return [cp('OutletConn', [0, -h, 0], [0, -1, 0]), cp('InletConn', [0, h, 0], [0, 1, 0]), cp('SideConn', [w, 0, 0], [1, 0, 0])];
    case 'pipe':
      return [cp('InletConn', [0, -h, 0], [0, -1, 0]), cp('OutletConn', [0, h, 0], [0, 1, 0])];
    case 'pump':
      return [cp('SuctionConn', [-w, 0, 0], [-1, 0, 0]), cp('DischargeConn', [w, 0, 0], [1, 0, 0]), cp('InletConn', [-w, 0, 0], [-1, 0, 0]), cp('OutletConn', [w, 0, 0], [1, 0, 0])];
    case 'turbine':
    case 'generator':
      return [cp('InletConn', [-w, 0, 0], [-1, 0, 0]), cp('OutletConn', [w, 0, 0], [1, 0, 0])];
    default: // valve, transformer, box, sensor, control_panel
      return [cp('InletConn', [-w, 0, 0], [-1, 0, 0]), cp('OutletConn', [w, 0, 0], [1, 0, 0]), cp('TopConn', [0, h, 0], [0, 1, 0])];
  }
}
