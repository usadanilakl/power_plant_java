import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NodeWriteRequest, PhysicalObjectNode, poColor } from '../../../../models/physical/physical-object.models';
import { PhysicalObjectApiService } from '../../../../services/physical/physical-object-api.service';
import { DiagramPlacementApiService } from '../../../diagram-builder/services/diagram-placement-api.service';
import { DiagramConnectionApiService } from '../../../diagram-builder/services/diagram-connection-api.service';
import { DiagramPlacementDto } from '../../../diagram-builder/models/diagram-placement-dto.model';
import { DiagramConnectionDto } from '../../../diagram-builder/models/diagram-connection-dto.model';

/** A labeled box on the map — one child PhysicalObject placed on the current node's canvas. */
export interface MapBox {
  localId: number;   // stable in-diagram id (persists as DiagramPlacement.localId)
  childId: number;   // the PhysicalObject this box represents (sourceEntityId)
  x: number; y: number; width: number; height: number;
  glyph: string;     // equipment-kind glyph key (persists as DiagramPlacement.symbolId)
  color: string;     // explicit box color (persists as DiagramPlacement.color)
  showChildren: boolean; // render the child's interior as a mini-map (persists as DiagramPlacement.locked)
}

/** A link between two boxes — styled as a pipe (persists as a DiagramConnection). */
export interface MapEdge {
  localId: number;
  sourceLocalId: number;
  targetLocalId: number;
  color?: string;    // pipe color (persists as DiagramConnection.color)
  width?: number;    // pipe width (persists as DiagramConnection.lineWidth)
}

const DEFAULT_W = 150;
const DEFAULT_H = 72;

/**
 * Signal-based state + persistence for the purpose-built plant map. Each PhysicalObject node owns a blank
 * canvas (a get-or-created Diagram); its children are drawn as labeled boxes and joined by connections. Boxes
 * persist as {@code DiagramPlacement} rows (sourceEntityType="PhysicalObject", sourceEntityId=childId) and
 * connections as {@code DiagramConnection} rows — the diagram tables are invisible plumbing; there is NO
 * simulator or symbol library. Auto-saves (debounced) on every mutation. Provided per page so it resets.
 */
@Injectable()
export class PlantMapStateService {
  private api = inject(PhysicalObjectApiService);
  private placementApi = inject(DiagramPlacementApiService);
  private connectionApi = inject(DiagramConnectionApiService);

  // ── node context ──
  currentNode = signal<PhysicalObjectNode | null>(null);
  breadcrumb = signal<PhysicalObjectNode[]>([]);
  childNodes = signal<PhysicalObjectNode[]>([]);
  currentDiagramId = signal<number | null>(null);

  // ── canvas model ──
  boxes = signal<MapBox[]>([]);
  edges = signal<MapEdge[]>([]);
  selectedLocalId = signal<number | null>(null);      // selected box
  selectedEdgeLocalId = signal<number | null>(null);  // selected pipe/connection

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  private nextPlacementLocalId = 1;
  private nextConnectionLocalId = 1;
  private saveTimer: any = null;
  private dirty = false;
  /** Tail of the serialized save chain — awaited by flushSave so in-flight writes aren't dropped. */
  private savePromise: Promise<void> | null = null;

  /** child id → node, for deriving box labels/colors from live data. */
  childById = computed(() => new Map(this.childNodes().map(n => [n.id, n])));

  /** Children that don't yet have a box on the canvas (the "to place" palette). */
  unplacedChildren = computed(() => {
    const placed = new Set(this.boxes().map(b => b.childId));
    return this.childNodes().filter(c => !placed.has(c.id));
  });

  /** The currently-selected box's child node (drives the inspector). */
  selectedChild = computed<PhysicalObjectNode | null>(() => {
    const sel = this.selectedLocalId();
    if (sel == null) return null;
    const box = this.boxes().find(b => b.localId === sel);
    return box ? this.childById().get(box.childId) ?? null : null;
  });

  /** The currently-selected box (for appearance edits). */
  selectedBox = computed<MapBox | null>(() => {
    const sel = this.selectedLocalId();
    return sel == null ? null : this.boxes().find(b => b.localId === sel) ?? null;
  });

  /** The currently-selected pipe/connection (for pipe-style edits). */
  selectedEdge = computed<MapEdge | null>(() => {
    const sel = this.selectedEdgeLocalId();
    return sel == null ? null : this.edges().find(e => e.localId === sel) ?? null;
  });

  /** Select a box (clears any pipe selection). */
  selectBox(localId: number | null) {
    this.selectedLocalId.set(localId);
    if (localId != null) this.selectedEdgeLocalId.set(null);
  }

