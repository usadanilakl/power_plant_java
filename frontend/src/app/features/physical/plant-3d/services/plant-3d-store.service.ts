import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DiagramApiService } from '../../../diagram-builder/services/diagram-api.service';
import { DiagramPlacementApiService } from '../../../diagram-builder/services/diagram-placement-api.service';
import { DiagramPlacementDto } from '../../../diagram-builder/models/diagram-placement-dto.model';
import { OBJECT_SRC, SCENE_DIAGRAM_NAME, SHAPE_SRC, SceneData, SceneObject, ShapeDef } from '../models/shape-3d.model';

/**
 * Persists the 3D scene onto a dedicated standalone Diagram (name = SCENE_DIAGRAM_NAME), which this builder owns
 * exclusively. Shapes + placed objects are DiagramPlacement rows discriminated by sourceEntityType; their
 * transform/shape payload rides in the svgPath TEXT column as JSON. bulkSave replaces the whole scene atomically
 * (upsert-by-localId + soft-delete-missing). No backend changes / no restart.
 */
@Injectable({ providedIn: 'root' })
export class Plant3dStore {
  private diagrams = inject(DiagramApiService);
  private placements = inject(DiagramPlacementApiService);

  /** Find-or-create the scene diagram, then load its shapes + objects. */
  async loadScene(): Promise<SceneData> {
    const diagramId = await this.ensureSceneDiagram();
    const resp = await firstValueFrom(this.placements.getByDiagram(diagramId));
    const rows = resp.responseData ?? [];
    const shapes: ShapeDef[] = [];
    const objects: SceneObject[] = [];
    for (const p of rows) {
      if (p.localId == null) continue;
      if (p.sourceEntityType === SHAPE_SRC) {
        const j = this.parse(p.svgPath);
        shapes.push({
          localId: p.localId, name: p.name || 'Shape', kind: j.kind === 'model' ? 'model' : 'primitive',
          prim: j.prim, color: j.color, metalness: j.metalness, roughness: j.roughness,
          defaultSize: j.defaultSize, modelFileId: j.modelFileId, modelUrl: j.modelUrl,
        });
      } else if (p.sourceEntityType === OBJECT_SRC && p.sourceEntityId != null) {
        const j = this.parse(p.svgPath);
        objects.push({
          localId: p.localId, physicalObjectId: p.sourceEntityId, name: p.name || 'Equipment',
          type: j.type ?? null, shapeLocalId: j.shapeLocalId ?? null,
          pos: j.pos ?? { x: 0, y: 0, z: 0 }, rot: j.rot ?? { x: 0, y: 0, z: 0 },
          size: j.size ?? { w: 1, h: 1, d: 1 }, color: j.color, shell: j.shell ?? false,
        });
      }
    }
    return { diagramId, shapes, objects };
  }

  /** Replace the whole scene (shapes + objects) in one bulk-save. */
  async saveScene(diagramId: number, shapes: ShapeDef[], objects: SceneObject[]): Promise<void> {
    const dtos: DiagramPlacementDto[] = [];
    for (const s of shapes) {
      dtos.push({
        diagramId, localId: s.localId, sourceEntityType: SHAPE_SRC, type: 'shape3d',
        name: s.name, label: s.name,
        svgPath: JSON.stringify({
          kind: s.kind, prim: s.prim, color: s.color, metalness: s.metalness, roughness: s.roughness,
          defaultSize: s.defaultSize, modelFileId: s.modelFileId, modelUrl: s.modelUrl,
        }),
        x: 0, y: 0, width: 0, height: 0,
      });
    }
    for (const o of objects) {
      dtos.push({
        diagramId, localId: o.localId, sourceEntityType: OBJECT_SRC, sourceEntityId: o.physicalObjectId,
        type: 'object3d', name: o.name, label: o.name,
        svgPath: JSON.stringify({ type: o.type, shapeLocalId: o.shapeLocalId, pos: o.pos, rot: o.rot, size: o.size, color: o.color, shell: o.shell }),
        x: Math.round(o.pos.x), y: Math.round(o.pos.z), width: 1, height: 1,
      });
    }
    await firstValueFrom(this.placements.bulkSave(diagramId, dtos));
  }

  private async ensureSceneDiagram(): Promise<number> {
    const all = (await firstValueFrom(this.diagrams.getAll())).responseData ?? [];
    const existing = all.find(d => d.name === SCENE_DIAGRAM_NAME && !d.deleted);
    if (existing?.id != null) return existing.id;
    const created = (await firstValueFrom(this.diagrams.create({
      name: SCENE_DIAGRAM_NAME, description: 'Plant 3D scene (builder) — do not edit in the 2D diagram tool',
      canvasWidth: 0, canvasHeight: 0,
    }))).responseData;
    if (created?.id == null) throw new Error('Could not create the 3D scene diagram');
    return created.id;
  }

  private parse(svg: string | undefined): any {
    if (!svg) return {};
    try { return JSON.parse(svg) ?? {}; } catch { return {}; }
  }
}
