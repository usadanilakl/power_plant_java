import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FootprintShape, normFootprint } from '../plant-glyphs';
import { NodeWriteRequest, PhysicalObjectNode, poColor } from '../../../../models/physical/physical-object.models';
import { PhysicalObjectApiService } from '../../../../services/physical/physical-object-api.service';
import { DiagramPlacementApiService } from '../../../diagram-builder/services/diagram-placement-api.service';
import { DiagramConnectionApiService } from '../../../diagram-builder/services/diagram-connection-api.service';
import { PlantMapBackgroundApiService } from './plant-map-background-api.service';
import { DiagramPlacementDto } from '../../../diagram-builder/models/diagram-placement-dto.model';
import { DiagramConnectionDto } from '../../../diagram-builder/models/diagram-connection-dto.model';

/** A labeled box on the map — one child PhysicalObject placed on the current node's canvas. */
export interface MapBox {
  localId: number;   // stable in-diagram id (persists as DiagramPlacement.localId)
  childId: number;   // the PhysicalObject this box represents (sourceEntityId)
  x: number; y: number; width: number; height: number;
  shape: FootprintShape; // plan-view footprint (persists as DiagramPlacement.type)
  glyph: string;     // equipment-kind badge key (persists as DiagramPlacement.symbolId)
  color: string;     // explicit box color (persists as DiagramPlacement.color)
  showChildren: boolean; // render the child's interior as a mini-map (persists as DiagramPlacement.locked)
}

/** A link between two boxes — a pipe ROUTE (persists as a DiagramConnection). */
export interface MapEdge {
  localId: number;
  sourceLocalId: number;
  targetLocalId: number;
  color?: string;    // pipe color (persists as DiagramConnection.color)
  width?: number;    // pipe width (persists as DiagramConnection.lineWidth)
  waypoints?: { x: number; y: number }[]; // route bends (persists as DiagramConnection.waypointsJson)
}

/** A read-only footprint from ANOTHER floor of the same node — shown dimmed so every level is visible at
 *  once; switch the active level (peeler) to bring it forward and edit it. Never saved (purely visual). */
export interface GhostBox {
  x: number; y: number; width: number; height: number;
  shape: FootprintShape; color: string; floor: number; name: string; childId: number;
}

const DEFAULT_W = 150;
const DEFAULT_H = 72;

/** A fitting on a pipe (valve/instrument/drain/vent/spray) — anchored to a point along the path. Each fitting is
 *  its OWN PhysicalObject (nodeId, a child of the pipe node); its on-pipe geometry rides the parent pipe's placement. */
export interface PipeFitting {
  id: string; type: string; at: { x: number; y: number };
  name?: string; tag?: string; desc?: string; double?: boolean; tag2?: string;
  nodeId?: number; // the fitting's PhysicalObject id (child of the pipe node)
  closed?: boolean; // valve state for the visual flow sim (a closed valve blocks flow through its pipe)
}
/** A cross-section connection point on a pipe (like a P&ID off-page connector). `at` = which endpoint carries it
 *  (source = the pipe's END, destination = its START). `linkId` is SHARED by the two ports of one continuation so
 *  they know each other (jump + highlight). `section` = the counterpart's section id when known (dest stores it). */
export interface PipePort { linkId: string; at: 'start' | 'end'; section?: number; }

/** A pipe = a guided, elbowed route (a polyline) with fittings on it. Each pipe is a real PhysicalObject (nodeId,
 *  child of its parent canvas node); it persists as ONE placement (sourceEntityType='Pipe', geometry+fittings in svgPath). */
export interface PipeGeo {
  id: string; parentId: number; points: { x: number; y: number }[];
  color?: string; width?: number; name?: string; fittings?: PipeFitting[];
  aEnd?: number; bEnd?: number;   // PhysicalObject ids the two ends anchor to (cross-area follow)
  nodeId?: number;                // the pipe's PhysicalObject id
  localId?: number;               // its DiagramPlacement localId on the parent's diagram (stable across saves)
  placementId?: number;           // JPA id of that placement (allows safe updates when its canvas is nested/off-screen)
  groupId?: string;               // shared across the segments of ONE logical pipe that runs through several sections
  continuesFrom?: number;         // the SECTION node this segment was continued from (backward "jump to origin")
  ports?: PipePort[];             // cross-section connectors (source end ↔ destination start), matched by linkId
  flowReversed?: boolean;         // visual-flow direction override for this already-drawn section
}

/** sourceEntityType for a real pipe's placement (a pipe is drawn as a routed line, not a box). Distinct from
 *  'PhysicalObject' so pipes are auto-excluded everywhere boxes are read (loadCanvas boxes, ghosts, boundary,
 *  nested box-filter all key on 'PhysicalObject'). */
export const PIPE_SRC = 'Pipe';
/** LEGACY: the pre-entity blob placement that carried ALL of a node's pipes as one JSON string. Read only by the
 *  one-time migration that promotes it to real pipe/fitting PhysicalObjects, then dropped. */
export const PIPE_META = '__pipes__';
/** The placement row carrying the reference-image METADATA (opacity/ext). The image BYTES are a separate synced
 *  file (NgPlantMapBackgroundService); this tiny JSON row rides the diagram like PIPE_META. */
