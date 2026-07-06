import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ThreeEquipmentInt, ThreeEquipmentType } from '../models/three-equipment.model';
import { PrimitiveKind, SceneObject, ShapeDef } from '../models/shape-3d.model';

/**
 * Builds a THREE.Object3D for each equipment. For now: lightweight PRIMITIVES per type (shared unit geometry,
 * scaled to size) — near-zero asset weight, phone-friendly. This is exactly where GLB models would slot in later
 * (load per type, clone/instance), keeping the same interface. Colours reflect status (or an explicit material).
 */
@Injectable({ providedIn: 'root' })
export class EquipmentFactory3dService {
  private geomCache = new Map<ThreeEquipmentType, THREE.BufferGeometry>();
  private readonly statusColor: Record<string, number> = {
    online: 0x4caf50, offline: 0x8a97a6, maintenance: 0xffb300, fault: 0xef5350,
  };

  /** A scene object for one equipment, positioned + rotated + scaled, tagged with its id for picking. */
  build(eq: ThreeEquipmentInt): THREE.Object3D {
    const color = eq.material?.color ? new THREE.Color(eq.material.color) : new THREE.Color(this.statusColor[eq.status ?? 'offline']);
    const mat = new THREE.MeshStandardMaterial({
      color, metalness: eq.material?.metalness ?? 0.35, roughness: eq.material?.roughness ?? 0.65,
    });
    const mesh = new THREE.Mesh(this.geometryFor(eq.type), mat);
    mesh.scale.set(eq.size.width, eq.size.height, eq.size.depth);
    mesh.castShadow = true; mesh.receiveShadow = true;

    const group = new THREE.Group();
    group.add(mesh);
    if (eq.position) group.position.set(eq.position.x, eq.position.y, eq.position.z);
    group.rotation.set(eq.rotation.x, eq.rotation.y, eq.rotation.z);
    group.userData['equipmentId'] = eq.id;
    group.userData['mesh'] = mesh;
    group.userData['baseColor'] = color.getHex();
    return group;
  }

  // ── BUILDER: build from a reusable ShapeDef (with fallback to a primitive by PhysicalObject type) ──

  private primCache = new Map<PrimitiveKind, THREE.BufferGeometry>();
  private readonly typeFallbackColor: Record<string, number> = {
    PLANT: 0x26c6da, SECTION: 0x42a5f5, SYSTEM: 0x66bb6a, SKID: 0xffa726, EQUIPMENT: 0xab47bc, LOCATION: 0x8d6e63,
  };

  /**
   * A scene object for the BUILDER: a group holding one mesh, transformed (pos/rot/size), tagged with the
   * PhysicalObject id for picking + the localId so the gizmo can write transforms back. If no shape is assigned
   * (or the shape id is stale) it falls back to a primitive keyed by the object's PhysicalObject type.
   */
  buildSceneObject(obj: SceneObject, shape: ShapeDef | null): THREE.Object3D {
    const group = new THREE.Group();
    group.position.set(obj.pos.x, obj.pos.y, obj.pos.z);
    group.rotation.set(obj.rot.x, obj.rot.y, obj.rot.z);
    group.scale.set(obj.size.w, obj.size.h, obj.size.d);
    group.userData['localId'] = obj.localId;
    group.userData['physicalObjectId'] = obj.physicalObjectId;

    // Custom GLB model: show a wireframe placeholder immediately, swap in the (cached, normalized) model when it loads.
    if (shape?.kind === 'model' && shape.modelUrl) {
      const ph = new THREE.Mesh(this.primGeometry('box'),
        new THREE.MeshStandardMaterial({ color: 0x39424d, transparent: true, opacity: 0.35, wireframe: true }));
      group.add(ph); group.userData['mesh'] = ph;
      this.loadModelTemplate(shape.modelUrl).then(tpl => {
        group.remove(ph);
        const inst = tpl.clone(true);
        if (obj.shell) this.shellModel(inst);
        group.add(inst);
      }).catch(() => { /* keep the wireframe box if the model can't be fetched/parsed */ });
      return group;
    }

    const mesh = this.meshForShape(shape, obj);
    group.add(mesh);
    group.userData['mesh'] = mesh;
    if (obj.shell) this.makeShell(group, mesh);
    return group;
  }

  // ── GLB model loading (cached template per URL, normalized to a unit box, cloned per instance) ──
  private gltfLoader = new GLTFLoader();
  private modelCache = new Map<string, Promise<THREE.Object3D>>();

