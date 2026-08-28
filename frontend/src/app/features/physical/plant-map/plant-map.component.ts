import {
  Component, ElementRef, HostListener, OnDestroy, ViewChild,
  computed, effect, inject, signal, untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { PhysicalObjectApiService } from '../../../services/physical/physical-object-api.service';
import {
  LinkedFile, PhysicalObjectNode, PO_TYPE_OPTIONS, poColor, RoundCheckRef, WorkAreaOption, WorkAreaRef,
} from '../../../models/physical/physical-object.models';
import { environment } from '../../../../environments/environment';
import { RfFileApiService } from '../../files/refactored/services/rf-file-api.service';
import { FileDto } from '../../../models/file/file.model';
import { SharedDataService } from '../../../services/shared-data.service';
import { ValueDto } from '../../../models/value.model';
import { MaximoAssetPickerComponent } from '../../maximo/maximo-asset-picker/maximo-asset-picker.component';
import { MaximoLocationPickerComponent } from '../../maximo/maximo-location-picker/maximo-location-picker.component';
import { MaximoAsset, MaximoLocation } from '../../../models/maximo/maximo.models';
import {
  BackgroundTransform, EquipmentPort, EquipmentPortRef, EquipmentPortRole,
  GhostBox, MapBox, PIPE_SRC, PipeGeo, PipeFitting, PipePort, PlantMapStateService,
} from './services/plant-map-state.service';
import {
  PLANT_GLYPHS, PLANT_GLYPH_BY_KEY, SERVICE_COLORS, PlantGlyph,
  FootprintShape, FOOTPRINT_SHAPES, hexToRgba, normFootprint,
} from './plant-glyphs';
import { DiagramPlacementApiService } from '../../diagram-builder/services/diagram-placement-api.service';
import { DiagramAlignmentService, ShapeRect, ShapeUpdate } from '../../diagram-builder/services/diagram-alignment.service';
import { AlignmentType, DistributeType } from '../../diagram-builder/models/diagram-placement.model';
import { EquipmentPortNetwork, tracePipeFlow } from './pipe-flow-graph';

/** One child of a nested container (in the container's OWN diagram coords) — for recursive zoom-nesting.
 *  For a LEVELED container, children from ALL levels are composited (view-from-top): `floor` = its level index,
 *  `dim` = it's beneath the top level (shown faint so the top deck reads on top and lower decks peek out). */
interface NestChild {
  childId: number; name: string; color: string; shape: FootprintShape;
  x: number; y: number; w: number; h: number;
  hasChildren: boolean; diagramId: number | null;  // to recurse into it as you keep zooming
  floor?: number; dim?: boolean;
  ports?: EquipmentPort[];
}
/** A nested descendant to render, mapped into content coords, at a given depth. */
interface NestItem { x: number; y: number; w: number; h: number; childId: number; name: string; color: string; shape: FootprintShape; depth: number; dim?: boolean; }
/** A nested pipe (a descendant container's pipe), mapped into content coords. Carries its id/nodeId so it's
 *  clickable from the parent view (single-click = info, double-click = drill to the object). */
interface NestPipe {
  id: string; nodeId?: number; parentId: number; name: string;
  points: string; path: { x: number; y: number }[]; color: string; width: number; depth: number; flowSegs?: string[];
  start: { x: number; y: number }; end: { x: number; y: number }; mid: { x: number; y: number };
}
/** A nested fitting (a descendant pipe's fitting), mapped into content coords + scaled down by the nesting. */
interface NestFitting { id: string; nodeId?: number; x: number; y: number; cat: string; path: string; actuator: string; code: string; color: string; size: number; depth: number; isValve?: boolean; closed?: boolean; }

type PipeEnd = 'start' | 'end';
interface PipeConnectSession { sourcePipeId: string; sourceEnd: PipeEnd | null; reconnectLinkId?: string; }
interface PipeConnectPending { targetPipeId: string; targetEnd: PipeEnd; }
interface PipeConnectionEndpointHandle {
  pipeId: string; end: PipeEnd; point: { x: number; y: number };
  role: 'source-choice' | 'source-selected' | 'target'; name: string;
}
interface VisiblePipe {
  id: string; nodeId?: number; parentId: number; name: string; nested: boolean;
  points: string; path: { x: number; y: number }[];
  start: { x: number; y: number }; end: { x: number; y: number }; mid: { x: number; y: number };
}

interface EquipmentPortHandle {
  objectId: number;
  portId: string;
  label: string;
  circuit: string;
  role: EquipmentPortRole;
  x: number;
  y: number;
  owner: 'box' | 'boundary';
  boxLocalId?: number;
}

// PipeGeo + PipeFitting are the entity-backed view-models — imported from the state service (each pipe/fitting is
// a real PhysicalObject: pipe = a 'Pipe' placement, fitting = a child node whose geometry rides the pipe's JSON).

/** In-progress pointer gesture on the canvas. */
type Drag =
  | { kind: 'move' | 'resize'; localId: number; startClientX: number; startClientY: number; origX: number; origY: number; origW: number; origH: number;
      /** Every selected box's start position — a move drags the whole selection, not just the grabbed box. */
      origins?: { localId: number; x: number; y: number }[] }
  | { kind: 'marquee'; startX: number; startY: number; additive: boolean }
  | { kind: 'draw'; startX: number; startY: number }
  | { kind: 'pan'; startClientX: number; startClientY: number; startPanX: number; startPanY: number; moved: boolean }
  | { kind: 'fitting'; fittingId: string; pipeId: string }
  | { kind: 'pipeVtx'; pipeId: string; index: number }
  | { kind: 'equipmentPort'; boxLocalId: number; portId: string }
  | { kind: 'bgMove'; startClientX: number; startClientY: number; x: number; y: number }
  | { kind: 'bgResize'; startClientX: number; startClientY: number; scaleX: number; scaleY: number };

/**
 * Purpose-built plant-map editor — a dedicated, simple canvas (NO simulator, NO symbol library). Each
 * PhysicalObject node is a blank stage; its children are labeled boxes you draw / place / drag / resize /
 * connect, and double-click to drill into. Click a box → the inspector edits the object's actual data
 * (name/type/tag/description), its links (connections), and its documents (files). Auto-saves through the
 * diagram tables (invisible plumbing). Touches nothing else in the app.
 */
@Component({
  selector: 'app-plant-map',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent,
    MaximoAssetPickerComponent, MaximoLocationPickerComponent],
  templateUrl: './plant-map.component.html',
  styleUrl: './plant-map.component.css',
  providers: [PlantMapStateService],
})
export class PlantMapComponent implements OnDestroy {
  readonly st = inject(PlantMapStateService);
  private alignSvc = inject(DiagramAlignmentService);
  private nodesApi = inject(PhysicalObjectApiService);
  private filesApi = inject(RfFileApiService);
  private placementApi = inject(DiagramPlacementApiService);
  private shared = inject(SharedDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ── system layers (feature #3) ──
  systems = signal<ValueDto[]>([]);
  layerActive = computed(() => this.st.activeSystemId() != null);

  /** A selected pipe/fitting's full PhysicalObject (fetched on select) so it gets the SAME Systems/Maximo/Files
   *  inspector sections as a normal object. */
  pipeFittingNode = signal<PhysicalObjectNode | null>(null);
  /** The object currently inspected — a box's child OR a selected pipe/fitting — driving the shared links panel. */
  objNode = computed(() => this.st.selectedChild() ?? this.pipeFittingNode());

  // ── levels / floors ──
  /** Floors for the switcher, top elevation first (descending floorIndex). */
  floorsTopDown = computed(() => [...this.st.floorSwitcher().floors].sort((a, b) => (b.floorIndex ?? 0) - (a.floorIndex ?? 0)));

  // ── recursive zoom-nesting: a container reveals its children as real items when big enough on screen ──
  private nestCache = new Map<number, NestChild[]>();   // container node id → its children (render info)
  private nestFetched = new Set<number>();              // containers fetched (or in-flight)
  private nestParent: number | null = null;             // the canvas diagram the cache belongs to
  private nestVersion = signal(0);                       // bumped when a fetch lands → re-render + fetch deeper
  /** On-screen width (px, after zoom) at which a container reveals its children — tunable "detail" control
   *  (lower = reveal more, deeper detail). */
  nestReveal = signal(140);
  setNestReveal(px: number) { this.nestReveal.set(Math.max(60, Math.min(300, px))); }
  private readonly NEST_MAX_DEPTH = 6;

  @ViewChild('viewport') viewportRef?: ElementRef<HTMLElement>;
  @ViewChild('treeList') treeListRef?: ElementRef<HTMLElement>;

  // ── pan / zoom (map navigation) ──
  zoom = signal(1);
  panX = signal(0);
  panY = signal(0);
  contentTransform = computed(() => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`);
  inverseZoom = computed(() => 1 / this.zoom());
  arrangeMode = signal(false);
  spacePanning = signal(false);
  canvasPulseNodeId = signal<number | null>(null);
  private canvasPulseTimer: any = null;

  readonly typeOptions = PO_TYPE_OPTIONS;
  readonly apiBase = environment.baseApiUrl;
  readonly color = poColor;
  readonly glyphs = PLANT_GLYPHS;
  readonly serviceColors = SERVICE_COLORS;
  readonly footprintShapes = FOOTPRINT_SHAPES;

  // which footprint the next right-drag draws
  drawShape = signal<FootprintShape>('rect');
  setDrawShape(s: FootprintShape) { this.drawShape.set(s); }

  // multi-shape ops
  duplicating = signal(false);

  // inline box rename (name-in-place, so a new footprint is named as you draw it)
  editingBoxLocalId = signal<number | null>(null);
  boxEditName = '';
  @ViewChild('boxRename') boxRenameRef?: ElementRef<HTMLInputElement>;

  // entry state (no node yet)
  roots = signal<PhysicalObjectNode[]>([]);
  noNodes = signal(false);

  // create-object form
  newName = '';
  newType = 'LOCATION';
  newTag = '';

  // transient interaction visuals
  private drag: Drag | null = null;
  rubber = signal<{ x: number; y: number; w: number; h: number } | null>(null);
  portPlacementBoxLocalId = signal<number | null>(null);
  selectedEquipmentPort = signal<{ objectId: number; portId: string; boxLocalId?: number } | null>(null);

  // ── inspector: edit fields + documents ──
  editName = ''; editType = ''; editTag = ''; editDesc = ''; editLoc = ''; editFloor = '';
  savingEdit = signal(false);
  editSaved = signal(false);   // brief "Saved ✓" confirmation after an auto-save
  files = signal<LinkedFile[]>([]);
  filesLoading = signal(false);
  fileQuery = '';
  fileResults = signal<FileDto[]>([]);
  fileSearching = signal(false);
  private lastSelectedNodeId: number | null = null;

  // round checks (reverse of RoundQuestion.physicalObjectId)
  roundChecks = signal<RoundCheckRef[]>([]);
  roundChecksLoading = signal(false);

  // collapsible inspector sections (Systems default-collapsed — it's the big one)
  collapsedSections = signal<Set<string>>(new Set(['systems']));
  isSectionOpen(key: string): boolean { return !this.collapsedSections().has(key); }
  toggleSection(key: string): void {
    const s = new Set(this.collapsedSections());
    if (s.has(key)) s.delete(key); else s.add(key);
    this.collapsedSections.set(s);
  }

  // work areas (safety binder)
  workAreas = signal<WorkAreaRef[]>([]);
  waLoading = signal(false);
  allWorkAreas = signal<WorkAreaOption[]>([]);
  waPickerOpen = signal(false);
  availableWorkAreas = computed(() => {
    const bound = new Set(this.workAreas().map(w => w.id));
    return this.allWorkAreas().filter(w => !bound.has(w.id));
  });

  private boxById = computed(() => new Map(this.st.boxes().map(b => [b.localId, b])));

  /** Natural size of the loaded reference image (so the grid working area can grow to contain it). */
  bgSize = signal<{ w: number; h: number } | null>(null);
  onBgLoad(ev: Event) { const img = ev.target as HTMLImageElement; this.bgSize.set({ w: img.naturalWidth, h: img.naturalHeight }); }
  backgroundAdjustMode = signal(false);
  backgroundFrame = computed(() => {
    const size = this.bgSize();
    const transform = this.st.backgroundTransform();
    if (!size) return null;
    return {
      x: transform.x, y: transform.y,
      w: Math.max(20, size.w * transform.scaleX),
      h: Math.max(20, size.h * transform.scaleY),
      rotation: transform.rotation,
    };
  });

  /** How big the scrollable content is — grows to contain every box, the boundary, and the reference image. */
  canvasSize = computed(() => {
    let w = 1600, h = 1000;
    for (const b of this.st.boxes()) { w = Math.max(w, b.x + b.width + 240); h = Math.max(h, b.y + b.height + 240); }
    const bd = this.st.boundary();
    if (bd) { w = Math.max(w, bd.x + bd.w + 80); h = Math.max(h, bd.y + bd.h + 80); }
    const bg = this.backgroundFrame();
    if (bg && this.st.backgroundUrl()) {
      const radians = Math.abs(bg.rotation) * Math.PI / 180;
      const rotatedW = Math.abs(bg.w * Math.cos(radians)) + Math.abs(bg.h * Math.sin(radians));
      const rotatedH = Math.abs(bg.w * Math.sin(radians)) + Math.abs(bg.h * Math.cos(radians));
      w = Math.max(w, bg.x + rotatedW + 80); h = Math.max(h, bg.y + rotatedH + 80);
    }
    return { w, h };
  });

  equipmentPortHandles = computed<EquipmentPortHandle[]>(() => {
    const handles: EquipmentPortHandle[] = [];
    for (const box of this.st.boxes()) {
      for (const port of box.ports ?? []) {
        const point = this.equipmentPortPoint({ x: box.x, y: box.y, w: box.width, h: box.height }, port);
        handles.push({
          objectId: box.childId, portId: port.id, label: port.label, circuit: port.circuit,
          role: port.role, x: point.x, y: point.y, owner: 'box', boxLocalId: box.localId,
        });
      }
    }
    const boundary = this.st.boundary();
    if (boundary) {
      const objectId = this.st.currentNode()?.id;
      if (objectId != null) {
        for (const port of this.st.boundaryPorts()) {
          const point = this.equipmentPortPoint(boundary, port);
          handles.push({
            objectId, portId: port.id, label: port.label, circuit: port.circuit,
            role: port.role, x: point.x, y: point.y, owner: 'boundary',
          });
        }
      }
    }
    return handles;
  });

  /** Rendered pipe ROUTES (border → waypoints → border) as polylines, with edit handles when selected. */
  /** All nested descendant items to render (recursive zoom-nesting), flat, in content coords. A container box
   *  reveals its children when it's big enough on screen; each revealed child that's itself big enough reveals
   *  ITS children, and so on — so zooming in continuously surfaces deeper items with no drilling. */
  nestedItems = computed<{ items: NestItem[]; pipes: NestPipe[]; fittings: NestFitting[] }>(() => {
    this.nestVersion(); this.pipeGeos();
    const z = this.zoom();
    const reveal = this.nestReveal();
    const items: NestItem[] = [];
    const pipes: NestPipe[] = [];
    const fittings: NestFitting[] = [];
    const walk = (rect: { x: number; y: number; w: number; h: number }, containerId: number, depth: number) => {
      if (depth > this.NEST_MAX_DEPTH) return;
      const shapes = this.nestCache.get(containerId) ?? [];
      const cpipes = this.pipeGeos().filter(p => p.parentId === containerId && p.points.length >= 2);
      if (!shapes.length && !cpipes.length) return;
      const bb = this.bboxOf(shapes, cpipes); // one bbox for boxes AND pipes so they stay aligned
      const scale = Math.max(1, (bb.maxX - bb.minX) / Math.max(1, rect.w));
      for (const s of shapes) {
        const r = this.mapInto(rect, bb, s);
        items.push({ x: r.x, y: r.y, w: r.w, h: r.h, childId: s.childId, name: s.name, color: s.color, shape: s.shape, depth, dim: s.dim });
        if (s.hasChildren && r.w * z >= reveal && r.h * z >= 34) walk(r, s.childId, depth + 1);
      }
      for (const cp of cpipes) {
        const fl = this.flowMode() ? this.flowResult().get(cp.id) : null; // map each flowing sub-segment into the footprint
        const mappedPoints = cp.points.map(pt => this.mapPointInto(rect, bb, pt));
          pipes.push({
            id: cp.id, nodeId: cp.nodeId, parentId: cp.parentId, name: cp.name || 'Pipe',
            points: mappedPoints.map(pt => `${pt.x},${pt.y}`).join(' '), path: mappedPoints,
          start: mappedPoints[0], end: mappedPoints[mappedPoints.length - 1], mid: mappedPoints[Math.floor(mappedPoints.length / 2)],
          flowSegs: fl ? fl.segsPath.map(seg => seg.map(pt => { const m = this.mapPointInto(rect, bb, pt); return `${m.x},${m.y}`; }).join(' ')) : undefined,
          color: cp.color || '#5b9bd5', width: Math.max(1.5, (cp.width || 8) / scale), depth,
        });
        // fittings, scaled down by the nesting; shown when big enough to read — BUT in flow mode always show VALVES
        // (at a clickable min size) so the whole system is operable from the parent/zoomed-out view.
        const fsz = Math.min(1, 1 / scale);
        const readable = 24 * fsz * z >= 10;
        const flow = this.flowMode();
        for (const f of (cp.fittings ?? [])) {
          const m = this.mapPointInto(rect, bb, f.at);
          const rf = this.fittingRender(f, m.x, m.y);
          const showForFlow = flow && rf.isValve;
          if (!readable && !showForFlow) continue;
          const size = showForFlow ? Math.max(fsz, 0.6 / z) : fsz; // ~14px clickable valve regardless of zoom
          fittings.push({ id: f.id, nodeId: f.nodeId, x: m.x, y: m.y, cat: rf.cat, path: rf.path, actuator: rf.actuator, code: rf.code, color: rf.color, size, depth, isValve: rf.isValve, closed: rf.closed });
        }
      }
    };
    for (const b of this.st.boxes()) {
      if (b.width * z >= reveal && b.height * z >= 34) walk({ x: b.x, y: b.y, w: b.width, h: b.height }, b.childId, 1);
    }
    return { items, pipes, fittings };
  });

  /** Direct boxes currently revealing nested children (→ lighter fill + label pinned to a corner). */
  revealingBoxes = computed(() => {
    this.nestVersion();
    const z = this.zoom();
    const reveal = this.nestReveal();
    const set = new Set<number>();
    for (const b of this.st.boxes()) {
      if (b.width * z >= reveal && b.height * z >= 34 && (this.nestCache.get(b.childId)?.length ?? 0) > 0) set.add(b.localId);
    }
    return set;
  });
  isRevealing(b: MapBox): boolean { return this.revealingBoxes().has(b.localId); }

  private bboxOf(shapes: NestChild[], pipes: PipeGeo[] = []) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of shapes) { minX = Math.min(minX, s.x); minY = Math.min(minY, s.y); maxX = Math.max(maxX, s.x + s.w); maxY = Math.max(maxY, s.y + s.h); }
    for (const p of pipes) for (const pt of p.points) { minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y); maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y); }
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    return { minX, minY, maxX, maxY };
  }
  /** Map a single point (container diagram coords) into the container's content-coord footprint (5% inset). */
  private mapPointInto(rect: { x: number; y: number; w: number; h: number },
                       bb: { minX: number; minY: number; maxX: number; maxY: number },
                       pt: { x: number; y: number }) {
    const spanX = Math.max(1, bb.maxX - bb.minX), spanY = Math.max(1, bb.maxY - bb.minY);
    const padX = rect.w * 0.05, padY = rect.h * 0.05;
    return { x: rect.x + padX + (pt.x - bb.minX) / spanX * (rect.w - 2 * padX),
             y: rect.y + padY + (pt.y - bb.minY) / spanY * (rect.h - 2 * padY) };
  }
  /** Map a child (in its container's diagram coords) into the container's content-coord footprint (5% inset). */
  private mapInto(rect: { x: number; y: number; w: number; h: number },
                  bb: { minX: number; minY: number; maxX: number; maxY: number },
                  s: { x: number; y: number; w: number; h: number }) {
    const spanX = Math.max(1, bb.maxX - bb.minX), spanY = Math.max(1, bb.maxY - bb.minY);
    const padX = rect.w * 0.05, padY = rect.h * 0.05;
    const iw = rect.w - 2 * padX, ih = rect.h - 2 * padY;
    return { x: rect.x + padX + (s.x - bb.minX) / spanX * iw, y: rect.y + padY + (s.y - bb.minY) / spanY * ih,
             w: (s.w / spanX) * iw, h: (s.h / spanY) * ih };
  }

  private readEquipmentPorts(svgPath?: string | null): EquipmentPort[] {
    let value: any;
    try { value = svgPath ? JSON.parse(svgPath) : null; } catch { return []; }
    return Array.isArray(value?.equipmentPorts) ? value.equipmentPorts : [];
  }

  /** Connections touching the selected box, named by the other end (for the inspector). */
  constructor() {
    const nodeId = this.route.snapshot.paramMap.get('nodeId');
    if (nodeId) this.st.openNode(Number(nodeId));
    else this.loadRoots();

    this.shared.loadSystems().subscribe(s => this.systems.set(s ?? []));
    this.nodesApi.getAllWorkAreas().subscribe(w => this.allWorkAreas.set(w ?? []));
    void this.loadTree(); // the "jump anywhere" hierarchy navigator

    // Keep the hierarchy rows current when objects are created or renamed on the open canvas; the initial tree
    // fetch is global, while these live state slices provide immediate local updates without another round trip.
    effect(() => {
      const contextNodes = [
        ...this.st.breadcrumb(),
        ...(this.st.currentNode() ? [this.st.currentNode()!] : []),
        ...(this.st.canvasNode() ? [this.st.canvasNode()!] : []),
        ...this.st.childNodes(),
      ];
      untracked(() => this.treeAllNodes.update(existing => {
        const byId = new Map(existing.map(node => [node.id, node]));
        for (const node of contextNodes) byId.set(node.id, node);
        return [...byId.values()];
      }));
    });

    // Repopulate the inspector (form + files + work areas) when the inspected object changes — a box's child OR a
    // selected pipe/fitting. Not on every drag.
    effect(() => {
      const node = this.objNode();
      untracked(() => this.onSelectionChanged(node));
    });

    // Selections are mutually exclusive: selecting a box or a nested node clears any pipe/fitting selection (and
    // vice-versa in selectPipe/selectFitting), so the inspector never resurrects a stale pipe when a box deselects.
    effect(() => {
      const boxSel = this.st.selectedLocalId(); const nested = this.st.selectedNestedNode();
      untracked(() => { if (boxSel != null || nested) { this.selectedPipeId.set(null); this.selectedFittingId.set(null); this.pipeFittingNode.set(null); } });
    });

    // Keep the tree navigator expanded down to the current node as you navigate.
    effect(() => {
      this.st.currentNode();
      untracked(() => this.expandToCurrent());
    });

    // Canvas selection and hierarchy selection are one shared concept: selecting any rendered object expands the
    // tree to that node and keeps its row visible without changing the open canvas.
    effect(() => {
      const selectedNodeId = this.selectedHierarchyNodeId();
      untracked(() => {
        if (selectedNodeId != null) {
          this.expandTreeTo(selectedNodeId);
          this.scrollTreeNodeIntoView(selectedNodeId);
        }
      });
    });

    // Reset pan/zoom whenever the open canvas changes (fresh view per node); drop any half-laid pipe draft so it
    // never carries into another section (a continuation resumes drawing fresh in the new area).
    effect(() => {
      this.st.currentDiagramId();
      untracked(() => {
        this.resetView(); this.pipeDraft.set([]); this.pipeCursor.set(null);
        this.arrangeMode.set(false); this.spacePanning.set(false);
        this.backgroundAdjustMode.set(false); this.portPlacementBoxLocalId.set(null); this.selectedEquipmentPort.set(null);
        this.pipeConnect.set(null); this.pipeConnectPending.set(null); this.pipeConnectHover.set(null);
        // Drop any pipe/fitting selection so its inspector doesn't linger, stale, over an unrelated node's canvas.
        this.selectedPipeId.set(null); this.selectedFittingId.set(null); this.pipeFittingNode.set(null);
      });
    });

    // Apply the canvas node's loaded pipes into the global pipeGeos — exactly once per canvas load (driven by
    // pipesLoadSeq, bumped only when pipes + identity are settled), so it never fires mid-load with a mismatched
    // node nor re-runs on the component's own save round-trips. Also promotes any legacy blob to real entities.
    effect(() => {
      this.st.pipesLoadSeq();
      untracked(() => {
        const nodeId = this.st.pipesLoadNodeId(); // the node these pipes were loaded FOR (not the current canvas) → no cross-node bleed
        this.applyLoadedPipes(this.st.pipes(), nodeId);
        this.syncLoadedBoundaryPipeEndpoints(nodeId);
        const blob = this.st.pipesLegacyBlob();
        if (blob && nodeId != null) void this.migrateLegacyBlob(blob, nodeId);
      });
    });

    // One-time compatibility migration: the removed side-dot implementation stored anonymous box-to-box wires.
    // Promote each one to a real routed pipe with explicit equipment ports, then clear the legacy rows.
    effect(() => {
      const did = this.st.currentDiagramId();
      const edges = this.st.edges();
      this.st.boxes();
      untracked(() => {
        if (did != null && edges.length) void this.migrateLegacyBoxEdges(did);
      });
    });

    // Keep the state service's hidden-child set (pipe + fitting node ids) in sync from the global pipeGeos, so those
    // nodes never appear in the "to place" palette as droppable boxes.
    effect(() => {
      const geos = this.pipeGeos();
      untracked(() => {
        const hidden = new Set<number>();
        for (const p of geos) {
          if (p.nodeId != null) hidden.add(p.nodeId);
          for (const f of (p.fittings ?? [])) if (f.nodeId != null) hidden.add(f.nodeId);
        }
        this.st.hiddenChildIds.set(hidden);
      });
    });

    // Recursive zoom-nesting: walk the revealed containers (direct boxes + nested, as data lands) and fetch
    // each one's children so it can render them. Reset the cache when the canvas changes.
    effect(() => {
      const did = this.st.currentDiagramId();
      const boxes = this.st.boxes();
      const childById = this.st.childById();
      const z = this.zoom();
      const fetchAt = this.nestReveal() * 0.6; // pre-fetch a container's children BEFORE it crosses the reveal
      this.nestVersion(); // re-run when a fetch lands, to fetch the next level down          // threshold, so it never renders empty
      untracked(() => {
        if (did !== this.nestParent) { this.nestParent = did; this.nestCache.clear(); this.nestFetched.clear(); }
        const walkFetch = (rect: { x: number; y: number; w: number; h: number }, containerId: number, containerDid: number | null, depth: number) => {
          if (depth > this.NEST_MAX_DEPTH) return; // NOT gated on containerDid: a leveled node's OWN diagram is null;
          if (!this.nestFetched.has(containerId)) { void this.fetchNest(containerId, containerDid, did); return; } // fetchNest resolves its top level
          const shapes = this.nestCache.get(containerId);
          if (!shapes || !shapes.length) return;
          const bb = this.bboxOf(shapes);
          for (const s of shapes) {
            const r = this.mapInto(rect, bb, s);
            if (s.hasChildren && r.w * z >= fetchAt && r.h * z >= 28) { // recurse on hasChildren (diagram resolved in fetchNest)
              walkFetch(r, s.childId, s.diagramId, depth + 1);
            }
          }
        };
        for (const b of boxes) {
          if (b.width * z >= fetchAt && b.height * z >= 28 && childById.get(b.childId)?.hasChildren) {
            walkFetch({ x: b.x, y: b.y, w: b.width, h: b.height }, b.childId, childById.get(b.childId)?.diagramId ?? null, 1);
          }
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.canvasPulseTimer) clearTimeout(this.canvasPulseTimer);
    void this.st.flushSave();
  }

  /**
   * Load a container's children (their footprints + names + whether THEY have children) for nested rendering.
   * Reads the container's OWN diagram for positions and getChildren for identity/recursion metadata. Guards on
   * `parentDid` so a fetch that lands after the canvas changed is dropped.
   */
  private async fetchNest(containerId: number, containerDid: number | null, parentDid: number | null) {
    this.nestFetched.add(containerId);
    try {
      const kids = await firstValueFrom(this.nodesApi.getChildren(containerId)).catch(() => [] as PhysicalObjectNode[]);
      if (this.nestParent !== parentDid) return;
      // Leveled node: composite ALL its levels as a view-from-top (its own diagram is usually null/empty; content
      // lives on the level diagrams). Levels are assumed spatially registered (shared coords — like the drill-in
      // ghosts). Ground→top: the top deck paints last/on top; lower decks are dimmed and peek out where they
      // extend beyond it. Non-leveled: just the container's own diagram.
      const floors = (kids ?? []).filter(k => k.local !== false && k.floorIndex != null)
        .sort((a, b) => (a.floorIndex ?? 0) - (b.floorIndex ?? 0)); // ground → top
      let sources: { kids: PhysicalObjectNode[]; did: number | null; floor: number }[];
      if (floors.length) {
        const floorKids = await Promise.all(floors.map(f =>
          firstValueFrom(this.nodesApi.getChildren(f.id)).catch(() => [] as PhysicalObjectNode[])));
        if (this.nestParent !== parentDid) return;
        sources = floors.map((f, i) => ({ kids: floorKids[i], did: f.diagramId ?? null, floor: f.floorIndex ?? 0 }));
      } else {
        sources = [{ kids, did: containerDid, floor: 0 }];
      }
      const placementLists = await Promise.all(sources.map(s =>
        s.did != null ? firstValueFrom(this.placementApi.getByDiagram(s.did)).then(r => r?.responseData ?? []).catch(() => [] as any[])
                      : Promise.resolve([] as any[])));
      if (this.nestParent !== parentDid) return;
      const topFloor = sources.reduce((m, s) => Math.max(m, s.floor), sources[0]?.floor ?? 0);

      const shapes: NestChild[] = [];
      const cpipes: PipeGeo[] = [];
      sources.forEach((s, i) => {
        const kidById = new Map(s.kids.map(k => [k.id, k]));
        for (const p of placementLists[i]) {
          if (p.sourceEntityType === 'PhysicalObject' && p.sourceEntityId != null && (p.width ?? 0) > 0 && (p.height ?? 0) > 0) {
            const k = kidById.get(p.sourceEntityId);
            shapes.push({
              childId: p.sourceEntityId, name: p.label || k?.name || '', color: p.color || poColor(k?.type),
              shape: normFootprint(p.type), x: p.x ?? 0, y: p.y ?? 0, w: p.width ?? 0, h: p.height ?? 0,
              hasChildren: k?.hasChildren ?? false, diagramId: k?.diagramId ?? null,
              ports: this.readEquipmentPorts(p.svgPath),
              floor: s.floor, dim: s.floor < topFloor, // lower decks shown faint, beneath the top
            });
          } else if (p.sourceEntityType === PIPE_SRC && p.sourceEntityId != null) {
            let geo: { points?: any; fittings?: any; aEnd?: number; bEnd?: number; groupId?: string; continuesFrom?: number; ports?: any; startAttachment?: EquipmentPortRef; endAttachment?: EquipmentPortRef; legacyEdgeLocalId?: number; flowReversed?: boolean } = {};
            try { geo = p.svgPath ? JSON.parse(p.svgPath) : {}; } catch { geo = {}; }
            cpipes.push({
              id: 'pipe-' + p.sourceEntityId, parentId: containerId, nodeId: p.sourceEntityId, localId: p.localId ?? undefined,
              placementId: p.id ?? undefined,
              points: Array.isArray(geo.points) ? geo.points : [], fittings: Array.isArray(geo.fittings) ? geo.fittings : [],
              aEnd: geo.aEnd ?? undefined, bEnd: geo.bEnd ?? undefined, groupId: geo.groupId ?? undefined,
              continuesFrom: geo.continuesFrom ?? undefined, ports: Array.isArray(geo.ports) ? geo.ports : undefined,
              startAttachment: geo.startAttachment ?? undefined, endAttachment: geo.endAttachment ?? undefined,
              legacyEdgeLocalId: geo.legacyEdgeLocalId ?? undefined,
              flowReversed: geo.flowReversed ?? undefined,
              color: p.color || undefined, width: p.lineWidth || undefined, name: p.label || p.name || 'Pipe',
            } as PipeGeo);
          }
        }
      });
      this.pipeGeos.update(l => [...l.filter(p => p.parentId !== containerId), ...cpipes]);
      // View-from-top occlusion: hide ONLY a lower-deck item that is FULLY under a top-deck item (pure clutter —
      // never visible as an overhang). A partially-covered item STAYS so its overhang peeks out beyond the top.
      const tops = shapes.filter(s => !s.dim);
      const visible = tops.length ? shapes.filter(s =>
        !s.dim || !tops.some(t => s.x >= t.x && s.y >= t.y && s.x + s.w <= t.x + t.w && s.y + s.h <= t.y + t.h)
      ) : shapes;
      this.nestCache.set(containerId, visible);
    } catch {
      if (this.nestParent === parentDid) this.nestCache.set(containerId, []);
    } finally {
      if (this.nestParent === parentDid) this.nestVersion.update(v => v + 1);
    }
  }

  setShowChildren(show: boolean) { const id = this.st.selectedLocalId(); if (id != null) this.st.patchBox(id, { showChildren: show }); }

  // ── inspector / overlay: system membership (feature #3) ──
  setActiveSystem(id: number | null) { this.st.activeSystemId.set(id); }

  /** Is this box's object in the active layer system? (drives hot/cold highlight) */
  boxInActiveSystem(b: MapBox): boolean {
    const sys = this.st.activeSystemId();
    return sys != null && this.st.childInSystem(b.childId, sys);
  }

  selectedObjectInSystem(systemId: number): boolean {
    const c = this.objNode();
    return c != null && this.st.childInSystem(c.id, systemId);
  }

  toggleSelectedObjectSystem(systemId: number) {
    const c = this.objNode();
    if (!c) return;
    const ids = new Set(this.st.childSystems().get(c.id) ?? []);
    if (ids.has(systemId)) ids.delete(systemId); else ids.add(systemId);
    void this.st.setObjectSystems(c.id, [...ids]);
  }

  private async loadRoots() {
    const all = await firstValueFrom(this.nodesApi.getTree());
    // Binder mode: only hand-built (local) roots belong on the plant map (`!== false` is transition-safe).
    const roots = all.filter(n => n.parentId == null && n.local !== false);
    this.roots.set(roots);
    this.noNodes.set(roots.length === 0);
    if (roots.length === 1) this.st.openNode(roots[0].id);
  }

  navigate(id: number) { void this.st.navigate(id); }
  canGoUp = computed(() => this.st.breadcrumb().length > 1);
  goUpOneLevel() {
    const path = this.st.breadcrumb();
    if (path.length > 1) this.navigate(path[path.length - 2].id);
  }

  /** Single-click a zoom-nested descendant → show its info in the inspector (double-click jumps to it). */
  async onNestClick(n: NestItem) {
    const node = await firstValueFrom(this.nodesApi.getNode(n.childId));
    if (node) this.st.selectNested(node);
  }

  // ── tree navigator (jump anywhere in the hierarchy) ──
  treeAllNodes = signal<PhysicalObjectNode[]>([]);
  expandedTree = signal<Set<number>>(new Set<number>());
  private treeChildrenMap = computed(() => {
    const m = new Map<number | null, PhysicalObjectNode[]>();
    for (const n of this.treeAllNodes()) {
      const p = n.parentId ?? null;
      const arr = m.get(p); if (arr) arr.push(n); else m.set(p, [n]);
    }
    return m;
  });
  /** Flattened, indented tree rows honoring expand/collapse (roots + expanded branches). */
  treeRows = computed<{ node: PhysicalObjectNode; depth: number; hasKids: boolean; open: boolean }[]>(() => {
    const byParent = this.treeChildrenMap();
    const expanded = this.expandedTree();
    const rows: { node: PhysicalObjectNode; depth: number; hasKids: boolean; open: boolean }[] = [];
    const walk = (parentId: number | null, depth: number) => {
      const kids = (byParent.get(parentId) ?? []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      for (const n of kids) {
        const nKids = byParent.get(n.id) ?? [];
        const open = expanded.has(n.id);
        rows.push({ node: n, depth, hasKids: nKids.length > 0, open });
        if (open && nKids.length) walk(n.id, depth + 1);
      }
    };
    walk(null, 0);
    return rows;
  });
  toggleTreeExpand(id: number, ev?: Event) {
    ev?.stopPropagation();
    this.expandedTree.update(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  isCurrentTreeNode(id: number): boolean { return this.st.currentNode()?.id === id; }
  isSelectedTreeNode(id: number): boolean {
    return this.selectedHierarchyNodeId() === id || this.st.viewedLevelId() === id;
  }

  /** Single-click in the tree locates/selects the object's rendered shape. The row's ↳ action explicitly opens it.
   *  If it lives elsewhere, open its owning canvas first and then reveal it. */
  async onTreeNodeClick(node: PhysicalObjectNode, ev?: Event) {
    ev?.stopPropagation();
    this.expandTreeTo(node.id);
    if (this.selectVisibleTreeNode(node)) return;
    if (node.id === this.st.currentNode()?.id) {
      this.scrollTreeNodeIntoView(node.id);
      return;
    }

    if (node.floorIndex != null && node.parentId === this.st.currentNode()?.id) {
      await this.st.peelToLevel(node.id);
      this.pulseCanvasNode(node.id);
      return;
    }

    // A fitting is stored below its pipe in the object tree but rendered on the pipe's owning section canvas.
    const fittingOwner = this.pipeGeos().find(pipe =>
      (pipe.fittings ?? []).some(fitting => fitting.nodeId === node.id));
    const ownerId = fittingOwner?.parentId ?? node.parentId;
    if (ownerId == null) {
      await this.st.navigate(node.id);
      return;
    }

    await this.st.navigate(ownerId);
    if (node.floorIndex != null && node.parentId === this.st.currentNode()?.id) {
      await this.st.peelToLevel(node.id);
      this.pulseCanvasNode(node.id);
      return;
    }
    // A parent's default view may land on its top occupied floor; a direct non-floor child belongs to Base.
    if (node.parentId === this.st.currentNode()?.id && node.floorIndex == null && this.st.viewedLevelId() != null) {
      await this.st.peelToBase();
    }
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    if (!this.selectVisibleTreeNode(node)) this.st.error.set(`${node.name || 'Object'} is not placed on this canvas.`);
  }

  private selectedHierarchyNodeId(): number | null {
    const selectedChild = this.st.selectedChild();
    if (selectedChild) return selectedChild.id;
    const pipeNodeId = this.selectedPipe()?.nodeId;
    if (pipeNodeId != null) return pipeNodeId;
    return this.selectedFitting()?.fitting.nodeId ?? null;
  }

  private selectVisibleTreeNode(node: PhysicalObjectNode): boolean {
    const box = this.st.boxes().find(item => item.childId === node.id);
    if (box) {
      this.st.selectBox(box.localId);
      this.bringRectIntoView({ x: box.x, y: box.y, w: box.width, h: box.height });
      this.pulseCanvasNode(node.id);
      return true;
    }
    const nested = this.nestedItems().items.find(item => item.childId === node.id);
    if (nested) {
      this.st.selectNested(node);
      this.bringRectIntoView(nested);
      this.pulseCanvasNode(node.id);
      return true;
    }
    const pipe = this.visiblePipes().find(item => item.nodeId === node.id);
    if (pipe) {
      this.selectPipe(pipe.id);
      this.bringRectIntoView(this.pathBounds(pipe.path));
      this.pulseCanvasNode(node.id);
      return true;
    }
    for (const pipeGeo of this.pipeGeos()) {
      const fitting = (pipeGeo.fittings ?? []).find(item => item.nodeId === node.id);
      if (!fitting) continue;
      const visible = this.viewFittings().find(item => item.id === fitting.id)
        ?? this.nestedItems().fittings.find(item => item.id === fitting.id);
      if (!visible) continue;
      this.selectFitting(fitting.id);
      this.bringRectIntoView({ x: visible.x - 12, y: visible.y - 12, w: 24, h: 24 });
      this.pulseCanvasNode(node.id);
      return true;
    }
    return false;
  }

  private expandTreeTo(id: number) {
    const byId = new Map(this.treeAllNodes().map(node => [node.id, node]));
    const open = new Set(this.expandedTree());
    let current: number | null = id;
    while (current != null) {
      open.add(current);
      current = byId.get(current)?.parentId ?? null;
    }
    this.expandedTree.set(open);
  }

  private scrollTreeNodeIntoView(id: number) {
    setTimeout(() => {
      const list = this.treeListRef?.nativeElement;
      const row = list?.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
      if (!list || !row) return;
      const listRect = list.getBoundingClientRect(), rowRect = row.getBoundingClientRect();
      if (rowRect.top < listRect.top) list.scrollTop -= listRect.top - rowRect.top;
      else if (rowRect.bottom > listRect.bottom) list.scrollTop += rowRect.bottom - listRect.bottom;
    }, 0);
  }

  private pulseCanvasNode(id: number) {
    this.canvasPulseNodeId.set(id);
    if (this.canvasPulseTimer) clearTimeout(this.canvasPulseTimer);
    this.canvasPulseTimer = setTimeout(() => this.canvasPulseNodeId.set(null), 1800);
  }
  private async loadTree() {
    const all = await firstValueFrom(this.nodesApi.getTree());
    this.treeAllNodes.set((all ?? []).filter(n => n.local !== false));
    this.expandToCurrent();
  }
  /** Expand the tree branches down to the current node so it's visible + highlighted. */
  private expandToCurrent() {
    const cur = this.st.currentNode(); if (!cur) return;
    this.expandTreeTo(cur.id);
    this.scrollTreeNodeIntoView(cur.id);
  }

  // ── pipes: guided elbowed routes; each pipe is a real PhysicalObject persisted as a 'Pipe' placement on its
  //    parent's diagram (geometry + fittings JSON in svgPath). pipeGeos is the global in-memory view-model across
  //    nodes (so nesting can render descendants' pipes); the current node's slice is pushed to the state to save. ──
  pipeGeos = signal<PipeGeo[]>([]);
  pipeMode = signal(false);                            // pipe-draw tool active
  pipeSnap = signal(true);                             // 90° elbow snap while drawing
  snapGrid = signal(false);                            // snap pipe vertices + box move/resize to the 28px grid
  // ── visual flow sim (no physics): click a source pipe → flow propagates through touching pipes, blocked by
  //    closed valves; flowing pipes animate directionally. For learning how a system is connected/controlled. ──
  flowMode = signal(false);
  flowSource = signal<string | null>(null);
  flowTopologyLoading = signal(false);
  toggleFlowMode() {
    this.cancelPipeConnect();
    this.arrangeMode.set(false);
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.flowMode.update(v => !v);
    if (!this.flowMode()) { this.flowSource.set(null); this.flowTopologyLoading.set(false); }
    else void this.preloadFlowInteriors();
  }

  private async preloadFlowInteriors() {
    const parentDid = this.st.currentDiagramId();
    if (parentDid == null) return;
    const pending = this.st.boxes().filter(box => !this.nestFetched.has(box.childId));
    if (!pending.length) return;
    this.flowTopologyLoading.set(true);
    try {
      await Promise.all(pending.map(box => {
        const child = this.st.childById().get(box.childId);
        return this.fetchNest(box.childId, child?.diagramId ?? null, parentDid);
      }));
    } finally {
      if (this.st.currentDiagramId() === parentDid) this.flowTopologyLoading.set(false);
    }
  }
  pipeDraft = signal<{ x: number; y: number }[]>([]);  // vertices being laid
  pipeCursor = signal<{ x: number; y: number } | null>(null); // cursor → live guide segment
  private pipeDraftStartAttachment: EquipmentPortRef | undefined;
  private pipeDraftEndAttachment: EquipmentPortRef | undefined;
  selectedPipeId = signal<string | null>(null);
  pipeEditName = '';
  /** Active cross-section continuation — the logical pipe (group) being run into another area. Survives navigation
   *  so you drill into the next section and keep drawing the SAME run (segments share groupId + name + color).
   *  `fromSection` = the section the NEXT segment continues from (so it can jump back to its origin). */
  continuing = signal<{ groupId: string; linkId: string; name: string; color?: string; width?: number; fromSection?: number } | null>(null);
  /** linkId whose connectors should pulse (set when you jump through a connector, so the counterpart is obvious). */
  highlightedLink = signal<string | null>(null);
  private highlightTimer: any = null;
  private pipeDraftEndA: number | null = null;         // object under the first vertex (endpoint anchor)
  private pipeDraftEndB: number | null = null;         // object under the last vertex (endpoint anchor)

  private nodeById = computed(() => new Map(this.treeAllNodes().map(n => [n.id, n])));
  private nameOf(id: number): string { return this.st.childById().get(id)?.name || this.nodeById().get(id)?.name || ('#' + id); }
  private hierarchyPath(id: number): string {
    const byId = this.nodeById();
    const names: string[] = [];
    const seen = new Set<number>();
    let current = byId.get(id) ?? null;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      names.unshift(current.name || current.tagNumber || ('#' + current.id));
      current = current.parentId != null ? (byId.get(current.parentId) ?? null) : null;
    }
    return names.length ? names.join(' → ') : this.nameOf(id);
  }
  hierarchyPathLabel(id: number): string { return this.hierarchyPath(id); }

  togglePipeMode() {
    this.cancelPipeConnect();
    this.arrangeMode.set(false);
    this.flowMode.set(false);
    this.flowSource.set(null);
    this.pipeMode.update(v => !v);
    this.cancelPipe();
  }

  setArrangeMode(on: boolean) {
    this.arrangeMode.set(on);
    this.drag = null;
    if (!on) return;
    this.cancelPipeConnect();
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.flowMode.set(false);
    this.flowSource.set(null);
  }

  /** Merge the CANVAS node's loaded pipes into the global pipeGeos, replacing any prior entries for that node. */
  private applyLoadedPipes(pipes: PipeGeo[], nodeId: number | null) {
    if (nodeId == null) return;
    this.pipeGeos.update(l => [...l.filter(p => p.parentId !== nodeId), ...pipes.map(p => ({ ...p, parentId: nodeId }))]);
  }

  private syncLoadedBoundaryPipeEndpoints(nodeId: number | null) {
    const boundary = this.st.boundary();
    const objectId = this.st.currentNode()?.id;
    if (nodeId == null || !boundary || objectId == null) return;
    const byPort = new Map(this.st.boundaryPorts().map(port => [port.id, this.equipmentPortPoint(boundary, port)]));
    let changed = false;
    this.pipeGeos.update(list => list.map(pipe => {
      if (pipe.parentId !== nodeId || pipe.points.length < 2) return pipe;
      const start = pipe.startAttachment?.objectId === objectId ? byPort.get(pipe.startAttachment.portId) : null;
      const end = pipe.endAttachment?.objectId === objectId ? byPort.get(pipe.endAttachment.portId) : null;
      if (!start && !end) return pipe;
      const points = [...pipe.points];
      if (start && Math.hypot(points[0].x - start.x, points[0].y - start.y) > 0.1) {
        points[0] = start; changed = true;
      }
      const last = points.length - 1;
      if (end && Math.hypot(points[last].x - end.x, points[last].y - end.y) > 0.1) {
        points[last] = end; changed = true;
      }
      return { ...pipe, points };
    }));
    if (changed) this.savePipes();
  }

  /** Node ids whose legacy-blob migration is running or done THIS session (synchronous re-entry guard). */
  private migratingNodes = new Set<number>();
  private migratingLegacyEdgeDiagrams = new Set<number>();

  /** One-time promotion of a legacy pre-entity pipe blob (Phase-4 __pipes__ JSON) into real pipe/fitting
   *  PhysicalObjects. Robust by construction: the state service keeps re-emitting the blob (doSave passthrough) so
   *  it's never lost; on abort/failure the created nodes are rolled back and the blob stays for a later retry; the
   *  blob is cleared ONLY in the same save that persists the real 'Pipe' placements (clearLegacyBlob → doSave). */
  private async migrateLegacyBlob(blobJson: string, nodeId: number) {
    if (this.migratingNodes.has(nodeId)) return;                                 // already running/done this session
    if (this.pipeGeos().some(p => p.parentId === nodeId && p.nodeId != null)) {  // real pipes already exist → nothing to migrate
      this.st.clearLegacyBlob(); return;
    }
    this.migratingNodes.add(nodeId);
    let legacy: PipeGeo[] = [];
    try { legacy = JSON.parse(blobJson); } catch { legacy = []; }
    if (!Array.isArray(legacy) || !legacy.length) { this.st.clearLegacyBlob(); return; } // empty/garbage → just drop it

    const created: number[] = [];                                                // for rollback on abort
    const migrated: PipeGeo[] = [];
    try {
      for (const lp of legacy) {
        const pipeNode = await firstValueFrom(this.nodesApi.createNode({ name: lp.name || 'Pipe', type: 'EQUIPMENT', parentId: nodeId }));
        if (!pipeNode) throw new Error('pipe create returned null'); // → rollback path (blob is preserved, never cleared)
        created.push(pipeNode.id);
        const fittings: PipeFitting[] = [];
        for (const lf of (lp.fittings ?? [])) {
          const fNode = await firstValueFrom(this.nodesApi.createNode({ name: lf.name || lf.tag || 'Fitting', type: 'EQUIPMENT', parentId: pipeNode.id }));
          if (!fNode) throw new Error('fitting create returned null');
          created.push(fNode.id);
          fittings.push({ ...lf, nodeId: fNode.id });
        }
        migrated.push({ ...lp, id: 'pipe-' + pipeNode.id, parentId: nodeId, nodeId: pipeNode.id, localId: undefined, fittings });
      }
    } catch {                                                                    // create failed → undo, retry next visit
      await this.rollbackNodes(created); this.migratingNodes.delete(nodeId); return;
    }
    if ((this.st.canvasNode()?.id ?? null) !== nodeId) {                         // navigated away → undo, retry next visit
      await this.rollbackNodes(created); this.migratingNodes.delete(nodeId); return;
    }
    // Apply + persist. clearLegacyBlob() stops the passthrough so THIS save both writes the real 'Pipe' placements
    // AND drops the blob — one atomic complete-set write. The blob only ever disappears once its replacement exists.
    this.pipeGeos.update(l => [...l.filter(p => p.parentId !== nodeId), ...migrated]);
    this.st.clearLegacyBlob();
    this.savePipes();
  }

  /** Best-effort undo of migration-created nodes (children before parents → reverse creation order). */
  private async rollbackNodes(ids: number[]) {
    for (const id of [...ids].reverse()) { try { await firstValueFrom(this.nodesApi.deleteNode(id)); } catch { /* best effort */ } }
  }

  /** Persist the CANVAS node's pipes as real 'Pipe' placements (via the state service's save chain). */
  private savePipes() {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return;
    this.st.setPipes(this.pipeGeos().filter(p => p.parentId === parent));
  }

  /** The grid cell (content coords) — matches the canvas background grid so snapping lands on drawn lines. */
  private readonly GRID = 28;
  toggleSnapGrid() { this.snapGrid.update(v => !v); }
  /** Snap a point to the grid when snap-to-grid is on (else unchanged). */
  private snapPt(pt: { x: number; y: number }): { x: number; y: number } {
    if (!this.snapGrid()) return pt;
    const g = this.GRID;
    return { x: Math.round(pt.x / g) * g, y: Math.round(pt.y / g) * g };
  }
  /** Snap a length to the grid when snap is on (min-clamped). */
  private snapLen(v: number, min: number): number {
    if (!this.snapGrid()) return v;
    return Math.max(min, Math.round(v / this.GRID) * this.GRID);
  }

  /** Snap a point to horizontal/vertical from the previous vertex (clean elbows). */
  private snapPipePoint(p: { x: number; y: number }, from?: { x: number; y: number }): { x: number; y: number } {
    if (!this.pipeSnap() || !from) return p;
    return Math.abs(p.x - from.x) >= Math.abs(p.y - from.y) ? { x: p.x, y: from.y } : { x: from.x, y: p.y };
  }
  /** Add a vertex at the pointer (canvas / box / nested click while in pipe mode). The first vertex snaps onto a
   *  nearby existing pipe so branches/tees connect. */
  addPipePoint(ev: PointerEvent) {
    const p = this.contentPoint(ev);
    const nearbyPort = this.nearestEquipmentPort(p);
    this.addPipePointAt(nearbyPort ? { x: nearbyPort.x, y: nearbyPort.y } : p,
      nearbyPort ? { objectId: nearbyPort.objectId, portId: nearbyPort.portId } : undefined);
  }

  private addPipePointAt(p: { x: number; y: number }, attachment?: EquipmentPortRef) {
    const pts = this.pipeDraft();
    const onBox = attachment?.objectId ?? this.boxAt(p.x, p.y)?.childId ?? null; // anchor endpoints to equipment for cross-area follow
    if (!pts.length) this.pipeDraftEndA = onBox;
    this.pipeDraftEndB = onBox;
    if (!pts.length) this.pipeDraftStartAttachment = attachment;
    this.pipeDraftEndAttachment = attachment;
    // Snap onto a nearby EXISTING pipe at ANY vertex → START on one = branch/tee; END on one = connect/join. This
    // takes priority over the 90°/grid snap so tees land exactly on the target pipe.
    const onPipe = this.snapToExistingPipe(p);
    let np: { x: number; y: number };
    if (onPipe) np = onPipe;
    else if (pts.length) np = this.snapPt(this.snapPipePoint(p, pts[pts.length - 1]));
    else np = this.snapPt(p);
    this.pipeDraft.set([...pts, np]);
  }
  cancelPipe() {
    this.pipeDraft.set([]); this.pipeCursor.set(null);
    this.pipeDraftEndA = null; this.pipeDraftEndB = null;
    this.pipeDraftStartAttachment = undefined; this.pipeDraftEndAttachment = undefined;
  }
  /** Finish the in-progress pipe → create its PhysicalObject, add it to the canvas, persist. */
  async finishPipe() {
    let pts = this.pipeDraft();
    pts = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y); // drop dbl-click dup
    this.pipeDraft.set([]); this.pipeCursor.set(null);
    const a = this.pipeDraftEndA, b = this.pipeDraftEndB; this.pipeDraftEndA = null; this.pipeDraftEndB = null;
    const startAttachment = this.pipeDraftStartAttachment, endAttachment = this.pipeDraftEndAttachment;
    this.pipeDraftStartAttachment = undefined; this.pipeDraftEndAttachment = undefined;
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (pts.length < 2 || parent == null) return;
    const cont = this.continuing();                                // cross-section continuation → same run's identity
    const pipeName = cont?.name ?? 'Pipe';
    const node = await firstValueFrom(this.nodesApi.createNode({ name: pipeName, type: 'EQUIPMENT', parentId: parent }));
    if (!node) return;                                              // creation failed → no phantom pipe
    if ((this.st.canvasNode()?.id ?? null) !== parent) {            // navigated away mid-create → undo the orphan node
      await firstValueFrom(this.nodesApi.deleteNode(node.id)); return;
    }
    const geo: PipeGeo = { id: 'pipe-' + node.id, parentId: parent, nodeId: node.id, points: pts, name: pipeName,
                           color: cont?.color, width: cont?.width, groupId: cont?.groupId,
                           continuesFrom: cont?.fromSection, // remembers the section it was continued FROM (jump-back)
                           // DESTINATION port at THIS segment's START — the entry from the source. Matched to the
                           // source's end port by linkId; stores the origin section so it can jump back even unloaded.
                           ports: cont?.linkId ? [{ linkId: cont.linkId, at: 'start', section: cont.fromSection } as PipePort] : undefined,
                           aEnd: a ?? undefined, bEnd: b ?? undefined,
                           startAttachment, endAttachment, fittings: [] };
    this.pipeGeos.update(list => [...list, geo]);
    this.savePipes();
    if (cont) { this.continuing.set(null); this.pipeMode.set(false); } // hop done — exit draw; re-Continue to run further/branch
    this.selectPipe(geo.id);
  }

  /** Run the selected pipe into ANOTHER area: assign/reuse its group id, arm continuation, and enter draw mode.
   *  Drill into the neighboring section and keep drawing — the new segment joins the same logical pipe. */
  continuePipe() {
    const p = this.selectedPipe(); if (!p || !this.selectedPipeOnCanvas()) return;
    this.arrangeMode.set(false);
    const gid = p.groupId ?? ('grp-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36));
    const linkId = 'lnk-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const from = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? undefined; // this segment's section = jump-back origin
    // Add a SOURCE port at THIS pipe's END (the onward direction) + adopt the group id. Each Continue = one link =
    // one branch, so a pipe can source several links (branch to multiple sections).
    this.pipeGeos.update(l => l.map(x => (x.id === p.id
      ? { ...x, groupId: gid, ports: [...(x.ports ?? []), { linkId, at: 'end' } as PipePort] } : x)));
    this.savePipes();
    this.continuing.set({ groupId: gid, linkId, name: p.name || 'Pipe', color: p.color, width: p.width, fromSection: from });
    this.selectPipe(null);      // show the continuation banner, not the pipe inspector
    this.pipeMode.set(true);
  }
  cancelContinue() { this.continuing.set(null); this.pipeMode.set(false); this.cancelPipe(); }

  /** Follow-stubs: when you're viewing a node that a pipe (on its PARENT canvas) connects to, offer a jump to the
   *  pipe's other end — "seamlessly follow the pipe to the connecting area when drilled in". */
  followStubs = computed(() => {
    const cur = this.st.currentNode(); const bc = this.st.breadcrumb();
    if (!cur || bc.length < 2) return [];
    const parentId = bc[bc.length - 2].id;
    const out: { id: string; target: number; label: string; pipe: string }[] = [];
    for (const p of this.pipeGeos()) {
      if (p.parentId !== parentId) continue;
      const far = p.aEnd === cur.id ? p.bEnd : (p.bEnd === cur.id ? p.aEnd : null);
      if (far != null) out.push({ id: p.id, target: far, label: this.nameOf(far), pipe: p.name || 'Pipe' });
    }
    return out;
  });

  /** Pipes to render on the current canvas (their parent node is the one being shown). */
  viewPipes = computed(() => {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return [];
    return this.pipeGeos().filter(p => p.parentId === parent && p.points.length >= 2).map(p => ({
      id: p.id, nodeId: p.nodeId, points: p.points.map(pt => `${pt.x},${pt.y}`).join(' '),
      path: p.points,
      color: p.color || '#5b9bd5', width: p.width || 8, name: p.name || 'Pipe',
      start: p.points[0], end: p.points[p.points.length - 1],
      mid: p.points[Math.floor(p.points.length / 2)], sel: p.id === this.selectedPipeId(),
    }));
  });
  /** The in-progress draft polyline + the live guide segment to the cursor. */
  pipeDraftPoints = computed(() => this.pipeDraft().map(p => `${p.x},${p.y}`).join(' '));
  pipeGuideSeg = computed(() => {
    const pts = this.pipeDraft(); const cur = this.pipeCursor();
    if (!pts.length || !cur) return null;
    const last = pts[pts.length - 1];
    const s = this.snapPt(this.snapPipePoint(cur, last));
    return { x1: last.x, y1: last.y, x2: s.x, y2: s.y };
  });

  selectedPipe = computed(() => this.pipeGeos().find(p => p.id === this.selectedPipeId()) ?? null);

  // Direct-manipulation connection mode. The source and target are picked from visible pipe endpoints on the canvas;
  // nested pipes participate through the same top interaction layer as current-section pipes.
  pipeConnect = signal<PipeConnectSession | null>(null);
  pipeConnectPending = signal<PipeConnectPending | null>(null);
  pipeConnectHover = signal<string | null>(null);
  pipeBodyHover = signal<string | null>(null);
  connectionBusy = signal(false);
  pipeHitWidth = computed(() => 24 / this.zoom());

  visiblePipes = computed<VisiblePipe[]>(() => {
    const parentId = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? 0;
    const current: VisiblePipe[] = this.viewPipes().map(pipe => ({
      id: pipe.id, parentId, name: pipe.name, nested: false,
      points: pipe.points, path: pipe.path,
      start: pipe.start, end: pipe.end, mid: pipe.mid,
      nodeId: pipe.nodeId,
    }));
    const nested: VisiblePipe[] = this.nestedItems().pipes.map(pipe => ({
      id: pipe.id, nodeId: pipe.nodeId, parentId: pipe.parentId, name: pipe.name, nested: true,
      points: pipe.points, path: pipe.path,
      start: pipe.start, end: pipe.end, mid: pipe.mid,
    }));
    return [...current, ...nested];
  });

  selectedPipeToolbar = computed(() => {
    if (this.pipeConnect()) return null;
    const selectedId = this.selectedPipeId();
    return selectedId ? (this.visiblePipes().find(pipe => pipe.id === selectedId) ?? null) : null;
  });
  hoveredVisiblePipe = computed(() => {
    const id = this.pipeBodyHover();
    return id ? (this.visiblePipes().find(pipe => pipe.id === id) ?? null) : null;
  });
  selectedPipePath = computed(() => {
    const pipe = this.selectedPipe();
    return pipe ? this.hierarchyPath(pipe.parentId) : '';
  });
  canConnectSelectedPipe = computed(() => {
    const selectedId = this.selectedPipeId();
    return !!selectedId && this.visiblePipes().some(pipe => pipe.id === selectedId);
  });

  connectionEndpointHandles = computed<PipeConnectionEndpointHandle[]>(() => {
    const session = this.pipeConnect();
    if (!session) return [];
    const visible = this.visiblePipes();
    const source = visible.find(pipe => pipe.id === session.sourcePipeId);
    if (!source) return [];
    if (session.sourceEnd == null) {
      return [
        { pipeId: source.id, end: 'start' as PipeEnd, point: source.start, role: 'source-choice' as const, name: source.name },
        { pipeId: source.id, end: 'end' as PipeEnd, point: source.end, role: 'source-choice' as const, name: source.name },
      ];
    }
    const handles: PipeConnectionEndpointHandle[] = [{
      pipeId: source.id, end: session.sourceEnd,
      point: session.sourceEnd === 'start' ? source.start : source.end,
      role: 'source-selected' as const, name: source.name,
    }];
    for (const pipe of visible) {
      if (pipe.id === source.id) continue;
      handles.push({ pipeId: pipe.id, end: 'start', point: pipe.start, role: 'target' as const, name: pipe.name });
      handles.push({ pipeId: pipe.id, end: 'end', point: pipe.end, role: 'target' as const, name: pipe.name });
    }
    return handles;
  });

  pipeConnectionConfirmation = computed(() => {
    const session = this.pipeConnect();
    const pending = this.pipeConnectPending();
    if (!session?.sourceEnd || !pending) return null;
    const visible = this.visiblePipes();
    const source = visible.find(pipe => pipe.id === session.sourcePipeId);
    const target = visible.find(pipe => pipe.id === pending.targetPipeId);
    if (!source || !target) return null;
    const point = pending.targetEnd === 'start' ? target.start : target.end;
    const sourceGeo = this.pipeGeos().find(pipe => pipe.id === source.id);
    const targetGeo = this.pipeGeos().find(pipe => pipe.id === target.id);
    const sourceHasLinks = !!sourceGeo?.ports?.some(port => port.at === session.sourceEnd);
    const targetHasLinks = !!targetGeo?.ports?.some(port => port.at === pending.targetEnd);
    return {
      x: point.x, y: point.y,
      sourceLabel: `${source.name} ${session.sourceEnd}`,
      targetLabel: `${target.name} ${pending.targetEnd}`,
      hasConflict: sourceHasLinks || targetHasLinks,
      reconnect: !!session.reconnectLinkId,
    };
  });

  selectedPipeLinks = computed(() => {
    const selected = this.selectedPipe();
    if (!selected) return [];
    const all = this.pipeGeos();
    return (selected.ports ?? []).map(port => {
      const counterparts = all.filter(pipe =>
        pipe.id !== selected.id && (pipe.ports ?? []).some(otherPort => otherPort.linkId === port.linkId));
      const target = counterparts[0];
      const targetPort = target?.ports?.find(otherPort => otherPort.linkId === port.linkId);
      const sectionId = target?.parentId ?? port.section ?? null;
      return {
        linkId: port.linkId,
        at: port.at,
        targetPipeId: target?.id ?? null,
        targetAt: targetPort?.at ?? null,
        targetLabel: target
          ? `${target.name || 'Pipe'} — ${this.nameOf(target.parentId)}`
          : sectionId != null ? this.nameOf(sectionId) : 'Counterpart not loaded',
        sectionId,
      };
    });
  });

  /** Jumps to the OTHER sections of the selected pipe's cross-section run (same groupId): the section it was
   *  continued FROM (⇠, always available — stored on the segment) + any other loaded segments' sections (⇢). */
  pipeRunJumps = computed<{ target: number; label: string; dir: 'from' | 'to' }[]>(() => {
    const p = this.selectedPipe(); if (!p || !p.groupId) return [];
    const out: { target: number; label: string; dir: 'from' | 'to' }[] = [];
    const seen = new Set<number>([p.parentId]);
    if (p.continuesFrom != null && !seen.has(p.continuesFrom)) { seen.add(p.continuesFrom); out.push({ target: p.continuesFrom, label: this.nameOf(p.continuesFrom), dir: 'from' }); }
    for (const q of this.pipeGeos()) {
      if (q.groupId === p.groupId && !seen.has(q.parentId)) { seen.add(q.parentId); out.push({ target: q.parentId, label: this.nameOf(q.parentId), dir: 'to' }); }
    }
    return out;
  });

  /** Off-page-style CONNECTORS drawn at a cross-section pipe's endpoints (like a P&ID off-page connector): a
   *  circle + arrow at the end where the run continues into / came from another section. Double-click a connector
   *  to jump to the counterpart section. Start = "came from" (continuesFrom); end = "continues to" (a loaded
   *  same-group segment in another section). Arrow points OUTWARD along the last segment (the flow direction). */
  pipeConnectors = computed<{ pipeId: string; linkId: string; x: number; y: number; target: number | null; label: string; dir: 'in' | 'out'; angle: number }[]>(() => {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return [];
    const deg = (dx: number, dy: number) => Math.atan2(dy, dx) * 180 / Math.PI;
    const all = this.pipeGeos();
    const out: { pipeId: string; linkId: string; x: number; y: number; target: number | null; label: string; dir: 'in' | 'out'; angle: number }[] = [];
    for (const p of all) {
      if (p.parentId !== parent || p.points.length < 2 || !p.ports?.length) continue;
      for (const port of p.ports) {
        // deterministic end: SOURCE port = the pipe's END, DESTINATION port = its START (no draw-direction guess)
        const end = port.at === 'start' ? p.points[0] : p.points[p.points.length - 1];
        const prev = port.at === 'start' ? p.points[1] : p.points[p.points.length - 2];
        // counterpart = the OTHER pipe carrying the same linkId (its section is the jump target)
        const cp = all.find(q => q.id !== p.id && (q.ports ?? []).some(pp => pp.linkId === port.linkId));
        const target = port.section ?? cp?.parentId ?? null;
        out.push({
          pipeId: p.id, linkId: port.linkId, x: end.x, y: end.y, target,
          label: target != null ? this.nameOf(target) : '',
          dir: port.at === 'start' ? 'in' : 'out',
          angle: deg(end.x - prev.x, end.y - prev.y),
        });
      }
    }
    return out;
  });

  /** Junction dots where a pipe's endpoint sits ON another pipe (a tee/branch or a connection) — a small filled
   *  node so the connection reads clearly, like a P&ID tee. */
  pipeJunctions = computed<{ x: number; y: number }[]>(() => {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return [];
    const pipes = this.pipeGeos().filter(p => p.parentId === parent && p.points.length >= 2);
    const out: { x: number; y: number }[] = [];
    for (const p of pipes) {
      for (const ep of [p.points[0], p.points[p.points.length - 1]]) {
        for (const q of pipes) {
          if (q.id === p.id) continue;
          const near = this.nearestOnPipe(q.points, ep);
          if (near && Math.hypot(near.x - ep.x, near.y - ep.y) <= 3.5) { out.push({ x: ep.x, y: ep.y }); break; }
        }
      }
    }
    return out;
  });

  equipmentPortNetworks = computed<EquipmentPortNetwork[]>(() => {
    this.nestVersion();
    const grouped = new Map<string, EquipmentPortNetwork>();
    const add = (objectId: number, ports: EquipmentPort[]) => {
      for (const port of ports) {
        const circuit = (port.circuit || '').trim();
        if (!circuit) continue;
        const key = `${objectId}:${circuit.toLowerCase()}`;
        const network = grouped.get(key) ?? { objectId, circuit, portIds: [] };
        if (!network.portIds.includes(port.id)) network.portIds.push(port.id);
        grouped.set(key, network);
      }
    };
    for (const box of this.st.boxes()) add(box.childId, box.ports ?? []);
    const currentId = this.st.currentNode()?.id;
    if (currentId != null) add(currentId, this.st.boundaryPorts());
    for (const shapes of this.nestCache.values()) for (const shape of shapes) add(shape.childId, shape.ports ?? []);
    return [...grouped.values()];
  });

  /** Visual-flow result: pipeId → the pipe's FLOWING sub-segments (a pipe can have several — e.g. a bypass leaves
   *  one segment dry). Built as a NODE-EDGE graph: each pipe is split at its endpoints, valves and junctions;
   *  edges are the sub-segments; nodes merge by position within a section and every linkId across sections. BFS from
   *  the source spreads through junctions and OPEN valves; a CLOSED valve is a barrier → flow routes around via a
   *  bypass. An endpoint may carry several independent links; all of them remain traversable. */
  flowResult = computed<Map<string, { segsStr: string[]; segsPath: { x: number; y: number }[][] }>>(() => {
    if (!this.flowMode() || this.flowTopologyLoading()) return new Map();
    return tracePipeFlow(
      this.pipeGeos(),
      this.flowSource(),
      fitting => this.fittingByKey.get(fitting.type)?.cat === 'valve',
      this.equipmentPortNetworks(),
    );
  });
  flowOf(id: string) { return this.flowResult().get(id) ?? null; }
  /** Toggle a valve fitting open/closed (visual flow sim), persisting it. */
  toggleValveClosed(fittingId: string) {
    this.pipeGeos.update(l => l.map(p => ({ ...p, fittings: (p.fittings ?? []).map(f => (f.id === fittingId ? { ...f, closed: !f.closed } : f)) })));
    this.savePipes();
  }

  /** Jump through a cross-section connector to its counterpart section, pulsing the matching connector there so
   *  you can see where the run continues (like a P&ID off-page connector tag). */
  jumpConnector(c: { linkId: string; target: number | null }) {
    if (c.target == null) return;
    this.highlightedLink.set(c.linkId);
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.highlightTimer = setTimeout(() => this.highlightedLink.set(null), 4500);
    this.navigate(c.target);
  }
  onPipeConnectorDown(ev: PointerEvent, pipeId: string) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    this.selectPipe(pipeId);
  }
  selectPipe(id: string | null) {
    this.selectedPipeId.set(id);
    if (id != null) this.selectedEquipmentPort.set(null);
    this.pipeEdit.set(false); // start each selection in view mode; user toggles Edit route
    if (id != null) { this.selectedFittingId.set(null); this.st.selectBox(null); this.st.selectedNestedNode.set(null); }
    const pipe = this.pipeGeos().find(x => x.id === id);
    this.pipeEditName = pipe?.name || '';
    void this.loadObjNode(id != null ? pipe?.nodeId : undefined); // its object → Systems/Maximo/Files sections
  }

  /** Fetch a selected pipe/fitting's full PhysicalObject so its shared links sections (Systems/Maximo/Files) show.
   *  Clears immediately, then applies only if the same pipe/fitting is still selected (drop a stale fetch). */
  private async loadObjNode(nodeId?: number) {
    this.pipeFittingNode.set(null);
    if (nodeId == null) return;
    try {
      const node = await firstValueFrom(this.nodesApi.getNode(nodeId));
      if (node && this.currentSelectedNodeId() === nodeId) {
        this.pipeFittingNode.set(node);
        // Prime this object's OWN system membership so toggling a System computes from the real set, never an empty
        // base — fittings are grandchildren, absent from the canvas node's child-systems map (else a toggle wipes it).
        const sys = await firstValueFrom(this.nodesApi.getObjectSystems(nodeId));
        if (this.currentSelectedNodeId() === nodeId) this.st.primeChildSystems(nodeId, sys.map(s => s.id));
      }
    } catch { /* leave cleared */ }
  }
  private currentSelectedNodeId(): number | undefined {
    return this.selectedPipe()?.nodeId ?? this.selectedFitting()?.fitting.nodeId ?? undefined;
  }
  savePipeName() {
    const id = this.selectedPipeId(); if (id == null) return;
    const name = this.pipeEditName.trim() || 'Pipe';
    this.pipeGeos.update(l => l.map(p => (p.id === id ? { ...p, name } : p))); this.savePipes();
  }
  setPipeColor(color: string) { const id = this.selectedPipeId(); if (id != null) { this.pipeGeos.update(l => l.map(p => (p.id === id ? { ...p, color } : p))); this.savePipes(); } }
  setPipeWidth(width: number) { const id = this.selectedPipeId(); if (id != null) { this.pipeGeos.update(l => l.map(p => (p.id === id ? { ...p, width } : p))); this.savePipes(); } }
  async reverseSelectedPipeFlow() {
    const id = this.selectedPipeId();
    if (id == null) return;
    const before = this.pipeGeos().find(pipe => pipe.id === id);
    if (!before) return;
    this.pipeGeos.update(list => list.map(pipe =>
      pipe.id === id ? { ...pipe, flowReversed: !pipe.flowReversed } : pipe));
    try {
      await this.persistChangedPipes(new Set([id]));
    } catch (error: any) {
      this.pipeGeos.update(list => list.map(pipe => pipe.id === id ? before : pipe));
      this.st.error.set(error?.message || 'Could not reverse flow for this pipe section.');
    }
  }

  traceSelectedPipe() {
    const id = this.selectedPipeId();
    if (!id) return;
    this.cancelPipeConnect();
    this.arrangeMode.set(false);
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.flowMode.set(true);
    this.flowSource.set(id);
  }

  openSelectedPipeSection() {
    const pipe = this.selectedPipe();
    if (pipe) this.navigate(pipe.parentId);
  }

  private pipeGeometryJson(pipe: PipeGeo): string {
    return JSON.stringify({
      points: pipe.points,
      fittings: pipe.fittings ?? [],
      aEnd: pipe.aEnd,
      bEnd: pipe.bEnd,
      groupId: pipe.groupId,
      continuesFrom: pipe.continuesFrom,
      ports: pipe.ports,
      startAttachment: pipe.startAttachment,
      endAttachment: pipe.endAttachment,
      legacyEdgeLocalId: pipe.legacyEdgeLocalId,
      flowReversed: pipe.flowReversed,
    });
  }

  /** Persist changed pipes on the current canvas through its serialized save chain and update nested/off-screen
   *  placements individually, avoiding a destructive complete-set save against a canvas that is not open. */
  private async persistChangedPipes(pipeIds: Set<string>) {
    const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    const changed = this.pipeGeos().filter(pipe => pipeIds.has(pipe.id));
    if (changed.some(pipe => pipe.parentId === currentParent)) this.savePipes();
    await Promise.all(changed
      .filter(pipe => pipe.parentId !== currentParent)
      .map(pipe => this.persistOffCanvasPipe(pipe)));
  }

  private async persistOffCanvasPipe(pipe: PipeGeo) {
    let placementId = pipe.placementId;
    if (placementId == null) {
      const knownParent = this.nodeById().get(pipe.parentId);
      const parent = knownParent ?? await firstValueFrom(this.nodesApi.getNode(pipe.parentId));
      if (parent?.diagramId == null) throw new Error(`No diagram found for ${this.nameOf(pipe.parentId)}.`);
      const placements = (await firstValueFrom(this.placementApi.getByDiagram(parent.diagramId)))?.responseData ?? [];
      const placement = placements.find(item => item.sourceEntityType === PIPE_SRC && item.sourceEntityId === pipe.nodeId);
      placementId = placement?.id;
      if (placementId == null) throw new Error(`Could not find the saved placement for ${pipe.name || 'pipe'}.`);
      const resolvedId = placementId;
      this.pipeGeos.update(list => list.map(item => item.id === pipe.id ? { ...item, placementId: resolvedId } : item));
    }
    await firstValueFrom(this.placementApi.update(placementId, { svgPath: this.pipeGeometryJson(pipe) }));
  }

  /** Remove a stale counterpart that is not currently in pipeGeos but whose section id was saved on the port. */
  private async pruneUnloadedPipeLink(sectionId: number, linkId: string) {
    const knownSection = this.nodeById().get(sectionId);
    const section = knownSection ?? await firstValueFrom(this.nodesApi.getNode(sectionId));
    if (section?.diagramId == null) return;
    const placements = (await firstValueFrom(this.placementApi.getByDiagram(section.diagramId)))?.responseData ?? [];
    await Promise.all(placements
      .filter(item => item.id != null && item.sourceEntityType === PIPE_SRC && item.svgPath?.includes(linkId))
      .map(async item => {
        let geometry: any;
        try { geometry = JSON.parse(item.svgPath || '{}'); } catch { return; }
        if (!Array.isArray(geometry.ports) || !geometry.ports.some((port: PipePort) => port.linkId === linkId)) return;
        geometry.ports = geometry.ports.filter((port: PipePort) => port.linkId !== linkId);
        await firstValueFrom(this.placementApi.update(item.id!, { svgPath: JSON.stringify(geometry) }));
      }));
  }

  beginPipeConnect(pipeId: string | null = this.selectedPipeId()) {
    if (!pipeId || !this.visiblePipes().some(pipe => pipe.id === pipeId)) {
      this.st.error.set('Open or zoom into the pipe until it is visible, then connect it on the canvas.');
      return;
    }
    this.arrangeMode.set(false);
    this.flowMode.set(false);
    this.flowSource.set(null);
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.selectPipe(pipeId);
    this.pipeConnect.set({ sourcePipeId: pipeId, sourceEnd: null });
    this.pipeConnectPending.set(null);
    this.pipeConnectHover.set(null);
    this.st.error.set(null);
  }

  beginPipeReconnect(linkId: string, at: PipeEnd) {
    const pipeId = this.selectedPipeId();
    if (!pipeId || !this.visiblePipes().some(pipe => pipe.id === pipeId)) return;
    this.arrangeMode.set(false);
    this.flowMode.set(false);
    this.flowSource.set(null);
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.pipeConnect.set({ sourcePipeId: pipeId, sourceEnd: at, reconnectLinkId: linkId });
    this.pipeConnectPending.set(null);
    this.pipeConnectHover.set(null);
  }

  cancelPipeConnect() {
    this.pipeConnect.set(null);
    this.pipeConnectPending.set(null);
    this.pipeConnectHover.set(null);
  }

  isPipeConnectSource(pipeId: string): boolean { return this.pipeConnect()?.sourcePipeId === pipeId; }
  isPipeConnectCandidate(pipeId: string): boolean {
    const session = this.pipeConnect();
    return !!session?.sourceEnd && session.sourcePipeId !== pipeId;
  }
  isPipeConnectHover(pipeId: string): boolean { return this.pipeConnectHover() === pipeId; }
  setPipeConnectHover(pipeId: string | null) {
    if (!this.pipeConnect()?.sourceEnd || pipeId === this.pipeConnect()?.sourcePipeId) return;
    this.pipeConnectHover.set(pipeId);
  }

  onConnectionEndpointDown(
    ev: PointerEvent,
    handle: PipeConnectionEndpointHandle,
  ) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    const session = this.pipeConnect();
    if (!session || this.connectionBusy()) return;
    if (handle.role === 'source-choice') {
      this.pipeConnect.set({ ...session, sourceEnd: handle.end });
      this.pipeConnectPending.set(null);
      return;
    }
    if (handle.role === 'target') this.proposePipeConnectTarget(handle.pipeId, handle.end);
  }

  private nearestVisiblePipeEnd(pipeId: string, point: { x: number; y: number }): PipeEnd | null {
    const pipe = this.visiblePipes().find(item => item.id === pipeId);
    if (!pipe) return null;
    return Math.hypot(point.x - pipe.start.x, point.y - pipe.start.y)
      <= Math.hypot(point.x - pipe.end.x, point.y - pipe.end.y) ? 'start' : 'end';
  }

  private pathBounds(path: { x: number; y: number }[]): { x: number; y: number; w: number; h: number } {
    if (!path.length) return { x: 0, y: 0, w: 0, h: 0 };
    const xs = path.map(point => point.x), ys = path.map(point => point.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(1, Math.max(...xs) - x), h: Math.max(1, Math.max(...ys) - y) };
  }

  private distanceToPath(point: { x: number; y: number }, path: { x: number; y: number }[]): number {
    let best = Infinity;
    for (let index = 0; index < path.length - 1; index++) {
      const projected = this.projectOnSeg(point, path[index], path[index + 1]);
      best = Math.min(best, Math.hypot(point.x - projected.x, point.y - projected.y));
    }
    return best;
  }

  private nearestVisiblePipe(point: { x: number; y: number }): VisiblePipe | null {
    const threshold = this.pipeHitWidth() / 2;
    let nearest: VisiblePipe | null = null;
    let best = threshold;
    for (const pipe of this.visiblePipes()) {
      const distance = this.distanceToPath(point, pipe.path);
      if (distance <= best) { best = distance; nearest = pipe; }
    }
    return nearest;
  }

  onVisiblePipeDown(ev: PointerEvent) {
    const pipe = this.nearestVisiblePipe(this.contentPoint(ev));
    if (pipe) this.onPipeDown(ev, pipe.id);
  }

  onVisiblePipeMove(ev: PointerEvent) {
    const pipe = this.nearestVisiblePipe(this.contentPoint(ev));
    this.pipeBodyHover.set(pipe?.id ?? null);
    this.setPipeConnectHover(pipe?.id ?? null);
  }

  clearVisiblePipeHover() {
    this.pipeBodyHover.set(null);
    this.setPipeConnectHover(null);
  }

  isPipeBodyHover(pipeId: string): boolean { return this.pipeBodyHover() === pipeId; }

  private proposePipeConnectTarget(pipeId: string, end: PipeEnd) {
    const session = this.pipeConnect();
    if (!session?.sourceEnd || pipeId === session.sourcePipeId) return;
    this.pipeConnectPending.set({ targetPipeId: pipeId, targetEnd: end });
    this.pipeConnectHover.set(pipeId);
  }

  async confirmPipeConnection(mode: 'branch' | 'replace-ends' | 'reconnect') {
    const session = this.pipeConnect();
    const pending = this.pipeConnectPending();
    if (!session?.sourceEnd || !pending || this.connectionBusy()) return;
    const saved = await this.savePipeConnection(session, pending, mode);
    if (saved) this.cancelPipeConnect();
  }

  private async savePipeConnection(
    session: PipeConnectSession,
    pending: PipeConnectPending,
    mode: 'branch' | 'replace-ends' | 'reconnect',
  ): Promise<boolean> {
    const selected = this.pipeGeos().find(pipe => pipe.id === session.sourcePipeId);
    const target = this.pipeGeos().find(pipe => pipe.id === pending.targetPipeId);
    if (!selected || !target || selected.id === target.id || session.sourceEnd == null) return false;

    const selectedLinks = new Set((selected.ports ?? [])
      .filter(port => port.at === session.sourceEnd).map(port => port.linkId));
    const targetLinks = new Set((target.ports ?? [])
      .filter(port => port.at === pending.targetEnd).map(port => port.linkId));
    const sharedLink = [...selectedLinks].find(linkId => targetLinks.has(linkId));
    if (sharedLink && sharedLink !== session.reconnectLinkId) {
      this.st.error.set('Those two pipe ends are already connected.');
      return false;
    }

    this.connectionBusy.set(true);
    this.st.error.set(null);
    const before = this.pipeGeos();
    const removedLinks = mode === 'reconnect' && session.reconnectLinkId
      ? new Set<string>([session.reconnectLinkId])
      : mode === 'replace-ends' ? new Set<string>([...selectedLinks, ...targetLinks]) : new Set<string>();
    const changedIds = new Set<string>([selected.id, target.id]);
    for (const pipe of before) {
      if ((pipe.ports ?? []).some(port => removedLinks.has(port.linkId))) changedIds.add(pipe.id);
    }
    const loadedSectionsByLink = new Map<string, Set<number>>();
    for (const linkId of removedLinks) {
      loadedSectionsByLink.set(linkId, new Set(before
        .filter(pipe => (pipe.ports ?? []).some(port => port.linkId === linkId))
        .map(pipe => pipe.parentId)));
    }
    const remoteHints = before.flatMap(pipe => (pipe.ports ?? [])
      .filter(port => removedLinks.has(port.linkId) && port.section != null)
      .map(port => ({ linkId: port.linkId, sectionId: port.section! })));

    const linkId = 'lnk-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const groupId = selected.groupId ?? target.groupId
      ?? ('grp-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36));
    this.pipeGeos.set(before.map(pipe => {
      const ports = (pipe.ports ?? []).filter(port => !removedLinks.has(port.linkId));
      if (pipe.id === selected.id) {
        return { ...pipe, groupId, ports: [...ports, { linkId, at: session.sourceEnd!, section: target.parentId }] };
      }
      if (pipe.id === target.id) {
        return { ...pipe, groupId, ports: [...ports, { linkId, at: pending.targetEnd, section: selected.parentId }] };
      }
      return ports.length === (pipe.ports ?? []).length ? pipe : { ...pipe, ports };
    }));

    try {
      await this.persistChangedPipes(changedIds);
      const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
      await Promise.all(remoteHints
        .filter((hint, index, all) => all.findIndex(other => other.linkId === hint.linkId && other.sectionId === hint.sectionId) === index)
        .filter(hint => hint.sectionId !== currentParent && !loadedSectionsByLink.get(hint.linkId)?.has(hint.sectionId))
        .map(hint => this.pruneUnloadedPipeLink(hint.sectionId, hint.linkId)));
      return true;
    } catch (error: any) {
      this.st.error.set(error?.message || 'Could not save the pipe connection.');
      return false;
    } finally {
      this.connectionBusy.set(false);
    }
  }

  async disconnectPipeLink(linkId: string) {
    if (this.connectionBusy()) return;
    const before = this.pipeGeos();
    const affected = before.filter(pipe => (pipe.ports ?? []).some(port => port.linkId === linkId));
    if (!affected.length) return;
    const loadedSections = new Set(affected.map(pipe => pipe.parentId));
    const remoteSections = [...new Set(affected.flatMap(pipe => (pipe.ports ?? [])
      .filter(port => port.linkId === linkId && port.section != null)
      .map(port => port.section!)))];
    this.pipeGeos.set(before.map(pipe => {
      const ports = (pipe.ports ?? []).filter(port => port.linkId !== linkId);
      return ports.length === (pipe.ports ?? []).length ? pipe : { ...pipe, ports };
    }));
    this.connectionBusy.set(true);
    this.st.error.set(null);
    try {
      await this.persistChangedPipes(new Set(affected.map(pipe => pipe.id)));
      const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
      await Promise.all(remoteSections
        .filter(sectionId => sectionId !== currentParent && !loadedSections.has(sectionId))
        .map(sectionId => this.pruneUnloadedPipeLink(sectionId, linkId)));
    } catch (error: any) {
      this.st.error.set(error?.message || 'Could not disconnect the pipe sections.');
    } finally {
      this.connectionBusy.set(false);
    }
  }
  async deletePipe(id: string) {
    const pipe = this.pipeGeos().find(p => p.id === id);
    if (!pipe) return;
    // Only delete from the pipe's OWN canvas — savePipes writes the current canvas, so deleting a nested pipe would
    // orphan its placement on the real parent diagram. (The UI already hides Delete for nested; this is defense.)
    if (pipe.parentId !== (this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null)) return;
    // Delete the entities FIRST (fittings before the pipe — the backend refuses to delete a node with children).
    // Only drop the pipe from the model once the deletes succeed; on failure keep it (stays hidden + retriable).
    try {
      for (const f of (pipe.fittings ?? [])) if (f.nodeId != null) await firstValueFrom(this.nodesApi.deleteNode(f.nodeId));
      if (pipe.nodeId != null) await firstValueFrom(this.nodesApi.deleteNode(pipe.nodeId));
    } catch { this.st.error.set('Could not delete the pipe — retry.'); return; }
    this.pipeGeos.update(l => l.filter(p => p.id !== id)); this.savePipes(); // now drop its 'Pipe' placement
    if (pipe.nodeId != null) this.st.forgetChildNode(pipe.nodeId); // don't let the soft-deleted node reappear in the palette
    if (this.selectedPipeId() === id) this.selectedPipeId.set(null);
  }

  // ── edit a pipe's route: drag vertices, add a bend at a segment midpoint, double-click a vertex to remove it ──
  pipeEdit = signal(false);
  togglePipeEdit() { this.pipeEdit.update(v => !v); }

  /** Handles for the selected on-canvas pipe's route: a dot per vertex + a small dot at each segment midpoint. */
  pipeEditHandles = computed(() => {
    const empty = { verts: [] as { x: number; y: number; i: number }[], mids: [] as { x: number; y: number; i: number }[] };
    if (!this.pipeEdit() || !this.selectedPipeOnCanvas()) return empty;
    const p = this.selectedPipe(); if (!p) return empty;
    const verts = p.points.map((pt, i) => ({ x: pt.x, y: pt.y, i }));
    const mids: { x: number; y: number; i: number }[] = [];
    for (let i = 0; i < p.points.length - 1; i++)
      mids.push({ x: (p.points[i].x + p.points[i + 1].x) / 2, y: (p.points[i].y + p.points[i + 1].y) / 2, i });
    return { verts, mids };
  });

  onPipeVtxDown(ev: PointerEvent, index: number) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    const p = this.selectedPipe(); if (!p) return;
    this.drag = { kind: 'pipeVtx', pipeId: p.id, index };
  }
  private movePipeVtx(pipeId: string, index: number, pt: { x: number; y: number }) {
    const pipe = this.pipeGeos().find(item => item.id === pipeId);
    if (!pipe) return;
    const endpoint = index === 0 || index === pipe.points.length - 1;
    const nearby = endpoint ? this.nearestEquipmentPort(pt) : null;
    const q0 = nearby ? { x: nearby.x, y: nearby.y } : this.snapPt(pt);
    const attachment = nearby ? { objectId: nearby.objectId, portId: nearby.portId } : undefined;
    this.pipeGeos.update(list => list.map(item => {
      if (item.id !== pipeId) return item;
      const points = item.points.map((point, pointIndex) => pointIndex === index ? q0 : point);
      if (index === 0) return { ...item, points, startAttachment: attachment, aEnd: attachment?.objectId };
      if (index === item.points.length - 1) return { ...item, points, endAttachment: attachment, bEnd: attachment?.objectId };
      return { ...item, points };
    }));
  }
  /** Double-click a vertex to remove that bend (keeps at least a two-point segment). */
  removePipeVtx(index: number, ev?: Event) {
    ev?.stopPropagation();
    const p = this.selectedPipe();
    if (!p || p.points.length <= 2 || index === 0 || index === p.points.length - 1) return;
    this.pipeGeos.update(l => l.map(pp => pp.id === p.id
      ? { ...pp, points: pp.points.filter((_, i) => i !== index) } : pp));
    this.savePipes();
  }
  /** Insert a bend at a segment midpoint and immediately drag it. */
  onPipeVtxAddDown(ev: PointerEvent, segIndex: number) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    const p = this.selectedPipe(); if (!p) return;
    const at = this.snapPt(this.contentPoint(ev));
    const insertAt = segIndex + 1;
    this.pipeGeos.update(l => l.map(pp => pp.id === p.id
      ? { ...pp, points: [...pp.points.slice(0, insertAt), at, ...pp.points.slice(insertAt)] } : pp));
    this.drag = { kind: 'pipeVtx', pipeId: p.id, index: insertAt };
  }

  /** Snap a would-be pipe START onto a nearby existing pipe (so branches/tees connect). */
  private snapToExistingPipe(p: { x: number; y: number }): { x: number; y: number } | null {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return null;
    let best: { x: number; y: number } | null = null, bestD = Infinity;
    const thresh = 22 / Math.max(0.2, this.zoom()); // ~22 screen px
    for (const pipe of this.pipeGeos()) {
      if (pipe.parentId !== parent || pipe.points.length < 2) continue;
      const near = this.nearestOnPipe(pipe.points, p);
      if (near) { const d = Math.hypot(near.x - p.x, near.y - p.y); if (d < bestD && d <= thresh) { bestD = d; best = near; } }
    }
    return best;
  }

  // ── fittings on a pipe (valves / instruments / drains / vents / sprays) ──
  // valves render as a bowtie + an actuator letter; instruments as a bubble with an ISA code; line items as glyphs.
  readonly BOWTIE = 'M3,3 L11,8 L3,13 Z M19,3 L11,8 L19,13 Z';
  readonly fittingTypes: { key: string; label: string; cat: 'valve' | 'line' | 'instrument'; code?: string; path?: string; color: string }[] = [
    { key: 'valve', label: 'Isolation valve', cat: 'valve', code: '', color: '#8bc34a' },
    { key: 'mov', label: 'MOV (motor-operated)', cat: 'valve', code: 'M', color: '#8bc34a' },
    { key: 'aov', label: 'AOV (air-operated)', cat: 'valve', code: 'A', color: '#8bc34a' },
    { key: 'cv', label: 'Control valve', cat: 'valve', code: 'C', color: '#8bc34a' },
    { key: 'check', label: 'Check valve', cat: 'valve', code: '›', color: '#8bc34a' },
    { key: 'relief', label: 'Relief valve', cat: 'valve', code: 'R', color: '#ef5350' },
    { key: 'drain', label: 'Drain', cat: 'line', path: 'M11,1 L11,7 M6,7 L16,7 L11,15 Z', color: '#42a5f5' },
    { key: 'vent', label: 'Vent', cat: 'line', path: 'M11,15 L11,9 M6,9 L16,9 L11,1 Z', color: '#26c6da' },
    { key: 'spray', label: 'Spray', cat: 'line', path: 'M11,1 L11,7 M11,7 L5,14 M11,7 L11,14 M11,7 L17,14', color: '#ab47bc' },
    { key: 'pt', label: 'Pressure transmitter', cat: 'instrument', code: 'PT', color: '#ffca28' },
    { key: 'pi', label: 'Pressure gauge', cat: 'instrument', code: 'PI', color: '#ffca28' },
    { key: 'dpt', label: 'DP transmitter', cat: 'instrument', code: 'PDT', color: '#ffca28' },
    { key: 'ft', label: 'Flow transmitter', cat: 'instrument', code: 'FT', color: '#4dd0e1' },
    { key: 'fi', label: 'Flow gauge', cat: 'instrument', code: 'FI', color: '#4dd0e1' },
    { key: 'tt', label: 'Temp transmitter', cat: 'instrument', code: 'TT', color: '#ff8a65' },
    { key: 'ti', label: 'Temp gauge', cat: 'instrument', code: 'TI', color: '#ff8a65' },
    { key: 'lt', label: 'Level transmitter', cat: 'instrument', code: 'LT', color: '#81c784' },
  ];
  private fittingByKey = new Map(this.fittingTypes.map(f => [f.key, f]));
  isValveFitting(): boolean { const t = this.selectedFitting()?.fitting.type; return !!t && this.fittingByKey.get(t)?.cat === 'valve'; }

  fittingType = signal<string | null>(null);   // armed fitting → next canvas click drops it on the selected pipe
  selectedFittingId = signal<string | null>(null);
  fittingEditName = ''; fittingEditTag = ''; fittingEditTag2 = ''; fittingEditDesc = '';
  pickFitting(type: string) {
    const next = this.fittingType() === type ? null : type;
    if (next) {
      this.arrangeMode.set(false);
      this.cancelPipeConnect();
      this.pipeMode.set(false);
      this.cancelPipe();
      this.flowMode.set(false);
      this.flowSource.set(null);
    }
    this.fittingType.set(next);
  }

  private projectOnSeg(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
    if (len2 === 0) return { x: a.x, y: a.y };
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2; t = Math.max(0, Math.min(1, t));
    return { x: a.x + t * dx, y: a.y + t * dy };
  }
  /** Nearest point ON a polyline to p (anchors a fitting / branch to the path). */
  private nearestOnPipe(points: { x: number; y: number }[], p: { x: number; y: number }) {
    let best: { x: number; y: number } | null = null, bestD = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
      const pr = this.projectOnSeg(p, points[i], points[i + 1]);
      const d = (pr.x - p.x) ** 2 + (pr.y - p.y) ** 2;
      if (d < bestD) { bestD = d; best = pr; }
    }
    return best;
  }
  /** Drop the armed fitting onto the selected pipe at the nearest point to the click → create its PhysicalObject. */
  private async placeFitting(ev: PointerEvent) {
    const type = this.fittingType(); const pipe = this.selectedPipe();
    this.fittingType.set(null);
    if (!type || !pipe) return;
    const at = this.nearestOnPipe(pipe.points, this.contentPoint(ev));
    if (!at) return;
    const label = this.fittingByKey.get(type)?.label || 'Fitting';
    const fNode = pipe.nodeId != null
      ? await firstValueFrom(this.nodesApi.createNode({ name: label, type: 'EQUIPMENT', parentId: pipe.nodeId }))
      : null;
    if (pipe.nodeId != null && !fNode) return;                     // createNode failed → no phantom fitting
    if ((this.st.canvasNode()?.id ?? null) !== pipe.parentId) {    // navigated away mid-create → undo the orphan node
      if (fNode) await firstValueFrom(this.nodesApi.deleteNode(fNode.id)); return;
    }
    const fid = 'fit-' + (fNode?.id ?? Date.now());
    this.pipeGeos.update(l => l.map(pp => pp.id === pipe.id
      ? { ...pp, fittings: [...(pp.fittings ?? []), { id: fid, type, at, nodeId: fNode?.id ?? undefined }] } : pp));
    this.savePipes();
    this.selectFitting(fid);
  }

  /** Render spec for a fitting: a bowtie (valves) or glyph (line) or nothing (instrument bubble = the fit-bg). */
  private fittingRender(f: PipeFitting, x: number, y: number) {
    const g = this.fittingByKey.get(f.type);
    return {
      id: f.id, nodeId: f.nodeId, x, y, cat: g?.cat ?? 'line',
      path: g?.cat === 'valve' ? this.BOWTIE : (g?.path ?? ''),
      actuator: g?.cat === 'valve' ? (g?.code ?? '') : '', code: g?.cat === 'instrument' ? (g?.code ?? '') : '',
      color: g?.color ?? '#ccc', tag: f.tag ?? '', tag2: f.tag2 ?? '', double: !!f.double,
      sel: f.id === this.selectedFittingId(),
      isValve: g?.cat === 'valve', closed: !!f.closed, // valve state for the flow sim
    };
  }
  /** Fittings to render on the current canvas (of pipes whose parent is the shown node). */
  viewFittings = computed(() => {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return [];
    const out: (ReturnType<typeof this.fittingRender> & { pipeId: string })[] = [];
    for (const p of this.pipeGeos()) {
      if (p.parentId !== parent) continue;
      for (const f of (p.fittings ?? [])) out.push({ ...this.fittingRender(f, f.at.x, f.at.y), pipeId: p.id });
    }
    return out;
  });

  selectedFitting = computed(() => {
    const id = this.selectedFittingId(); if (id == null) return null;
    for (const p of this.pipeGeos()) {
      const f = (p.fittings ?? []).find(x => x.id === id);
      if (f) return { fitting: f, pipeId: p.id, typeLabel: this.fittingByKey.get(f.type)?.label ?? f.type };
    }
    return null;
  });
  selectFitting(id: string | null, ev?: Event) {
    ev?.stopPropagation();
    this.selectedFittingId.set(id);
    if (id != null) { this.selectedPipeId.set(null); this.st.selectBox(null); this.st.selectedNestedNode.set(null); }
    const f = this.selectedFitting()?.fitting;
    this.fittingEditName = f?.name ?? ''; this.fittingEditTag = f?.tag ?? ''; this.fittingEditTag2 = f?.tag2 ?? ''; this.fittingEditDesc = f?.desc ?? '';
    void this.loadObjNode(id != null ? f?.nodeId : undefined); // its object → Systems/Maximo/Files sections
  }
  /** A nested pipe/fitting (a descendant's, shown via zoom) is clickable from the parent view: single-click selects
   *  it (info + Open-object), double-click drills to its object to edit. Mirrors nested boxes. */
  onNestPipeClick(np: NestPipe, ev: PointerEvent) { this.onPipeDown(ev, np.id); }
  onNestFittingClick(nf: NestFitting, ev?: PointerEvent) {
    if (ev && this.startMiddlePan(ev)) return;
    ev?.stopPropagation();
    if (this.flowMode()) { if (nf.cat === 'valve') this.toggleValveClosed(nf.id); return; }
    this.selectFitting(nf.id);
  }

  /** The selected pipe/fitting lives on the CURRENT canvas (so its edits persist here). A nested-selected one is
   *  info-only until you Open it — the inspector hides its edit controls and offers "Open object" instead. */
  selectedPipeOnCanvas = computed(() => {
    const p = this.selectedPipe(); const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    return !!p && p.parentId === parent;
  });
  selectedFittingOnCanvas = computed(() => {
    const sf = this.selectedFitting(); if (!sf) return false;
    const p = this.pipeGeos().find(x => x.id === sf.pipeId);
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    return !!p && p.parentId === parent;
  });

  private patchFitting(patch: Partial<PipeFitting>) {
    const sel = this.selectedFitting(); if (!sel) return;
    this.pipeGeos.update(l => l.map(p => p.id === sel.pipeId
      ? { ...p, fittings: (p.fittings ?? []).map(f => f.id === sel.fitting.id ? { ...f, ...patch } : f) } : p));
    this.savePipes();
  }
  saveFitting() { this.patchFitting({ name: this.fittingEditName.trim(), tag: this.fittingEditTag.trim(), tag2: this.fittingEditTag2.trim(), desc: this.fittingEditDesc.trim() }); }
  toggleFittingDouble(on: boolean) { this.patchFitting({ double: on }); }
  async deleteFitting(id: string) {
    let nodeId: number | undefined; let owner: PipeGeo | undefined;
    for (const p of this.pipeGeos()) { const f = (p.fittings ?? []).find(x => x.id === id); if (f) { nodeId = f.nodeId; owner = p; break; } }
    // Only delete from the owning pipe's OWN canvas (else savePipes can't drop it from the right diagram → orphan).
    if (owner && owner.parentId !== (this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null)) return;
    // Soft-delete the fitting entity FIRST; only drop it from the model on success (else keep it, retriable).
    if (nodeId != null) { try { await firstValueFrom(this.nodesApi.deleteNode(nodeId)); } catch { this.st.error.set('Could not delete the fitting — retry.'); return; } }
    this.pipeGeos.update(l => l.map(p => ({ ...p, fittings: (p.fittings ?? []).filter(f => f.id !== id) })));
    this.savePipes();
    if (this.selectedFittingId() === id) this.selectedFittingId.set(null);
  }

  // ── drag a fitting ALONG its pipe ──
  onFittingDown(ev: PointerEvent, id: string, pipeId: string) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    if (this.flowMode()) { // in flow mode a click toggles a valve open/closed (no drag/select)
      const f = this.pipeGeos().flatMap(p => p.fittings ?? []).find(x => x.id === id);
      if (f && this.fittingByKey.get(f.type)?.cat === 'valve') this.toggleValveClosed(id);
      return;
    }
    this.selectFitting(id);
    if (this.arrangeMode() && !this.spacePanning()) this.drag = { kind: 'fitting', fittingId: id, pipeId };
    else this.startPan(ev);
  }
  /** Pipe hit-line pointer-down: in flow mode → set it as the flow source; else select it. */
  onPipeDown(ev: PointerEvent, id: string) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    if (this.flowMode()) { this.flowSource.set(id); return; }
    const session = this.pipeConnect();
    if (session) {
      const end = this.nearestVisiblePipeEnd(id, this.contentPoint(ev));
      if (!end) return;
      if (id === session.sourcePipeId && session.sourceEnd == null) {
        this.pipeConnect.set({ ...session, sourceEnd: end });
        this.pipeConnectPending.set(null);
      } else if (id !== session.sourcePipeId && session.sourceEnd != null) {
        this.proposePipeConnectTarget(id, end);
      }
      return;
    }
    this.selectPipe(id);
    this.startPan(ev);
  }
  private moveFitting(id: string, at: { x: number; y: number }) {
    this.pipeGeos.update(l => l.map(p => ({ ...p, fittings: (p.fittings ?? []).map(f => f.id === id ? { ...f, at } : f) })));
  }

  // ── box rendering helpers ──
  boxLabel(b: MapBox): string {
    const c = this.st.childById().get(b.childId);
    return c?.name || c?.tagNumber || `#${b.childId}`;
  }
  boxType(b: MapBox): string | null { return this.st.childById().get(b.childId)?.type ?? null; }
  boxColor(b: MapBox): string { return b.color || poColor(this.boxType(b)); }
  boxShape(b: MapBox): FootprintShape { return b.shape || 'rect'; }
  /** Translucent footprint fill (runs read a touch more solid, like a pipe). */
  boxFill(b: MapBox): string { return hexToRgba(this.boxColor(b), this.isRevealing(b) ? 0.05 : (b.shape === 'run' ? 0.4 : 0.16)); }
  /** Very faint fill for a ghost (an item on another floor, shown for context). */
  ghostFill(g: GhostBox): string { return hexToRgba(g.color || '#8aa0b6', 0.08); }
  /** Translucent fill for a nested item, fading with depth so deeper items don't overwhelm. */
  nestFill(n: NestItem): string { return hexToRgba(n.color || '#8aa0b6', Math.max(0.06, 0.2 - n.depth * 0.03)); }
  /** A run taller than it is wide is a vertical run → its sheen runs across the short axis. */
  runVertical(b: MapBox): boolean { return b.height > b.width; }
  /** The equipment badge (small corner icon) — only for path glyphs, not 'none'. */
  badgeOf(b: MapBox): PlantGlyph | undefined {
    const g = PLANT_GLYPH_BY_KEY.get(b.glyph || 'none');
    return g && g.kind === 'path' ? g : undefined;
  }
  boxHasChildren(b: MapBox): boolean { return this.st.childById().get(b.childId)?.hasChildren ?? false; }
  isSelected(b: MapBox): boolean { return this.st.selectedLocalIds().includes(b.localId); }
  /** The reference box (selection[0]) — what align + match-size measure against. Shown with a distinct outline. */
  isReference(b: MapBox): boolean { return this.st.selectedLocalIds().length > 1 && this.st.selectedLocalId() === b.localId; }

  // ── multi-shape operations (align / match size / duplicate) ─────────────────────────────────────────────
  // Geometry comes from the shared DiagramAlignmentService (same math the diagram builder uses) — the boxes are
  // adapted to its ShapeRect contract by localId, and the returned updates are applied back through setBoxRect.

  /** Boxes as ShapeRects, selection order preserved so index 0 stays the reference. */
  private selectionRects(): ShapeRect[] {
    return this.st.selectedBoxes().map(b => ({ id: b.localId, x: b.x, y: b.y, width: b.width, height: b.height }));
  }

  private applyShapeUpdates(updates: ShapeUpdate[]) {
    const byId = this.boxById();
    for (const u of updates) {
      const b = byId.get(u.id);
      if (!b) continue;
      this.st.setBoxRect(u.id, u.x ?? b.x, u.y ?? b.y, u.width ?? b.width, u.height ?? b.height);
    }
    for (const u of updates) this.syncAttachedPipeEndpoints(u.id);
    if (updates.length) this.savePipes();
  }

  canOperate = computed(() => this.st.selectedLocalIds().length > 1);

  align(kind: AlignmentType) { this.applyShapeUpdates(this.alignSvc.alignShapes(this.selectionRects(), kind)); }
  matchSize(dim: 'width' | 'height' | 'both') { this.applyShapeUpdates(this.alignSvc.matchSize(this.selectionRects(), dim)); }
  distribute(dir: DistributeType) { this.applyShapeUpdates(this.alignSvc.distributeShapes(this.selectionRects(), dir)); }

  /**
   * Duplicate the selection. A box IS a PhysicalObject, so each copy creates a real new node first, then places
   * and styles it. Offset so copies don't hide under the originals (the map has no z-order to separate them).
   * Tag numbers are deliberately NOT copied — they must stay unique.
   */
  async duplicateSelection() {
    if (this.duplicating()) return;
    const source = this.st.selectedBoxes();
    if (!source.length) return;
    this.duplicating.set(true);
    const OFF = 20;
    const newIds: number[] = [];
    try {
      for (const b of source) {
        const c = this.st.childById().get(b.childId);
        const created = await this.st.createChild({ name: `${c?.name || 'Object'} copy`, type: c?.type || undefined });
        if (!created) continue;
        const localId = this.st.placeChild(created.id, b.x + OFF, b.y + OFF, b.shape);
        if (localId == null) continue;
        this.st.setBoxRect(localId, b.x + OFF, b.y + OFF, b.width, b.height);
        this.st.patchBox(localId, { glyph: b.glyph, color: b.color, showChildren: b.showChildren });
        this.st.patchBoxPorts(localId, (b.ports ?? []).map((port, index) => ({
          ...port, id: `port-${Date.now().toString(36)}-${index}-${Math.floor(Math.random() * 1e6).toString(36)}`,
        })));
        newIds.push(localId);
      }
    } finally {
      this.duplicating.set(false);
    }
    if (newIds.length) this.st.setSelection(newIds);   // leave the copies selected, ready to drag away
  }

  /** Canvas keyboard shortcuts. Guarded so they never fire while a field or the inline rename is being typed in. */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent) {
    if (this.editingBoxLocalId() != null) return;                 // inline rename input lives ON the canvas
    const t = ev.target as HTMLElement | null;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (ev.code === 'Space') {
      ev.preventDefault();
      this.spacePanning.set(true);
      return;
    }
    if (this.pipeMode() || this.fittingType()) return;             // pipe tools own the keyboard while armed
    const sel = this.st.selectedLocalIds();

    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'd') {
      ev.preventDefault(); void this.duplicateSelection(); return;
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'a') {
      ev.preventDefault(); this.st.setSelection(this.st.boxes().map(b => b.localId)); return;
    }
    if (!sel.length) return;
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      for (const id of [...sel]) this.st.removeBox(id);
      return;
    }
    const step = ev.shiftKey ? 10 : 1;
    const dx = ev.key === 'ArrowLeft' ? -step : ev.key === 'ArrowRight' ? step : 0;
    const dy = ev.key === 'ArrowUp' ? -step : ev.key === 'ArrowDown' ? step : 0;
    if (dx || dy) {
      if (!this.arrangeMode()) return;
      ev.preventDefault();
      for (const b of this.st.selectedBoxes()) {
        this.st.setBoxRect(b.localId, Math.max(0, b.x + dx), Math.max(0, b.y + dy), b.width, b.height);
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(ev: KeyboardEvent) {
    if (ev.code === 'Space') this.spacePanning.set(false);
  }

  // ── create / place ──
  async addObject() {
    const name = this.newName.trim();
    if (!name) return;
    const hadNode = this.st.currentNode() != null;
    const created = await this.st.createChild({ name, type: this.newType, tagNumber: this.newTag.trim() || undefined });
    this.newName = ''; this.newTag = '';
    if (!created) return;
    if (!hadNode) this.st.openNode(created.id);   // root: open its blank canvas
    else this.st.placeChild(created.id);          // child: drop a box on the current canvas
  }

  placeFromPalette(childId: number) { this.st.placeChild(childId); }

  /** Add a floor/level to the current node — it appears in the Levels switcher, NOT as a box on the canvas. */
  async addLevel() {
    const name = this.newName.trim();
    await this.st.createFloor(name);
    this.newName = '';
  }

  // ── level management (rename / reorder / delete in the Levels switcher) ──
  editingFloorId = signal<number | null>(null);
  floorEditName = '';

  startRenameFloor(f: PhysicalObjectNode) { this.editingFloorId.set(f.id); this.floorEditName = f.name ?? ''; }
  cancelRenameFloor() { this.editingFloorId.set(null); }
  async saveRenameFloor(f: PhysicalObjectNode) {
    const name = this.floorEditName.trim();
    if (name) await this.st.updateNodeData(f.id, { name });
    this.editingFloorId.set(null);
  }

  async deleteFloor(f: PhysicalObjectNode) {
    if (!confirm(`Delete level "${f.name}"? (only works if it's empty)`)) return;
    await this.st.deleteObject(f.id);
  }

  /** Move a level up/down the stack by swapping its floorIndex with the neighbour. */
  async moveFloor(f: PhysicalObjectNode, dir: 'up' | 'down') {
    const floors = this.floorsTopDown();          // sorted top → bottom (descending floorIndex)
    const i = floors.findIndex(x => x.id === f.id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= floors.length) return;
    const other = floors[j];
    const fi = f.floorIndex ?? 0, oi = other.floorIndex ?? 0;
    await this.st.updateNodeData(f.id, { floorIndex: oi });
    await this.st.updateNodeData(other.id, { floorIndex: fi });
  }

  // ── pointer interaction ──
  /** Screen point → content coords, undoing the viewport offset + pan + zoom. */
  private contentPoint(ev: PointerEvent): { x: number; y: number } {
    const el = this.viewportRef?.nativeElement;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const z = this.zoom();
    return { x: (ev.clientX - r.left - this.panX()) / z, y: (ev.clientY - r.top - this.panY()) / z };
  }

  /** Pan only as much as necessary to reveal a selected item; do not disorient the user by recentering something
   *  that is already on screen. */
  private bringRectIntoView(rect: { x: number; y: number; w: number; h: number }) {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;
    const z = this.zoom();
    const margin = 56;
    const left = this.panX() + rect.x * z;
    const top = this.panY() + rect.y * z;
    const right = left + rect.w * z;
    const bottom = top + rect.h * z;
    let panX = this.panX(), panY = this.panY();
    const availableW = Math.max(1, viewport.clientWidth - margin * 2);
    const availableH = Math.max(1, viewport.clientHeight - margin * 2);
    if (right - left > availableW) panX += viewport.clientWidth / 2 - (left + right) / 2;
    else if (left < margin) panX += margin - left;
    else if (right > viewport.clientWidth - margin) panX -= right - (viewport.clientWidth - margin);
    if (bottom - top > availableH) panY += viewport.clientHeight / 2 - (top + bottom) / 2;
    else if (top < margin) panY += margin - top;
    else if (bottom > viewport.clientHeight - margin) panY -= bottom - (viewport.clientHeight - margin);
    this.panX.set(panX);
    this.panY.set(panY);
  }

  private boxAt(x: number, y: number): MapBox | null {
    const list = this.st.boxes();
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) return b;
    }
    return null;
  }