  /** Select a pipe/connection (clears any box selection). */
  selectEdge(localId: number | null) {
    this.selectedEdgeLocalId.set(localId);
    if (localId != null) this.selectedLocalId.set(null);
  }

  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }

  // ── loading ──────────────────────────────────────────────────────────────

  /** Open a node: load identity + breadcrumb + children, get-or-create its canvas, then load boxes + edges. */
  async openNode(id: number) {
    this.loading.set(true); this.error.set(null);
    this.selectedLocalId.set(null); this.selectedEdgeLocalId.set(null);
    this.boxes.set([]); this.edges.set([]);
    try {
      const [node, breadcrumb, children] = await Promise.all([
        firstValueFrom(this.api.getNode(id)),
        firstValueFrom(this.api.getBreadcrumb(id)),
        firstValueFrom(this.api.getChildren(id)),
      ]);
      this.currentNode.set(node);
      this.breadcrumb.set(breadcrumb);
      this.childNodes.set(children);

      const diagram = await firstValueFrom(this.api.getOrCreateDiagram(id));
      const did = diagram?.id ?? null;
      this.currentDiagramId.set(did);
      if (did != null) await this.loadCanvas(did);
    } catch (e: any) {
      this.error.set(this.msg(e));
      this.currentDiagramId.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadCanvas(diagramId: number) {
    const [pRes, cRes] = await Promise.all([
      firstValueFrom(this.placementApi.getByDiagram(diagramId)),
      firstValueFrom(this.connectionApi.getByDiagram(diagramId)),
    ]);
    const placements = pRes?.responseData ?? [];
    const connections = cRes?.responseData ?? [];

    const childById = this.childById();
    const boxes: MapBox[] = placements
      .filter(p => p.sourceEntityType === 'PhysicalObject' && p.sourceEntityId != null && p.localId != null)
      .map(p => ({
        localId: p.localId!,
        childId: p.sourceEntityId!,
        x: p.x ?? 0, y: p.y ?? 0,
        width: p.width ?? DEFAULT_W, height: p.height ?? DEFAULT_H,
        glyph: p.symbolId || 'none',
        color: p.color || poColor(childById.get(p.sourceEntityId!)?.type),
        showChildren: p.locked ?? false,
      }));
    const boxByLocal = new Set(boxes.map(b => b.localId));
    const edges: MapEdge[] = connections
      .filter(c => c.localId != null
        && c.sourcePlacementLocalId != null && c.targetPlacementLocalId != null
        && boxByLocal.has(c.sourcePlacementLocalId) && boxByLocal.has(c.targetPlacementLocalId))
      .map(c => ({
        localId: c.localId!, sourceLocalId: c.sourcePlacementLocalId!, targetLocalId: c.targetPlacementLocalId!,
        color: c.color || undefined, width: c.lineWidth || undefined,
      }));

    this.boxes.set(boxes);
    this.edges.set(edges);
    this.nextPlacementLocalId = boxes.reduce((m, b) => Math.max(m, b.localId), 0) + 1;
    this.nextConnectionLocalId = edges.reduce((m, e) => Math.max(m, e.localId), 0) + 1;
    this.dirty = false;
  }

  /** Persist any pending changes for the current node, then move to another node (drill in or breadcrumb up). */
  async navigate(id: number) {
    await this.flushSave();
    await this.openNode(id);
  }

  // ── node data (actual object) ────────────────────────────────────────────

  /** Create a new child under the current node (returns it; caller places it). */
  async createChild(req: NodeWriteRequest): Promise<PhysicalObjectNode | null> {
    this.error.set(null);
    try {
      const parentId = this.currentNode()?.id ?? null;
      const node = await firstValueFrom(this.api.createNode({ ...req, parentId }));
      if (node && parentId != null) this.childNodes.update(l => [...l, node]);
      return node;
    } catch (e: any) { this.error.set(this.msg(e)); return null; }
  }

  /** Patch a node's actual data (name/type/tag/…). Refreshes the child list so boxes re-derive, then re-saves. */
  async updateNodeData(id: number, req: NodeWriteRequest): Promise<PhysicalObjectNode | null> {
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.updateNode(id, req));
      if (updated) {
        this.childNodes.update(list => list.map(n => (n.id === id ? updated : n)));
        if (this.currentNode()?.id === id) this.currentNode.set(updated);
        this.scheduleSave(); // persist the new label/color onto the placement
      }
      return updated;
    } catch (e: any) { this.error.set(this.msg(e)); return null; }
  }

  /** Delete the PhysicalObject itself (backend blocks if it still has children); also drops its box. */
  async deleteObject(id: number): Promise<boolean> {
    this.error.set(null);
    try {
      await firstValueFrom(this.api.deleteNode(id));
      this.childNodes.update(list => list.filter(n => n.id !== id));
      const box = this.boxes().find(b => b.childId === id);
      if (box) this.removeBox(box.localId);
      return true;
    } catch (e: any) { this.error.set(this.msg(e)); return false; }
  }

  // ── canvas mutations ──────────────────────────────────────────────────────

  /** Place an existing child as a box (no-op if already placed). Returns the new box's localId. */
  placeChild(childId: number, x?: number, y?: number): number | null {
    if (this.boxes().some(b => b.childId === childId)) return null;
    const n = this.boxes().length;
    const localId = this.nextPlacementLocalId++;
    const box: MapBox = {
      localId, childId,
      x: x ?? 60 + (n % 6) * 40, y: y ?? 60 + (n % 6) * 34,
      width: DEFAULT_W, height: DEFAULT_H,
      glyph: 'none', color: poColor(this.childById().get(childId)?.type), showChildren: false,
    };
    this.boxes.update(list => [...list, box]);
    this.selectBox(localId);
    this.scheduleSave();
    return localId;
  }

  setBoxRect(localId: number, x: number, y: number, width: number, height: number) {
    this.boxes.update(list => list.map(b => (b.localId === localId ? { ...b, x, y, width, height } : b)));
    this.scheduleSave();
  }

  /** Patch a box's appearance (glyph / color / mini-map toggle). */
  patchBox(localId: number, patch: Partial<Pick<MapBox, 'glyph' | 'color' | 'showChildren'>>) {
    this.boxes.update(list => list.map(b => (b.localId === localId ? { ...b, ...patch } : b)));
    this.scheduleSave();
  }

  /** Remove a box (keeps the PhysicalObject) and any connections touching it. */
  removeBox(localId: number) {
    this.boxes.update(list => list.filter(b => b.localId !== localId));
    this.edges.update(list => list.filter(e => e.sourceLocalId !== localId && e.targetLocalId !== localId));
    if (this.selectedLocalId() === localId) this.selectedLocalId.set(null);
    this.scheduleSave();
  }

  /** Connect two boxes (ignores self-links and duplicates). Returns the new edge's localId. */
  connect(sourceLocalId: number, targetLocalId: number): number | null {
    if (sourceLocalId === targetLocalId) return null;
    const exists = this.edges().some(e =>
      (e.sourceLocalId === sourceLocalId && e.targetLocalId === targetLocalId) ||
      (e.sourceLocalId === targetLocalId && e.targetLocalId === sourceLocalId));
    if (exists) return null;
    const localId = this.nextConnectionLocalId++;
    this.edges.update(list => [...list, { localId, sourceLocalId, targetLocalId }]);
    this.scheduleSave();
    return localId;
  }

  /** Patch a pipe/connection's style (color / width). */
  patchEdge(localId: number, patch: Partial<Pick<MapEdge, 'color' | 'width'>>) {
    this.edges.update(list => list.map(e => (e.localId === localId ? { ...e, ...patch } : e)));
    this.scheduleSave();
  }

  disconnect(edgeLocalId: number) {
    this.edges.update(list => list.filter(e => e.localId !== edgeLocalId));
    if (this.selectedEdgeLocalId() === edgeLocalId) this.selectedEdgeLocalId.set(null);
    this.scheduleSave();
  }

  // ── persistence ───────────────────────────────────────────────────────────

  private scheduleSave() {
    this.dirty = true;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => { this.saveTimer = null; void this.saveNow(); }, 500);
  }

  /** Flush any pending debounced save AND await any in-flight one (call before navigating away / on destroy). */
  async flushSave() {
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    if (this.dirty) this.saveNow();          // enqueue onto the chain
    if (this.savePromise) await this.savePromise; // wait for the chain tail (in-flight write included)
  }

  /**
   * Persist boxes + edges. Saves are SERIALIZED onto one chain so two debounced saves can't race the
   * backend's soft-delete on the same diagram; each link snapshots the diagram id + data at its own execution
   * time (never mid-await), so a drill that swaps in another node's canvas can't cross-save.
   */
  private saveNow(): Promise<void> {
    const next = (this.savePromise ?? Promise.resolve()).then(() => this.doSave());
    this.savePromise = next.finally(() => { if (this.savePromise === next) this.savePromise = null; });
    return this.savePromise;
  }

  private async doSave() {
    const did = this.currentDiagramId();
    if (did == null) { this.dirty = false; return; }
    const boxes = this.boxes();
    const edges = this.edges();
    const childById = this.childById();
    this.dirty = false;
    this.saving.set(true);
    try {
      const placementDtos: DiagramPlacementDto[] = boxes.map(b => {
        const child = childById.get(b.childId);
        const label = child?.name || child?.tagNumber || `#${b.childId}`;
        return {
          diagramId: did, localId: b.localId,
          sourceEntityType: 'PhysicalObject', sourceEntityId: b.childId,
          type: 'rectangle',
          x: b.x, y: b.y, width: b.width, height: b.height,
          label, name: label,
          color: b.color || poColor(child?.type),
          symbolId: b.glyph || 'none',
          locked: b.showChildren,
        };
      });
      const connectionDtos: DiagramConnectionDto[] = edges.map(e => ({
        diagramId: did, localId: e.localId,
        sourcePlacementLocalId: e.sourceLocalId, targetPlacementLocalId: e.targetLocalId,
        sourceAnchor: 'right', targetAnchor: 'left',
        color: e.color, lineWidth: e.width,
      }));
      await firstValueFrom(this.placementApi.bulkSave(did, placementDtos));
      await firstValueFrom(this.connectionApi.bulkSave(did, connectionDtos));
    } catch (e: any) {
      this.error.set(this.msg(e));
      this.dirty = true; // let the next mutation retry
    } finally {
      this.saving.set(false);
    }
  }
}
