import { Injectable } from '@angular/core';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { ThreeEquipmentInt } from '../models/three-equipment.model';
import { connectionPointsFor } from '../data/connection-points';

/**
 * Resolves absolute position + rotation for every item. ANCHORS (with a fixed `position` and no `placement`) are
 * already resolved; DEPENDENTS are placed by aligning their own connection point to their parent's, resolved
 * iteratively until all are placed (failsafe against cycles). This is the whole point: you enter connectivity,
 * the engine computes the coordinates. Ported from the three-plant LayoutService, made connection-points size-aware.
 */
@Injectable({ providedIn: 'root' })
export class Layout3dService {
  calculateLayout(data: ThreeEquipmentInt[]): ThreeEquipmentInt[] {
    const byId = new Map<string, ThreeEquipmentInt>();
    const resolved: ThreeEquipmentInt[] = [];
    const pending = new Set<ThreeEquipmentInt>();
    for (const d of data) {
      const eq: ThreeEquipmentInt = { ...d, rotation: { ...d.rotation }, position: d.position ? { ...d.position } : undefined };
      byId.set(eq.id, eq);
      if (!eq.placement || !eq.placement.fromEquipmentId) resolved.push(eq); // anchor
      else pending.add(eq);
    }
    let passes = 0; const max = data.length + 1;
    while (pending.size && passes++ < max) {
      const before = pending.size;
      for (const eq of Array.from(pending)) {
        const parent = byId.get(eq.placement!.fromEquipmentId);
        if (parent && parent.position) { this.place(eq, parent); resolved.push(eq); pending.delete(eq); }
      }
      if (pending.size === before) break; // stuck — missing parent or a cycle
    }
    for (const eq of pending) { eq.position = eq.position ?? { x: 0, y: 0, z: 0 }; resolved.push(eq); } // show unresolved at origin
    return resolved;
  }

  /** Place `child` so its own connection point coincides (position + opposing direction) with the parent's. */
  private place(child: ThreeEquipmentInt, parent: ThreeEquipmentInt): void {
    const pCp = connectionPointsFor(parent.type, parent.size).find(p => p.id === child.placement!.externalConnectionPoint);
    const cCp = connectionPointsFor(child.type, child.size).find(p => p.id === child.placement!.ownConnectionPoint);
    if (!pCp || !cCp) { child.position = { x: 0, y: 0, z: 0 }; return; }
    const pPos = new Vector3(parent.position!.x, parent.position!.y, parent.position!.z);
    const pQuat = new Quaternion().setFromEuler(new Euler(parent.rotation.x, parent.rotation.y, parent.rotation.z));
    const pMat = new Matrix4().compose(pPos, pQuat, new Vector3(1, 1, 1));
    const targetPos = pCp.position.clone().applyMatrix4(pMat);
    const targetDir = pCp.direction.clone().transformDirection(pMat).negate();
    const q = new Quaternion().setFromUnitVectors(cCp.direction.clone().normalize(), targetDir.clone().normalize());
    const finalPos = targetPos.clone().sub(cCp.position.clone().applyQuaternion(q));
    child.position = { x: finalPos.x, y: finalPos.y, z: finalPos.z };
    const e = new Euler().setFromQuaternion(q);
    child.rotation = { x: e.x, y: e.y, z: e.z };
  }
}