  private equipmentPortPoint(
    rect: { x: number; y: number; w: number; h: number },
    port: Pick<EquipmentPort, 'x' | 'y'>,
  ): { x: number; y: number } {
    return { x: rect.x + port.x * rect.w, y: rect.y + port.y * rect.h };
  }

  private projectEquipmentPort(box: MapBox, point: { x: number; y: number }): { x: number; y: number } {
    const nx = Math.max(0, Math.min(1, (point.x - box.x) / Math.max(1, box.width)));
    const ny = Math.max(0, Math.min(1, (point.y - box.y) / Math.max(1, box.height)));
    if (box.shape === 'circle') {
      const dx = nx - 0.5, dy = ny - 0.5;
      const length = Math.hypot(dx, dy) || 1;
      return { x: 0.5 + dx / length * 0.5, y: 0.5 + dy / length * 0.5 };
    }
    const distances = [ny, 1 - nx, 1 - ny, nx];
    const nearest = distances.indexOf(Math.min(...distances));
    if (nearest === 0) return { x: nx, y: 0 };
    if (nearest === 1) return { x: 1, y: ny };
    if (nearest === 2) return { x: nx, y: 1 };
    return { x: 0, y: ny };
  }

  private nearestEquipmentPort(point: { x: number; y: number }): EquipmentPortHandle | null {
    const threshold = 20 / Math.max(0.2, this.zoom());
    let nearest: EquipmentPortHandle | null = null;
    let best = threshold;
    for (const handle of this.equipmentPortHandles()) {
      const distance = Math.hypot(handle.x - point.x, handle.y - point.y);
      if (distance <= best) { nearest = handle; best = distance; }
    }
    return nearest;
  }