export const BG_SRC = '__bg__';

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
  private bgApi = inject(PlantMapBackgroundApiService);

  // ── node context ──
  currentNode = signal<PhysicalObjectNode | null>(null);
  breadcrumb = signal<PhysicalObjectNode[]>([]);
  childNodes = signal<PhysicalObjectNode[]>([]);
  currentDiagramId = signal<number | null>(null);

  // ── canvas model ──
  boxes = signal<MapBox[]>([]);       // the ACTIVE floor — editable
  edges = signal<MapEdge[]>([]);
  ghostBoxes = signal<GhostBox[]>([]); // the OTHER floors — read-only, dimmed context (so all levels are visible)
  selectedLocalId = signal<number | null>(null);      // selected box
  selectedEdgeLocalId = signal<number | null>(null);  // selected pipe/connection
  selectedNestedNode = signal<PhysicalObjectNode | null>(null); // a clicked zoom-nested descendant (info-only)

  // ── system layers (cross-cutting overlay) ──
  /** childId → set of System value ids it belongs to (current node's children). */
  childSystems = signal<Map<number, Set<number>>>(new Map());
  /** The System value currently used as the highlight layer (null = no layer). */
  activeSystemId = signal<number | null>(null);

  // ── levels / floors (a node's canvas delegates to its top level; peel down to lower levels or Base) ──
  /** The node whose diagram + children are actually rendered — a level of currentNode, or currentNode itself. */
  canvasNode = signal<PhysicalObjectNode | null>(null);
  /** currentNode's level-children (floors), top→ground; the peeler list. Empty when the node has no levels. */
  nodeFloors = signal<PhysicalObjectNode[]>([]);
  /** Which level is being viewed (a floor id), or null = the node's own Base canvas. */
  viewedLevelId = signal<number | null>(null);

  // ── work areas (permit safety binder) ──
  /** childId → count of work areas bound to it (drives the map's safety badge). */
  childWorkAreas = signal<Map<number, number>>(new Map());

  // ── parent boundary (this node's footprint, from its box on the parent's canvas) ──
  boundary = signal<{ x: number; y: number; w: number; h: number } | null>(null);

  // ── reference underlay (satellite / plot plan traced beneath the footprints) ──
  /** Servable URL of the current canvas's reference image (a synced file, shared across devices; null = none). */
  backgroundUrl = signal<string | null>(null);
  backgroundOpacity = signal(0.55);
  private bgLocalId: number | null = null;   // stable localId of the __bg__ metadata placement
  private bgExt: string | null = null;        // stored so the metadata row records the image's extension

  // ── pipes — each pipe is a real PhysicalObject drawn as a routed line, persisted as a 'Pipe' placement on its
  //    parent's diagram (geometry + fittings JSON in svgPath). This signal holds the CANVAS node's pipes; the
  //    component owns rendering/editing (a global pipeGeos) and pushes the current node's slice here to persist.
  pipes = signal<PipeGeo[]>([]);
  /** Bumped once per canvas load (after pipes + identity are settled) so the component applies them to its global
   *  pipeGeos exactly once per load — never mid-load with a mismatched node, never on its own save round-trips. */
  pipesLoadSeq = signal(0);
  /** The node id the just-loaded pipes/blob belong to. The component applies pipes to THIS node (not the current
   *  canvasNode) so overlapping navigations can't cross-contaminate one node's pipes onto another. */
  pipesLoadNodeId = signal<number | null>(null);
  /** A legacy blob (PIPE_META) found on the just-loaded canvas that still needs promoting to real entities — the
   *  component's migration reads this; null when there's nothing to migrate. Re-emitted verbatim by doSave (so the
   *  complete-set soft-delete can't drop it) until clearLegacyBlob() is called after a successful migration save. */
  pipesLegacyBlob = signal<string | null>(null);
  private legacyBlobLocalId: number | null = null;
  /** Node ids that are pipes/fittings (routed lines, not placeable boxes) — kept in sync by the component from its
   *  global pipeGeos; excluded from the "to place" palette so they never appear as droppable boxes. */
  hiddenChildIds = signal<Set<number>>(new Set());

  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  private nextPlacementLocalId = 1;
  private nextConnectionLocalId = 1;
  private saveTimer: any = null;
  private dirty = false;
  private saveRetries = 0; // bounded self-retry so a transient save failure doesn't strand a write (e.g. migration's blob-drop)
  /** Tail of the serialized save chain — awaited by flushSave so in-flight writes aren't dropped. */
  private savePromise: Promise<void> | null = null;

  /** child id → node, for deriving box labels/colors from live data. */
  childById = computed(() => new Map(this.childNodes().map(n => [n.id, n])));

  /** Children that don't yet have a box on the canvas (the "to place" palette). Floors are excluded — they live in
   *  the elevation switcher; pipe/fitting nodes are excluded — they're routed lines, not droppable boxes. */
  unplacedChildren = computed(() => {
    const placed = new Set(this.boxes().map(b => b.childId));
    const hidden = this.hiddenChildIds();
    return this.childNodes().filter(c => !placed.has(c.id) && c.floorIndex == null && !hidden.has(c.id));
  });

  /**
   * Floors to show in the peeler + which is "here" (a level id, or null = Base). The node's own content is
   * the Base; its level-children stack above it, top elevation first. Empty when the node has no levels.
   */
  floorSwitcher = computed<{ floors: PhysicalObjectNode[]; currentId: number | null }>(() =>
    ({ floors: this.nodeFloors(), currentId: this.viewedLevelId() }));

  /** The currently-selected object's node (drives the inspector) — a box's child, or a clicked nested descendant. */
  selectedChild = computed<PhysicalObjectNode | null>(() => {
    const sel = this.selectedLocalId();
    if (sel != null) {
      const box = this.boxes().find(b => b.localId === sel);
      return box ? this.childById().get(box.childId) ?? null : null;
    }
    return this.selectedNestedNode(); // a clicked zoom-nested descendant — info only, no box on this canvas
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

  /**
   * Multi-selection, ORDERED — index 0 is the REFERENCE that align / match-size measure against (same rule as
   * the form designer). `selectedLocalId` stays the single-selection anchor the inspector keys on, and always
   * mirrors entry 0, so every existing single-select consumer keeps working untouched.
   */
  selectedLocalIds = signal<number[]>([]);

  selectedBoxes = computed<MapBox[]>(() => {
    const byId = new Map(this.boxes().map(b => [b.localId, b]));
    return this.selectedLocalIds().map(id => byId.get(id)).filter((b): b is MapBox => !!b);
  });

  /** Replace the whole selection (first id becomes the reference). */
  setSelection(localIds: number[]) {
    this.selectedLocalIds.set(localIds);
    this.selectedLocalId.set(localIds[0] ?? null);
    if (localIds.length) { this.selectedEdgeLocalId.set(null); this.selectedNestedNode.set(null); }
  }

  /** Modifier-click: add the box to the selection, or drop it if already in. */
  toggleBoxSelection(localId: number) {
    const ids = this.selectedLocalIds();
    this.setSelection(ids.includes(localId) ? ids.filter(i => i !== localId) : [...ids, localId]);
  }

  /** Select a box (clears pipe + nested selection). */
  selectBox(localId: number | null) {
    this.selectedLocalId.set(localId);
    this.selectedLocalIds.set(localId == null ? [] : [localId]);
    if (localId != null) { this.selectedEdgeLocalId.set(null); this.selectedNestedNode.set(null); }
  }

  /** Select a pipe/connection (clears box + nested selection). */
  selectEdge(localId: number | null) {
    this.selectedEdgeLocalId.set(localId);
    if (localId != null) { this.selectedLocalId.set(null); this.selectedLocalIds.set([]); this.selectedNestedNode.set(null); }
  }

  /** Select a zoom-nested descendant to show its info (it has no box on this canvas). */
  selectNested(node: PhysicalObjectNode | null) {
    this.selectedNestedNode.set(node);
    if (node != null) { this.selectedLocalId.set(null); this.selectedLocalIds.set([]); this.selectedEdgeLocalId.set(null); }
  }

  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }

  // ── loading ──────────────────────────────────────────────────────────────

  /** Open a node: load its identity + breadcrumb, then show its canvas — its TOP level if it has levels
   *  (view-from-top), otherwise its own Base canvas. Peel down to lower levels / Base via the peeler. */
  async openNode(id: number) {
    this.loading.set(true); this.error.set(null);
    this.selectedLocalId.set(null); this.selectedLocalIds.set([]); this.selectedEdgeLocalId.set(null); this.selectedNestedNode.set(null);
    this.boxes.set([]); this.edges.set([]); this.ghostBoxes.set([]);
    this.childSystems.set(new Map());
    this.activeSystemId.set(null); // each node starts with no active layer (avoids a stale highlight on drill)
    this.nodeFloors.set([]);
    this.viewedLevelId.set(null);
    this.canvasNode.set(null);
    this.childWorkAreas.set(new Map());
    this.boundary.set(null);
    this.clearBackgroundState();
    try {
      const [node, breadcrumb, children] = await Promise.all([
        firstValueFrom(this.api.getNode(id)),
        firstValueFrom(this.api.getBreadcrumb(id)),
        firstValueFrom(this.api.getChildren(id)),
      ]);
      if (!node) { this.error.set('Node not found'); this.currentDiagramId.set(null); return; }
      this.currentNode.set(node);
      this.breadcrumb.set(breadcrumb);
      await this.computeBoundary(node, breadcrumb);
      // Levels: a node's canvas delegates to a level; its own direct content is the Base. Land on the
      // top-most level that ACTUALLY HAS content (else Base if it has content, else the top level) — so a
      // leveled node never opens on an empty deck while the user's objects sit on another level / the Base.
      const floors = children
        .filter(c => c.local !== false && c.floorIndex != null)
        .sort((a, b) => (b.floorIndex ?? 0) - (a.floorIndex ?? 0));
      this.nodeFloors.set(floors);
      const baseKids = children.filter(c => c.local !== false && c.floorIndex == null);
      if (floors.length) {
        const floorKids = await Promise.all(floors.map(f =>
          firstValueFrom(this.api.getChildren(f.id)).catch(() => [] as PhysicalObjectNode[])));
        const hasContent = (kids: PhysicalObjectNode[]) => kids.some(k => k.local !== false && k.floorIndex == null);
        const idx = floorKids.findIndex(hasContent);
        if (idx >= 0) { this.viewedLevelId.set(floors[idx].id); await this.loadCanvasNode(floors[idx], floorKids[idx]); }
        else if (baseKids.length) { this.viewedLevelId.set(null); await this.loadCanvasNode(node, children); }
        else { this.viewedLevelId.set(floors[0].id); await this.loadCanvasNode(floors[0], floorKids[0]); }
      } else {
        this.viewedLevelId.set(null);
        await this.loadCanvasNode(node, children);
      }
    } catch (e: any) {
      this.error.set(this.msg(e));
      this.currentDiagramId.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load the visible canvas for `cn` — the node itself (Base) or one of its levels. currentNode stays the
   * context (breadcrumb/levels); `cn` owns the diagram + children shown. Binder mode: only local children.
   */
  private async loadCanvasNode(cn: PhysicalObjectNode, preChildren?: PhysicalObjectNode[]) {
    this.canvasNode.set(cn);
    this.selectedLocalId.set(null); this.selectedLocalIds.set([]); this.selectedEdgeLocalId.set(null); this.selectedNestedNode.set(null);
    // Null the diagram id the instant we clear the boxes: during the async load gap the canvas has no valid
    // save target, so a mutation made mid-load can't bulk-save one box to the OLD diagram (which would
    // soft-delete everything on it). doSave early-returns when currentDiagramId is null.
    this.currentDiagramId.set(null);
    this.boxes.set([]); this.edges.set([]); this.ghostBoxes.set([]);
    this.clearBackgroundState();
    const [children, childSystems, childWorkAreas] = await Promise.all([
      preChildren ? Promise.resolve(preChildren) : firstValueFrom(this.api.getChildren(cn.id)),
      firstValueFrom(this.api.getChildSystems(cn.id)),
      firstValueFrom(this.api.getChildWorkAreas(cn.id)),
    ]);
    this.childNodes.set(children.filter(c => c.local !== false));
    this.childSystems.set(this.toChildSystemsMap(childSystems));
    this.childWorkAreas.set(this.toCountMap(childWorkAreas));
    const diagram = await firstValueFrom(this.api.getOrCreateDiagram(cn.id));
    const did = diagram?.id ?? null;
    this.currentDiagramId.set(did);
    if (did != null) { void this.loadBackground(did); await this.loadCanvas(did); }
    else { // no diagram → no pipes
      this.pipes.set([]); this.pipesLegacyBlob.set(null); this.legacyBlobLocalId = null; this.hiddenChildIds.set(new Set());
      this.pipesLoadNodeId.set(cn.id); this.pipesLoadSeq.update(n => n + 1);
    }
    await this.loadGhosts(cn.id); // the OTHER floors, dimmed, so all levels are visible together
  }

  /** Load the OTHER floors' placements as read-only ghosts (dimmed context). The active floor (`activeNodeId`)
   *  is excluded — it's the editable `boxes`. Purely visual: ghosts are never saved. */
  private async loadGhosts(activeNodeId: number) {
    const node = this.currentNode();
    if (!node) { this.ghostBoxes.set([]); return; }
    const nodeId = node.id;
    const floorNodes = [
      { id: node.id, floor: 0, diagramId: node.diagramId ?? null },
      ...this.nodeFloors().map(f => ({ id: f.id, floor: f.floorIndex ?? 0, diagramId: f.diagramId ?? null })),
    ].filter(fn => fn.id !== activeNodeId && fn.diagramId != null);
    const ghosts: GhostBox[] = [];
    await Promise.all(floorNodes.map(async fn => {
      try {
        const res = await firstValueFrom(this.placementApi.getByDiagram(fn.diagramId!));
        for (const p of (res?.responseData ?? [])) {
          if (p.sourceEntityType !== 'PhysicalObject' || (p.width ?? 0) <= 0 || (p.height ?? 0) <= 0) continue;
          ghosts.push({
            x: p.x ?? 0, y: p.y ?? 0, width: p.width ?? 0, height: p.height ?? 0,
            shape: normFootprint(p.type), color: p.color || '#8aa0b6', floor: fn.floor,
            name: p.label || p.name || '', childId: p.sourceEntityId ?? 0,
          });
        }
      } catch { /* skip this floor's ghosts */ }
    }));
    if (this.currentNode()?.id !== nodeId) return; // navigated away mid-fetch → drop stale ghosts
    this.ghostBoxes.set(ghosts);
  }

  /** Peel to a specific level of the current node (view-from-top → down). currentNode stays put. */
  async peelToLevel(levelId: number) {
    if (this.viewedLevelId() === levelId) return;
    await this.flushSave();
    const floor = this.nodeFloors().find(f => f.id === levelId);
    if (!floor) return;
    this.viewedLevelId.set(levelId);
    await this.loadCanvasNode(floor);
  }

  /** Peel to the node's own Base canvas (its direct, non-level content). */
  async peelToBase() {
    if (this.viewedLevelId() == null) return;
    const node = this.currentNode();
    if (!node) return;
    await this.flushSave();
    this.viewedLevelId.set(null);
    await this.loadCanvasNode(node);
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
        shape: normFootprint(p.type),
        glyph: p.symbolId || 'none',
        color: p.color || poColor(childById.get(p.sourceEntityId!)?.type),
        showChildren: p.locked ?? false,
      }));
    const boxByLocal = new Set(boxes.map(b => b.localId));
    const edges: MapEdge[] = connections
      .filter(c => c.localId != null
        && c.sourcePlacementLocalId != null && c.targetPlacementLocalId != null
        && boxByLocal.has(c.sourcePlacementLocalId) && boxByLocal.has(c.targetPlacementLocalId))
      .map(c => {
        let waypoints: { x: number; y: number }[] | undefined;
        try { waypoints = c.waypointsJson ? JSON.parse(c.waypointsJson) : undefined; } catch { waypoints = undefined; }
        return {
          localId: c.localId!, sourceLocalId: c.sourcePlacementLocalId!, targetLocalId: c.targetPlacementLocalId!,
          color: c.color || undefined, width: c.lineWidth || undefined, waypoints,
        };
      });

    // Real pipe placements (sourceEntityType='Pipe'): each carries its own geometry + fittings JSON in svgPath.
    const pipes: PipeGeo[] = placements
      .filter(p => p.sourceEntityType === PIPE_SRC && p.sourceEntityId != null && p.localId != null)
      .map(p => {
        let geo: { points?: any; fittings?: any; aEnd?: number; bEnd?: number; groupId?: string; continuesFrom?: number; ports?: any; flowReversed?: boolean } = {};
        try { geo = p.svgPath ? JSON.parse(p.svgPath) : {}; } catch { geo = {}; }
        return {
          id: 'pipe-' + p.sourceEntityId!, parentId: this.canvasNode()?.id ?? 0,
          nodeId: p.sourceEntityId!, localId: p.localId!, placementId: p.id,
          points: Array.isArray(geo.points) ? geo.points : [],
          fittings: Array.isArray(geo.fittings) ? geo.fittings : [],
          aEnd: geo.aEnd ?? undefined, bEnd: geo.bEnd ?? undefined, groupId: geo.groupId ?? undefined,
          continuesFrom: geo.continuesFrom ?? undefined, ports: Array.isArray(geo.ports) ? geo.ports : undefined,
          flowReversed: geo.flowReversed ?? undefined,
          color: p.color || undefined, width: p.lineWidth || undefined,
          name: p.label || p.name || 'Pipe',
        } as PipeGeo;
      });

    // Legacy pre-entity blob (PIPE_META): kept + re-emitted verbatim by doSave (so the complete-set soft-delete
    // can't drop it) until the component's migration promotes it to real entities and calls clearLegacyBlob().
    const legacy = placements.find(p => p.sourceEntityType === PIPE_META && p.localId != null);
    this.legacyBlobLocalId = legacy?.localId ?? null;

    // Background metadata row (opacity/ext); the URL itself is fetched separately by loadBackground.
    const bg = placements.find(p => p.sourceEntityType === BG_SRC && p.localId != null);
    this.bgLocalId = bg?.localId ?? null;
    if (bg) {
      try { const j = JSON.parse(bg.svgPath || '{}'); this.backgroundOpacity.set(typeof j.opacity === 'number' ? j.opacity : 0.55); if (j.ext) this.bgExt = j.ext; }
      catch { this.backgroundOpacity.set(0.55); }
    }

    this.boxes.set(boxes);
    this.edges.set(edges);
    this.pipes.set(pipes);
    this.pipesLegacyBlob.set(legacy?.svgPath ?? null);
    // Seed the hidden-child set synchronously so the just-loaded pipe/fitting nodes never flash in the palette.
    const hidden = new Set<number>();
    for (const p of pipes) { if (p.nodeId != null) hidden.add(p.nodeId); for (const f of (p.fittings ?? [])) if (f.nodeId != null) hidden.add(f.nodeId); }
    this.hiddenChildIds.set(hidden);
    this.nextPlacementLocalId = Math.max(
      boxes.reduce((m, b) => Math.max(m, b.localId), 0),
      pipes.reduce((m, p) => Math.max(m, p.localId ?? 0), 0),
      legacy?.localId ?? 0, bg?.localId ?? 0) + 1;
    this.nextConnectionLocalId = edges.reduce((m, e) => Math.max(m, e.localId), 0) + 1;
    this.dirty = false;
    this.pipesLoadNodeId.set(this.canvasNode()?.id ?? null);
    this.pipesLoadSeq.update(n => n + 1); // pipes + identity now settled → let the component apply them once
  }

  /**
   * The current node's footprint = the size of ITS box on the parent's canvas, scaled up to a comfortable
   * working area and drawn as a boundary frame. Gives a sense of "where the parent's space ends" while placing
   * children (and keeps child layouts proportional to how the node reads on the level above). Root → no frame.
   */
  private async computeBoundary(node: PhysicalObjectNode | null, breadcrumb: PhysicalObjectNode[]) {
    if (!node || breadcrumb.length < 2) return;
    const parent = breadcrumb[breadcrumb.length - 2];
    if (parent?.diagramId == null) return;
    try {
      const res = await firstValueFrom(this.placementApi.getByDiagram(parent.diagramId));
      const p = (res?.responseData ?? []).find(pl =>
        pl.sourceEntityType === 'PhysicalObject' && pl.sourceEntityId === node.id && pl.width && pl.height);
      if (!p || !p.width || !p.height) return;
      const scale = 1100 / Math.max(p.width, p.height);
      this.boundary.set({ x: 24, y: 24, w: Math.round(p.width * scale), h: Math.round(p.height * scale) });
    } catch { /* no boundary */ }
  }

  /** Persist any pending changes for the current node, then move to another node (drill in or breadcrumb up). */
  async navigate(id: number) {
    await this.flushSave();
    await this.openNode(id);
  }

  // ── node data (actual object) ────────────────────────────────────────────

  /** Create a new child under the CANVAS node (the viewed level, or the node's Base); caller places it. */
  async createChild(req: NodeWriteRequest): Promise<PhysicalObjectNode | null> {
    this.error.set(null);
    try {
      const parentId = this.canvasNode()?.id ?? this.currentNode()?.id ?? null;
      const node = await firstValueFrom(this.api.createNode({ ...req, parentId }));
      if (node && parentId != null) this.childNodes.update(l => [...l, node]);
      return node;
    } catch (e: any) { this.error.set(this.msg(e)); return null; }
  }

  /** Add a level to the CURRENT node (levels belong to the node, not to whichever level is being viewed) and
   *  peel to it so it can be built on. Levels live in the peeler, never as a box. */
  async createFloor(name: string): Promise<PhysicalObjectNode | null> {
    const parentId = this.currentNode()?.id ?? null;
    if (parentId == null) return null;
    const nextIndex = this.nodeFloors().reduce((m, f) => Math.max(m, f.floorIndex ?? -1), -1) + 1;
    try {
      const node = await firstValueFrom(this.api.createNode(
        { name: name || `Level ${nextIndex}`, type: 'LOCATION', floorIndex: nextIndex, parentId }));
      if (node) {
        this.nodeFloors.update(list => [...list, node].sort((a, b) => (b.floorIndex ?? 0) - (a.floorIndex ?? 0)));
        await this.peelToLevel(node.id);
      }
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
        // keep the peeler in sync + re-sort if a level's elevation (floorIndex) changed
        this.nodeFloors.update(list => list.map(n => (n.id === id ? updated : n))
          .sort((a, b) => (b.floorIndex ?? 0) - (a.floorIndex ?? 0)));
        // A box's object that just became a floor leaves the 2D canvas (it's a level now).
        if (updated.floorIndex != null) {
          const box = this.boxes().find(b => b.childId === updated.id);
          if (box) this.removeBox(box.localId);
        }
        if (this.currentNode()?.id === id) this.currentNode.set(updated);
        this.scheduleSave(); // persist the new label onto the placement
      }
      return updated;
    } catch (e: any) { this.error.set(this.msg(e)); return null; }
  }

  /** Link a node to a Maximo asset/location (or re-link); refreshes the node so its WO/SR tab lights up. */
  async linkMaximo(id: number, req: { assetnum?: string; location?: string; siteid?: string; maximoType?: string }): Promise<PhysicalObjectNode | null> {
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.linkMaximo(id, req));
      if (updated) {
        this.childNodes.update(l => l.map(n => (n.id === id ? updated : n)));
        if (this.currentNode()?.id === id) this.currentNode.set(updated);
      }
      return updated;
    } catch (e: any) { this.error.set(this.msg(e)); return null; }
  }

  /** Remove a node's Maximo link. */
  async unlinkMaximo(id: number): Promise<PhysicalObjectNode | null> {
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.unlinkMaximo(id));
      if (updated) {
        this.childNodes.update(l => l.map(n => (n.id === id ? updated : n)));
        if (this.currentNode()?.id === id) this.currentNode.set(updated);
      }
      return updated;
    } catch (e: any) { this.error.set(this.msg(e)); return null; }
  }

  /** Delete the PhysicalObject itself (backend blocks if it still has children); also drops its box or, if it
   *  was the level being viewed, peels to the next remaining level / Base. */
  async deleteObject(id: number): Promise<boolean> {
    this.error.set(null);
    try {
      await firstValueFrom(this.api.deleteNode(id));
      this.childNodes.update(list => list.filter(n => n.id !== id));
      const remainingFloors = this.nodeFloors().filter(n => n.id !== id);
      this.nodeFloors.set(remainingFloors);
      const box = this.boxes().find(b => b.childId === id);
      if (box) this.removeBox(box.localId);
      if (this.viewedLevelId() === id) { // deleted the level we were on → re-view
        if (remainingFloors.length) await this.peelToLevel(remainingFloors[0].id);
        else await this.peelToBase();
      }
      return true;
    } catch (e: any) { this.error.set(this.msg(e)); return false; }
  }

  // ── system layers ─────────────────────────────────────────────────────────

  private toChildSystemsMap(rec: Record<string, number[]>): Map<number, Set<number>> {
    const map = new Map<number, Set<number>>();
    for (const [k, v] of Object.entries(rec ?? {})) map.set(Number(k), new Set(v ?? []));
    return map;
  }

  private toCountMap(rec: Record<string, number>): Map<number, number> {
    const map = new Map<number, number>();
    for (const [k, v] of Object.entries(rec ?? {})) map.set(Number(k), v);
    return map;
  }

  /** Re-fetch the safety-badge counts for the current node's children (after a work-area link/unlink). */
  async reloadChildWorkAreas() {
    const id = this.currentNode()?.id;
    if (id == null) return;
    try { this.childWorkAreas.set(this.toCountMap(await firstValueFrom(this.api.getChildWorkAreas(id)))); }
    catch { /* keep prior counts */ }
  }

  /** True when object `childId` belongs to System value `systemId`. */
  childInSystem(childId: number, systemId: number): boolean {
    return this.childSystems().get(childId)?.has(systemId) ?? false;
  }

  /** Seed one object's System membership into the map (for a selected pipe/fitting not covered by the canvas
   *  node's child-systems load) so a subsequent toggle computes from the REAL set, never an empty base. */
  primeChildSystems(id: number, systemIds: number[]) {
    this.childSystems.update(m => { const n = new Map(m); n.set(id, new Set(systemIds)); return n; });
  }

  /** Replace an object's System membership and refresh the local map (for highlight + inspector). */
  async setObjectSystems(childId: number, systemIds: number[]) {
    this.error.set(null);
    try {
      // Use the server's returned systems as source of truth (it silently drops any unknown Value id).
      const result = await firstValueFrom(this.api.setObjectSystems(childId, systemIds));
      const ids = new Set(result.map(r => r.id));
      this.childSystems.update(m => {
        const next = new Map(m);
        next.set(childId, ids);
        return next;
      });
    } catch (e: any) { this.error.set(this.msg(e)); }
  }

  // ── canvas mutations ──────────────────────────────────────────────────────

  /** Place an existing child as a box (no-op if already placed or if it's a floor). Returns the new box's localId. */
  placeChild(childId: number, x?: number, y?: number, shape: FootprintShape = 'rect'): number | null {
    if (this.childById().get(childId)?.floorIndex != null) return null; // floors → elevation switcher, not a box
    if (this.boxes().some(b => b.childId === childId)) return null;
    const n = this.boxes().length;
    const localId = this.nextPlacementLocalId++;
    const box: MapBox = {
      localId, childId,
      x: x ?? 60 + (n % 6) * 40, y: y ?? 60 + (n % 6) * 34,
      width: DEFAULT_W, height: DEFAULT_H,
      shape,
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

  /** Patch a box's appearance (footprint shape / glyph badge / color / mini-map toggle). */
  patchBox(localId: number, patch: Partial<Pick<MapBox, 'shape' | 'glyph' | 'color' | 'showChildren'>>) {
    this.boxes.update(list => list.map(b => (b.localId === localId ? { ...b, ...patch } : b)));
    this.scheduleSave();
  }

  /** Remove a box (keeps the PhysicalObject) and any connections touching it. */
  removeBox(localId: number) {
    this.boxes.update(list => list.filter(b => b.localId !== localId));
    this.edges.update(list => list.filter(e => e.sourceLocalId !== localId && e.targetLocalId !== localId));
    this.selectedLocalIds.update(ids => ids.filter(i => i !== localId));
    if (this.selectedLocalId() === localId) this.selectedLocalId.set(this.selectedLocalIds()[0] ?? null);
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

  /** Insert a route bend (waypoint) into a pipe at `index`. */
  insertWaypoint(localId: number, index: number, x: number, y: number) {
    this.edges.update(list => list.map(e => {
      if (e.localId !== localId) return e;
      const wps = [...(e.waypoints ?? [])];
      wps.splice(Math.max(0, Math.min(index, wps.length)), 0, { x, y });
      return { ...e, waypoints: wps };
    }));
    this.scheduleSave();
  }

  /** Move an existing route bend. */
  moveWaypoint(localId: number, index: number, x: number, y: number) {
    this.edges.update(list => list.map(e => {
      if (e.localId !== localId) return e;
      const wps = [...(e.waypoints ?? [])];
      if (index < 0 || index >= wps.length) return e;
      wps[index] = { x, y };
      return { ...e, waypoints: wps };
    }));
    this.scheduleSave();
  }

  /** Delete a route bend (double-click a handle). */
  removeWaypoint(localId: number, index: number) {
    this.edges.update(list => list.map(e => {
      if (e.localId !== localId) return e;
      const wps = [...(e.waypoints ?? [])];
      if (index < 0 || index >= wps.length) return e;
      wps.splice(index, 1);
      return { ...e, waypoints: wps.length ? wps : undefined };
    }));
    this.scheduleSave();
  }

  disconnect(edgeLocalId: number) {
    this.edges.update(list => list.filter(e => e.localId !== edgeLocalId));
    if (this.selectedEdgeLocalId() === edgeLocalId) this.selectedEdgeLocalId.set(null);
    this.scheduleSave();
  }

  // ── reference underlay (satellite / plot plan) ──────────────────────────────
  // The image BYTES are a synced file on disk (NgPlantMapBackgroundService); the opacity/ext METADATA rides the
  // diagram as a tiny '__bg__' placement (see doSave / loadCanvas). Shared across devices.

  private clearBackgroundState() { this.backgroundUrl.set(null); this.bgLocalId = null; this.bgExt = null; this.backgroundOpacity.set(0.55); }

  /** Fetch the current canvas's background URL (lazily pulling the bytes to this device if a peer uploaded them). */
  private async loadBackground(did: number) {
    try {
      const r = await firstValueFrom(this.bgApi.get(did));
      if (this.currentDiagramId() !== did) return;     // navigated away during the fetch
      this.backgroundUrl.set(r?.responseData?.url ?? null);
      if (r?.responseData?.ext) this.bgExt = r.responseData.ext;
    } catch { if (this.currentDiagramId() === did) this.backgroundUrl.set(null); }
  }

  /** Upload the picked image for the current canvas. Returns false if the canvas changed since picking. */
  async uploadBackground(file: File, expectedDid?: number | null): Promise<boolean> {
    const did = this.currentDiagramId();
    if (did == null) return false;
    if (expectedDid != null && expectedDid !== did) return false;
    try {
      const res = (await firstValueFrom(this.bgApi.upload(did, file)))?.responseData;
      if (this.currentDiagramId() !== did) return false;  // drilled away mid-upload
      if (!res) { this.error.set('Could not save the background.'); return false; }
      this.error.set(null);
      this.backgroundUrl.set(res.url);
      this.bgExt = res.ext;
      this.scheduleSave();                                // persist the __bg__ metadata row
      return true;
    } catch (e: any) { this.error.set(this.msg(e)); return false; }
  }

  async clearBackgroundImage() {
    const did = this.currentDiagramId();
    this.backgroundUrl.set(null); this.bgLocalId = null; this.bgExt = null;
    if (did != null) { try { await firstValueFrom(this.bgApi.delete(did)); } catch { /* ignore */ } }
    this.scheduleSave();                                  // stop emitting __bg__ → soft-deleted
  }

  setBackgroundOpacity(o: number) {
    this.backgroundOpacity.set(o);
    if (this.backgroundUrl()) this.scheduleSave();        // persist opacity onto the __bg__ row (debounced)
  }

  // ── persistence ───────────────────────────────────────────────────────────

  /** Stop preserving the legacy blob — its pipes have been migrated (or already exist as real placements), so the
   *  next save drops the blob (no longer re-emitted). Schedules that save so the blob is actually cleaned even on
   *  the dedup path (no other mutation follows there); on the migration path the following savePipes() coalesces. */
  clearLegacyBlob() {
    if (this.pipesLegacyBlob() == null && this.legacyBlobLocalId == null) return; // already clear → no needless save
    this.pipesLegacyBlob.set(null); this.legacyBlobLocalId = null; this.scheduleSave();
  }

  /** Drop a node from the in-memory child list (e.g. a just-deleted pipe) so its now soft-deleted entity can't
   *  linger as a droppable box in the "to place" palette. */
  forgetChildNode(id: number) { this.childNodes.update(l => l.filter(n => n.id !== id)); }

  /** Replace the CANVAS node's pipes and persist them (component owns the pipe UI; this is the sink). Assigns a
   *  stable placement localId to any new pipe so each pipe updates one row rather than churning. */
  setPipes(pipes: PipeGeo[]) {
    for (const p of pipes) if (p.localId == null) p.localId = this.nextPlacementLocalId++;
    this.pipes.set(pipes);
    this.scheduleSave();
  }

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
    const pipes = this.pipes();
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
          type: b.shape || 'rect',
          x: b.x, y: b.y, width: b.width, height: b.height,
          label, name: label,
          color: b.color || poColor(child?.type),
          symbolId: b.glyph || 'none',
          locked: b.showChildren,
        };
      });
      // Each pipe = one real placement (sourceEntityType='Pipe', sourceEntityId = the pipe's PhysicalObject),
      // geometry+fittings in svgPath. Part of the complete set → the backend's soft-delete-missing drops pipes the
      // user removed. A legacy PIPE_META blob (if any) is intentionally NOT re-emitted → it's cleaned up once its
      // pipes have migrated to real entities.
      for (const p of pipes) {
        if (p.nodeId == null) continue; // not yet a real entity (createNode pending/failed) — skip until it is
        const localId = p.localId ?? this.nextPlacementLocalId++;
        const xs = p.points.map(pt => pt.x), ys = p.points.map(pt => pt.y);
        const minX = xs.length ? Math.min(...xs) : 0, minY = ys.length ? Math.min(...ys) : 0;
        placementDtos.push({
          diagramId: did, localId,
          sourceEntityType: PIPE_SRC, sourceEntityId: p.nodeId, type: 'run',
          svgPath: JSON.stringify({ points: p.points, fittings: p.fittings ?? [], aEnd: p.aEnd, bEnd: p.bEnd, groupId: p.groupId, continuesFrom: p.continuesFrom, ports: p.ports, flowReversed: p.flowReversed }),
          color: p.color, lineWidth: p.width,
          name: p.name || 'Pipe', label: p.name || 'Pipe',
          x: minX, y: minY,
          width: xs.length ? Math.max(...xs) - minX : 0, height: ys.length ? Math.max(...ys) - minY : 0,
        });
      }
      // Preserve any un-migrated legacy blob: re-emit it verbatim so the complete-set soft-delete never drops it
      // before its pipes are promoted. clearLegacyBlob() (after a successful migration save) stops this → it's then
      // cleaned up in the same save that writes the real 'Pipe' placements.
      const blob = this.pipesLegacyBlob();
      if (blob != null && this.legacyBlobLocalId != null) {
        placementDtos.push({
          diagramId: did, localId: this.legacyBlobLocalId,
          sourceEntityType: PIPE_META, type: 'pipedata', name: PIPE_META, svgPath: blob,
          x: 0, y: 0, width: 0, height: 0,
        });
      }
      // Background metadata (opacity/ext) — a tiny row emitted only while a background exists. Dropping it (no
      // background) lets the complete-set soft-delete remove it. The image BYTES live on disk, not here.
      if (this.backgroundUrl() != null) {
        const localId = this.bgLocalId ?? this.nextPlacementLocalId++;
        this.bgLocalId = localId;
        placementDtos.push({
          diagramId: did, localId,
          sourceEntityType: BG_SRC, type: 'bg', name: BG_SRC,
          svgPath: JSON.stringify({ opacity: this.backgroundOpacity(), ext: this.bgExt }),
          x: 0, y: 0, width: 0, height: 0,
        });
      }
      const connectionDtos: DiagramConnectionDto[] = edges.map(e => ({
        diagramId: did, localId: e.localId,
        sourcePlacementLocalId: e.sourceLocalId, targetPlacementLocalId: e.targetLocalId,
        sourceAnchor: 'right', targetAnchor: 'left',
        color: e.color, lineWidth: e.width,
        waypointsJson: e.waypoints && e.waypoints.length ? JSON.stringify(e.waypoints) : undefined,
      }));
      await firstValueFrom(this.placementApi.bulkSave(did, placementDtos));
      await firstValueFrom(this.connectionApi.bulkSave(did, connectionDtos));
      this.saveRetries = 0; // success → reset the retry budget
    } catch (e: any) {
      this.error.set(this.msg(e));
      this.dirty = true;
      // Self-retry a transient failure (bounded) so the write isn't stranded until the next mutation — important
      // for the migration's atomic blob-drop, which otherwise could re-migrate + duplicate on a later session.
      if (this.saveRetries < 5) { this.saveRetries++; this.scheduleSave(); }
    } finally {
      this.saving.set(false);
    }
  }
}