  loadModelTemplate(url: string): Promise<THREE.Object3D> {
    let p = this.modelCache.get(url);
    if (p) return p;
    p = new Promise<THREE.Object3D>((resolve, reject) => {
      this.gltfLoader.load(url, gltf => resolve(this.normalizeToUnitBox(gltf.scene)), undefined, reject);
    });
    this.modelCache.set(url, p);
    return p;
  }

  /** Center the model at its origin and scale it to fit a 1×1×1 box, so `group.scale` = size behaves like a primitive. */
  private normalizeToUnitBox(root: THREE.Object3D): THREE.Object3D {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    root.position.sub(center);
    root.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    const wrap = new THREE.Group();
    wrap.add(root);
    wrap.scale.setScalar(1 / maxDim);
    return wrap;
  }

  /** See-through a loaded model — clone its materials first so shared (cached) materials aren't mutated for others. */
  private shellModel(root: THREE.Object3D): void {
    root.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const ghost = (m: THREE.Material) => { const c = m.clone(); c.transparent = true; c.opacity = 0.28; c.depthWrite = false; return c; };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(ghost) : ghost(mesh.material);
    });
  }

  /** Render a container see-through: faint transparent fill (no depth write, so it never occludes contents) + a
   *  crisp edge outline so the volume still reads. */
  private makeShell(group: THREE.Group, mesh: THREE.Mesh): void {
    const m = mesh.material as THREE.MeshStandardMaterial;
    m.transparent = true; m.opacity = 0.12; m.depthWrite = false;
    mesh.castShadow = false;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry as THREE.BufferGeometry),
      new THREE.LineBasicMaterial({ color: 0x9fb3c8, transparent: true, opacity: 0.55 }));
    group.add(edges); // shares the group's scale
  }

  /** A unit mesh (fits a 1×1×1 box; the object group applies the real size via scale) for a shape or type fallback. */
  private meshForShape(shape: ShapeDef | null, obj: SceneObject): THREE.Mesh {
    const geom = shape?.prim
      ? this.primGeometry(shape.prim)                       // primitive shape, or a model-shape awaiting its GLB
      : this.geometryFor(this.typeToPrimitiveType(obj.type)); // no shape → auto primitive by PhysicalObject type
    const hex = obj.color ?? shape?.color ?? undefined;
    const color = hex ? new THREE.Color(hex) : new THREE.Color(this.typeFallbackColor[obj.type ?? ''] ?? 0x8a97a6);
    const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
      color, metalness: shape?.metalness ?? 0.35, roughness: shape?.roughness ?? 0.65,
    }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  /** A unit primitive geometry (bounded to a 1×1×1 box so `scale` = real size), shared/cached per kind. */
  primGeometry(kind: PrimitiveKind): THREE.BufferGeometry {
    const cached = this.primCache.get(kind);
    if (cached) return cached;
    let g: THREE.BufferGeometry;
    switch (kind) {
      case 'box': g = new THREE.BoxGeometry(1, 1, 1); break;
      case 'cylinder': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 24); break;
      case 'sphere': g = new THREE.SphereGeometry(0.5, 20, 14); break;
      case 'cone': g = new THREE.ConeGeometry(0.5, 1, 24); break;
      case 'torus': g = new THREE.TorusGeometry(0.35, 0.15, 14, 28); break;
      case 'capsule': g = new THREE.CapsuleGeometry(0.35, 0.3, 6, 14); break;
      default: g = new THREE.BoxGeometry(1, 1, 1);
    }
    this.primCache.set(kind, g);
    return g;
  }

  private typeToPrimitiveType(type: string | null): ThreeEquipmentType {
    switch (type) {
      case 'SYSTEM': case 'SKID': return 'tank';
      case 'EQUIPMENT': return 'pump';
      case 'LOCATION': case 'SECTION': case 'PLANT': return 'box';
      default: return 'box';
    }
  }

  /** Shared unit geometry per type (scaled per instance) — one geometry reused for every item of a type. */
  private geometryFor(type: ThreeEquipmentType): THREE.BufferGeometry {
    const cached = this.geomCache.get(type);
    if (cached) return cached;
    let g: THREE.BufferGeometry;
    switch (type) {
      case 'tank': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 24); break;
      case 'pump': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 20); break;
      case 'pipe': g = new THREE.CylinderGeometry(0.5, 0.5, 1, 12); break;
      case 'valve': g = new THREE.SphereGeometry(0.5, 16, 12); break;
      case 'turbine': g = new THREE.CylinderGeometry(0.4, 0.5, 1, 20); break;
      case 'sensor': g = new THREE.SphereGeometry(0.5, 10, 8); break;
      default: g = new THREE.BoxGeometry(1, 1, 1); // transformer, generator, control_panel, box
    }
    this.geomCache.set(type, g);
    return g;
  }
}