  beginPortPlacement() {
    const box = this.st.selectedBox();
    if (!box) return;
    this.setArrangeMode(true);
    this.portPlacementBoxLocalId.set(box.localId);
    this.selectedEquipmentPort.set(null);
  }

  cancelPortPlacement() { this.portPlacementBoxLocalId.set(null); }

  private placeEquipmentPort(box: MapBox, point: { x: number; y: number }) {
    const normalized = this.projectEquipmentPort(box, point);
    const index = (box.ports?.length ?? 0) + 1;
    const port: EquipmentPort = {
      id: `port-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      label: `P${index}`, circuit: 'Circuit 1', role: 'bidirectional', ...normalized,
    };
    this.st.patchBoxPorts(box.localId, [...(box.ports ?? []), port]);
    this.selectedEquipmentPort.set({ objectId: box.childId, portId: port.id, boxLocalId: box.localId });
    this.portPlacementBoxLocalId.set(null);
  }

  updateEquipmentPort(boxLocalId: number, portId: string, patch: Partial<EquipmentPort>) {
    const box = this.boxById().get(boxLocalId);
    if (!box) return;
    this.st.patchBoxPorts(boxLocalId, (box.ports ?? []).map(port => port.id === portId ? { ...port, ...patch } : port));
  }

  deleteEquipmentPort(boxLocalId: number, portId: string) {
    const box = this.boxById().get(boxLocalId);
    if (!box) return;
    this.st.patchBoxPorts(boxLocalId, (box.ports ?? []).filter(port => port.id !== portId));
    const affected = new Set(this.pipeGeos()
      .filter(pipe => (pipe.startAttachment?.objectId === box.childId && pipe.startAttachment.portId === portId)
        || (pipe.endAttachment?.objectId === box.childId && pipe.endAttachment.portId === portId))
      .map(pipe => pipe.id));
    this.pipeGeos.update(list => list.map(pipe => ({
      ...pipe,
      startAttachment: pipe.startAttachment?.objectId === box.childId && pipe.startAttachment.portId === portId
        ? undefined : pipe.startAttachment,
      endAttachment: pipe.endAttachment?.objectId === box.childId && pipe.endAttachment.portId === portId
        ? undefined : pipe.endAttachment,
      aEnd: pipe.startAttachment?.objectId === box.childId && pipe.startAttachment.portId === portId
        ? undefined : pipe.aEnd,
      bEnd: pipe.endAttachment?.objectId === box.childId && pipe.endAttachment.portId === portId
        ? undefined : pipe.bEnd,
    })));
    this.selectedEquipmentPort.set(null);
    if (affected.size) void this.persistChangedPipes(affected);
  }

  private async migrateLegacyBoxEdges(diagramId: number) {
    if (this.migratingLegacyEdgeDiagrams.has(diagramId)) return;
    const parentId = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    const edges = [...this.st.edges()];
    if (parentId == null || !edges.length) return;
    this.migratingLegacyEdgeDiagrams.add(diagramId);
    const boxes = new Map(this.st.boxes().map(box => [box.localId, { ...box, ports: [...(box.ports ?? [])] }]));
    const createdNodeIds: number[] = [];
    const migratedPipes: PipeGeo[] = [];
    try {
      for (const edge of edges) {
        if (this.pipeGeos().some(pipe => pipe.parentId === parentId && pipe.legacyEdgeLocalId === edge.localId)) continue;
        const source = boxes.get(edge.sourceLocalId), target = boxes.get(edge.targetLocalId);
        if (!source || !target) continue;
        const waypoints = edge.waypoints ?? [];
        const sourceToward = waypoints[0] ?? { x: target.x + target.width / 2, y: target.y + target.height / 2 };
        const targetToward = waypoints[waypoints.length - 1] ?? { x: source.x + source.width / 2, y: source.y + source.height / 2 };
        const sourcePosition = this.projectEquipmentPort(source, sourceToward);
        const targetPosition = this.projectEquipmentPort(target, targetToward);
        const suffix = `${Date.now().toString(36)}-${edge.localId}`;
        const sourcePort: EquipmentPort = {
          id: `port-${suffix}-a`, label: `P${source.ports.length + 1}`, circuit: 'Circuit 1',
          role: 'bidirectional', ...sourcePosition,
        };
        const targetPort: EquipmentPort = {
          id: `port-${suffix}-b`, label: `P${target.ports.length + 1}`, circuit: 'Circuit 1',
          role: 'bidirectional', ...targetPosition,
        };
        source.ports.push(sourcePort); target.ports.push(targetPort);
        const sourcePoint = this.equipmentPortPoint({ x: source.x, y: source.y, w: source.width, h: source.height }, sourcePort);
        const targetPoint = this.equipmentPortPoint({ x: target.x, y: target.y, w: target.width, h: target.height }, targetPort);
        const node = await firstValueFrom(this.nodesApi.createNode({ name: 'Pipe', type: 'EQUIPMENT', parentId }));
        if (!node) throw new Error('Could not create a routed pipe for a legacy connection.');
        createdNodeIds.push(node.id);
        migratedPipes.push({
          id: `pipe-${node.id}`, nodeId: node.id, parentId, name: 'Pipe', color: edge.color, width: edge.width ?? 8,
          points: [sourcePoint, ...waypoints, targetPoint], fittings: [],
          aEnd: source.childId, bEnd: target.childId,
          startAttachment: { objectId: source.childId, portId: sourcePort.id },
          endAttachment: { objectId: target.childId, portId: targetPort.id },
          legacyEdgeLocalId: edge.localId,
        });
      }
      if (this.st.currentDiagramId() !== diagramId) throw new Error('Canvas changed during legacy connection migration.');
      for (const box of boxes.values()) this.st.patchBoxPorts(box.localId, box.ports);
      this.pipeGeos.update(list => [...list, ...migratedPipes]);
      this.st.clearLegacyEdges();
      this.savePipes();
    } catch (error: any) {
      await this.rollbackNodes(createdNodeIds);
      this.st.error.set(error?.message || 'Could not migrate the old shape connections.');
      this.migratingLegacyEdgeDiagrams.delete(diagramId);
    }
  }

  isEquipmentPortSelected(handle: EquipmentPortHandle): boolean {
    const selected = this.selectedEquipmentPort();
    return selected?.objectId === handle.objectId && selected.portId === handle.portId;
  }

  onEquipmentPortDown(ev: PointerEvent, handle: EquipmentPortHandle) {
    if (this.startMiddlePan(ev)) return;
    ev.preventDefault(); ev.stopPropagation();
    const ref: EquipmentPortRef = { objectId: handle.objectId, portId: handle.portId };
    if (this.pipeMode()) {
      this.addPipePointAt({ x: handle.x, y: handle.y }, ref);
      return;
    }
    const connect = this.pipeConnect();
    if (connect && connect.sourceEnd == null) {
      const source = this.visiblePipes().find(pipe => pipe.id === connect.sourcePipeId);
      if (source) {
        const startDistance = Math.hypot(source.start.x - handle.x, source.start.y - handle.y);
        const endDistance = Math.hypot(source.end.x - handle.x, source.end.y - handle.y);
        if (Math.min(startDistance, endDistance) <= 14 / Math.max(0.2, this.zoom())) {
          this.pipeConnect.set({ ...connect, sourceEnd: startDistance <= endDistance ? 'start' : 'end' });
          return;
        }
      }
    }
    if (connect?.sourceEnd) {
      this.attachPipeEndpointToPort(connect.sourcePipeId, connect.sourceEnd, ref, { x: handle.x, y: handle.y });
      this.cancelPipeConnect();
      return;
    }
    this.selectedEquipmentPort.set({ objectId: handle.objectId, portId: handle.portId, boxLocalId: handle.boxLocalId });
    if (handle.boxLocalId != null) this.st.selectBox(handle.boxLocalId);
    if (handle.owner === 'box' && handle.boxLocalId != null && this.arrangeMode() && !this.spacePanning()) {
      this.drag = { kind: 'equipmentPort', boxLocalId: handle.boxLocalId, portId: handle.portId };
    } else if (!this.arrangeMode() || this.spacePanning()) {
      this.startPan(ev);
    }
  }

  private attachPipeEndpointToPort(
    pipeId: string, end: PipeEnd, ref: EquipmentPortRef, point: { x: number; y: number },
  ) {
    const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    const pipe = this.pipeGeos().find(item => item.id === pipeId);
    if (!pipe || pipe.parentId !== currentParent) {
      this.st.error.set('Open the pipe\'s own section before attaching it to an equipment port.');
      return;
    }
    this.pipeGeos.update(list => list.map(item => {
      if (item.id !== pipeId || item.points.length < 2) return item;
      const points = [...item.points];
      if (end === 'start') points[0] = point; else points[points.length - 1] = point;
      return end === 'start'
        ? { ...item, points, startAttachment: ref, aEnd: ref.objectId }
        : { ...item, points, endAttachment: ref, bEnd: ref.objectId };
    }));
    this.savePipes();
  }

  detachSelectedPipePort(end: PipeEnd) {
    const pipeId = this.selectedPipeId();
    if (!pipeId) return;
    this.pipeGeos.update(list => list.map(pipe => pipe.id !== pipeId ? pipe : end === 'start'
      ? { ...pipe, startAttachment: undefined, aEnd: undefined }
      : { ...pipe, endAttachment: undefined, bEnd: undefined }));
    void this.persistChangedPipes(new Set([pipeId]));
  }

  pipeAttachmentLabel(ref?: EquipmentPortRef): string {
    if (!ref) return 'Unassigned';
    for (const box of this.st.boxes()) {
      if (box.childId !== ref.objectId) continue;
      const port = box.ports?.find(item => item.id === ref.portId);
      if (port) return `${this.nameOf(ref.objectId)} / ${port.label}`;
    }
    if (this.st.currentNode()?.id === ref.objectId) {
      const port = this.st.boundaryPorts().find(item => item.id === ref.portId);
      if (port) return `${this.nameOf(ref.objectId)} / ${port.label}`;
    }
    return `${this.nameOf(ref.objectId)} / ${ref.portId}`;
  }

  private syncAttachedPipeEndpoints(boxLocalId: number) {
    const box = this.boxById().get(boxLocalId);
    if (!box) return;
    const byPort = new Map((box.ports ?? []).map(port => [port.id,
      this.equipmentPortPoint({ x: box.x, y: box.y, w: box.width, h: box.height }, port)]));
    this.pipeGeos.update(list => list.map(pipe => {
      if (pipe.parentId !== (this.st.canvasNode()?.id ?? this.st.currentNode()?.id) || pipe.points.length < 2) return pipe;
      const start = pipe.startAttachment?.objectId === box.childId ? byPort.get(pipe.startAttachment.portId) : null;
      const end = pipe.endAttachment?.objectId === box.childId ? byPort.get(pipe.endAttachment.portId) : null;
      if (!start && !end) return pipe;
      const points = [...pipe.points];
      if (start) points[0] = start;
      if (end) points[points.length - 1] = end;
      return { ...pipe, points };
    }));
  }

  onBackgroundDown(ev: PointerEvent) {
    if (this.startMiddlePan(ev)) return;
    if (!this.backgroundAdjustMode() || this.st.backgroundTransform().locked || ev.button !== 0) return;
    ev.preventDefault(); ev.stopPropagation();
    const transform = this.st.backgroundTransform();
    this.drag = {
      kind: 'bgMove', startClientX: ev.clientX, startClientY: ev.clientY,
      x: transform.x, y: transform.y,
    };
  }

  onBackgroundResizeDown(ev: PointerEvent) {
    if (this.startMiddlePan(ev)) return;
    if (!this.backgroundAdjustMode() || this.st.backgroundTransform().locked || ev.button !== 0) return;
    ev.preventDefault(); ev.stopPropagation();
    const transform = this.st.backgroundTransform();
    this.drag = {
      kind: 'bgResize', startClientX: ev.clientX, startClientY: ev.clientY,
      scaleX: transform.scaleX, scaleY: transform.scaleY,
    };
  }

  private startPan(ev: PointerEvent) {
    this.drag = {
      kind: 'pan', startClientX: ev.clientX, startClientY: ev.clientY,
      startPanX: this.panX(), startPanY: this.panY(), moved: false,
    };
  }

  /** Middle-button drag is a universal pan override, even when an edit handle/tool owns the pointer target. */
  private startMiddlePan(ev: PointerEvent): boolean {
    if (ev.button !== 1) return false;
    ev.preventDefault();
    ev.stopPropagation();
    this.startPan(ev);
    return true;
  }

  /** Empty-canvas press: LEFT drag pans, SHIFT+LEFT drag box-selects, RIGHT drag draws a new object. */
  onCanvasDown(ev: PointerEvent) {
    if (this.startMiddlePan(ev)) return;
    if (this.spacePanning() && ev.button === 0) { this.startPan(ev); return; }
    // Pipe tool: left-click lays a vertex, right-click finishes. (Boxes/nested are click-through in pipe mode.)
    if (this.pipeMode()) {
      if (ev.button === 2) this.finishPipe(); else this.addPipePoint(ev);
      return;
    }
    if (this.fittingType() && ev.button === 0) { this.placeFitting(ev); return; } // armed fitting → drop on the pipe
    if (this.pipeConnect()) {
      if (ev.button === 2) { this.cancelPipeConnect(); return; }
      this.pipeConnectPending.set(null);
      this.startPan(ev);
      return;
    }
    this.st.selectedLocalId.set(null);
    this.st.selectedLocalIds.set([]);
    this.st.selectedEdgeLocalId.set(null);
    this.st.selectedNestedNode.set(null);
    this.selectedPipeId.set(null);
    this.selectedFittingId.set(null);
    this.selectedEquipmentPort.set(null);
    if (ev.button === 2) {
      const p = this.contentPoint(ev);
      this.drag = { kind: 'draw', startX: p.x, startY: p.y };
      this.rubber.set({ x: p.x, y: p.y, w: 0, h: 0 });
    } else if (ev.shiftKey) {
      // Shift+left = box-select. Plain left stays PAN (it's the documented default and muscle memory).
      const p = this.contentPoint(ev);
      this.drag = { kind: 'marquee', startX: p.x, startY: p.y, additive: ev.ctrlKey || ev.metaKey };
      this.rubber.set({ x: p.x, y: p.y, w: 0, h: 0 });
    } else {
      this.startPan(ev);
    }
  }

  /** Wheel = zoom toward the cursor (keeps the point under the pointer fixed). */
  onWheel(ev: WheelEvent) {
    ev.preventDefault();
    const el = this.viewportRef?.nativeElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = ev.clientX - r.left, my = ev.clientY - r.top;
    const old = this.zoom();
    const next = Math.min(4, Math.max(0.15, old * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
    const cx = (mx - this.panX()) / old, cy = (my - this.panY()) / old;
    this.panX.set(mx - cx * next);
    this.panY.set(my - cy * next);
    this.zoom.set(next);
  }

  /** Reset the view (zoom 100%, no pan). */
  resetView() { this.zoom.set(1); this.panX.set(0); this.panY.set(0); }

  onBoxDown(ev: PointerEvent, b: MapBox) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    if (ev.button === 0 && this.portPlacementBoxLocalId() === b.localId) {
      this.placeEquipmentPort(b, this.contentPoint(ev));
      return;
    }
    // Modifier-click toggles membership (and starts no drag) so a selection can be built up click by click.
    if (ev.ctrlKey || ev.metaKey || ev.shiftKey) { this.st.toggleBoxSelection(b.localId); return; }
    // Grabbing a box that's already part of a multi-selection keeps it — that's what lets you drag the group.
    if (!this.st.selectedLocalIds().includes(b.localId)) this.st.selectBox(b.localId);
    if (!this.arrangeMode() || this.spacePanning() || ev.button !== 0) {
      this.startPan(ev);
      return;
    }
    this.drag = {
      kind: 'move', localId: b.localId, startClientX: ev.clientX, startClientY: ev.clientY,
      origX: b.x, origY: b.y, origW: b.width, origH: b.height,
      origins: this.st.selectedBoxes().map(s => ({ localId: s.localId, x: s.x, y: s.y })),
    };
  }

  onResizeDown(ev: PointerEvent, b: MapBox) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    if (this.spacePanning()) { this.startPan(ev); return; }
    if (!this.arrangeMode()) return;
    this.st.selectBox(b.localId);
    this.drag = { kind: 'resize', localId: b.localId, startClientX: ev.clientX, startClientY: ev.clientY, origX: b.x, origY: b.y, origW: b.width, origH: b.height };
  }

  /** Press on a pipe segment: select it (for styling), don't start a canvas draw. */
  /** Drag an existing route bend. */
  /** Press a segment midpoint → insert a bend there, then drag it. */
  onBoxDblClick(b: MapBox) { void this.st.navigate(b.childId); }

  /** Click a rendered interior item (in a box's LOD mini-map) → drill straight into that item's level. */
  drillToDescendant(childId: number, ev: Event) {
    ev.stopPropagation();
    if (childId) void this.st.navigate(childId);
  }

  @HostListener('window:keydown.escape')
  onEscapeKey() {
    if (this.pipeConnect()) { this.cancelPipeConnect(); return; }
    if (this.pipeMode() && this.pipeDraft().length) this.cancelPipe();
  }
  @HostListener('window:keydown.enter')
  onEnterKey() { if (this.pipeMode() && this.pipeDraft().length) this.finishPipe(); }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(ev: PointerEvent) {
    if (this.pipeMode() && this.pipeDraft().length) this.pipeCursor.set(this.contentPoint(ev)); // live guide segment
    const d = this.drag;
    if (!d) return;
    const z = this.zoom();
    if (d.kind === 'pan') {
      d.moved = true;
      this.panX.set(d.startPanX + (ev.clientX - d.startClientX));
      this.panY.set(d.startPanY + (ev.clientY - d.startClientY));
    } else if (d.kind === 'move') {
      const nx = Math.max(0, d.origX + (ev.clientX - d.startClientX) / z);
      const ny = Math.max(0, d.origY + (ev.clientY - d.startClientY) / z);
      const s = this.snapPt({ x: nx, y: ny });
      if (d.origins && d.origins.length > 1) {
        // Snap the GRABBED box, then shift the group by that same delta — so snapping can't distort spacing.
        const dx = Math.max(0, s.x) - d.origX, dy = Math.max(0, s.y) - d.origY;
        const byId = this.boxById();
        for (const o of d.origins) {
          const bb = byId.get(o.localId);
          if (bb) this.st.setBoxRect(o.localId, Math.max(0, o.x + dx), Math.max(0, o.y + dy), bb.width, bb.height);
        }
        for (const o of d.origins) this.syncAttachedPipeEndpoints(o.localId);
      } else {
        this.st.setBoxRect(d.localId, Math.max(0, s.x), Math.max(0, s.y), d.origW, d.origH);
        this.syncAttachedPipeEndpoints(d.localId);
      }
    } else if (d.kind === 'marquee') {
      const c = this.contentPoint(ev);
      this.rubber.set({ x: Math.min(d.startX, c.x), y: Math.min(d.startY, c.y), w: Math.abs(c.x - d.startX), h: Math.abs(c.y - d.startY) });
    } else if (d.kind === 'resize') {
      const min = this.minSize(this.boxById().get(d.localId)?.shape ?? 'rect');
      const nw = this.snapLen(Math.max(min.w, d.origW + (ev.clientX - d.startClientX) / z), min.w);
      const nh = this.snapLen(Math.max(min.h, d.origH + (ev.clientY - d.startClientY) / z), min.h);
      this.st.setBoxRect(d.localId, d.origX, d.origY, nw, nh);
      this.syncAttachedPipeEndpoints(d.localId);
    } else if (d.kind === 'draw') {
      const c = this.contentPoint(ev);
      this.rubber.set({ x: Math.min(d.startX, c.x), y: Math.min(d.startY, c.y), w: Math.abs(c.x - d.startX), h: Math.abs(c.y - d.startY) });
    } else if (d.kind === 'fitting') {
      const pipe = this.pipeGeos().find(p => p.id === d.pipeId);
      if (pipe) { const at = this.nearestOnPipe(pipe.points, this.contentPoint(ev)); if (at) this.moveFitting(d.fittingId, at); } // keep it on the path
    } else if (d.kind === 'pipeVtx') {
      this.movePipeVtx(d.pipeId, d.index, this.contentPoint(ev));
    } else if (d.kind === 'equipmentPort') {
      const box = this.boxById().get(d.boxLocalId);
      if (box) {
        this.updateEquipmentPort(d.boxLocalId, d.portId, this.projectEquipmentPort(box, this.contentPoint(ev)));
        this.syncAttachedPipeEndpoints(d.boxLocalId);
      }
    } else if (d.kind === 'bgMove') {
      this.st.setBackgroundTransform({
        x: Math.max(0, d.x + (ev.clientX - d.startClientX) / z),
        y: Math.max(0, d.y + (ev.clientY - d.startClientY) / z),
      });
    } else if (d.kind === 'bgResize') {
      const size = this.bgSize();
      if (!size) return;
      const transform = this.st.backgroundTransform();
      const dx = (ev.clientX - d.startClientX) / z;
      const dy = (ev.clientY - d.startClientY) / z;
      let scaleX = Math.max(0.05, d.scaleX + dx / Math.max(1, size.w));
      let scaleY = Math.max(0.05, d.scaleY + dy / Math.max(1, size.h));
      if (transform.aspectLocked) {
        const scale = Math.max(scaleX, scaleY);
        scaleX = scale; scaleY = scale;
      }
      this.st.setBackgroundTransform({ scaleX, scaleY });
    }
  }

  @HostListener('window:pointerup', ['$event'])
  onPointerUp(ev: PointerEvent) {
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    if (d.kind === 'fitting') { this.savePipes(); return; } // persist the moved fitting
    if (d.kind === 'pipeVtx' || d.kind === 'equipmentPort' || d.kind === 'move' || d.kind === 'resize') {
      this.savePipes(); return;
    }
    if (d.kind === 'draw') {
      const r = this.rubber();
      this.rubber.set(null);
      // long-enough drag; min-side allows thin pipe runs, long-side rejects accidental taps
      if (r && Math.max(r.w, r.h) >= 24 && Math.min(r.w, r.h) >= 6) void this.createDrawnObject(r);
    } else if (d.kind === 'marquee') {
      const r = this.rubber();
      this.rubber.set(null);
      if (r) {
        // Intersection (touch), not containment — grazing a box selects it, which is what people expect.
        const hits = this.st.boxes()
          .filter(b => r.x < b.x + b.width && r.x + r.w > b.x && r.y < b.y + b.height && r.y + r.h > b.y)
          .map(b => b.localId);
        const prev = this.st.selectedLocalIds();
        this.st.setSelection(d.additive ? [...prev, ...hits.filter(i => !prev.includes(i))] : hits);
      }
    }
    // move / resize were persisted live via setBoxRect's debounced save
  }

  /** Draw-to-create: a rubber-banded footprint becomes a brand-new child object at that size/position,
   *  then jumps straight into inline naming so you type its name in one motion (no "New object"). */
  private async createDrawnObject(r: { x: number; y: number; w: number; h: number }) {
    const shape = this.drawShape();
    const created = await this.st.createChild({ name: this.defaultDrawName(shape), type: this.newType });
    if (!created) return;
    const localId = this.st.placeChild(created.id, r.x, r.y, shape);
    if (localId == null) return;
    const min = this.minSize(shape);
    this.st.setBoxRect(localId, r.x, r.y, Math.max(min.w, r.w), Math.max(min.h, r.h));
    const box = this.st.boxes().find(b => b.localId === localId);
    if (box) this.startRenameBox(box);
  }

  /** Per-shape minimum footprint size — a pipe run may be thin in either axis; other shapes need room for a label. */
  private minSize(shape: FootprintShape): { w: number; h: number } {
    return shape === 'run' ? { w: 6, h: 6 } : { w: 8, h: 8 };
  }

  /** Too small to fit a readable name plate — hide the label (shape + color still identify it). */
  isTiny(b: MapBox): boolean { return b.width < 42 || b.height < 26; }

  private defaultDrawName(shape: FootprintShape): string {
    return shape === 'run' ? 'Pipe run' : shape === 'circle' ? 'Tank' : 'Area';
  }

  // ── inline rename (name-in-place on the footprint) ──
  isEditingBox(b: MapBox): boolean { return this.editingBoxLocalId() === b.localId; }

  startRenameBox(b: MapBox, ev?: Event) {
    if (ev && 'button' in ev && this.startMiddlePan(ev as PointerEvent)) return;
    ev?.stopPropagation();
    this.st.selectBox(b.localId);
    this.boxEditName = this.boxLabel(b);
    this.editingBoxLocalId.set(b.localId);
    setTimeout(() => { const el = this.boxRenameRef?.nativeElement; if (el) { el.focus(); el.select(); } }, 0);
  }

  async commitRenameBox(b: MapBox) {
    if (this.editingBoxLocalId() !== b.localId) return; // already committed (blur after enter)
    const name = this.boxEditName.trim();
    this.editingBoxLocalId.set(null);
    if (name && name !== this.boxLabel(b)) await this.st.updateNodeData(b.childId, { name });
  }

  cancelRenameBox() { this.editingBoxLocalId.set(null); }

  // ── inspector: edit ──
  private onSelectionChanged(child: PhysicalObjectNode | null) {
    const id = child?.id ?? null;
    // Only reset the form when the selected OBJECT actually changes — never when the effect re-runs for the
    // same object (e.g. after a save refreshes the child list), so in-progress typing is never clobbered.
    if (id === this.lastSelectedNodeId) return;
    this.lastSelectedNodeId = id;
    this.mxPickerOpen.set(false);
    if (!child) {
      this.editName = this.editType = this.editTag = this.editDesc = this.editLoc = this.editFloor = '';
      this.files.set([]); this.fileResults.set([]); this.fileQuery = '';
      this.workAreas.set([]); this.waPickerOpen.set(false);
      this.roundChecks.set([]);
      return;
    }
    this.editName = child.name ?? '';
    this.editType = child.type ?? '';
    this.editTag = child.tagNumber ?? '';
    this.editDesc = child.description ?? '';
    this.editLoc = child.specificLocation ?? '';
    this.editFloor = child.floorIndex != null ? String(child.floorIndex) : '';
    this.fileResults.set([]); this.fileQuery = '';
    this.waPickerOpen.set(false);
    void this.loadFiles(child.id);
    void this.loadWorkAreas(child.id);
    void this.loadRoundChecks(child.id);
  }

  private async loadRoundChecks(nodeId: number) {
    this.roundChecksLoading.set(true);
    try { this.roundChecks.set(await firstValueFrom(this.nodesApi.getRoundChecks(nodeId))); }
    catch { this.roundChecks.set([]); }
    finally { this.roundChecksLoading.set(false); }
  }

  // ── inspector: work areas (safety) ──
  private async loadWorkAreas(nodeId: number) {
    this.waLoading.set(true);
    try { this.workAreas.set(await firstValueFrom(this.nodesApi.getNodeWorkAreas(nodeId))); }
    catch { this.workAreas.set([]); }
    finally { this.waLoading.set(false); }
  }

  async linkWorkArea(wa: WorkAreaOption) {
    const c = this.objNode();
    if (!c) return;
    await firstValueFrom(this.nodesApi.linkWorkArea(c.id, wa.id));
    this.waPickerOpen.set(false);
    await this.loadWorkAreas(c.id);
    await this.st.reloadChildWorkAreas();
  }

  async unlinkWorkArea(wa: WorkAreaRef) {
    const c = this.objNode();
    if (!c) return;
    await firstValueFrom(this.nodesApi.unlinkWorkArea(c.id, wa.id));
    await this.loadWorkAreas(c.id);
    await this.st.reloadChildWorkAreas();
  }

  /** Does this box's object have a bound work area? (drives the safety badge) */
  boxHasWorkArea(b: MapBox): boolean { return (this.st.childWorkAreas().get(b.childId) ?? 0) > 0; }

  // ── inspector: Maximo link ──
  mxPickerOpen = signal(false);

  async onAssetPicked(a: MaximoAsset) {
    const c = this.objNode();
    if (!c) return;
    await this.st.linkMaximo(c.id, { assetnum: a.assetnum, location: a.location, siteid: a.siteid, maximoType: a.assettype });
    this.mxPickerOpen.set(false);
  }

  async onLocationPicked(l: MaximoLocation) {
    const c = this.objNode();
    if (!c) return;
    await this.st.linkMaximo(c.id, { location: l.location, siteid: l.siteid, maximoType: (l as any).type });
    this.mxPickerOpen.set(false);
  }

  async unlinkMaximo() {
    const c = this.objNode();
    if (!c) return;
    await this.st.unlinkMaximo(c.id);
  }

  /** Start a permit from this node: open the WR form pre-seeded with this work area (existing prefill applies). */
  startPermit(wa: WorkAreaRef) {
    this.router.navigate(['/permit-builder/work-requests'], { queryParams: { workAreaId: wa.id } });
  }

  async saveEdit() {
    const child = this.st.selectedChild();
    if (!child) return;
    this.savingEdit.set(true);
    // blank = leave unchanged (PATCH contract) — never silently wipe a field.
    const floor = this.editFloor.trim();
    const updated = await this.st.updateNodeData(child.id, {
      name: this.editName.trim() || undefined,
      type: this.editType || undefined,
      tagNumber: this.editTag.trim() || undefined,
      description: this.editDesc.trim() || undefined,
      specificLocation: this.editLoc.trim() || undefined,
      floorIndex: floor === '' ? undefined : (Number.isFinite(Number(floor)) ? Number(floor) : undefined),
    });
    // Re-seed from what actually persisted: a blanked field is "unchanged" server-side, so without this the
    // input would keep showing the empty value and silently disagree with the shape label.
    if (updated) {
      this.editName = updated.name ?? '';
      this.editType = updated.type ?? '';
      this.editTag = updated.tagNumber ?? '';
      this.editDesc = updated.description ?? '';
      this.editLoc = updated.specificLocation ?? '';
      this.editFloor = updated.floorIndex != null ? String(updated.floorIndex) : '';
    }
    this.savingEdit.set(false);
  }

  /** Commit the inspector form when a field loses focus — no Save click. No-ops when nothing actually changed. */
  async autoSaveEdit() {
    const child = this.st.selectedChild();
    if (!child || this.savingEdit()) return;
    const floor = this.editFloor.trim();
    const changed =
      this.editName.trim() !== (child.name ?? '') ||
      (this.editType || '') !== (child.type ?? '') ||
      this.editTag.trim() !== (child.tagNumber ?? '') ||
      this.editDesc.trim() !== (child.description ?? '') ||
      this.editLoc.trim() !== (child.specificLocation ?? '') ||
      floor !== (child.floorIndex != null ? String(child.floorIndex) : '');
    if (!changed) return;
    await this.saveEdit();
    this.editSaved.set(true);
    setTimeout(() => this.editSaved.set(false), 1800);
  }

  drillSelected() { const c = this.st.selectedChild(); if (c) void this.st.navigate(c.id); }
  removeSelectedBox() { const id = this.st.selectedLocalId(); if (id != null) this.st.removeBox(id); }

  // ── inspector: appearance (footprint shape + equipment badge + color) ──
  setShape(shape: FootprintShape) {
    const box = this.st.selectedBox();
    if (!box) return;
    this.st.patchBox(box.localId, { shape });
    const projected = (box.ports ?? []).map(port => ({
      ...port,
      ...this.projectEquipmentPort({ ...box, shape }, this.equipmentPortPoint(
        { x: box.x, y: box.y, w: box.width, h: box.height }, port)),
    }));
    this.st.patchBoxPorts(box.localId, projected);
    this.syncAttachedPipeEndpoints(box.localId);
    this.savePipes();
  }
  setGlyph(key: string) { const id = this.st.selectedLocalId(); if (id != null) this.st.patchBox(id, { glyph: key }); }
  setColor(color: string) { const id = this.st.selectedLocalId(); if (id != null) this.st.patchBox(id, { color }); }
  readonly boxSizePresets = [
    { key: 'detail', label: 'Detail', w: 18, h: 18 },
    { key: 'small', label: 'Small', w: 56, h: 32 },
    { key: 'standard', label: 'Standard', w: 96, h: 48 },
    { key: 'large', label: 'Large', w: 180, h: 90 },
  ];
  setSelectedBoxSize(width: number, height: number) {
    const box = this.st.selectedBox();
    if (!box) return;
    const min = this.minSize(box.shape || 'rect');
    const w = Math.max(min.w, Number.isFinite(width) ? width : box.width);
    const h = Math.max(min.h, Number.isFinite(height) ? height : box.height);
    const centerX = box.x + box.width / 2, centerY = box.y + box.height / 2;
    this.st.setBoxRect(box.localId, Math.max(0, centerX - w / 2), Math.max(0, centerY - h / 2), w, h);
    this.syncAttachedPipeEndpoints(box.localId);
    this.savePipes();
  }
  setSelectedBoxDimension(axis: 'width' | 'height', value: number) {
    const box = this.st.selectedBox();
    if (!box) return;
    this.setSelectedBoxSize(axis === 'width' ? value : box.width, axis === 'height' ? value : box.height);
  }

  // ── reference underlay (satellite / plot plan) ──
  bgUploading = signal(false);
  async onPickBackground(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.st.error.set('The reference must be an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { this.st.error.set('Image too large (max 10 MB) — crop or downscale it.'); return; }
    const did = this.st.currentDiagramId(); // snapshot: drop the write if the user drills away before the upload lands
    this.bgUploading.set(true);
    try { await this.st.uploadBackground(file, did); }
    finally { this.bgUploading.set(false); }
  }
  clearBackground() { void this.st.clearBackgroundImage(); }
  setBgOpacity(v: number) { this.st.setBackgroundOpacity(v); }
  toggleBackgroundAdjust() {
    if (this.st.backgroundTransform().locked) this.st.setBackgroundTransform({ locked: false });
    this.backgroundAdjustMode.update(value => !value);
  }
  setBackgroundLocked(locked: boolean) {
    this.st.setBackgroundTransform({ locked });
    if (locked) this.backgroundAdjustMode.set(false);
  }
  patchBackgroundTransform(patch: Partial<BackgroundTransform>) { this.st.setBackgroundTransform(patch); }
  setBackgroundScale(axis: 'x' | 'y', percent: number) {
    const scale = Math.max(0.05, Number(percent) / 100 || 0.05);
    const transform = this.st.backgroundTransform();
    if (transform.aspectLocked) this.st.setBackgroundTransform({ scaleX: scale, scaleY: scale });
    else this.st.setBackgroundTransform(axis === 'x' ? { scaleX: scale } : { scaleY: scale });
  }
  resetBackgroundTransform() { this.st.setBackgroundTransform({ ...({
    x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, aspectLocked: true,
  } satisfies Partial<BackgroundTransform>) }); }
  fitBackground(mode: 'contain' | 'fill') {
    const image = this.bgSize();
    if (!image) return;
    const boundary = this.st.boundary();
    const target = boundary ?? { x: 24, y: 24, w: 1500, h: 920 };
    const scale = mode === 'contain'
      ? Math.min(target.w / image.w, target.h / image.h)
      : Math.max(target.w / image.w, target.h / image.h);
    this.st.setBackgroundTransform({
      x: target.x + (target.w - image.w * scale) / 2,
      y: target.y + (target.h - image.h * scale) / 2,
      scaleX: scale, scaleY: scale, rotation: 0, aspectLocked: true,
    });
  }
  fitBackgroundToSelection() {
    const image = this.bgSize(), box = this.st.selectedBox();
    if (!image || !box) return;
    this.st.setBackgroundTransform({
      x: box.x, y: box.y,
      scaleX: box.width / image.w, scaleY: box.height / image.h,
      rotation: 0, aspectLocked: false,
    });
  }

  // ── inspector: legacy box-to-box connection (edge) style ──
  async deleteSelectedObject() {
    const c = this.st.selectedChild();
    if (!c) return;
    if (!confirm(`Delete "${c.name}"? This removes the object itself (only works if it has no children).`)) return;
    await this.st.deleteObject(c.id);
  }

  // ── inspector: documents (linked files) ──
  private async loadFiles(nodeId: number) {
    this.filesLoading.set(true);
    try { this.files.set(await firstValueFrom(this.nodesApi.getNodeFiles(nodeId))); }
    catch { this.files.set([]); }
    finally { this.filesLoading.set(false); }
  }

  async searchFiles() {
    if (!this.fileQuery.trim()) { this.fileResults.set([]); return; }
    this.fileSearching.set(true);
    try {
      const page = await firstValueFrom(
        this.filesApi.searchFiles({ type: 'global', query: this.fileQuery.trim(), page: 1 }, 20));
      this.fileResults.set((page?.responseData?.content ?? []).map(f => FileDto.fromJson(f)));
    } catch { this.fileResults.set([]); }
    finally { this.fileSearching.set(false); }
  }

  async linkFile(f: FileDto) {
    const c = this.objNode();
    if (!c) return;
    await firstValueFrom(this.nodesApi.linkFile(c.id, f.id));
    this.fileResults.set([]); this.fileQuery = '';
    await this.loadFiles(c.id);
  }

  async unlinkFile(file: LinkedFile) {
    const c = this.objNode();
    if (!c) return;
    await firstValueFrom(this.nodesApi.unlinkFile(c.id, file.id));
    await this.loadFiles(c.id);
  }

  openFile(file: LinkedFile) {
    if (file.fileLink) window.open(`${this.apiBase}/${file.fileLink}`, '_blank');
  }

  fileLabel(f: FileDto): string {
    const num = Array.isArray(f.fileNumber) ? f.fileNumber.join(' ') : ((f as any).fileNumber ?? '');
    return [f.name, num].filter(Boolean).join(' · ') || `#${f.id}`;
  }
}
