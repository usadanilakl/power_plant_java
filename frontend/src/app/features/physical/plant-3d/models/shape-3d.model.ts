/**
 * The 3D BUILDER's persisted model. Everything here rides in DiagramPlacement rows on a dedicated standalone
 * "__PLANT_3D_SCENE__" Diagram (the builder owns it exclusively → bulk-save is safe):
 *  - a ShapeDef  = one placement, sourceEntityType='Shape3D'  (the reusable shape library)
 *  - a SceneObject = one placement, sourceEntityType='Object3D', sourceEntityId=<PhysicalObject id>
 * The transform/shape payload lives in the placement's svgPath TEXT column as JSON. Zero backend changes.
 */

export const SCENE_DIAGRAM_NAME = '__PLANT_3D_SCENE__';
export const SHAPE_SRC = 'Shape3D';
export const OBJECT_SRC = 'Object3D';

/** Primitive shapes available with no uploaded model — the "simple shapes if no 3D model is provided" set. */
export type PrimitiveKind = 'box' | 'cylinder' | 'sphere' | 'cone' | 'torus' | 'capsule';
export const PRIMITIVE_KINDS: PrimitiveKind[] = ['box', 'cylinder', 'sphere', 'cone', 'torus', 'capsule'];

/** A reusable shape in the library. `kind:'primitive'` today; `kind:'model'` (GLB) is Phase B — the fields are
 *  already here so nothing about the persisted schema changes when uploads land. */
export interface ShapeDef {
  localId: number;                 // stable placement localId within the scene diagram
  name: string;
  kind: 'primitive' | 'model';
  prim?: PrimitiveKind;            // when kind==='primitive'
  color?: string;                  // base color (#rrggbb)
  metalness?: number;              // 0..1
  roughness?: number;              // 0..1
  defaultSize?: { w: number; h: number; d: number };
  // Phase B (GLB) — unused for now:
  modelFileId?: number;            // FileObject id of the uploaded .glb/.gltf
  modelUrl?: string;               // static /uploads/... URL to fetch with GLTFLoader
}

/** A piece of equipment placed in the scene. IS a real PhysicalObject (physicalObjectId); its 3D transform +
 *  which shape it uses live here. shapeLocalId=null → the factory falls back to a primitive by PhysicalObject type. */
export interface SceneObject {
  localId: number;                 // stable placement localId (Object3D)
  physicalObjectId: number;        // sourceEntityId → the PhysicalObject
  name: string;
  type: string | null;             // PhysicalObject type (fallback color/shape)
  shapeLocalId: number | null;     // → ShapeDef.localId, or null for the type fallback
  pos: { x: number; y: number; z: number };
  rot: { x: number; y: number; z: number };
  size: { w: number; h: number; d: number };
  color?: string;                  // per-instance color override
  shell?: boolean;                 // render see-through (transparent + edge outline) so it doesn't hide contents
}

/** What's parsed out of the scene diagram on load. */
export interface SceneData {
  diagramId: number;
  shapes: ShapeDef[];
  objects: SceneObject[];
}
