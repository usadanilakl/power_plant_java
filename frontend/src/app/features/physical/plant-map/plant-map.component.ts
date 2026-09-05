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
  GhostBox, MapBox, PIPE_SRC, PipeFlowDirection, PipeGeo, PipeFitting, PipeTap, PlantMapStateService,
} from './services/plant-map-state.service';
import {
  PLANT_GLYPHS, PLANT_GLYPH_BY_KEY, SERVICE_COLORS, PlantGlyph,
  FootprintShape, FOOTPRINT_SHAPES, hexToRgba, normFootprint,
} from './plant-glyphs';
import { DiagramPlacementApiService } from '../../diagram-builder/services/diagram-placement-api.service';
import { DiagramPlacementDto } from '../../diagram-builder/models/diagram-placement-dto.model';
import { DiagramAlignmentService, ShapeRect, ShapeUpdate } from '../../diagram-builder/services/diagram-alignment.service';
import { AlignmentType, DistributeType } from '../../diagram-builder/models/diagram-placement.model';
import { EquipmentPortNetwork, tracePipeFlow } from './pipe-flow-graph';
import { partitionPolylineByBoundaries } from './pipe-boundary-partition';
import {
  PlantMapTopologyApiService, PlantMapTopologyConnection, PlantMapTopologyTerminal,
} from './services/plant-map-topology-api.service';

/** Canvas zoom bounds. Max raised to 8× so tightly-packed pipe ends/fittings can be separated enough to grab. */
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 8;

/** One child of a nested container (in the container's OWN diagram coords) — for recursive zoom-nesting.
 *  For a LEVELED container, children from ALL levels are composited (view-from-top): `floor` = its level index,
 *  `dim` = it's beneath the top level (shown faint so the top deck reads on top and lower decks peek out). */
interface NestChild {
  childId: number; name: string; color: string; shape: FootprintShape;
  x: number; y: number; w: number; h: number;
  parentId: number; localId?: number; placementId?: number;
  hasChildren: boolean; diagramId: number | null;  // to recurse into it as you keep zooming
  floor?: number; dim?: boolean;
  ports?: EquipmentPort[];
}
interface NestBoundaryFrame {
  objectId: number;
  parentId: number;
  rect: { x: number; y: number; w: number; h: number };
  shape: FootprintShape;
  ports: EquipmentPort[];
  localId?: number;
  placementId?: number;
}
interface PartitionedPipeRoute { first: PipeGeo; last: PipeGeo; all: PipeGeo[]; }
interface BoundaryPartitionContext {
  continuationId: string;
  originNodeId: number;
  created: PipeGeo[];
  createdNodeIds: Set<number>;
  originals: Map<string, PipeGeo>;
  frames: Map<string, { frame: NestBoundaryFrame; ports: EquipmentPort[] }>;
}
/** A nested descendant to render, mapped into content coords, at a given depth. */
interface NestItem { x: number; y: number; w: number; h: number; childId: number; name: string; color: string; shape: FootprintShape; depth: number; dim?: boolean; }
/** A nested pipe (a descendant container's pipe), mapped into content coords. Carries its id/nodeId so it's
 *  clickable from the parent view (single-click = info, double-click = drill to the object). */
interface NestPipe {
  id: string; nodeId?: number; parentId: number; name: string;
  points: string; path: { x: number; y: number }[]; color: string; width: number; depth: number; flowSegs?: string[];
  start: { x: number; y: number }; end: { x: number; y: number }; mid: { x: number; y: number };
  frames: NestBoundaryFrame[];
}
/** A nested fitting (a descendant pipe's fitting), mapped into content coords + scaled down by the nesting. */
interface NestFitting { id: string; nodeId?: number; x: number; y: number; cat: string; path: string; actuator: string; code: string; color: string; size: number; depth: number; isValve?: boolean; closed?: boolean; }

type PipeEnd = 'start' | 'end';
interface PipeConnectSession {
  sourcePipeId: string;
  /** A/B endpoint source. Null plus sourcePoint means a body junction source. */
  sourceEnd: PipeEnd | null;
  sourcePoint?: { x: number; y: number };
  sourceTapId?: string;
  reconnectLinkId?: string;
}
interface PipeConnectPending {
  targetPipeId: string;
  targetEnd?: PipeEnd;
  /** Point in the target pipe's owning section, used for the persisted tap. */
  targetPoint?: { x: number; y: number };
  /** The same contact in the canvas currently shown to the user (needed for nested mini-map targets). */
  targetDisplayPoint?: { x: number; y: number };
  targetTapId?: string;
}
interface PipeExtension { pipeId: string; end: PipeEnd; }
interface PipeConnectionEndpointHandle {
  pipeId: string; end: PipeEnd; point: { x: number; y: number };
  role: 'source-choice' | 'source-selected' | 'target'; name: string;
}
interface PipeConnectionBodyPreview {
  pipeId: string;
  point: { x: number; y: number };
  pending: PipeConnectPending;
  role: 'source-choice' | 'source-selected' | 'target';
  name: string;
}
interface PipeCrossover {
  key: string;
  x: number;
  y: number;
  path: string;
  color: string;
  width: number;
  maskRadius: number;
}
interface EndpointConnectionView {
  kind: 'equipment' | 'pipe';
  key: string;
  label: string;
  targetPipeId?: string;
  equipmentRef?: EquipmentPortRef;
}
interface VisiblePipe {
  id: string; nodeId?: number; parentId: number; name: string; nested: boolean;
  points: string; path: { x: number; y: number }[];
  start: { x: number; y: number }; end: { x: number; y: number }; mid: { x: number; y: number };
  frames: NestBoundaryFrame[];
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
  | { kind: 'pipeMove'; pipeId: string; startClientX: number; startClientY: number; moved: boolean;
      points: { x: number; y: number }[]; fittings: PipeFitting[]; taps: PipeTap[]; pinStart: boolean; pinEnd: boolean }
  | { kind: 'pipeVtx'; pipeId: string; index: number }
  | { kind: 'pipeSeg'; pipeId: string; index: number; startClientX: number; startClientY: number;
      /** Snapshot of the route at grab time — the delta is applied from here so snap can't drift. A terminal end
       *  that is topology-connected is pinned, so the section leans about it instead of tearing the connection. */
      basePoints: { x: number; y: number }[]; pinStart: boolean; pinEnd: boolean }
  | { kind: 'equipmentPort'; boxLocalId: number; portId: string }
  | { kind: 'boundaryPort'; portId: string }
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
  private topologyApi = inject(PlantMapTopologyApiService);
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
  spacePanning = signal(false);
  canvasPulseNodeId = signal<number | null>(null);
  private canvasPulseTimer: any = null;

  // ── flow highlight color (a per-device display preference; the animated ▶ Flow overlay) ──
  private readonly FLOW_COLOR_KEY = 'plantMap.flowColor';
  flowColor = signal<string>(this.readFlowColor());
  private readFlowColor(): string {
    try { return localStorage.getItem(this.FLOW_COLOR_KEY) || '#eaf6ff'; } catch { return '#eaf6ff'; }
  }
  setFlowColor(color: string) {
    this.flowColor.set(color || '#eaf6ff');
    try { localStorage.setItem(this.FLOW_COLOR_KEY, this.flowColor()); } catch { /* private mode — keep in-memory */ }
  }
  trackPortById(_index: number, port: { id: string }): string { return port.id; }

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
  /** Armed to drop the NEXT canvas click onto this node's boundary as a connector (edited from inside the object). */
  portPlacementBoundary = signal(false);
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
  /** Set when a fresh image is uploaded inside an object — the boundary is small vs a raw photo, so fit it to the
   *  boundary once its natural size is known (stops the user tracing far outside the frame). */
  private pendingBgFit = false;
  onBgLoad(ev: Event) {
    const img = ev.target as HTMLImageElement;
    this.bgSize.set({ w: img.naturalWidth, h: img.naturalHeight });
    if (this.pendingBgFit) { this.pendingBgFit = false; if (this.st.boundary()) this.fitBackground('contain'); }
  }
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
    const walk = (
      rect: { x: number; y: number; w: number; h: number },
      containerId: number,
      depth: number,
      frames: NestBoundaryFrame[],
    ) => {
      if (depth > this.NEST_MAX_DEPTH) return;
      const shapes = this.nestCache.get(containerId) ?? [];
      const cpipes = this.pipeGeos().filter(p => p.parentId === containerId && p.points.length >= 2);
      if (!shapes.length && !cpipes.length) return;
      // A child canvas always uses the same fixed boundary coordinate system. Content must never be re-fit to
      // its current bounding box: doing that made a pipe on the child boundary visibly miss the parent outline.
      const childBoundary = this.childBoundaryFor(rect);
      const scale = Math.max(1, childBoundary.w / Math.max(1, rect.w));
      for (const s of shapes) {
        const r = this.mapIntoBoundary(rect, childBoundary, s);
        items.push({ x: r.x, y: r.y, w: r.w, h: r.h, childId: s.childId, name: s.name, color: s.color, shape: s.shape, depth, dim: s.dim });
        if (s.hasChildren && r.w * z >= reveal && r.h * z >= 34) walk(r, s.childId, depth + 1, [
          ...frames,
          {
            objectId: s.childId, parentId: containerId, rect: r, shape: s.shape,
            ports: s.ports ?? [], localId: s.localId, placementId: s.placementId,
          },
        ]);
      }
      for (const cp of cpipes) {
        const fl = this.flowMode() ? this.flowResult().get(cp.id) : null; // map each flowing sub-segment into the footprint
        const mappedPoints = cp.points.map(pt => this.mapPointIntoBoundary(rect, childBoundary, pt));
          pipes.push({
            id: cp.id, nodeId: cp.nodeId, parentId: cp.parentId, name: cp.name || 'Pipe',
            points: mappedPoints.map(pt => `${pt.x},${pt.y}`).join(' '), path: mappedPoints,
          start: mappedPoints[0], end: mappedPoints[mappedPoints.length - 1], mid: mappedPoints[Math.floor(mappedPoints.length / 2)],
          flowSegs: fl ? fl.segsPath.map(seg => seg.map(pt => { const m = this.mapPointIntoBoundary(rect, childBoundary, pt); return `${m.x},${m.y}`; }).join(' ')) : undefined,
          color: cp.color || '#5b9bd5', width: Math.max(1.5, (cp.width || 8) / scale), depth, frames,
        });
        // fittings, scaled down by the nesting; shown when big enough to read — BUT in flow mode always show VALVES
        // (at a clickable min size) so the whole system is operable from the parent/zoomed-out view.
        const fsz = Math.min(1, 1 / scale);
        const readable = 24 * fsz * z >= 10;
        const flow = this.flowMode();
        for (const f of (cp.fittings ?? [])) {
          const m = this.mapPointIntoBoundary(rect, childBoundary, f.at);
          const rf = this.fittingRender(f, m.x, m.y);
          const showForFlow = flow && rf.isValve;
          if (!readable && !showForFlow) continue;
          const size = showForFlow ? Math.max(fsz, 0.6 / z) : fsz; // ~14px clickable valve regardless of zoom
          fittings.push({ id: f.id, nodeId: f.nodeId, x: m.x, y: m.y, cat: rf.cat, path: rf.path, actuator: rf.actuator, code: rf.code, color: rf.color, size, depth, isValve: rf.isValve, closed: rf.closed });
        }
      }
    };
    const rootParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? 0;
    for (const b of this.st.boxes()) {
      if (b.width * z >= reveal && b.height * z >= 34) {
        const rect = { x: b.x, y: b.y, w: b.width, h: b.height };
        walk(rect, b.childId, 1, [{
          objectId: b.childId, parentId: rootParent, rect, shape: b.shape,
          ports: b.ports ?? [], localId: b.localId,
        }]);
      }
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

  /** The canonical coordinate frame used when that footprint is opened as a child canvas. */
  private childBoundaryFor(rect: { w: number; h: number }) {
    const scale = 1100 / Math.max(1, rect.w, rect.h);
    return { x: 24, y: 24, w: Math.round(rect.w * scale), h: Math.round(rect.h * scale) };
  }
  private mapPointIntoBoundary(
    rect: { x: number; y: number; w: number; h: number },
    boundary: { x: number; y: number; w: number; h: number },
    point: { x: number; y: number },
  ) {
    return {
      x: rect.x + (point.x - boundary.x) / Math.max(1, boundary.w) * rect.w,
      y: rect.y + (point.y - boundary.y) / Math.max(1, boundary.h) * rect.h,
    };
  }
  private mapIntoBoundary(
    rect: { x: number; y: number; w: number; h: number },
    boundary: { x: number; y: number; w: number; h: number },
    shape: { x: number; y: number; w: number; h: number },
  ) {
    const point = this.mapPointIntoBoundary(rect, boundary, shape);
    return {
      ...point,
      w: shape.w / Math.max(1, boundary.w) * rect.w,
      h: shape.h / Math.max(1, boundary.h) * rect.h,
    };
  }

  /** Keep a box rect inside the boundary (when one exists). Size is capped to the boundary; position is pushed
   *  back in. No-op at the root (no boundary) so the top-level canvas stays a free workspace. */
  private clampRectToBoundary(x: number, y: number, w: number, h: number): { x: number; y: number; w: number; h: number } {
    const bd = this.st.boundary();
    if (!bd) return { x, y, w, h };
    const cw = Math.min(w, bd.w), ch = Math.min(h, bd.h);
    return {
      x: Math.max(bd.x, Math.min(x, bd.x + bd.w - cw)),
      y: Math.max(bd.y, Math.min(y, bd.y + bd.h - ch)),
      w: cw, h: ch,
    };
  }

  /** Keep a free pipe point inside the boundary (when one exists). Attachment/contact points are exempt — they
   *  land on a connector or an existing pipe, including boundary connectors that legitimately sit on the edge. */
  private clampPointToBoundary(pt: { x: number; y: number }): { x: number; y: number } {
    const bd = this.st.boundary();
    if (!bd) return pt;
    return { x: Math.max(bd.x, Math.min(pt.x, bd.x + bd.w)), y: Math.max(bd.y, Math.min(pt.y, bd.y + bd.h)) };
  }

  canFitToBoundary = computed(() => !!this.st.boundary()
    && (this.st.boxes().length > 0 || this.pipeGeos().some(p => p.points.length) || this.st.backgroundUrl() != null));

  /**
   * Shrink-and-relayout EVERYTHING on this canvas — boxes, pipes (with their fittings/taps), legacy edges, and the
   * reference image — by ONE uniform transform so it all fits inside this object's boundary. A single affine
   * (scale S, translate T) preserves every coincidence: box ports, fittings/taps on their pipe, pipe ends on ports —
   * so nothing detaches. Rescues a layout that spilled outside the frame (which otherwise overflows the object's box
   * up in the parent view). Only ever shrinks; if it already fits it just recenters.
   */
  fitContentToBoundary() {
    const boundary = this.st.boundary();
    if (!boundary) return;
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;

    const xs: number[] = [], ys: number[] = [];
    const add = (x: number, y: number) => { xs.push(x); ys.push(y); };
    for (const b of this.st.boxes()) { add(b.x, b.y); add(b.x + b.width, b.y + b.height); }
    const pipes = this.pipeGeos().filter(p => p.parentId === parent);
    for (const p of pipes) {
      for (const pt of p.points) add(pt.x, pt.y);
      for (const f of (p.fittings ?? [])) add(f.at.x, f.at.y);
      for (const t of (p.taps ?? [])) add(t.at.x, t.at.y);
    }
    for (const e of this.st.edges()) for (const wp of (e.waypoints ?? [])) add(wp.x, wp.y);
    const bg = this.st.backgroundUrl() ? this.backgroundFrame() : null;
    if (bg) { add(bg.x, bg.y); add(bg.x + bg.w, bg.y + bg.h); }
    if (!xs.length) return;

    const minX = Math.min(...xs), minY = Math.min(...ys);
    const bboxW = Math.max(1, Math.max(...xs) - minX), bboxH = Math.max(1, Math.max(...ys) - minY);
    const pad = 18;
    const targetW = Math.max(1, boundary.w - pad * 2), targetH = Math.max(1, boundary.h - pad * 2);
    const scale = Math.min(targetW / bboxW, targetH / bboxH, 1); // uniform, shrink-only
    const tx = boundary.x + pad + (targetW - bboxW * scale) / 2 - minX * scale;
    const ty = boundary.y + pad + (targetH - bboxH * scale) / 2 - minY * scale;
    const map = (pt: { x: number; y: number }) => ({ x: tx + scale * pt.x, y: ty + scale * pt.y });

    this.st.boxes.update(list => list.map(b => ({
      ...b, x: tx + scale * b.x, y: ty + scale * b.y,
      width: Math.max(4, scale * b.width), height: Math.max(4, scale * b.height),
    })));
    this.pipeGeos.update(list => list.map(p => p.parentId !== parent ? p : {
      ...p,
      points: p.points.map(map),
      fittings: (p.fittings ?? []).map(f => ({ ...f, at: map(f.at) })),
      taps: (p.taps ?? []).map(t => ({ ...t, at: map(t.at) })),
    }));
    this.st.edges.update(list => list.map(e => e.waypoints?.length ? { ...e, waypoints: e.waypoints.map(map) } : e));
    if (bg) {
      const t = this.st.backgroundTransform();
      this.st.setBackgroundTransform({ x: tx + scale * t.x, y: ty + scale * t.y, scaleX: scale * t.scaleX, scaleY: scale * t.scaleY });
    }
    this.savePipes(); // one full doSave persists boxes + edges + pipes + bg together
    this.st.error.set(null);
  }

  private readEquipmentPorts(svgPath?: string | null): EquipmentPort[] {
    let value: any;
    try { value = svgPath ? JSON.parse(svgPath) : null; } catch { return []; }
    return Array.isArray(value?.equipmentPorts) ? value.equipmentPorts : [];
  }

  /** Connections touching the selected box, named by the other end (for the inspector). */
  constructor() {
    void this.refreshTopology().catch(() => this.st.error.set('Could not load the Plant Map connection graph.'));
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
        this.resetView(); this.pipeDraft.set([]); this.pipeCursor.set(null); this.pipeExtension.set(null);
        this.spacePanning.set(false);
        this.backgroundAdjustMode.set(false); this.portPlacementBoxLocalId.set(null); this.selectedEquipmentPort.set(null);
        // Keep a connect session whose SOURCE END is already picked, so you can drill to another section and finish
        // the link there (cross-section connect). Drop unstarted / body-drafting sessions — those can't carry over.
        const connect = this.pipeConnect();
        if (!connect || connect.sourceEnd == null) this.pipeConnect.set(null);
        this.pipeConnectHover.set(null); this.pipeConnectBodyPreview.set(null);
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
        void this.migrateLoadedPipeTopology(nodeId).then(async () => {
          this.syncLoadedBoundaryPipeEndpoints(nodeId);
          await this.reconcileLoadedPipeContacts(nodeId);
        });
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
          const childBoundary = this.childBoundaryFor(rect);
          for (const s of shapes) {
            const r = this.mapIntoBoundary(rect, childBoundary, s);
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
              parentId: containerId, localId: p.localId ?? undefined, placementId: p.id ?? undefined,
              hasChildren: k?.hasChildren ?? false, diagramId: k?.diagramId ?? null,
              ports: this.readEquipmentPorts(p.svgPath),
              floor: s.floor, dim: s.floor < topFloor, // lower decks shown faint, beneath the top
            });
          } else if (p.sourceEntityType === PIPE_SRC && p.sourceEntityId != null) {
            let geo: { points?: any; fittings?: any; taps?: any; aEnd?: number; bEnd?: number; groupId?: string; generatedByBoundaryPort?: EquipmentPortRef; generatedContinuationId?: string; generatedFromPipeNodeId?: number; continuesFrom?: number; ports?: any; startAttachment?: EquipmentPortRef; endAttachment?: EquipmentPortRef; legacyEdgeLocalId?: number; flowDirection?: PipeFlowDirection; flowReversed?: boolean } = {};
            try { geo = p.svgPath ? JSON.parse(p.svgPath) : {}; } catch { geo = {}; }
            cpipes.push({
              id: 'pipe-' + p.sourceEntityId, parentId: containerId, nodeId: p.sourceEntityId, localId: p.localId ?? undefined,
              placementId: p.id ?? undefined,
              points: Array.isArray(geo.points) ? geo.points : [], fittings: Array.isArray(geo.fittings) ? geo.fittings : [],
              taps: Array.isArray(geo.taps) ? geo.taps : [],
              aEnd: geo.aEnd ?? undefined, bEnd: geo.bEnd ?? undefined, groupId: geo.groupId ?? undefined,
              generatedByBoundaryPort: geo.generatedByBoundaryPort ?? undefined,
              generatedContinuationId: geo.generatedContinuationId ?? undefined,
              generatedFromPipeNodeId: geo.generatedFromPipeNodeId ?? undefined,
              continuesFrom: geo.continuesFrom ?? undefined, ports: Array.isArray(geo.ports) ? geo.ports : undefined,
              startAttachment: geo.startAttachment ?? undefined, endAttachment: geo.endAttachment ?? undefined,
              legacyEdgeLocalId: geo.legacyEdgeLocalId ?? undefined,
              flowDirection: geo.flowDirection ?? (geo.flowReversed ? 'reverse' : undefined),
              flowReversed: geo.flowReversed ?? undefined,
              color: p.color || undefined, width: p.lineWidth || undefined, name: p.label || p.name || 'Pipe',
            } as PipeGeo);
          }
        }
      });
      this.pipeGeos.update(l => [...l.filter(p => p.parentId !== containerId), ...cpipes]);
      await this.migrateLoadedPipeTopology(containerId);
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

  navigate(id: number) { this.portPlacementBoundary.set(false); this.portPlacementBoxLocalId.set(null); void this.st.navigate(id); }
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
  /** Canonical connection graph. Geometry blobs are only consulted by the one-time migration. */
  topologyConnections = signal<PlantMapTopologyConnection[]>([]);
  topologyReady = signal(false);
  private topologyLoadPromise: Promise<void> | null = null;
  pipeMode = signal(false);                            // pipe-draw tool active
  pipeSnap = signal(true);                             // 90° elbow snap while drawing
  snapGrid = signal(false);                            // snap pipe vertices + box move/resize to the 28px grid
  // ── deterministic nominal flow (no hydraulic solver): equipment Supply ports inject flow, Consumer ports
  //    terminate it, explicit A/B direction constrains it, and closed valves remain barriers. Selection never changes it. ──
  flowMode = signal(false);
  flowTopologyLoading = signal(false);
  toggleFlowMode() {
    this.cancelPipeConnect();
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.flowMode.update(v => !v);
    if (!this.flowMode()) this.flowTopologyLoading.set(false);
    else void this.preloadFlowInteriors();
  }

  private async preloadFlowInteriors() {
    const parentDid = this.st.currentDiagramId();
    if (parentDid == null) return;
    this.flowTopologyLoading.set(true);
    try {
      try { await this.refreshTopology(); } catch { /* the visible error is set by the caller/load path */ }
      const currentSection = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
      const sectionIds = new Set(this.st.boxes().map(box => box.childId));
      for (const connection of this.topologyConnections()) {
        for (const terminal of connection.terminals) sectionIds.add(terminal.sectionId);
      }
      const byId = this.nodeById();
      const pending = [...sectionIds].filter(sectionId => sectionId !== currentSection
        && !this.nestFetched.has(sectionId) && this.isInCurrentMapHierarchy(sectionId));
      await Promise.all(pending.map(sectionId => {
        const node = byId.get(sectionId) ?? this.st.childById().get(sectionId);
        return this.fetchNest(sectionId, node?.diagramId ?? null, parentDid);
      }));
    } finally {
      if (this.st.currentDiagramId() === parentDid) this.flowTopologyLoading.set(false);
    }
  }
  pipeDraft = signal<{ x: number; y: number }[]>([]);  // vertices being laid
  pipeCursor = signal<{ x: number; y: number } | null>(null); // cursor → live guide segment
  pipeExtension = signal<PipeExtension | null>(null);
  private pipeDraftStartAttachment: EquipmentPortRef | undefined;
  private pipeDraftEndAttachment: EquipmentPortRef | undefined;
  selectedPipeId = signal<string | null>(null);
  /** Multi-selected pipes (marquee) — highlighted and bulk-deletable alongside boxes. */
  selectedPipeIds = signal<Set<string>>(new Set());
  isPipeSelected(id: string): boolean { return this.selectedPipeId() === id || this.selectedPipeIds().has(id); }
  private clearMultiPipeSelection() { if (this.selectedPipeIds().size) this.selectedPipeIds.set(new Set()); }
  /** True when at least one point/segment of the path falls inside the rubber rect (marquee hit test). */
  private pathHitsRect(points: { x: number; y: number }[], r: { x: number; y: number; w: number; h: number }): boolean {
    const inside = (x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    for (let i = 0; i < points.length; i++) {
      if (inside(points[i].x, points[i].y)) return true;
      if (i < points.length - 1) {
        const a = points[i], b = points[i + 1];
        for (let t = 0.2; t < 1; t += 0.2) if (inside(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y))) return true;
      }
    }
    return false;
  }
  pipeEditName = '';
  /** linkId whose connectors should pulse (set when you jump through a connector, so the counterpart is obvious). */
  highlightedLink = signal<string | null>(null);
  private highlightTimer: any = null;
  private pipeDraftEndA: number | null = null;         // object under the first vertex (endpoint anchor)
  private pipeDraftEndB: number | null = null;         // object under the last vertex (endpoint anchor)

  private nodeById = computed(() => new Map(this.treeAllNodes().map(n => [n.id, n])));
  private nameOf(id: number): string { return this.st.childById().get(id)?.name || this.nodeById().get(id)?.name || ('#' + id); }
  private isInCurrentMapHierarchy(id: number): boolean {
    const root = this.st.currentNode()?.id;
    if (root == null) return false;
    const byId = this.nodeById();
    const seen = new Set<number>();
    let cursor: number | null = id;
    while (cursor != null && !seen.has(cursor)) {
      if (cursor === root) return true;
      seen.add(cursor);
      cursor = byId.get(cursor)?.parentId ?? null;
    }
    return false;
  }
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
    this.flowMode.set(false);
    this.pipeMode.update(v => !v);
    this.cancelPipe();
  }

  /** Merge the CANVAS node's loaded pipes into the global pipeGeos, replacing any prior entries for that node. */
  private applyLoadedPipes(pipes: PipeGeo[], nodeId: number | null) {
    if (nodeId == null) return;
    this.pipeGeos.update(l => [...l.filter(p => p.parentId !== nodeId), ...pipes.map(p => ({ ...p, parentId: nodeId }))]);
  }

  private refreshTopology(): Promise<void> {
    if (this.topologyLoadPromise) return this.topologyLoadPromise;
    this.topologyLoadPromise = firstValueFrom(this.topologyApi.getAll())
      .then(result => {
        this.topologyConnections.set(result?.responseData ?? []);
        this.topologyReady.set(true);
      })
      .catch(error => {
        this.topologyReady.set(false);
        throw error;
      })
      .finally(() => { this.topologyLoadPromise = null; });
    return this.topologyLoadPromise;
  }

  private topologyEnd(end: PipeEnd): 'A' | 'B' { return end === 'start' ? 'A' : 'B'; }
  private topologyTerminal(pipe: Pick<PipeGeo, 'nodeId' | 'parentId'>, end: PipeEnd): PlantMapTopologyTerminal | null {
    return pipe.nodeId == null ? null : { pipeNodeId: pipe.nodeId, end: this.topologyEnd(end), sectionId: pipe.parentId };
  }
  private topologyTapTerminal(pipe: Pick<PipeGeo, 'nodeId' | 'parentId'>, tapId: string): PlantMapTopologyTerminal | null {
    return pipe.nodeId == null ? null : { pipeNodeId: pipe.nodeId, end: `T:${tapId}`, sectionId: pipe.parentId };
  }
  private topologyTerminalPoint(pipe: PipeGeo, end: string): { x: number; y: number } | null {
    if (end === 'A') return pipe.points[0] ?? null;
    if (end === 'B') return pipe.points[pipe.points.length - 1] ?? null;
    if (end.startsWith('T:')) return pipe.taps?.find(tap => tap.id === end.slice(2))?.at ?? null;
    return null;
  }
  topologyTerminalLabel(end: string): string {
    return end === 'A' || end === 'B' ? `end ${end}` : 'branch point';
  }
  private sameTopologyTerminal(left: PlantMapTopologyTerminal, right: PlantMapTopologyTerminal): boolean {
    return left.pipeNodeId === right.pipeNodeId && left.end === right.end;
  }
  private connectionForPipeEnd(pipe: Pick<PipeGeo, 'nodeId' | 'parentId'>, end: PipeEnd): PlantMapTopologyConnection | null {
    const terminal = this.topologyTerminal(pipe, end);
    if (!terminal) return null;
    return this.connectionForTerminal(terminal);
  }
  private connectionForTerminal(terminal: PlantMapTopologyTerminal): PlantMapTopologyConnection | null {
    return this.topologyConnections().find(connection => connection.terminals.some(item =>
      this.sameTopologyTerminal(item, terminal))) ?? null;
  }
  private equipmentRefForPipeEnd(pipe: PipeGeo, end: PipeEnd): EquipmentPortRef | undefined {
    const connection = this.connectionForPipeEnd(pipe, end);
    return connection?.kind === 'EQUIPMENT_PORT'
      && connection.equipmentObjectId != null && connection.equipmentPortId
      ? { objectId: connection.equipmentObjectId, portId: connection.equipmentPortId }
      : undefined;
  }
  private isPipeEndConnected(pipe: PipeGeo, end: PipeEnd): boolean {
    return this.connectionForPipeEnd(pipe, end) != null;
  }
  private applyTopologyConnection(connection: PlantMapTopologyConnection) {
    // The server guarantees one junction per pipe end. Mirror that invariant immediately in the UI.
    this.topologyConnections.update(list => {
      const retained = list.flatMap(item => {
        if (item.connectionKey === connection.connectionKey) return [];
        const terminals = item.terminals.filter(terminal => !connection.terminals.some(next =>
          this.sameTopologyTerminal(terminal, next)));
        const valid = item.kind === 'EQUIPMENT_PORT' ? terminals.length > 0 : terminals.length >= 2;
        return valid ? [{ ...item, terminals }] : [];
      });
      return [...retained, connection];
    });
  }

  /** Promote unambiguous legacy links, then stop persisting connection truth inside pipe geometry. */
  private async migrateLoadedPipeTopology(nodeId: number | null) {
    if (nodeId == null) return;
    try { await this.refreshTopology(); }
    catch { this.st.error.set('Could not load the Plant Map connection graph. Pipe geometry was left unchanged.'); return; }
    const pipes = this.pipeGeos().filter(pipe => pipe.parentId === nodeId && pipe.nodeId != null);
    for (const pipe of pipes) {
      for (const end of ['start', 'end'] as PipeEnd[]) {
        if (this.connectionForPipeEnd(pipe, end)) continue;
        const terminal = this.topologyTerminal(pipe, end);
        if (!terminal) continue;
        const attachment = end === 'start' ? pipe.startAttachment : pipe.endAttachment;
        const ports = (pipe.ports ?? []).filter(port => port.at === end);
        try {
          if (attachment) {
            const result = await firstValueFrom(this.topologyApi.attach({ terminal, equipmentPort: attachment }));
            if (result?.responseData) this.applyTopologyConnection(result.responseData);
          } else if (ports.length) {
            const result = await firstValueFrom(this.topologyApi.attach({
              terminal,
              connectionKey: `continuation:${ports[0].linkId}`,
              kind: 'CONTINUATION',
            }));
            if (result?.responseData) this.applyTopologyConnection(result.responseData);
            if (ports.length > 1) {
              this.st.error.set(`${pipe.name || 'Pipe'} end ${this.topologyEnd(end)} had several old links. The first was migrated; review that junction.`);
            }
          }
        } catch (error: any) {
          this.st.error.set(error?.error?.message || error?.message || 'Could not migrate an old pipe connection.');
          return;
        }
      }
    }
    if (!pipes.some(pipe => pipe.ports?.length || pipe.startAttachment || pipe.endAttachment
      || pipe.aEnd != null || pipe.bEnd != null || pipe.continuesFrom != null)) return;
    this.pipeGeos.update(list => list.map(pipe => pipe.parentId !== nodeId ? pipe : {
      ...pipe,
      ports: undefined, startAttachment: undefined, endAttachment: undefined,
      aEnd: undefined, bEnd: undefined, continuesFrom: undefined,
    }));
    await this.persistChangedPipes(new Set(pipes.map(pipe => pipe.id)));
  }

  private reconcilingContactNodes = new Set<number>();

  /** Geometry is only an authoring input: once a route endpoint visibly lands on another route, promote that
   * unambiguous contact into canonical topology. Body/body crossings are deliberately ignored here. */
  private async reconcileLoadedPipeContacts(nodeId: number | null) {
    const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (nodeId == null || nodeId !== currentParent || this.reconcilingContactNodes.has(nodeId)) return;
    this.reconcilingContactNodes.add(nodeId);
    try {
      const pipeIds = this.pipeGeos().filter(pipe => pipe.parentId === nodeId).map(pipe => pipe.id);
      for (const pipeId of pipeIds) {
        await this.autoConnectPipeEndpointAtContact(pipeId, 'start');
        await this.autoConnectPipeEndpointAtContact(pipeId, 'end');
      }
    } finally {
      this.reconcilingContactNodes.delete(nodeId);
    }
  }

  private syncLoadedBoundaryPipeEndpoints(nodeId: number | null) {
    const boundary = this.st.boundary();
    const objectId = this.st.currentNode()?.id;
    if (nodeId == null || !boundary || objectId == null) return;
    const byPort = new Map(this.st.boundaryPorts().map(port => [port.id, this.equipmentPortPoint(boundary, port)]));
    let changed = false;
    this.pipeGeos.update(list => list.map(pipe => {
      if (pipe.parentId !== nodeId || pipe.points.length < 2) return pipe;
      const startRef = this.equipmentRefForPipeEnd(pipe, 'start');
      const endRef = this.equipmentRefForPipeEnd(pipe, 'end');
      const start = startRef?.objectId === objectId ? byPort.get(startRef.portId) : null;
      const end = endRef?.objectId === objectId ? byPort.get(endRef.portId) : null;
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
    await this.migrateLoadedPipeTopology(nodeId);
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
  /** Add a vertex at the pointer (canvas / box / nested click while in pipe mode). */
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
    let np: { x: number; y: number };
    const contact = attachment ? null : this.nearestCurrentPipeContact(p, this.pipeExtension()?.pipeId);
    // An explicit equipment connector remains authoritative over grid and orthogonal snapping.
    if (attachment) np = { ...p };
    else if (contact) np = { ...contact.point };
    else if (pts.length) np = this.clampPointToBoundary(this.snapPt(this.snapPipePoint(p, pts[pts.length - 1])));
    else np = this.clampPointToBoundary(this.snapPt(p));
    this.pipeDraft.set([...pts, np]);
  }
  private addPipeConnectElbow(ev: PointerEvent) {
    const points = this.pipeDraft();
    if (!points.length) return;
    const next = this.snapPt(this.snapPipePoint(this.contentPoint(ev), points[points.length - 1]));
    if (Math.hypot(next.x - points[points.length - 1].x, next.y - points[points.length - 1].y) > 0.01) {
      this.pipeDraft.set([...points, next]);
    }
  }
  cancelPipe() {
    this.pipeDraft.set([]); this.pipeCursor.set(null);
    this.pipeExtension.set(null);
    this.pipeDraftEndA = null; this.pipeDraftEndB = null;
    this.pipeDraftStartAttachment = undefined; this.pipeDraftEndAttachment = undefined;
  }
  /** Finish a new route, or merge an endpoint extension back into its existing pipe. */
  async finishPipe() {
    let pts = this.pipeDraft();
    pts = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y); // drop dbl-click dup
    this.pipeDraft.set([]); this.pipeCursor.set(null);
    const extension = this.pipeExtension(); this.pipeExtension.set(null);
    const a = this.pipeDraftEndA, b = this.pipeDraftEndB; this.pipeDraftEndA = null; this.pipeDraftEndB = null;
    const startAttachment = this.pipeDraftStartAttachment, endAttachment = this.pipeDraftEndAttachment;
    this.pipeDraftStartAttachment = undefined; this.pipeDraftEndAttachment = undefined;
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (pts.length < 2 || parent == null) return;
    if (extension) {
      const existing = this.pipeGeos().find(pipe => pipe.id === extension.pipeId && pipe.parentId === parent);
      if (!existing) return;
      const added = pts.slice(1);
      const points = extension.end === 'end'
        ? [...existing.points, ...added]
        : [...added].reverse().concat(existing.points);
      this.pipeGeos.update(list => list.map(pipe => {
        if (pipe.id !== existing.id) return pipe;
        return extension.end === 'end'
          ? { ...pipe, points }
          : { ...pipe, points };
      }));
      this.savePipes();
      let partitioned: PartitionedPipeRoute;
      try { partitioned = await this.partitionDrawnPipe(existing.id, extension.end === 'start' ? 'end' : 'start'); }
      catch (error: any) {
        this.st.error.set(error?.error?.message || error?.message || 'Could not continue the pipe across the child boundary.');
        this.pipeMode.set(false);
        this.pipeEdit.set(true);
        return;
      }
      const newAttachment = endAttachment;
      const endpointPipe = extension.end === 'end' ? partitioned.last : partitioned.first;
      const endpoint = extension.end === 'end' ? 'end' : 'start';
      const newPoint = endpoint === 'end'
        ? endpointPipe.points[endpointPipe.points.length - 1] : endpointPipe.points[0];
      if (newAttachment) await this.attachPipeEndpointToPort(endpointPipe.id, endpoint, newAttachment, newPoint);
      else await this.autoConnectPipeEndpointAtContact(endpointPipe.id, endpoint);
      this.pipeMode.set(false);
      this.pipeEdit.set(true);
      return;
    }
    const pipeName = 'Pipe';
    const node = await firstValueFrom(this.nodesApi.createNode({ name: pipeName, type: 'EQUIPMENT', parentId: parent }));
    if (!node) return;                                              // creation failed → no phantom pipe
    if ((this.st.canvasNode()?.id ?? null) !== parent) {            // navigated away mid-create → undo the orphan node
      await firstValueFrom(this.nodesApi.deleteNode(node.id)); return;
    }
    const geo: PipeGeo = { id: 'pipe-' + node.id, parentId: parent, nodeId: node.id, points: pts, name: pipeName,
                           fittings: [] };
    this.pipeGeos.update(list => [...list, geo]);
    this.savePipes();
    let partitioned: PartitionedPipeRoute;
    try { partitioned = await this.partitionDrawnPipe(geo.id); }
    catch (error: any) {
      this.st.error.set(error?.error?.message || error?.message || 'Could not split the pipe at the child boundary. The original route was preserved.');
      this.selectPipe(geo.id);
      return;
    }
    if (startAttachment) {
      await this.attachPipeEndpointToPort(partitioned.first.id, 'start', startAttachment, partitioned.first.points[0]);
    } else {
      await this.autoConnectPipeEndpointAtContact(partitioned.first.id, 'start');
    }
    const finalPoint = partitioned.last.points[partitioned.last.points.length - 1];
    if (endAttachment) await this.attachPipeEndpointToPort(partitioned.last.id, 'end', endAttachment, finalPoint);
    else await this.autoConnectPipeEndpointAtContact(partitioned.last.id, 'end');
    this.selectPipe(geo.id);
  }

  /** Follow-stubs: when you're viewing a node that a pipe (on its PARENT canvas) connects to, offer a jump to the
   *  pipe's other end — "seamlessly follow the pipe to the connecting area when drilled in". */
  followStubs = computed(() => {
    const cur = this.st.currentNode(); const bc = this.st.breadcrumb();
    if (!cur || bc.length < 2) return [];
    const parentId = bc[bc.length - 2].id;
    const out: { id: string; target: number; label: string; pipe: string }[] = [];
    for (const p of this.pipeGeos()) {
      if (p.parentId !== parentId) continue;
      const a = this.equipmentRefForPipeEnd(p, 'start');
      const b = this.equipmentRefForPipeEnd(p, 'end');
      const far = a?.objectId === cur.id ? b?.objectId : (b?.objectId === cur.id ? a?.objectId : null);
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
      mid: p.points[Math.floor(p.points.length / 2)], sel: this.isPipeSelected(p.id),
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

  // Direct-manipulation connection mode. A/B or a projected body point can be selected. Endpoint/body contacts
  // become one canonical junction; body/body points at different coordinates create a real routed branch pipe.
  pipeConnect = signal<PipeConnectSession | null>(null);
  pipeConnectHover = signal<string | null>(null);
  pipeConnectBodyPreview = signal<PipeConnectionBodyPreview | null>(null);
  pipeBodyHover = signal<string | null>(null);
  connectionBusy = signal(false);
  pipeHitWidth = computed(() => 24 / this.zoom());

  visiblePipes = computed<VisiblePipe[]>(() => {
    const parentId = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? 0;
    const current: VisiblePipe[] = this.viewPipes().map(pipe => ({
      id: pipe.id, parentId, name: pipe.name, nested: false,
      points: pipe.points, path: pipe.path,
      start: pipe.start, end: pipe.end, mid: pipe.mid,
      nodeId: pipe.nodeId, frames: [],
    }));
    const nested: VisiblePipe[] = this.nestedItems().pipes.map(pipe => ({
      id: pipe.id, nodeId: pipe.nodeId, parentId: pipe.parentId, name: pipe.name, nested: true,
      points: pipe.points, path: pipe.path,
      start: pipe.start, end: pipe.end, mid: pipe.mid, frames: pipe.frames,
    }));
    return [...current, ...nested];
  });

  selectedPipeToolbar = computed(() => {
    if (this.pipeConnect()) return null;
    const selectedId = this.selectedPipeId();
    return selectedId ? (this.visiblePipes().find(pipe => pipe.id === selectedId) ?? null) : null;
  });
  selectedPipeEndLabels = computed(() => {
    const selectedId = this.selectedPipeId();
    const pipe = selectedId ? this.visiblePipes().find(item => item.id === selectedId) : null;
    return pipe ? [
      { key: `${pipe.id}-A`, label: 'A', role: 'a' as const, point: pipe.start },
      { key: `${pipe.id}-B`, label: 'B', role: 'b' as const, point: pipe.end },
    ] : [];
  });
  hoveredVisiblePipe = computed(() => {
    const id = this.pipeBodyHover();
    // A selected pipe already has a labeled action bar; suppress hover cards while it is open so they never stack.
    if (!id || this.selectedPipeId() != null) return null;
    return this.visiblePipes().find(pipe => pipe.id === id) ?? null;
  });
  selectedPipePath = computed(() => {
    const pipe = this.selectedPipe();
    return pipe ? this.hierarchyPath(pipe.parentId) : '';
  });
  canConnectSelectedPipe = computed(() => {
    const selectedId = this.selectedPipeId();
    return !!selectedId && this.visiblePipes().some(pipe => pipe.id === selectedId);
  });

  private pipeConnectSourcePicked(session: PipeConnectSession | null): boolean {
    return !!session && (session.sourceEnd != null || session.sourcePoint != null);
  }
  pipeConnectHasSource = computed(() => this.pipeConnectSourcePicked(this.pipeConnect()));
  pipeConnectBodyDrafting = computed(() => {
    const session = this.pipeConnect();
    return !!session?.sourcePoint && session.sourceEnd == null;
  });

  connectionEndpointHandles = computed<PipeConnectionEndpointHandle[]>(() => {
    const session = this.pipeConnect();
    const visible = this.visiblePipes();
    if (!session) return [];
    const source = visible.find(pipe => pipe.id === session.sourcePipeId);
    if (!this.pipeConnectSourcePicked(session)) {
      // still choosing the source end — that needs the source itself on-screen
      if (!source) return [];
      return [
        { pipeId: source.id, end: 'start' as PipeEnd, point: source.start, role: 'source-choice' as const, name: source.name },
        { pipeId: source.id, end: 'end' as PipeEnd, point: source.end, role: 'source-choice' as const, name: source.name },
      ];
    }
    // Source end already chosen — offer target ends on every visible pipe, EVEN IF the source itself is off-canvas
    // (you picked it in a child, then drilled up to the parent). This is what lets a link be made across sections.
    const handles: PipeConnectionEndpointHandle[] = [];
    if (source && session.sourceEnd != null) handles.push({
      pipeId: source.id, end: session.sourceEnd,
      point: session.sourceEnd === 'start' ? source.start : source.end,
      role: 'source-selected' as const, name: source.name,
    });
    // Every candidate end remains visible at a small, screen-sized radius. Hover only enlarges/emphasizes it.
    for (const pipe of visible) {
      if (pipe.id === session.sourcePipeId) continue;
      handles.push({ pipeId: pipe.id, end: 'start', point: pipe.start, role: 'target', name: pipe.name });
      handles.push({ pipeId: pipe.id, end: 'end', point: pipe.end, role: 'target', name: pipe.name });
    }
    return handles;
  });

  connectionBodyHandles = computed<PipeConnectionBodyPreview[]>(() => {
    const session = this.pipeConnect();
    if (!session) return [];
    const handles: PipeConnectionBodyPreview[] = [];
    if (session.sourcePoint && session.sourceEnd == null) {
      handles.push({
        pipeId: session.sourcePipeId,
        point: session.sourcePoint,
        pending: { targetPipeId: session.sourcePipeId, targetPoint: session.sourcePoint, targetTapId: session.sourceTapId },
        role: 'source-selected',
        name: this.pipeGeos().find(pipe => pipe.id === session.sourcePipeId)?.name || 'Pipe',
      });
    }
    const preview = this.pipeConnectBodyPreview();
    if (preview) handles.push(preview);
    return handles;
  });

  selectedPipeLinks = computed(() => {
    const selected = this.selectedPipe();
    if (!selected) return [];
    const all = this.pipeGeos();
    return (['start', 'end'] as PipeEnd[]).flatMap(end => {
      const connection = this.connectionForPipeEnd(selected, end);
      if (!connection) return [];
      const others = connection.terminals.filter(terminal => terminal.pipeNodeId !== selected.nodeId
        || terminal.end !== this.topologyEnd(end));
      const targetTerminal = others[0];
      const target = targetTerminal ? all.find(pipe => pipe.nodeId === targetTerminal.pipeNodeId) : undefined;
      const sectionId = targetTerminal?.sectionId ?? null;
      const equipmentLabel = connection.kind === 'EQUIPMENT_PORT'
        && connection.equipmentObjectId != null && connection.equipmentPortId
        ? this.pipeAttachmentLabel({ objectId: connection.equipmentObjectId, portId: connection.equipmentPortId })
        : null;
      return [{
        linkId: connection.connectionKey, at: end,
        targetPipeId: target?.id ?? null,
        targetAt: targetTerminal?.end ?? null,
        targetLabel: equipmentLabel ?? (target
          ? `${target.name || 'Pipe'} — ${this.nameOf(target.parentId)}`
          : sectionId != null ? this.nameOf(sectionId) : 'Connected junction'),
        sectionId,
      }];
    });
  });

  selectedPipeBodyLinks = computed(() => {
    const selected = this.selectedPipe();
    if (!selected) return [];
    return (selected.taps ?? []).flatMap(tap => {
      const terminal = this.topologyTapTerminal(selected, tap.id);
      const connection = terminal ? this.connectionForTerminal(terminal) : null;
      if (!connection) return [];
      const labels = connection.terminals
        .filter(item => !this.sameTopologyTerminal(item, terminal!))
        .map(item => {
          const other = this.pipeGeos().find(pipe => pipe.nodeId === item.pipeNodeId);
          return other
            ? `${other.name || 'Pipe'} (${this.topologyTerminalLabel(item.end)}) · ${this.nameOf(other.parentId)}`
            : `Pipe in ${this.nameOf(item.sectionId)} (${this.topologyTerminalLabel(item.end)})`;
        });
      return [{
        tapId: tap.id,
        connectionKey: connection.connectionKey,
        label: labels.join(', ') || 'Junction',
      }];
    });
  });

  /** What is already connected to the endpoint currently chosen in Connect mode. */
  selectedEndpointConnections = computed(() => {
    const session = this.pipeConnect();
    if (!session?.sourceEnd) return null;
    const pipe = this.pipeGeos().find(item => item.id === session.sourcePipeId);
    const visible = this.visiblePipes().find(item => item.id === session.sourcePipeId);
    if (!pipe || !visible) return null;
    const end = session.sourceEnd;
    const connections: EndpointConnectionView[] = [];
    const connection = this.connectionForPipeEnd(pipe, end);
    if (!connection) return { pipeId: pipe.id, end, point: end === 'start' ? visible.start : visible.end, connections };
    if (connection.kind === 'EQUIPMENT_PORT' && connection.equipmentObjectId != null && connection.equipmentPortId) {
      const equipmentRef = { objectId: connection.equipmentObjectId, portId: connection.equipmentPortId };
      connections.push({
        kind: 'equipment', key: connection.connectionKey,
        label: this.pipeAttachmentLabel(equipmentRef), equipmentRef,
      });
    }
    for (const terminal of connection.terminals.filter(item => item.pipeNodeId !== pipe.nodeId
      || item.end !== this.topologyEnd(end))) {
      const counterpart = this.pipeGeos().find(item => item.nodeId === terminal.pipeNodeId);
      connections.push({
        kind: 'pipe', key: connection.connectionKey,
        label: counterpart
          ? `${counterpart.name || 'Pipe'} (${this.topologyTerminalLabel(terminal.end)}) · ${this.nameOf(counterpart.parentId)}`
          : `Pipe in ${this.nameOf(terminal.sectionId)} (${this.topologyTerminalLabel(terminal.end)})`,
        targetPipeId: counterpart?.id,
      });
    }
    return {
      pipeId: pipe.id, end,
      point: end === 'start' ? visible.start : visible.end,
      connections,
    };
  });

  isCurrentConnectionPipe(pipeId: string): boolean {
    return !!this.selectedEndpointConnections()?.connections.some(connection => connection.targetPipeId === pipeId);
  }

  isCurrentConnectionEquipmentPort(handle: EquipmentPortHandle): boolean {
    return !!this.selectedEndpointConnections()?.connections.some(connection => connection.kind === 'equipment'
      && connection.equipmentRef?.objectId === handle.objectId && connection.equipmentRef.portId === handle.portId);
  }

  /** Other sections participating in the selected pipe's canonical junctions. */
  pipeRunJumps = computed<{ target: number; label: string; dir: 'from' | 'to' }[]>(() => {
    const p = this.selectedPipe(); if (!p) return [];
    const out: { target: number; label: string; dir: 'from' | 'to' }[] = [];
    const seen = new Set<number>([p.parentId]);
    for (const end of ['start', 'end'] as PipeEnd[]) {
      const connection = this.connectionForPipeEnd(p, end);
      for (const terminal of connection?.terminals ?? []) {
        if (!seen.has(terminal.sectionId)) {
          seen.add(terminal.sectionId);
          out.push({ target: terminal.sectionId, label: this.nameOf(terminal.sectionId), dir: 'to' });
        }
      }
    }
    return out;
  });

  /** Off-page connectors are navigation objects derived only from cross-section topology, never flow arrows. */
  /** Off-page-style tags at a connected pipe end that the eye can't follow to its partner: a partner in ANOTHER
   *  section (double-click jumps) OR one on THIS canvas but across a visible gap (single-click flashes both). Ends
   *  that physically touch their partner are a plain junction dot instead (see pipeJunctions). */
  pipeConnectors = computed<{ pipeId: string; linkId: string; x: number; y: number; target: number | null; label: string; dir: 'in' | 'out'; angle: number; sameCanvas: boolean }[]>(() => {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return [];
    const deg = (dx: number, dy: number) => Math.atan2(dy, dx) * 180 / Math.PI;
    const all = this.pipeGeos();
    const byNode = new Map(all.filter(pipe => pipe.nodeId != null).map(pipe => [pipe.nodeId!, pipe]));
    const GAP = 10; // ends farther apart than this are a "gap" worth a connector tag; closer is a touching junction
    const out: { pipeId: string; linkId: string; x: number; y: number; target: number | null; label: string; dir: 'in' | 'out'; angle: number; sameCanvas: boolean }[] = [];
    for (const p of all) {
      if (p.parentId !== parent || p.points.length < 2) continue;
      for (const pipeEnd of ['start', 'end'] as PipeEnd[]) {
        const connection = this.connectionForPipeEnd(p, pipeEnd);
        if (!connection) continue;
        const point = pipeEnd === 'start' ? p.points[0] : p.points[p.points.length - 1];
        const previous = pipeEnd === 'start' ? p.points[1] : p.points[p.points.length - 2];
        const angle = deg(point.x - previous.x, point.y - previous.y);
        const crossCounterpart = connection.terminals.find(terminal => terminal.sectionId !== parent);
        if (crossCounterpart || connection.kind === 'CONTINUATION') {
          // Partner lives in another section: an off-page connector; double-click jumps to it.
          const target = crossCounterpart?.sectionId ?? null;
          out.push({
            pipeId: p.id, linkId: connection.connectionKey, x: point.x, y: point.y, target,
            label: target != null ? this.nameOf(target) : 'Unresolved', dir: 'out', angle, sameCanvas: false,
          });
          continue;
        }
        // Partner(s) on THIS canvas: show a connector only when the ends don't touch (a visible gap). A same-point
        // join stays a plain junction dot. Both gapped ends carry the same linkId, so flashing one flashes both.
        const partners = connection.terminals.filter(terminal =>
          !(terminal.pipeNodeId === p.nodeId && terminal.end === this.topologyEnd(pipeEnd)));
        let partnerName: string | null = null;
        for (const partner of partners) {
          const partnerPipe = byNode.get(partner.pipeNodeId);
          const partnerPoint = partnerPipe ? this.topologyTerminalPoint(partnerPipe, partner.end) : null;
          if (partnerPoint && Math.hypot(partnerPoint.x - point.x, partnerPoint.y - point.y) > GAP) {
            partnerName = partnerPipe?.name || 'Pipe';
            break;
          }
        }
        if (partnerName != null) out.push({
          pipeId: p.id, linkId: connection.connectionKey, x: point.x, y: point.y, target: null,
          label: partnerName, dir: 'in', angle, sameCanvas: true,
        });
      }
    }
    return out;
  });

  /** Junction dots are derived only from canonical topology, never visual proximity. */
  pipeJunctions = computed<{ x: number; y: number }[]>(() => {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return [];
    const pipes = new Map(this.pipeGeos()
      .filter(pipe => pipe.parentId === parent && pipe.nodeId != null && pipe.points.length >= 2)
      .map(pipe => [pipe.nodeId!, pipe]));
    const out: { x: number; y: number }[] = [];
    const seen = new Set<string>();
    for (const connection of this.topologyConnections()) {
      if (connection.kind === 'EQUIPMENT_PORT') continue;
      const local = connection.terminals.filter(terminal => terminal.sectionId === parent
        && pipes.has(terminal.pipeNodeId));
      if (local.length < 2) continue;
      for (const terminal of local) {
        const pipe = pipes.get(terminal.pipeNodeId)!;
        const point = this.topologyTerminalPoint(pipe, terminal.end);
        if (!point) continue;
        const key = `${Math.round(point.x * 10)}:${Math.round(point.y * 10)}`;
        if (!seen.has(key)) { seen.add(key); out.push({ ...point }); }
      }
    }
    return out;
  });

  /** Body/body geometry alone never creates topology. Unconnected intersections get a line-hop; an explicit
   * canonical junction suppresses the hop and the normal junction dot above identifies the connection. */
  pipeCrossovers = computed<PipeCrossover[]>(() => {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return [];
    const pipes = this.pipeGeos().filter(pipe => pipe.parentId === parent
      && pipe.nodeId != null && pipe.points.length >= 2);
    const result: PipeCrossover[] = [];
    const seen = new Set<string>();
    const screenRadius = 9 / Math.max(0.2, this.zoom());
    for (let leftIndex = 0; leftIndex < pipes.length; leftIndex++) {
      const left = pipes[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < pipes.length; rightIndex++) {
        const right = pipes[rightIndex];
        for (let li = 0; li < left.points.length - 1; li++) {
          for (let ri = 0; ri < right.points.length - 1; ri++) {
            const crossing = this.segmentIntersection(
              left.points[li], left.points[li + 1], right.points[ri], right.points[ri + 1],
            );
            if (!crossing) continue;
            const atLeftEnd = Math.min(
              Math.hypot(crossing.x - left.points[0].x, crossing.y - left.points[0].y),
              Math.hypot(crossing.x - left.points[left.points.length - 1].x, crossing.y - left.points[left.points.length - 1].y),
            ) <= 0.5;
            const atRightEnd = Math.min(
              Math.hypot(crossing.x - right.points[0].x, crossing.y - right.points[0].y),
              Math.hypot(crossing.x - right.points[right.points.length - 1].x, crossing.y - right.points[right.points.length - 1].y),
            ) <= 0.5;
            if (atLeftEnd || atRightEnd || this.pipesShareJunctionAt(left, right, crossing)) continue;
            const key = `${left.id}:${right.id}:${Math.round(crossing.x * 10)}:${Math.round(crossing.y * 10)}`;
            if (seen.has(key)) continue;
            seen.add(key);

            // The later route is drawn as the upper elevation. A compact arc plus a canvas-coloured cut makes the
            // non-connection legible even over dense pipework; topology, not draw order, still controls flow.
            const a = right.points[ri], b = right.points[ri + 1];
            const length = Math.max(0.001, Math.hypot(b.x - a.x, b.y - a.y));
            const ux = (b.x - a.x) / length, uy = (b.y - a.y) / length;
            let nx = -uy, ny = ux;
            if (ny > 0) { nx *= -1; ny *= -1; }
            const start = { x: crossing.x - ux * screenRadius, y: crossing.y - uy * screenRadius };
            const end = { x: crossing.x + ux * screenRadius, y: crossing.y + uy * screenRadius };
            const lift = screenRadius * 0.72;
            const c1 = { x: crossing.x - ux * screenRadius * 0.35 + nx * lift, y: crossing.y - uy * screenRadius * 0.35 + ny * lift };
            const c2 = { x: crossing.x + ux * screenRadius * 0.35 + nx * lift, y: crossing.y + uy * screenRadius * 0.35 + ny * lift };
            result.push({
              key, x: crossing.x, y: crossing.y,
              path: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
              color: right.color || '#5b9bd5', width: right.width || 8,
              maskRadius: (Math.max(left.width || 8, right.width || 8) / 2) + 4 / Math.max(0.2, this.zoom()),
            });
          }
        }
      }
    }
    return result;
  });

  private segmentIntersection(
    a: { x: number; y: number }, b: { x: number; y: number },
    c: { x: number; y: number }, d: { x: number; y: number },
  ): { x: number; y: number } | null {
    const r = { x: b.x - a.x, y: b.y - a.y };
    const s = { x: d.x - c.x, y: d.y - c.y };
    const cross = r.x * s.y - r.y * s.x;
    if (Math.abs(cross) < 1e-7) return null; // parallel/overlapping routes are not a crossing glyph
    const ca = { x: c.x - a.x, y: c.y - a.y };
    const t = (ca.x * s.y - ca.y * s.x) / cross;
    const u = (ca.x * r.y - ca.y * r.x) / cross;
    if (t < -1e-7 || t > 1 + 1e-7 || u < -1e-7 || u > 1 + 1e-7) return null;
    return { x: a.x + t * r.x, y: a.y + t * r.y };
  }

  private pipesShareJunctionAt(left: PipeGeo, right: PipeGeo, point: { x: number; y: number }): boolean {
    if (left.nodeId == null || right.nodeId == null) return false;
    return this.topologyConnections().some(connection => {
      const leftAtPoint = connection.terminals.some(terminal => terminal.pipeNodeId === left.nodeId
        && this.terminalNearPoint(left, terminal, point));
      const rightAtPoint = connection.terminals.some(terminal => terminal.pipeNodeId === right.nodeId
        && this.terminalNearPoint(right, terminal, point));
      return leftAtPoint && rightAtPoint;
    });
  }

  private terminalNearPoint(
    pipe: PipeGeo,
    terminal: PlantMapTopologyTerminal,
    point: { x: number; y: number },
  ): boolean {
    const terminalPoint = this.topologyTerminalPoint(pipe, terminal.end);
    return !!terminalPoint && Math.hypot(terminalPoint.x - point.x, terminalPoint.y - point.y) <= 1;
  }

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

  flowBoundaryPorts = computed(() => {
    this.nestVersion();
    const boundaries: { objectId: number; portId: string; role: 'supply' | 'consumer' }[] = [];
    const add = (objectId: number, ports: EquipmentPort[]) => {
      for (const port of ports) if (port.flowBoundary === 'supply' || port.flowBoundary === 'consumer') {
        boundaries.push({ objectId, portId: port.id, role: port.flowBoundary });
      }
    };
    for (const box of this.st.boxes()) add(box.childId, box.ports ?? []);
    const currentId = this.st.currentNode()?.id;
    if (currentId != null) add(currentId, this.st.boundaryPorts());
    for (const shapes of this.nestCache.values()) for (const shape of shapes) add(shape.childId, shape.ports ?? []);
    return boundaries;
  });
  flowSourceCount = computed(() => this.flowBoundaryPorts().filter(port => port.role === 'supply').length);
  pipeFlowDirection(pipe: PipeGeo): PipeFlowDirection {
    return pipe.flowDirection ?? (pipe.flowReversed ? 'reverse' : 'both');
  }

  /** Flow is a source-driven topology simulation. A direction constraint alone never creates process flow. */
  flowResult = computed<Map<string, { segsStr: string[]; segsPath: { x: number; y: number }[][] }>>(() => {
    if (!this.flowMode() || this.flowTopologyLoading()) return new Map();
    if (!this.flowSourceCount()) return new Map();
    const pipes = this.pipeGeos().filter(pipe => pipe.points.length >= 2);
    return tracePipeFlow(
      pipes,
      this.topologyConnections(),
      this.flowBoundaryPorts(),
      fitting => this.fittingByKey.get(fitting.type)?.cat === 'valve',
      this.equipmentPortNetworks(),
      fitting => this.valveGateDir(fitting),
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
  onPipeConnectorDown(ev: PointerEvent, connector: { pipeId: string; linkId: string }) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    this.flashLink(connector.linkId); // pulse this tag AND its partner(s) sharing the link, so the gap is obvious
    this.selectPipe(connector.pipeId);
  }

  /** Pulse every connector tag that shares this link (its partner across a gap or in another section). */
  private flashLink(linkId: string) {
    this.highlightedLink.set(linkId);
    if (this.highlightTimer) clearTimeout(this.highlightTimer);
    this.highlightTimer = setTimeout(() => this.highlightedLink.set(null), 3000);
  }
  selectPipe(id: string | null) {
    const changed = this.selectedPipeId() !== id;
    this.selectedPipeId.set(id);
    this.clearMultiPipeSelection(); // a single pick replaces any marquee multi-selection
    if (id != null) this.selectedEquipmentPort.set(null);
    if (changed || id == null) this.pipeEdit.set(false);
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
  async setSelectedPipeFlowDirection(direction: PipeFlowDirection) {
    await this.patchSelectedPipeFlow({ flowDirection: direction, flowReversed: undefined });
  }
  private async patchSelectedPipeFlow(patch: Partial<Pick<PipeGeo, 'flowDirection' | 'flowReversed'>>) {
    const id = this.selectedPipeId();
    if (id == null) return;
    const before = this.pipeGeos().find(pipe => pipe.id === id);
    if (!before) return;
    this.pipeGeos.update(list => list.map(pipe => pipe.id === id ? { ...pipe, ...patch } : pipe));
    try {
      await this.persistChangedPipes(new Set([id]));
    } catch (error: any) {
      this.pipeGeos.update(list => list.map(pipe => pipe.id === id ? before : pipe));
      this.st.error.set(error?.message || 'Could not save the pipe flow setup.');
    }
  }

  showFlow() {
    this.cancelPipeConnect();
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.flowMode.set(true);
    void this.preloadFlowInteriors();
  }

  openSelectedPipeSection() {
    const pipe = this.selectedPipe();
    if (pipe) this.navigate(pipe.parentId);
  }

  private pipeGeometryJson(pipe: PipeGeo): string {
    return JSON.stringify({
      points: pipe.points,
      fittings: pipe.fittings ?? [],
      taps: pipe.taps ?? [],
      groupId: pipe.groupId,
      generatedByBoundaryPort: pipe.generatedByBoundaryPort,
      generatedContinuationId: pipe.generatedContinuationId,
      generatedFromPipeNodeId: pipe.generatedFromPipeNodeId,
      legacyEdgeLocalId: pipe.legacyEdgeLocalId,
      flowDirection: this.pipeFlowDirection(pipe),
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

  beginPipeConnect(pipeId: string | null = this.selectedPipeId()) {
    if (!pipeId || !this.visiblePipes().some(pipe => pipe.id === pipeId)) {
      this.st.error.set('Open or zoom into the pipe until it is visible, then connect it on the canvas.');
      return;
    }
    this.flowMode.set(false);
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.pipeEdit.set(false);
    this.selectPipe(pipeId);
    this.pipeConnect.set({ sourcePipeId: pipeId, sourceEnd: null });
    this.pipeConnectHover.set(null);
    this.pipeConnectBodyPreview.set(null);
    this.pipeDraft.set([]);
    this.pipeCursor.set(null);
    this.st.error.set(null);
  }

  beginPipeReconnect(linkId: string, at: PipeEnd) {
    const pipeId = this.selectedPipeId();
    if (!pipeId || !this.visiblePipes().some(pipe => pipe.id === pipeId)) return;
    this.flowMode.set(false);
    this.pipeMode.set(false);
    this.cancelPipe();
    this.fittingType.set(null);
    this.pipeConnect.set({ sourcePipeId: pipeId, sourceEnd: at, reconnectLinkId: linkId });
    this.pipeConnectHover.set(null);
    this.pipeConnectBodyPreview.set(null);
  }

  cancelPipeConnect() {
    this.pipeConnect.set(null);
    this.pipeConnectHover.set(null);
    this.pipeConnectBodyPreview.set(null);
    this.pipeDraft.set([]);
    this.pipeCursor.set(null);
  }

  isPipeConnectSource(pipeId: string): boolean { return this.pipeConnect()?.sourcePipeId === pipeId; }
  isPipeConnectCandidate(pipeId: string): boolean {
    const session = this.pipeConnect();
    return this.pipeConnectSourcePicked(session) && session!.sourcePipeId !== pipeId;
  }
  isPipeConnectHover(pipeId: string): boolean { return this.pipeConnectHover() === pipeId; }
  setPipeConnectHover(pipeId: string | null) {
    const session = this.pipeConnect();
    if (!this.pipeConnectSourcePicked(session) || pipeId === session?.sourcePipeId) return;
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
    // When several ends crowd one spot, the handle the browser delivered is just the top of the SVG stack — not
    // necessarily the one under the cursor. Re-pick the CLOSEST same-role end to the actual click so the pointer
    // reliably hits the end you aimed at (helps most when pipes run close together).
    const target = this.nearestEndpointHandle(this.contentPoint(ev), handle.role) ?? handle;
    if (target.role === 'source-choice') {
      this.pipeConnect.set({ ...session, sourceEnd: target.end });
      this.pipeConnectBodyPreview.set(null);
      return;
    }
    if (target.role === 'target') this.proposePipeConnectTarget(target.pipeId, target.end);
  }

  /** The endpoint handle of the given role nearest to `point` (within a generous, zoom-aware radius). Resolves
   *  overlapping A/B handles by geometry instead of paint order, so a click lands on the intended end. */
  private nearestEndpointHandle(
    point: { x: number; y: number },
    role: PipeConnectionEndpointHandle['role'],
  ): PipeConnectionEndpointHandle | null {
    let best: PipeConnectionEndpointHandle | null = null;
    let bestDistance = (18 / this.zoom()) ** 2;
    for (const h of this.connectionEndpointHandles()) {
      if (h.role !== role) continue;
      const distance = (h.point.x - point.x) ** 2 + (h.point.y - point.y) ** 2;
      if (distance <= bestDistance) { bestDistance = distance; best = h; }
    }
    return best;
  }

  private nearestVisiblePipeEnd(
    pipeId: string,
    point: { x: number; y: number },
    requireHit = true,
  ): PipeEnd | null {
    const pipe = this.visiblePipes().find(item => item.id === pipeId);
    if (!pipe) return null;
    const startDistance = Math.hypot(point.x - pipe.start.x, point.y - pipe.start.y);
    const endDistance = Math.hypot(point.x - pipe.end.x, point.y - pipe.end.y);
    if (requireHit && Math.min(startDistance, endDistance) > 14 / this.zoom()) return null;
    return startDistance <= endDistance ? 'start' : 'end';
  }

  private visiblePipeContact(
    pipe: VisiblePipe,
    point: { x: number; y: number },
  ): { point: { x: number; y: number }; pending: PipeConnectPending; end?: PipeEnd } | null {
    const end = this.nearestVisiblePipeEnd(pipe.id, point);
    if (end) {
      const actual = this.pipeGeos().find(item => item.id === pipe.id);
      const actualPoint = actual
        ? (end === 'start' ? actual.points[0] : actual.points[actual.points.length - 1])
        : (end === 'start' ? pipe.start : pipe.end);
      return {
        point: end === 'start' ? pipe.start : pipe.end,
        pending: {
          targetPipeId: pipe.id,
          targetEnd: end,
          targetPoint: actualPoint ? { ...actualPoint } : undefined,
          targetDisplayPoint: { ...(end === 'start' ? pipe.start : pipe.end) },
        },
        end,
      };
    }
    const actual = this.pipeGeos().find(item => item.id === pipe.id);
    if (!actual || actual.points.length < 2) return null;
    const displayProjection = this.nearestOnPathSegment(pipe.path, point);
    if (!displayProjection) return null;
    const actualStart = actual.points[displayProjection.segment];
    const actualEnd = actual.points[displayProjection.segment + 1];
    if (!actualStart || !actualEnd) return null;
    // nestedItems preserves segment order. Reusing the projection parameter maps the visible click into the
    // coordinate frame in which the child pipe is persisted, without storing parent display coordinates.
    const projected = {
      x: actualStart.x + displayProjection.t * (actualEnd.x - actualStart.x),
      y: actualStart.y + displayProjection.t * (actualEnd.y - actualStart.y),
    };
    const displayLength = Math.hypot(
      pipe.path[displayProjection.segment + 1].x - pipe.path[displayProjection.segment].x,
      pipe.path[displayProjection.segment + 1].y - pipe.path[displayProjection.segment].y,
    );
    const actualLength = Math.hypot(actualEnd.x - actualStart.x, actualEnd.y - actualStart.y);
    const tapTolerance = (10 / this.zoom()) * actualLength / Math.max(0.001, displayLength);
    const tap = (actual.taps ?? []).find(item =>
      Math.hypot(item.at.x - projected.x, item.at.y - projected.y) <= tapTolerance);
    return {
      point: { ...displayProjection.point },
      pending: {
        targetPipeId: pipe.id,
        targetPoint: { ...projected },
        targetDisplayPoint: { ...displayProjection.point },
        targetTapId: tap?.id,
      },
    };
  }

  private nearestOnPathSegment(
    path: { x: number; y: number }[],
    point: { x: number; y: number },
  ): { point: { x: number; y: number }; segment: number; t: number } | null {
    let best: { point: { x: number; y: number }; segment: number; t: number } | null = null;
    let bestDistance = Infinity;
    for (let segment = 0; segment < path.length - 1; segment++) {
      const start = path[segment], end = path[segment + 1];
      const dx = end.x - start.x, dy = end.y - start.y;
      const lengthSquared = dx * dx + dy * dy;
      const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
        ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
      const projected = { x: start.x + t * dx, y: start.y + t * dy };
      const distance = Math.hypot(point.x - projected.x, point.y - projected.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { point: projected, segment, t };
      }
    }
    return best;
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

  private nearestVisiblePipe(point: { x: number; y: number }, excludePipeId?: string): VisiblePipe | null {
    const threshold = this.pipeHitWidth() / 2;
    let nearest: VisiblePipe | null = null;
    let best = threshold;
    for (const pipe of this.visiblePipes()) {
      if (pipe.id === excludePipeId) continue;
      const distance = this.distanceToPath(point, pipe.path);
      if (distance <= best) { best = distance; nearest = pipe; }
    }
    return nearest;
  }

  /** A geometric contact candidate on the current canvas. Endpoints win over body taps. */
  private nearestCurrentPipeContact(
    point: { x: number; y: number },
    excludePipeId?: string,
  ): { target: PipeGeo; point: { x: number; y: number }; end?: PipeEnd; tapId?: string } | null {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    let result: { target: PipeGeo; point: { x: number; y: number }; end?: PipeEnd; tapId?: string } | null = null;
    let best = Infinity;
    for (const target of this.pipeGeos()) {
      if (target.id === excludePipeId || target.parentId !== parent || target.points.length < 2) continue;
      const projected = this.nearestOnPipe(target.points, point);
      if (!projected) continue;
      const distance = Math.hypot(point.x - projected.x, point.y - projected.y);
      const threshold = (target.width ?? 8) / 2 + 8 / this.zoom();
      if (distance > threshold || distance >= best) continue;
      const startDistance = Math.hypot(projected.x - target.points[0].x, projected.y - target.points[0].y);
      const targetEndPoint = target.points[target.points.length - 1];
      const endDistance = Math.hypot(projected.x - targetEndPoint.x, projected.y - targetEndPoint.y);
      const endpointThreshold = (target.width ?? 8) / 2 + 10 / this.zoom();
      const end: PipeEnd | undefined = Math.min(startDistance, endDistance) <= endpointThreshold
        ? (startDistance <= endDistance ? 'start' : 'end') : undefined;
      const snappedPoint = end === 'start' ? target.points[0]
        : end === 'end' ? targetEndPoint : projected;
      const tap = end ? undefined : (target.taps ?? []).find(item =>
        Math.hypot(item.at.x - snappedPoint.x, item.at.y - snappedPoint.y) <= 10 / this.zoom());
      best = distance;
      result = { target, point: { ...snappedPoint }, end, tapId: tap?.id };
    }
    return result;
  }

  /** Assign topology when a free pipe endpoint is visibly touching another route. */
  private async autoConnectPipeEndpointAtContact(pipeId: string, end: PipeEnd): Promise<boolean> {
    const source = this.pipeGeos().find(pipe => pipe.id === pipeId);
    if (!source || this.isPipeEndConnected(source, end)) return false;
    const point = end === 'start' ? source.points[0] : source.points[source.points.length - 1];
    const contact = point ? this.nearestCurrentPipeContact(point, pipeId) : null;
    if (!contact) return false;
    return this.savePipeConnection(
      { sourcePipeId: pipeId, sourceEnd: end },
      contact.end
        ? { targetPipeId: contact.target.id, targetEnd: contact.end, targetPoint: contact.point }
        : { targetPipeId: contact.target.id, targetPoint: contact.point, targetTapId: contact.tapId },
    );
  }

  onVisiblePipeDown(ev: PointerEvent) {
    const point = this.contentPoint(ev);
    const session = this.pipeConnect();
    const source = session && !this.pipeConnectSourcePicked(session)
      ? this.visiblePipes().find(pipe => pipe.id === session.sourcePipeId) ?? null
      : null;
    const pipe = source && this.distanceToPath(point, source.path) <= this.pipeHitWidth() / 2
      ? source
      : this.nearestVisiblePipe(point, this.pipeConnectSourcePicked(session) ? session!.sourcePipeId : undefined);
    if (!pipe) return;
    if (!session) {
      this.onPipeDown(ev, pipe.id);
      return;
    }
    ev.preventDefault(); ev.stopPropagation();
    const contact = this.visiblePipeContact(pipe, point);
    if (!this.pipeConnectSourcePicked(session)) {
      if (pipe.id !== session.sourcePipeId) return;
      if (!contact) {
        this.st.error.set('Open this pipe\'s section before placing a body junction on it.');
        return;
      }
      if (contact.end) this.pipeConnect.set({ ...session, sourceEnd: contact.end });
      else {
        this.pipeConnect.set({
          ...session,
          sourceEnd: null,
          sourcePoint: { ...contact.pending.targetPoint! },
          sourceTapId: contact.pending.targetTapId,
        });
        this.pipeDraft.set([{ ...contact.point }]);
        this.pipeCursor.set({ ...contact.point });
      }
      this.pipeConnectBodyPreview.set(null);
      return;
    }
    if (pipe.id === session.sourcePipeId) return;
    if (!contact) return;
    void this.completePipeConnection(contact.pending);
  }

  onVisiblePipeMove(ev: PointerEvent) {
    const point = this.contentPoint(ev);
    const session = this.pipeConnect();
    const source = session && !this.pipeConnectSourcePicked(session)
      ? this.visiblePipes().find(pipe => pipe.id === session.sourcePipeId) ?? null
      : null;
    const pipe = source && this.distanceToPath(point, source.path) <= this.pipeHitWidth() / 2
      ? source
      : this.nearestVisiblePipe(point, this.pipeConnectSourcePicked(session) ? session!.sourcePipeId : undefined);
    this.pipeBodyHover.set(pipe?.id ?? null);
    this.setPipeConnectHover(pipe?.id ?? null);
    this.pipeConnectBodyPreview.set(null);
    if (!pipe || !session) return;
    const choosingSource = !this.pipeConnectSourcePicked(session) && pipe.id === session.sourcePipeId;
    const choosingTarget = this.pipeConnectSourcePicked(session) && pipe.id !== session.sourcePipeId;
    if (!choosingSource && !choosingTarget) return;
    const contact = this.visiblePipeContact(pipe, point);
    if (!contact || contact.end) return;
    this.pipeConnectBodyPreview.set({
      pipeId: pipe.id,
      point: contact.point,
      pending: contact.pending,
      role: choosingSource ? 'source-choice' : 'target',
      name: pipe.name,
    });
  }

  clearVisiblePipeHover() {
    this.pipeBodyHover.set(null);
    this.setPipeConnectHover(null);
    this.pipeConnectBodyPreview.set(null);
  }

  isPipeBodyHover(pipeId: string): boolean { return this.pipeBodyHover() === pipeId; }

  private proposePipeConnectTarget(pipeId: string, end: PipeEnd) {
    const session = this.pipeConnect();
    if (!this.pipeConnectSourcePicked(session) || pipeId === session!.sourcePipeId) return;
    this.pipeConnectHover.set(pipeId);
    void this.completePipeConnection({ targetPipeId: pipeId, targetEnd: end });
  }

  private newPipeTapId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private newStableId(prefix: string): string {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}-${id}`;
  }

  private async completePipeConnection(pending: PipeConnectPending) {
    const session = this.pipeConnect();
    if (!this.pipeConnectSourcePicked(session) || !pending || this.connectionBusy()) return;
    const target = this.pipeGeos().find(pipe => pipe.id === pending.targetPipeId);
    const source = this.pipeGeos().find(pipe => pipe.id === session!.sourcePipeId);
    if (!source || !target || source.id === target.id) return;
    const resolvedPending: PipeConnectPending = pending.targetEnd && !pending.targetPoint
      ? {
          ...pending,
          targetPoint: {
            ...(pending.targetEnd === 'start' ? target.points[0] : target.points[target.points.length - 1]),
          },
        }
      : pending;
    // Pipes in different sections (you picked a source end in a child, then drilled up to the parent) link across
    // the boundary — a logical cross-section connection, never a drawn branch. Both ends then carry a jump connector.
    const crossSection = target.parentId !== source.parentId;
    const bodyToBody = !crossSection && session!.sourceEnd == null && !!session!.sourcePoint
      && resolvedPending.targetEnd == null && !!resolvedPending.targetPoint;
    const separatedBodies = bodyToBody
      && Math.hypot(
        session!.sourcePoint!.x - resolvedPending.targetPoint!.x,
        session!.sourcePoint!.y - resolvedPending.targetPoint!.y,
      ) > 3 / Math.max(0.2, this.zoom());
    const targetEndAlreadyConnected = !crossSection && session!.sourceEnd == null && !!session!.sourcePoint
      && resolvedPending.targetEnd != null
      && this.isPipeEndConnected(target, resolvedPending.targetEnd)
      && !!resolvedPending.targetPoint
      && Math.hypot(
        session!.sourcePoint!.x - resolvedPending.targetPoint.x,
        session!.sourcePoint!.y - resolvedPending.targetPoint.y,
      ) > 3 / Math.max(0.2, this.zoom());
    const saved = separatedBodies || targetEndAlreadyConnected
      ? await this.createConnectingBranch(session!, resolvedPending)
      : await this.savePipeConnection(session!, resolvedPending, /* moveEndpoints */ false);
    if (saved) this.cancelPipeConnect();
  }

  /**
   * Normalize a newly drawn route into section-owned pieces. The user's polyline is authoritative: this only
   * clips it at direct-child boundaries, converts the inside coordinates, and repeats inside that child.
   */
  private async partitionDrawnPipe(pipeId: string, retainEnd: PipeEnd = 'start'): Promise<PartitionedPipeRoute> {
    const source = this.pipeGeos().find(pipe => pipe.id === pipeId);
    if (!source?.nodeId) throw new Error('The pipe must be saved before its section boundaries can be resolved.');
    const context: BoundaryPartitionContext = {
      continuationId: this.newStableId('continuation'),
      originNodeId: source.nodeId,
      created: [], createdNodeIds: new Set(), originals: new Map(), frames: new Map(),
    };
    try {
      // createOffCanvasPipePlacement uses a complete placement set, so make the original visible to it first.
      this.savePipes();
      await this.st.flushSave();
      const frames = await this.directBoundaryFrames(source.parentId);
      const route = await this.partitionPipeInSection(source, frames, context, 0, retainEnd);
      await this.refreshTopology();
      return route;
    } catch (error) {
      await this.rollbackBoundaryPartition(context);
      throw error;
    }
  }

  private async partitionPipeInSection(
    source: PipeGeo,
    frames: NestBoundaryFrame[],
    context: BoundaryPartitionContext,
    depth: number,
    retainEnd: PipeEnd = 'start',
  ): Promise<PartitionedPipeRoute> {
    if (depth >= this.NEST_MAX_DEPTH || source.points.length < 2 || !frames.length) {
      return { first: source, last: source, all: [source] };
    }
    const frameByKey = new Map(frames.map(frame => [this.boundaryFrameKey(frame), frame]));
    const pieces = partitionPolylineByBoundaries(source.points, frames.map(frame => ({
      id: this.boundaryFrameKey(frame), x: frame.rect.x, y: frame.rect.y,
      w: frame.rect.w, h: frame.rect.h, shape: frame.shape,
    })));
    if (pieces.length < 2 || !pieces.some(piece => piece.boundaryId == null)) {
      return { first: source, last: source, all: [source] };
    }
    let retainedIndex = pieces.findIndex(piece => piece.boundaryId == null);
    if (retainEnd === 'end') {
      for (let index = pieces.length - 1; index >= 0; index--) {
        if (pieces[index].boundaryId == null) { retainedIndex = index; break; }
      }
    }
    const groupId = source.groupId || this.newStableId('run');
    const transitions: { frame: NestBoundaryFrame; point: { x: number; y: number }; port: EquipmentPort }[] = [];
    const workingPorts = new Map<string, EquipmentPort[]>();
    for (let index = 0; index < pieces.length - 1; index++) {
      const leftFrame = pieces[index].boundaryId ? frameByKey.get(pieces[index].boundaryId!) : null;
      const rightFrame = pieces[index + 1].boundaryId ? frameByKey.get(pieces[index + 1].boundaryId!) : null;
      const frame = leftFrame ?? rightFrame;
      if (!frame || (leftFrame && rightFrame && leftFrame !== rightFrame)) {
        throw new Error('Overlapping child containers cannot share an automatic pipe boundary. Move one footprint or draw around the overlap.');
      }
      const point = pieces[index].points[pieces[index].points.length - 1];
      const key = this.boundaryFrameKey(frame);
      const ports = workingPorts.get(key) ?? [...(frame.ports ?? [])];
      const port: EquipmentPort = {
        id: this.newStableId('transit'), label: `Transit ${ports.length + 1}`,
        circuit: groupId, role: 'bidirectional', flowBoundary: 'none',
        ...this.projectEquipmentPort(this.frameAsBox(frame), point),
      };
      ports.push(port);
      workingPorts.set(key, ports);
      transitions.push({ frame, point: { ...point }, port });
    }
    for (const [key, ports] of workingPorts) {
      const frame = frameByKey.get(key)!;
      if (!context.frames.has(key)) {
        context.frames.set(key, { frame, ports: (frame.ports ?? []).map(port => ({ ...port })) });
      }
      await this.setBoundaryFramePorts(frame, ports);
    }

    if (!context.originals.has(source.id)) context.originals.set(source.id, this.clonePipeGeo(source));
    const basePipes: PipeGeo[] = [];
    for (let index = 0; index < pieces.length; index++) {
      const piece = pieces[index];
      const frame = piece.boundaryId ? frameByKey.get(piece.boundaryId)! : null;
      const points = frame
        ? piece.points.map(point => this.rootPointToFrameLocal(frame, point))
        : piece.points.map(point => ({ ...point }));
      if (index === retainedIndex) {
        const retained = { ...source, points, groupId };
        basePipes.push(retained);
        this.pipeGeos.update(list => list.map(pipe => pipe.id === source.id ? retained : pipe));
        continue;
      }
      const adjacent = transitions[index - 1] ?? transitions[index];
      const node = await firstValueFrom(this.nodesApi.createNode({
        name: source.name || 'Pipe', type: 'EQUIPMENT', parentId: frame?.objectId ?? source.parentId,
      }));
      if (!node) throw new Error('Could not create an automatic pipe section.');
      context.createdNodeIds.add(node.id);
      const generated: PipeGeo = {
        id: `pipe-${node.id}`, nodeId: node.id, parentId: frame?.objectId ?? source.parentId,
        name: source.name || 'Pipe', color: source.color, width: source.width,
        groupId, generatedContinuationId: context.continuationId,
        generatedFromPipeNodeId: context.originNodeId,
        generatedByBoundaryPort: { objectId: adjacent.frame.objectId, portId: adjacent.port.id },
        flowDirection: this.pipeFlowDirection(source), points, fittings: [], taps: [],
      };
      const placed = await this.createOffCanvasPipePlacement(generated);
      context.created.push(placed);
      basePipes.push(placed);
      this.pipeGeos.update(list => [...list, placed]);
    }
    await this.persistChangedPipes(new Set(basePipes.map(pipe => pipe.id)));
    await this.st.flushSave();

    const expanded: PartitionedPipeRoute[] = [];
    for (let index = 0; index < basePipes.length; index++) {
      const frame = pieces[index].boundaryId ? frameByKey.get(pieces[index].boundaryId!) : null;
      if (!frame) {
        expanded.push({ first: basePipes[index], last: basePipes[index], all: [basePipes[index]] });
        continue;
      }
      const nestedFrames = await this.directBoundaryFrames(frame.objectId);
      expanded.push(await this.partitionPipeInSection(basePipes[index], nestedFrames, context, depth + 1));
    }
    for (let index = 0; index < transitions.length; index++) {
      const left = expanded[index].last;
      const right = expanded[index + 1].first;
      const equipmentPort = { objectId: transitions[index].frame.objectId, portId: transitions[index].port.id };
      for (const terminal of [this.topologyTerminal(left, 'end'), this.topologyTerminal(right, 'start')]) {
        if (!terminal) throw new Error('An automatic boundary pipe has no persisted terminal.');
        const result = await firstValueFrom(this.topologyApi.attach({ terminal, equipmentPort }));
        if (result?.responseData) this.applyTopologyConnection(result.responseData);
      }
    }
    const all = expanded.flatMap(route => route.all);
    return { first: expanded[0].first, last: expanded[expanded.length - 1].last, all };
  }

  private async directBoundaryFrames(sectionId: number): Promise<NestBoundaryFrame[]> {
    const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (sectionId === currentParent) {
      return this.st.boxes().map(box => ({
        objectId: box.childId, parentId: sectionId,
        rect: { x: box.x, y: box.y, w: box.width, h: box.height },
        shape: box.shape, ports: box.ports ?? [], localId: box.localId,
      }));
    }
    const parentDid = this.st.currentDiagramId();
    if (!this.nestFetched.has(sectionId)) {
      const node = this.nodeById().get(sectionId);
      await this.fetchNest(sectionId, node?.diagramId ?? null, parentDid);
    }
    return (this.nestCache.get(sectionId) ?? []).map(shape => ({
      objectId: shape.childId, parentId: sectionId,
      rect: { x: shape.x, y: shape.y, w: shape.w, h: shape.h },
      shape: shape.shape, ports: shape.ports ?? [], localId: shape.localId, placementId: shape.placementId,
    }));
  }

  private boundaryFrameKey(frame: NestBoundaryFrame): string {
    return frame.placementId != null ? `placement:${frame.placementId}` : `${frame.parentId}:${frame.objectId}:${frame.localId ?? ''}`;
  }

  private clonePipeGeo(pipe: PipeGeo): PipeGeo {
    return {
      ...pipe, points: pipe.points.map(point => ({ ...point })),
      fittings: (pipe.fittings ?? []).map(fitting => ({ ...fitting, at: { ...fitting.at } })),
      taps: (pipe.taps ?? []).map(tap => ({ ...tap, at: { ...tap.at } })),
    };
  }

  private async rollbackBoundaryPartition(context: BoundaryPartitionContext) {
    const firstPlaced = context.created.find(pipe => pipe.nodeId != null);
    if (firstPlaced?.nodeId != null) {
      try { await firstValueFrom(this.topologyApi.deletePipe(firstPlaced.nodeId)); } catch { /* continue local rollback */ }
    }
    const placedIds = new Set(context.created.map(pipe => pipe.nodeId));
    for (const nodeId of [...context.createdNodeIds].filter(id => !placedIds.has(id)).reverse()) {
      try { await firstValueFrom(this.nodesApi.deleteNode(nodeId)); } catch { /* best effort */ }
    }
    const createdIds = new Set(context.created.map(pipe => pipe.id));
    this.pipeGeos.update(list => list.filter(pipe => !createdIds.has(pipe.id)).map(pipe => context.originals.get(pipe.id) ?? pipe));
    for (const { frame, ports } of [...context.frames.values()].reverse()) {
      try { await this.setBoundaryFramePorts(frame, ports); } catch { /* best effort */ }
    }
    try { await this.persistChangedPipes(new Set(context.originals.keys())); } catch { /* best effort */ }
    try { await this.st.flushSave(); } catch { /* best effort */ }
    try { await this.refreshTopology(); } catch { /* keep original failure */ }
  }

  private frameAsBox(frame: NestBoundaryFrame): MapBox {
    return {
      localId: frame.localId ?? -1, childId: frame.objectId,
      x: frame.rect.x, y: frame.rect.y, width: frame.rect.w, height: frame.rect.h,
      shape: frame.shape, glyph: 'none', color: '', showChildren: true, ports: frame.ports,
    };
  }

  private rootPointToFrameLocal(frame: NestBoundaryFrame, point: { x: number; y: number }) {
    const boundary = this.childBoundaryFor(frame.rect);
    return {
      x: boundary.x + (point.x - frame.rect.x) / Math.max(0.001, frame.rect.w) * boundary.w,
      y: boundary.y + (point.y - frame.rect.y) / Math.max(0.001, frame.rect.h) * boundary.h,
    };
  }

  private async setBoundaryFramePorts(frame: NestBoundaryFrame, ports: EquipmentPort[]) {
    const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (frame.parentId === currentParent && frame.localId != null) {
      this.st.patchBoxPorts(frame.localId, ports);
      frame.ports = ports;
      return;
    }
    if (frame.placementId == null) throw new Error(`Could not locate ${this.nameOf(frame.objectId)} on its parent map.`);
    await firstValueFrom(this.placementApi.update(frame.placementId, {
      svgPath: JSON.stringify({ equipmentPorts: ports }),
    }));
    frame.ports = ports;
    for (const [containerId, shapes] of this.nestCache) {
      this.nestCache.set(containerId, shapes.map(shape => shape.placementId === frame.placementId
        ? { ...shape, ports } : shape));
    }
    this.nestVersion.update(value => value + 1);
  }

  /** Add one pipe placement to an off-screen child diagram without replacing its existing complete placement set. */
  private async createOffCanvasPipePlacement(pipe: PipeGeo): Promise<PipeGeo> {
    const diagram = await firstValueFrom(this.nodesApi.getOrCreateDiagram(pipe.parentId));
    if (diagram?.id == null || pipe.nodeId == null) throw new Error('The child section has no diagram.');
    const existing = (await firstValueFrom(this.placementApi.getByDiagram(diagram.id)))?.responseData ?? [];
    const localId = Math.max(0, ...existing.map(item => item.localId ?? 0)) + 1;
    const xs = pipe.points.map(point => point.x), ys = pipe.points.map(point => point.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const dto: DiagramPlacementDto = {
      diagramId: diagram.id,
      localId,
      sourceEntityType: PIPE_SRC,
      sourceEntityId: pipe.nodeId,
      type: 'run',
      name: pipe.name || 'Pipe',
      label: pipe.name || 'Pipe',
      color: pipe.color,
      lineWidth: pipe.width,
      groupId: pipe.groupId,
      x: minX,
      y: minY,
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY,
      svgPath: this.pipeGeometryJson(pipe),
    };
    const saved = (await firstValueFrom(this.placementApi.bulkSave(diagram.id, [...existing, dto])))?.responseData ?? [];
    const placement = saved.find(item => item.sourceEntityType === PIPE_SRC && item.sourceEntityId === pipe.nodeId);
    if (placement?.id == null) throw new Error('Could not place the continuation on the child diagram.');
    return { ...pipe, localId, placementId: placement.id };
  }

  /** Body points that do not already meet need visible geometry between them. The draft begins at the chosen
   * source body and accepts optional elbow clicks; selecting the target creates and connects this real branch. */
  private async createConnectingBranch(
    session: PipeConnectSession,
    pending: PipeConnectPending,
  ): Promise<boolean> {
    const source = this.pipeGeos().find(pipe => pipe.id === session.sourcePipeId);
    const target = this.pipeGeos().find(pipe => pipe.id === pending.targetPipeId);
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (!source || !target || !session.sourcePoint || !pending.targetPoint
      || source.parentId !== target.parentId || source.parentId !== parent) {
      this.st.error.set('Open the owning section before drawing a branch between pipe bodies.');
      return false;
    }
    const targetPoint = { ...pending.targetPoint };
    const points = (this.pipeDraft().length ? this.pipeDraft() : [session.sourcePoint]).map(point => ({ ...point }));
    const last = points[points.length - 1];
    if (this.pipeSnap() && last.x !== targetPoint.x && last.y !== targetPoint.y) {
      const elbow = Math.abs(targetPoint.x - last.x) >= Math.abs(targetPoint.y - last.y)
        ? { x: targetPoint.x, y: last.y }
        : { x: last.x, y: targetPoint.y };
      points.push(elbow);
    }
    points.push(targetPoint);
    const route = points.filter((point, index) => index === 0
      || Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) > 0.01);
    if (route.length < 2) return false;

    let nodeId: number | null = null;
    let branchId: string | null = null;
    let partitioned: PartitionedPipeRoute | null = null;
    try {
      const node = await firstValueFrom(this.nodesApi.createNode({ name: 'Branch pipe', type: 'EQUIPMENT', parentId: parent }));
      if (!node) throw new Error('Could not create the connecting branch.');
      nodeId = node.id;
      branchId = `pipe-${node.id}`;
      const branch: PipeGeo = {
        id: branchId,
        nodeId: node.id,
        parentId: parent,
        name: 'Branch pipe',
        color: source.color,
        width: source.width,
        flowDirection: 'both',
        points: route,
        fittings: [],
        taps: [],
      };
      this.pipeGeos.update(list => [...list, branch]);
      this.savePipes();
      partitioned = await this.partitionDrawnPipe(branch.id);
      const sourceSaved = await this.savePipeConnection(
        { sourcePipeId: partitioned.first.id, sourceEnd: 'start' },
        { targetPipeId: source.id, targetPoint: session.sourcePoint, targetTapId: session.sourceTapId },
      );
      if (!sourceSaved) throw new Error('Could not connect the start of the branch.');
      const targetSaved = await this.savePipeConnection(
        { sourcePipeId: partitioned.last.id, sourceEnd: 'end' },
        pending,
      );
      if (!targetSaved) throw new Error('Could not connect the end of the branch.');
      this.selectPipe(branch.id);
      return true;
    } catch (error: any) {
      const related = nodeId == null ? [] : this.dependentGeneratedPipes(nodeId);
      if (branchId) {
        const continuationOwners = new Map<string, EquipmentPortRef>();
        for (const dependent of related) {
          const owner = dependent.generatedByBoundaryPort;
          if (owner) continuationOwners.set(dependent.generatedContinuationId || dependent.groupId || dependent.id, owner);
        }
        for (const owner of continuationOwners.values()) {
          this.removeGeneratedContinuationFromLocalState(owner.objectId, owner.portId);
        }
        this.pipeGeos.update(list => list.filter(pipe => pipe.id !== branchId));
        this.savePipes();
      }
      if (nodeId != null) {
        try { await firstValueFrom(this.topologyApi.deletePipe(nodeId)); }
        catch { try { await firstValueFrom(this.nodesApi.deleteNode(nodeId)); } catch { /* best effort rollback */ } }
        this.st.forgetChildNode(nodeId);
      }
      try { await this.refreshTopology(); } catch { /* original error remains useful */ }
      this.st.error.set(error?.error?.message || error?.message || 'Could not create the connecting branch.');
      return false;
    }
  }

  private async savePipeConnection(
    session: PipeConnectSession,
    pending: PipeConnectPending,
    // false ⇒ create the topology link but NEVER reposition geometry (explicit Connect — pipes stay where they are
    // and read as a linked pair via connectors). true ⇒ snap the end to its contact (auto-connect of touching ends).
    moveEndpoints = true,
  ): Promise<boolean> {
    const selected = this.pipeGeos().find(pipe => pipe.id === session.sourcePipeId);
    const target = this.pipeGeos().find(pipe => pipe.id === pending.targetPipeId);
    if (!selected || !target || selected.id === target.id || !this.pipeConnectSourcePicked(session)) return false;
    const createdSourceTap: PipeTap | null = session.sourceEnd == null && !session.sourceTapId && session.sourcePoint
      ? { id: this.newPipeTapId(), at: { ...session.sourcePoint } }
      : null;
    const sourceTapId = session.sourceTapId ?? createdSourceTap?.id;
    const terminal = session.sourceEnd != null
      ? this.topologyTerminal(selected, session.sourceEnd)
      : sourceTapId ? this.topologyTapTerminal(selected, sourceTapId) : null;
    const createdTap: PipeTap | null = !pending.targetEnd && !pending.targetTapId && pending.targetPoint
      ? { id: this.newPipeTapId(), at: { ...pending.targetPoint } }
      : null;
    const tapId = pending.targetTapId ?? createdTap?.id;
    const targetTerminal = pending.targetEnd
      ? this.topologyTerminal(target, pending.targetEnd)
      : tapId ? this.topologyTapTerminal(target, tapId) : null;
    if (!terminal || !targetTerminal) return false;
    this.connectionBusy.set(true);
    this.st.error.set(null);
    try {
      if (createdSourceTap || createdTap) {
        this.pipeGeos.update(list => list.map(pipe => {
          if (createdSourceTap && pipe.id === selected.id) return { ...pipe, taps: [...(pipe.taps ?? []), createdSourceTap] };
          if (createdTap && pipe.id === target.id) return { ...pipe, taps: [...(pipe.taps ?? []), createdTap] };
          return pipe;
        }));
        await this.persistChangedPipes(new Set([
          ...(createdSourceTap ? [selected.id] : []),
          ...(createdTap ? [target.id] : []),
        ]));
      }
      // Selecting an established body tap means "add another branch here", not "move this tap away from its
      // existing junction". Orient the request toward that junction so the new target joins every participant.
      const preserveSourceBodyJunction = session.sourceEnd == null && !!session.sourceTapId
        && this.connectionForTerminal(terminal) != null;
      const sourceConnection = this.connectionForTerminal(terminal);
      const targetConnection = this.connectionForTerminal(targetTerminal);
      const mergeJunctions = preserveSourceBodyJunction && !!sourceConnection && !!targetConnection
        && sourceConnection.connectionKey !== targetConnection.connectionKey;
      const result = await firstValueFrom(this.topologyApi.attach(preserveSourceBodyJunction
        ? { terminal: targetTerminal, targetTerminal: terminal, mergeJunctions }
        : { terminal, targetTerminal }));
      if (result?.responseData) this.applyTopologyConnection(result.responseData);
      // Same-section endpoints share coordinates. For a current-canvas endpoint attached to a nested body, the
      // tap remains child-local while the endpoint moves to the contact visible in the parent canvas.
      const targetPoint = pending.targetPoint
        ?? (pending.targetEnd === 'start' ? target.points[0] : target.points[target.points.length - 1]);
      const sourcePoint = session.sourceEnd != null
        ? (session.sourceEnd === 'start' ? selected.points[0] : selected.points[selected.points.length - 1])
        : session.sourcePoint ?? null;
      // Only snap the two ends together when they're ALREADY near each other. Far-apart ends stay exactly where
      // they are and read as a linked pair via the amber gap connectors — connecting must never yank one pipe
      // across the canvas to touch the other.
      const gap = sourcePoint && targetPoint
        ? Math.hypot(sourcePoint.x - targetPoint.x, sourcePoint.y - targetPoint.y) : Infinity;
      if (moveEndpoints && selected.parentId === target.parentId && (session.sourceEnd != null || pending.targetEnd != null) && gap <= 26) {
        this.pipeGeos.update(list => list.map(pipe => {
          const moveSourceEnd = session.sourceEnd != null && pipe.id === selected.id;
          const moveTargetEnd = session.sourceEnd == null && pending.targetEnd != null && pipe.id === target.id;
          if ((!moveSourceEnd && !moveTargetEnd) || pipe.points.length < 2) return pipe;
          const points = [...pipe.points];
          if (moveSourceEnd) {
            if (session.sourceEnd === 'start') points[0] = { ...targetPoint };
            else points[points.length - 1] = { ...targetPoint };
          } else if (session.sourcePoint) {
            if (pending.targetEnd === 'start') points[0] = { ...session.sourcePoint };
            else points[points.length - 1] = { ...session.sourcePoint };
          }
          return { ...pipe, points };
        }));
        await this.persistChangedPipes(new Set([session.sourceEnd != null ? selected.id : target.id]));
      } else if (selected.parentId === target.parentId && (session.sourceEnd != null || pending.targetEnd != null)) {
        // gapped same-section connect: geometry untouched — the link stands and gap connectors mark both ends
      } else if (moveEndpoints && session.sourceEnd != null && pending.targetDisplayPoint) {
        const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
        if (selected.parentId === currentParent) {
          this.pipeGeos.update(list => list.map(pipe => {
            if (pipe.id !== selected.id || pipe.points.length < 2) return pipe;
            const points = [...pipe.points];
            if (session.sourceEnd === 'start') points[0] = { ...pending.targetDisplayPoint! };
            else points[points.length - 1] = { ...pending.targetDisplayPoint! };
            return { ...pipe, points };
          }));
          await this.persistChangedPipes(new Set([selected.id]));
        }
      }
      return true;
    } catch (error: any) {
      if (createdSourceTap || createdTap) {
        this.pipeGeos.update(list => list.map(pipe => {
          if (createdSourceTap && pipe.id === selected.id) {
            return { ...pipe, taps: (pipe.taps ?? []).filter(tap => tap.id !== createdSourceTap.id) };
          }
          if (createdTap && pipe.id === target.id) {
            return { ...pipe, taps: (pipe.taps ?? []).filter(tap => tap.id !== createdTap.id) };
          }
          return pipe;
        }));
        void this.persistChangedPipes(new Set([
          ...(createdSourceTap ? [selected.id] : []),
          ...(createdTap ? [target.id] : []),
        ]));
      }
      this.st.error.set(error?.error?.message || error?.message || 'Could not save the pipe connection.');
      return false;
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
    if (pipe.nodeId == null) return;
    // One backend transaction owns topology, placement, fitting children and the pipe entity. This prevents the
    // old failure mode where the entity disappeared first and a failed detach left JSON topology orphans.
    try {
      await firstValueFrom(this.topologyApi.deletePipe(pipe.nodeId));
    } catch { this.st.error.set('Could not delete the pipe — retry.'); return; }
    try { await this.refreshTopology(); } catch { /* pipe deletion itself still succeeded */ }
    const dependents = pipe.nodeId == null ? [] : this.dependentGeneratedPipes(pipe.nodeId);
    const generated = pipe.generatedByBoundaryPort
      ? this.generatedContinuationPipes(pipe)
      : [pipe, ...dependents];
    if (pipe.generatedByBoundaryPort) {
      this.removeGeneratedContinuationFromLocalState(
        pipe.generatedByBoundaryPort.objectId, pipe.generatedByBoundaryPort.portId);
    } else {
      const continuationOwners = new Map<string, EquipmentPortRef>();
      for (const dependent of dependents) {
        const owner = dependent.generatedByBoundaryPort;
        if (owner) continuationOwners.set(dependent.generatedContinuationId || dependent.groupId || dependent.id, owner);
      }
      for (const owner of continuationOwners.values()) {
        this.removeGeneratedContinuationFromLocalState(owner.objectId, owner.portId);
      }
      this.pipeGeos.update(list => list.filter(item => item.id !== id));
    }
    this.savePipes(); // persist the current canvas without the deleted segment; the backend removed off-screen siblings.
    for (const removed of generated) if (removed.nodeId != null) this.st.forgetChildNode(removed.nodeId);
    if (generated.some(removed => removed.id === this.selectedPipeId())) this.selectedPipeId.set(null);
  }

  // ── edit a pipe's route: drag vertices, add a bend at a segment midpoint, double-click a vertex to remove it ──
  pipeEdit = signal(false);
  togglePipeEdit() {
    this.cancelPipeConnect();
    this.flowMode.set(false);
    this.pipeMode.set(false);
    this.cancelPipe();
    this.pipeEdit.update(value => !value);
  }

  /** Route bends remain draggable; either endpoint starts a normal multi-click extension of this same route.
   *  `segs` are the straight sections between bends — drag one to move the whole section (its elbows follow). */
  pipeEditHandles = computed(() => {
    const empty = {
      verts: [] as { x: number; y: number; i: number; endpoint: boolean }[],
      mids: [] as { x: number; y: number; i: number }[],
      segs: [] as { i: number; x1: number; y1: number; x2: number; y2: number }[],
    };
    if (!this.pipeEdit() || !this.selectedPipeOnCanvas()) return empty;
    const p = this.selectedPipe(); if (!p) return empty;
    const verts = p.points.map((pt, i) => ({ x: pt.x, y: pt.y, i, endpoint: i === 0 || i === p.points.length - 1 }));
    const mids: { x: number; y: number; i: number }[] = [];
    const segs: { i: number; x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < p.points.length - 1; i++) {
      mids.push({ x: (p.points[i].x + p.points[i + 1].x) / 2, y: (p.points[i].y + p.points[i + 1].y) / 2, i });
      segs.push({ i, x1: p.points[i].x, y1: p.points[i].y, x2: p.points[i + 1].x, y2: p.points[i + 1].y });
    }
    return { verts, mids, segs };
  });

  /** Grab a whole straight section: translate its two bends together (adjacent sections stretch/lean to follow).
   *  A connected terminal end stays pinned, so the section pivots about it rather than tearing the connection. */
  onPipeSegDown(ev: PointerEvent, segIndex: number) {
    if (this.startMiddlePan(ev)) return;
    if (ev.button !== 0) return; // left-drag moves the section; right-click is handled as "delete section"
    ev.preventDefault(); ev.stopPropagation();
    const p = this.selectedPipe(); if (!p) return;
    const lastIndex = p.points.length - 1;
    this.drag = {
      kind: 'pipeSeg', pipeId: p.id, index: segIndex,
      startClientX: ev.clientX, startClientY: ev.clientY,
      basePoints: p.points.map(pt => ({ ...pt })),
      pinStart: segIndex === 0 && this.isPipeEndConnected(p, 'start'),
      pinEnd: segIndex + 1 === lastIndex && this.isPipeEndConnected(p, 'end'),
    };
  }

  /** Right-click a straight section to remove it: an end section is trimmed away; a middle section collapses so its
   *  two neighbors meet. Won't trim a connected A/B end (disconnect it first) or reduce a pipe below one segment. */
  onPipeSegContext(ev: MouseEvent, segIndex: number) {
    ev.preventDefault(); ev.stopPropagation();
    const p = this.selectedPipe();
    if (!p || p.points.length <= 2) return;
    const lastSeg = p.points.length - 2;
    if (segIndex === 0 && this.isPipeEndConnected(p, 'start')) { this.st.error.set('Disconnect end A before deleting its section.'); return; }
    if (segIndex === lastSeg && this.isPipeEndConnected(p, 'end')) { this.st.error.set('Disconnect end B before deleting its section.'); return; }
    this.pipeGeos.update(list => list.map(pp => {
      if (pp.id !== p.id) return pp;
      const points = [...pp.points];
      if (segIndex === 0) points.splice(0, 1);                       // trim the A-end section
      else if (segIndex === lastSeg) points.splice(points.length - 1, 1); // trim the B-end section
      else points.splice(segIndex, 2, {                             // middle: collapse to the section's midpoint
        x: (points[segIndex].x + points[segIndex + 1].x) / 2,
        y: (points[segIndex].y + points[segIndex + 1].y) / 2,
      });
      const taps = (pp.taps ?? []).map(tap => ({ ...tap, at: this.nearestOnPipe(points, tap.at) ?? tap.at }));
      return { ...pp, points, taps };
    }));
    void this.persistChangedPipes(this.syncMovedPipeBranches(p.id));
  }

  private movePipeSegment(drag: Extract<Drag, { kind: 'pipeSeg' }>, dxContent: number, dyContent: number) {
    const a = drag.index, b = drag.index + 1;
    this.pipeGeos.update(list => list.map(item => {
      if (item.id !== drag.pipeId) return item;
      const points = drag.basePoints.map((pt, i) => {
        if (i !== a && i !== b) return { ...pt };
        if ((i === a && drag.pinStart) || (i === b && drag.pinEnd)) return { ...pt };
        return this.clampPointToBoundary(this.snapPt({ x: pt.x + dxContent, y: pt.y + dyContent }));
      });
      const taps = (item.taps ?? []).map(tap => ({ ...tap, at: this.nearestOnPipe(points, tap.at) ?? tap.at }));
      return { ...item, points, taps };
    }));
  }

  onPipeVtxDown(ev: PointerEvent, index: number) {
    if (this.startMiddlePan(ev)) return;
    if (ev.button !== 0) return;
    ev.preventDefault(); ev.stopPropagation();
    const p = this.selectedPipe(); if (!p) return;
    // Dragging ANY vertex — bends AND the A/B ends — MOVES it (extend / shrink / lean the adjacent section). A
    // connected end can't be dragged freely (it would tear the link); disconnect it first, or use Extend to draw on.
    const end: PipeEnd | null = index === 0 ? 'start' : index === p.points.length - 1 ? 'end' : null;
    if (end && this.isPipeEndConnected(p, end)) {
      this.st.error.set(`End ${this.topologyEnd(end)} is connected — disconnect it before moving it.`);
      return;
    }
    this.drag = { kind: 'pipeVtx', pipeId: p.id, index };
  }

  /** Double-click an A/B end to keep DRAWING from it (add sections). Interior bends double-click to delete. */
  onPipeVtxDblClick(index: number, ev?: Event) {
    const p = this.selectedPipe(); if (!p) return;
    if (index === 0 || index === p.points.length - 1) {
      ev?.stopPropagation();
      this.beginPipeExtension(p, index === 0 ? 'start' : 'end');
    } else {
      this.removePipeVtx(index, ev);
    }
  }
  /** Continue drawing from an end (the pipe inspector's Extend A / Extend B buttons — "add section"). */
  extendSelectedPipeEnd(end: PipeEnd) {
    const p = this.selectedPipe();
    if (p) { this.pipeEdit.set(true); this.beginPipeExtension(p, end); }
  }

  private beginPipeExtension(pipe: PipeGeo, end: PipeEnd) {
    if (this.isPipeEndConnected(pipe, end)) {
      this.st.error.set(`Disconnect pipe end ${this.topologyEnd(end)} before extending it.`);
      return;
    }
    const endpoint = end === 'start' ? pipe.points[0] : pipe.points[pipe.points.length - 1];
    if (!endpoint) return;
    this.cancelPipeConnect();
    this.flowMode.set(false);
    this.fittingType.set(null);
    this.pipeExtension.set({ pipeId: pipe.id, end });
    this.pipeDraft.set([{ ...endpoint }]);
    this.pipeCursor.set(null);
    this.pipeDraftEndA = null;
    this.pipeDraftEndB = null;
    this.pipeDraftStartAttachment = undefined;
    this.pipeDraftEndAttachment = undefined;
    this.pipeMode.set(true);
    this.st.error.set(null);
  }
  private movePipeVtx(pipeId: string, index: number, pt: { x: number; y: number }) {
    const pipe = this.pipeGeos().find(item => item.id === pipeId);
    if (!pipe) return;
    const endpoint = index === 0 || index === pipe.points.length - 1;
    const nearby = endpoint ? this.nearestEquipmentPort(pt) : null;
    const q0 = nearby ? { x: nearby.x, y: nearby.y } : this.clampPointToBoundary(this.snapPt(pt));
    this.pipeGeos.update(list => list.map(item => {
      if (item.id !== pipeId) return item;
      const points = item.points.map((point, pointIndex) => pointIndex === index ? q0 : point);
      const taps = (item.taps ?? []).map(tap => ({
        ...tap, at: this.nearestOnPipe(points, tap.at) ?? tap.at,
      }));
      return { ...item, points, taps };
    }));
  }
  /** Double-click a vertex to remove that bend (keeps at least a two-point segment). */
  removePipeVtx(index: number, ev?: Event) {
    ev?.stopPropagation();
    const p = this.selectedPipe();
    if (!p || p.points.length <= 2 || index === 0 || index === p.points.length - 1) return;
    this.pipeGeos.update(l => l.map(pp => {
      if (pp.id !== p.id) return pp;
      const points = pp.points.filter((_, i) => i !== index);
      const taps = (pp.taps ?? []).map(tap => ({ ...tap, at: this.nearestOnPipe(points, tap.at) ?? tap.at }));
      return { ...pp, points, taps };
    }));
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
      this.cancelPipeConnect();
      this.pipeMode.set(false);
      this.cancelPipe();
      this.flowMode.set(false);
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
      // A one-way valve shows its permitted along-pipe direction as a chevron: › = A→B, ‹ = B→A. A both-way
      // valve keeps its type code (M/A/C/R). Any valve can be made directional, not just the check type.
      actuator: g?.cat === 'valve'
        ? (this.valveGateDir(f) === 'forward' ? '›' : this.valveGateDir(f) === 'reverse' ? '‹' : (g?.code ?? ''))
        : '',
      code: g?.cat === 'instrument' ? (g?.code ?? '') : '',
      color: g?.color ?? '#ccc', tag: f.tag ?? '', tag2: f.tag2 ?? '', double: !!f.double,
      sel: f.id === this.selectedFittingId(),
      size: this.fittingSize(f), // per-fitting symbol scale (item: change valve size)
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
  /** Symbol scale for a fitting (1 = default). Clamped so it never shrinks to nothing or swallows the canvas. */
  fittingSize(f: PipeFitting): number { return Math.max(0.4, Math.min(4, f.size ?? 1)); }
  setFittingSize(size: number) { this.patchFitting({ size: Math.max(0.4, Math.min(4, size || 1)) }); }
  /** The permitted flow direction of a valve (any valve can be one-way; a check valve defaults to A→B). */
  valveFlowDir(f?: PipeFitting): 'forward' | 'reverse' | 'both' {
    const fitting = f ?? this.selectedFitting()?.fitting;
    return fitting?.checkFlow ?? (fitting?.type === 'check' ? 'forward' : 'both');
  }
  setValveFlow(dir: 'forward' | 'reverse' | 'both') { this.patchFitting({ checkFlow: dir }); }
  /** A check valve is automatic — it has no manual open/closed state (unlike a gate/isolation valve). */
  isCheckValve(): boolean { return this.selectedFitting()?.fitting.type === 'check'; }
  /** The one direction a valve permits along the pipe, or null when it lets flow pass both ways. */
  valveGateDir(f: PipeFitting): 'forward' | 'reverse' | null {
    const dir = this.valveFlowDir(f);
    return dir === 'both' ? null : dir;
  }
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
    if (this.spacePanning() || ev.button !== 0) this.startPan(ev);
    else this.drag = { kind: 'fitting', fittingId: id, pipeId };
  }
  /** A selected current-canvas pipe drags from anywhere on its body; an unselected pipe only becomes selected. */
  onPipeDown(ev: PointerEvent, id: string) {
    if (this.startMiddlePan(ev)) return;
    ev.stopPropagation();
    const session = this.pipeConnect();
    if (session) {
      const visible = this.visiblePipes().find(pipe => pipe.id === id);
      const contact = visible ? this.visiblePipeContact(visible, this.contentPoint(ev)) : null;
      if (!contact) return;
      if (id === session.sourcePipeId && !this.pipeConnectSourcePicked(session)) {
        if (contact.end) this.pipeConnect.set({ ...session, sourceEnd: contact.end });
        else {
          this.pipeConnect.set({
            ...session, sourcePoint: { ...contact.pending.targetPoint! }, sourceTapId: contact.pending.targetTapId,
          });
          this.pipeDraft.set([{ ...contact.point }]);
        }
      } else if (id !== session.sourcePipeId && this.pipeConnectSourcePicked(session)) {
        void this.completePipeConnection(contact.pending);
      }
      return;
    }
    const alreadySelected = this.selectedPipeId() === id;
    this.selectPipe(id);
    if (alreadySelected && ev.button === 0 && !this.spacePanning()) this.startPipeMove(ev, id);
    else this.startPan(ev);
  }

  private startPipeMove(ev: PointerEvent, id: string) {
    ev.preventDefault(); ev.stopPropagation();
    if (this.spacePanning() || ev.button !== 0) { this.startPan(ev); return; }
    const pipe = this.pipeGeos().find(item => item.id === id);
    const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (pipe && pipe.parentId === currentParent) {
      this.drag = {
        kind: 'pipeMove', pipeId: pipe.id, startClientX: ev.clientX, startClientY: ev.clientY, moved: false,
        points: pipe.points.map(point => ({ ...point })),
        fittings: (pipe.fittings ?? []).map(fitting => ({ ...fitting, at: { ...fitting.at } })),
        taps: (pipe.taps ?? []).map(tap => ({ ...tap, at: { ...tap.at } })),
        pinStart: this.isPipeEndConnected(pipe, 'start'),
        pinEnd: this.isPipeEndConnected(pipe, 'end'),
      };
    } else this.startPan(ev);
  }

  /** Move a route as one object. Attached endpoints remain anchored and the route stretches from those anchors. */
  private movePipeRoute(
    drag: Extract<Drag, { kind: 'pipeMove' }>, rawDx: number, rawDy: number,
  ) {
    if (!drag.points.length) return;
    const minX = Math.min(...drag.points.map(point => point.x));
    const minY = Math.min(...drag.points.map(point => point.y));
    const origin = this.snapPt({ x: Math.max(0, minX + rawDx), y: Math.max(0, minY + rawDy) });
    const dx = origin.x - minX, dy = origin.y - minY;
    let points = drag.points.map(point => ({ x: point.x + dx, y: point.y + dy }));

    if (drag.pinStart && drag.pinEnd && drag.points.length === 2) {
      // A two-point route has no movable body. Create one translated middle span so it can still be repositioned
      // while both established connections stay intact.
      points = [
        { ...drag.points[0] },
        { x: drag.points[0].x + dx, y: drag.points[0].y + dy },
        { x: drag.points[1].x + dx, y: drag.points[1].y + dy },
        { ...drag.points[1] },
      ];
    } else {
      if (drag.pinStart) points[0] = { ...drag.points[0] };
      if (drag.pinEnd) points[points.length - 1] = { ...drag.points[drag.points.length - 1] };
    }

    // Avoid zero-length segments when the drag aligns a generated/pinned bend with its neighbour.
    points = points.filter((point, index) => index === 0
      || Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y) > 0.01);
    const fittings = drag.fittings.map(fitting => ({
      ...fitting, at: { x: fitting.at.x + dx, y: fitting.at.y + dy },
    }));
    const taps = drag.taps.map(tap => {
      const translated = { x: tap.at.x + dx, y: tap.at.y + dy };
      return { ...tap, at: this.nearestOnPipe(points, translated) ?? translated };
    });
    this.pipeGeos.update(list => list.map(pipe => pipe.id === drag.pipeId ? { ...pipe, points, fittings, taps } : pipe));
  }

  /** Keep branch endpoints physically on a moved pipe's stable body taps. */
  private syncMovedPipeBranches(pipeId: string): Set<string> {
    const owner = this.pipeGeos().find(pipe => pipe.id === pipeId);
    if (!owner?.nodeId) return new Set([pipeId]);
    const changed = new Set<string>([pipeId]);
    const replacements = new Map<string, PipeGeo>();
    for (const tap of owner.taps ?? []) {
      const terminal = this.topologyTapTerminal(owner, tap.id);
      const connection = terminal ? this.connectionForTerminal(terminal) : null;
      for (const participant of connection?.terminals ?? []) {
        if (participant.sectionId !== owner.parentId || participant.pipeNodeId === owner.nodeId) continue;
        const pipe = replacements.get(String(participant.pipeNodeId))
          ?? this.pipeGeos().find(item => item.nodeId === participant.pipeNodeId);
        if (!pipe) continue;
        let next = pipe;
        if (participant.end === 'A' || participant.end === 'B') {
          const points = pipe.points.map(point => ({ ...point }));
          if (participant.end === 'A') points[0] = { ...tap.at };
          else points[points.length - 1] = { ...tap.at };
          next = { ...pipe, points };
        } else if (participant.end.startsWith('T:')) {
          const id = participant.end.slice(2);
          next = { ...pipe, taps: (pipe.taps ?? []).map(item => item.id === id ? { ...item, at: { ...tap.at } } : item) };
        }
        replacements.set(String(participant.pipeNodeId), next);
        changed.add(pipe.id);
      }
    }
    if (replacements.size) this.pipeGeos.update(list => list.map(pipe => replacements.get(String(pipe.nodeId)) ?? pipe));
    return changed;
  }

  private async finishPipeMove(pipeId: string) {
    await this.persistChangedPipes(this.syncMovedPipeBranches(pipeId));
    await this.autoConnectPipeEndpointAtContact(pipeId, 'start');
    await this.autoConnectPipeEndpointAtContact(pipeId, 'end');
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
    // Delete removes the whole selection — boxes AND pipes (marquee or single), else a selected fitting.
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      const pipeIds = [...new Set([...(this.selectedPipeId() ? [this.selectedPipeId()!] : []), ...this.selectedPipeIds()])];
      if (sel.length || pipeIds.length) { ev.preventDefault(); void this.deleteSelection([...sel], pipeIds); return; }
      const fittingId = this.selectedFittingId();
      if (fittingId && this.selectedFittingOnCanvas()) { ev.preventDefault(); void this.deleteFitting(fittingId); return; }
    }
    if (!sel.length) return;
    const step = ev.shiftKey ? 10 : 1;
    const dx = ev.key === 'ArrowLeft' ? -step : ev.key === 'ArrowRight' ? step : 0;
    const dy = ev.key === 'ArrowUp' ? -step : ev.key === 'ArrowDown' ? step : 0;
    if (dx || dy) {
      ev.preventDefault();
      for (const b of this.st.selectedBoxes()) {
        const c = this.clampRectToBoundary(Math.max(0, b.x + dx), Math.max(0, b.y + dy), b.width, b.height);
        this.st.setBoxRect(b.localId, c.x, c.y, b.width, b.height);
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

  placeFromPalette(childId: number) {
    const localId = this.st.placeChild(childId);
    if (localId == null || !this.st.boundary()) return;
    const box = this.st.boxes().find(b => b.localId === localId);
    if (box) { const c = this.clampRectToBoundary(box.x, box.y, box.width, box.height); this.st.setBoxRect(localId, c.x, c.y, c.w, c.h); }
  }

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
    this.portPlacementBoxLocalId.set(box.localId);
    this.selectedEquipmentPort.set(null);
  }

  cancelPortPlacement() { this.portPlacementBoxLocalId.set(null); }

  // ── boundary connectors (this object's own shell — placed/edited from INSIDE, persisted onto the parent's box) ──
  // The same port bridges the interior route and the parent route, and can be a flow Supply/Consumer so flow can be
  // traced while drilled in. Persistence rides st.setBoundaryPorts (a targeted PUT to the parent's placement).

  /** Arm (or cancel) dropping the next canvas click onto the boundary edge as a new connector. */
  beginBoundaryPortPlacement() {
    if (!this.st.boundary()) return;
    this.portPlacementBoundary.update(value => !value);
    this.portPlacementBoxLocalId.set(null);
    this.selectedEquipmentPort.set(null);
  }
  cancelBoundaryPortPlacement() { this.portPlacementBoundary.set(false); }

  /** Snap a point onto the nearest edge of the boundary rect, normalized to the rect (0..1). */
  private projectRectPort(rect: { x: number; y: number; w: number; h: number }, point: { x: number; y: number }) {
    const nx = Math.max(0, Math.min(1, (point.x - rect.x) / Math.max(1, rect.w)));
    const ny = Math.max(0, Math.min(1, (point.y - rect.y) / Math.max(1, rect.h)));
    const distances = [ny, 1 - nx, 1 - ny, nx];
    const nearest = distances.indexOf(Math.min(...distances));
    if (nearest === 0) return { x: nx, y: 0 };
    if (nearest === 1) return { x: 1, y: ny };
    if (nearest === 2) return { x: nx, y: 1 };
    return { x: 0, y: ny };
  }

  private placeBoundaryPort(point: { x: number; y: number }) {
    const boundary = this.st.boundary();
    const objectId = this.st.currentNode()?.id;
    if (!boundary || objectId == null) return;
    const normalized = this.projectRectPort(boundary, point);
    const index = this.st.boundaryPorts().length + 1;
    const port: EquipmentPort = {
      id: `port-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      label: `N${index}`, circuit: '', role: 'bidirectional', flowBoundary: 'none', ...normalized,
    };
    void this.st.setBoundaryPorts([...this.st.boundaryPorts(), port]);
    this.selectedEquipmentPort.set({ objectId, portId: port.id });
    this.portPlacementBoundary.set(false);
  }

  selectBoundaryPort(portId: string) {
    const objectId = this.st.currentNode()?.id;
    if (objectId != null) this.selectedEquipmentPort.set({ objectId, portId });
  }

  /** In-memory only (per-keystroke text edits) — the map/flow update live; the write waits for blur. */
  updateBoundaryPortLocal(portId: string, patch: Partial<EquipmentPort>) {
    this.st.boundaryPorts.update(list => list.map(port => port.id === portId ? { ...port, ...patch } : port));
  }
  /** Immediate persist — for discrete changes (a role/flow dropdown) and the text inputs' blur commit. */
  updateBoundaryPort(portId: string, patch: Partial<EquipmentPort>) {
    this.updateBoundaryPortLocal(portId, patch);
    void this.st.setBoundaryPorts(this.st.boundaryPorts());
  }
  persistBoundaryPorts() { void this.st.setBoundaryPorts(this.st.boundaryPorts()); }

  async deleteBoundaryPort(portId: string) {
    const objectId = this.st.currentNode()?.id;
    if (objectId == null) return;
    try {
      await firstValueFrom(this.topologyApi.deleteEquipmentPort(objectId, portId)); // detach any interior pipes
      this.topologyConnections.update(list => list.filter(connection => !(connection.kind === 'EQUIPMENT_PORT'
        && connection.equipmentObjectId === objectId && connection.equipmentPortId === portId)));
      await this.st.setBoundaryPorts(this.st.boundaryPorts().filter(port => port.id !== portId));
      if (this.selectedEquipmentPort()?.portId === portId) this.selectedEquipmentPort.set(null);
    } catch (error: any) {
      this.st.error.set(error?.error?.message || error?.message || 'Could not remove the boundary connector.');
    }
  }

  private placeEquipmentPort(box: MapBox, point: { x: number; y: number }) {
    const normalized = this.projectEquipmentPort(box, point);
    const index = (box.ports?.length ?? 0) + 1;
    const port: EquipmentPort = {
      id: `port-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      label: `P${index}`, circuit: 'Circuit 1', role: 'bidirectional', flowBoundary: 'none', ...normalized,
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

  async deleteEquipmentPort(boxLocalId: number, portId: string) {
    const box = this.boxById().get(boxLocalId);
    if (!box) return;
    try {
      await firstValueFrom(this.topologyApi.deleteEquipmentPort(box.childId, portId));
      this.removeGeneratedContinuationFromLocalState(box.childId, portId);
      this.topologyConnections.update(list => list.filter(connection => !(connection.kind === 'EQUIPMENT_PORT'
        && connection.equipmentObjectId === box.childId && connection.equipmentPortId === portId)));
      this.st.patchBoxPorts(boxLocalId, (box.ports ?? []).filter(port => port.id !== portId));
      this.selectedEquipmentPort.set(null);
    } catch (error: any) {
      this.st.error.set(error?.error?.message || error?.message || 'Could not remove the equipment connector.');
    }
  }

  private removeGeneratedContinuationFromLocalState(objectId: number, portId: string) {
    const first = this.pipeGeos().find(pipe => pipe.generatedByBoundaryPort?.objectId === objectId
      && pipe.generatedByBoundaryPort.portId === portId);
    const generated = first ? this.generatedContinuationPipes(first) : [];
    const owners = generated.map(pipe => pipe.generatedByBoundaryPort!).filter(Boolean);
    if (generated.length) this.pipeGeos.update(list => list.filter(pipe => !generated.some(item => item.id === pipe.id)));
    for (const owner of owners) {
      const current = this.st.boxes().find(box => box.childId === owner.objectId);
      if (current) this.st.patchBoxPorts(current.localId, (current.ports ?? []).filter(port => port.id !== owner.portId));
      for (const [containerId, shapes] of this.nestCache) {
        const next = shapes.map(shape => shape.childId === owner.objectId
          ? { ...shape, ports: (shape.ports ?? []).filter(port => port.id !== owner.portId) }
          : shape);
        this.nestCache.set(containerId, next);
      }
    }
    if (owners.length) this.nestVersion.update(value => value + 1);
  }

  private generatedContinuationPipes(pipe: PipeGeo): PipeGeo[] {
    if (!pipe.generatedByBoundaryPort) return [];
    if (pipe.generatedContinuationId) {
      return this.pipeGeos().filter(item => item.generatedContinuationId === pipe.generatedContinuationId);
    }
    return pipe.groupId
      ? this.pipeGeos().filter(item => item.groupId === pipe.groupId && item.generatedByBoundaryPort)
      : [pipe];
  }

  private dependentGeneratedPipes(sourceNodeId: number): PipeGeo[] {
    const found = new Map<string, PipeGeo>();
    const pending = [sourceNodeId];
    while (pending.length) {
      const current = pending.pop()!;
      for (const pipe of this.pipeGeos()) {
        if (pipe.generatedFromPipeNodeId !== current || found.has(pipe.id)) continue;
        found.set(pipe.id, pipe);
        if (pipe.nodeId != null) pending.push(pipe.nodeId);
      }
    }
    return [...found.values()];
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
      for (const pipe of migratedPipes) {
        if (pipe.startAttachment) await this.attachPipeEndpointToPort(pipe.id, 'start', pipe.startAttachment, pipe.points[0]);
        if (pipe.endAttachment) await this.attachPipeEndpointToPort(pipe.id, 'end', pipe.endAttachment, pipe.points[pipe.points.length - 1]);
      }
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
    if (connect && !this.pipeConnectSourcePicked(connect)) {
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
    if (connect?.sourcePoint) {
      this.st.error.set('Finish this body branch on another pipe. To reach equipment, draw the branch first and connect its free end to the equipment port.');
      return;
    }
    this.selectedEquipmentPort.set({ objectId: handle.objectId, portId: handle.portId, boxLocalId: handle.boxLocalId });
    if (handle.boxLocalId != null) this.st.selectBox(handle.boxLocalId);
    if (handle.owner === 'box' && handle.boxLocalId != null && !this.spacePanning() && ev.button === 0) {
      this.drag = { kind: 'equipmentPort', boxLocalId: handle.boxLocalId, portId: handle.portId };
    } else if (handle.owner === 'boundary' && !this.spacePanning() && ev.button === 0) {
      this.drag = { kind: 'boundaryPort', portId: handle.portId }; // slide a boundary connector along the edge
    } else {
      this.startPan(ev);
    }
  }

  private async attachPipeEndpointToPort(
    pipeId: string, end: PipeEnd, ref: EquipmentPortRef, point: { x: number; y: number },
  ) {
    const currentParent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    const pipe = this.pipeGeos().find(item => item.id === pipeId);
    if (!pipe) return;
    const terminal = this.topologyTerminal(pipe, end);
    if (!terminal) return;
    const onCurrentCanvas = pipe.parentId === currentParent;
    this.connectionBusy.set(true);
    this.st.error.set(null);
    try {
      const result = await firstValueFrom(this.topologyApi.attach({ terminal, equipmentPort: ref }));
      if (result?.responseData) this.applyTopologyConnection(result.responseData);
      if (onCurrentCanvas) {
        this.pipeGeos.update(list => list.map(item => {
          if (item.id !== pipeId || item.points.length < 2) return item;
          const points = [...item.points];
          if (end === 'start') points[0] = point; else points[points.length - 1] = point;
          return { ...item, points };
        }));
        await this.persistChangedPipes(new Set([pipeId]));
      }
    } catch (error: any) {
      this.st.error.set(error?.error?.message || error?.message || 'Could not attach the pipe to the equipment connector.');
    } finally {
      this.connectionBusy.set(false);
    }
  }

  detachSelectedPipePort(end: PipeEnd) {
    const pipeId = this.selectedPipeId();
    if (!pipeId) return;
    void this.detachPipePort(pipeId, end);
  }

  detachSelectedPipeTap(tapId: string) {
    const pipe = this.selectedPipe();
    const terminal = pipe ? this.topologyTapTerminal(pipe, tapId) : null;
    if (!pipe || !terminal || this.connectionBusy()) return;
    void (async () => {
      this.connectionBusy.set(true);
      this.st.error.set(null);
      try {
        await firstValueFrom(this.topologyApi.detach(terminal));
        this.pipeGeos.update(list => list.map(item => item.id === pipe.id
          ? { ...item, taps: (item.taps ?? []).filter(tap => tap.id !== tapId) }
          : item));
        await this.persistChangedPipes(new Set([pipe.id]));
        await this.refreshTopology();
      } catch (error: any) {
        this.st.error.set(error?.error?.message || error?.message || 'Could not disconnect the body junction.');
      } finally {
        this.connectionBusy.set(false);
      }
    })();
  }

  private async detachPipePort(pipeId: string, end: PipeEnd) {
    if (this.connectionBusy()) return;
    const pipe = this.pipeGeos().find(item => item.id === pipeId);
    const terminal = pipe ? this.topologyTerminal(pipe, end) : null;
    if (!terminal) return;
    this.connectionBusy.set(true);
    this.st.error.set(null);
    try {
      await firstValueFrom(this.topologyApi.detach(terminal));
      await this.refreshTopology();
    } catch (error: any) {
      this.st.error.set(error?.error?.message || error?.message || 'Could not disconnect the pipe end.');
    } finally {
      this.connectionBusy.set(false);
    }
  }

  pipeAttachmentLabel(ref?: EquipmentPortRef): string {
    if (!ref) return 'Unassigned';
    for (const box of this.st.boxes()) {
      if (box.childId !== ref.objectId) continue;
      const port = box.ports?.find(item => item.id === ref.portId);
      if (port) return `${this.nameOf(ref.objectId)} / ${port.label}`;
    }
    for (const shapes of this.nestCache.values()) {
      const shape = shapes.find(item => item.childId === ref.objectId);
      const port = shape?.ports?.find(item => item.id === ref.portId);
      if (port) return `${this.nameOf(ref.objectId)} / ${port.label}`;
    }
    if (this.st.currentNode()?.id === ref.objectId) {
      const port = this.st.boundaryPorts().find(item => item.id === ref.portId);
      if (port) return `${this.nameOf(ref.objectId)} / ${port.label}`;
    }
    return `${this.nameOf(ref.objectId)} / ${ref.portId}`;
  }

  pipeEndConnected(pipe: PipeGeo, end: PipeEnd): boolean { return this.isPipeEndConnected(pipe, end); }
  pipeEndConnectionLabel(pipe: PipeGeo, end: PipeEnd): string {
    const connection = this.connectionForPipeEnd(pipe, end);
    if (!connection) return 'Free';
    if (connection.kind === 'EQUIPMENT_PORT' && connection.equipmentObjectId != null && connection.equipmentPortId) {
      return this.pipeAttachmentLabel({ objectId: connection.equipmentObjectId, portId: connection.equipmentPortId });
    }
    const others = connection.terminals.filter(terminal => terminal.pipeNodeId !== pipe.nodeId
      || terminal.end !== this.topologyEnd(end));
    if (!others.length) return connection.kind === 'CONTINUATION' ? 'Unresolved continuation' : 'Junction';
    return others.map(terminal => {
      const other = this.pipeGeos().find(item => item.nodeId === terminal.pipeNodeId);
      return `${other?.name || 'Pipe'} ${terminal.end} · ${this.nameOf(terminal.sectionId)}`;
    }).join(', ');
  }

  private syncAttachedPipeEndpoints(boxLocalId: number) {
    const box = this.boxById().get(boxLocalId);
    if (!box) return;
    const byPort = new Map((box.ports ?? []).map(port => [port.id,
      this.equipmentPortPoint({ x: box.x, y: box.y, w: box.width, h: box.height }, port)]));
    this.pipeGeos.update(list => list.map(pipe => {
      if (pipe.parentId !== (this.st.canvasNode()?.id ?? this.st.currentNode()?.id) || pipe.points.length < 2) return pipe;
      const startRef = this.equipmentRefForPipeEnd(pipe, 'start');
      const endRef = this.equipmentRefForPipeEnd(pipe, 'end');
      const start = startRef?.objectId === box.childId ? byPort.get(startRef.portId) : null;
      const end = endRef?.objectId === box.childId ? byPort.get(endRef.portId) : null;
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
    // Boundary-connector placement: the armed click drops a connector on this object's boundary edge.
    if (this.portPlacementBoundary() && ev.button === 0) {
      ev.preventDefault(); ev.stopPropagation();
      this.placeBoundaryPort(this.contentPoint(ev));
      return;
    }
    // Pipe tool: left-click lays a vertex, right-click finishes. (Boxes/nested are click-through in pipe mode.)
    if (this.pipeMode()) {
      if (ev.button === 2) this.finishPipe(); else this.addPipePoint(ev);
      return;
    }
    if (this.fittingType() && ev.button === 0) { this.placeFitting(ev); return; } // armed fitting → drop on the pipe
    if (this.pipeConnect()) {
      if (ev.button === 2) { this.cancelPipeConnect(); return; }
      if (ev.button === 0 && this.pipeConnectBodyDrafting()) {
        ev.preventDefault(); ev.stopPropagation();
        this.addPipeConnectElbow(ev);
        return;
      }
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
    this.clearMultiPipeSelection(); // a fresh marquee (or a click on empty canvas) starts clean
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
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, old * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
    const cx = (mx - this.panX()) / old, cy = (my - this.panY()) / old;
    this.panX.set(mx - cx * next);
    this.panY.set(my - cy * next);
    this.zoom.set(next);
  }

  /** Zoom by a fixed factor toward the viewport CENTER (the +/- buttons; the wheel zooms toward the cursor). */
  zoomBy(factor: number) {
    const old = this.zoom();
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, old * factor));
    if (next === old) return;
    const el = this.viewportRef?.nativeElement;
    const r = el?.getBoundingClientRect();
    const mx = r ? r.width / 2 : 0, my = r ? r.height / 2 : 0;
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
    // Clicking a shape only selects it and starts the normal pan gesture. Relocation requires its move handle.
    if (!this.st.selectedLocalIds().includes(b.localId)) { this.st.selectBox(b.localId); this.clearMultiPipeSelection(); }
    this.startPan(ev);
  }

  onShapeMoveHandleDown(ev: PointerEvent, b: MapBox) {
    if (this.startMiddlePan(ev)) return;
    ev.preventDefault(); ev.stopPropagation();
    if (this.spacePanning() || ev.button !== 0) { this.startPan(ev); return; }
    if (!this.st.selectedLocalIds().includes(b.localId)) this.st.selectBox(b.localId);
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
    if (ev.button !== 0) return;
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
    if (this.pipeExtension()) { this.cancelPipe(); this.pipeMode.set(false); return; }
    if (this.pipeMode() && this.pipeDraft().length) this.cancelPipe();
  }
  @HostListener('window:keydown.enter')
  onEnterKey() { if (this.pipeMode() && this.pipeDraft().length >= 2) this.finishPipe(); }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(ev: PointerEvent) {
    if ((this.pipeMode() || this.pipeConnectBodyDrafting()) && this.pipeDraft().length) {
      this.pipeCursor.set(this.contentPoint(ev)); // live guide segment
    }
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
        let dx = Math.max(0, s.x) - d.origX, dy = Math.max(0, s.y) - d.origY;
        const byId = this.boxById();
        const bd = this.st.boundary();
        if (bd) { // keep the whole group's footprint inside the boundary (clamp the shared delta)
          let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
          for (const o of d.origins) {
            const bb = byId.get(o.localId); if (!bb) continue;
            gMinX = Math.min(gMinX, o.x); gMinY = Math.min(gMinY, o.y);
            gMaxX = Math.max(gMaxX, o.x + bb.width); gMaxY = Math.max(gMaxY, o.y + bb.height);
          }
          if (gMinX !== Infinity) {
            dx = Math.max(bd.x - gMinX, Math.min(dx, bd.x + bd.w - gMaxX));
            dy = Math.max(bd.y - gMinY, Math.min(dy, bd.y + bd.h - gMaxY));
          }
        }
        for (const o of d.origins) {
          const bb = byId.get(o.localId);
          if (bb) this.st.setBoxRect(o.localId, Math.max(0, o.x + dx), Math.max(0, o.y + dy), bb.width, bb.height);
        }
        for (const o of d.origins) this.syncAttachedPipeEndpoints(o.localId);
      } else {
        const c = this.clampRectToBoundary(Math.max(0, s.x), Math.max(0, s.y), d.origW, d.origH);
        this.st.setBoxRect(d.localId, c.x, c.y, d.origW, d.origH);
        this.syncAttachedPipeEndpoints(d.localId);
      }
    } else if (d.kind === 'marquee') {
      const c = this.contentPoint(ev);
      this.rubber.set({ x: Math.min(d.startX, c.x), y: Math.min(d.startY, c.y), w: Math.abs(c.x - d.startX), h: Math.abs(c.y - d.startY) });
    } else if (d.kind === 'resize') {
      const min = this.minSize(this.boxById().get(d.localId)?.shape ?? 'rect');
      let nw = this.snapLen(Math.max(min.w, d.origW + (ev.clientX - d.startClientX) / z), min.w);
      let nh = this.snapLen(Math.max(min.h, d.origH + (ev.clientY - d.startClientY) / z), min.h);
      const bd = this.st.boundary(); // cap growth at the boundary edge (top-left is fixed while resizing)
      if (bd) { nw = Math.min(nw, Math.max(min.w, bd.x + bd.w - d.origX)); nh = Math.min(nh, Math.max(min.h, bd.y + bd.h - d.origY)); }
      this.st.setBoxRect(d.localId, d.origX, d.origY, nw, nh);
      this.syncAttachedPipeEndpoints(d.localId);
    } else if (d.kind === 'draw') {
      const c = this.contentPoint(ev);
      this.rubber.set({ x: Math.min(d.startX, c.x), y: Math.min(d.startY, c.y), w: Math.abs(c.x - d.startX), h: Math.abs(c.y - d.startY) });
    } else if (d.kind === 'fitting') {
      const pipe = this.pipeGeos().find(p => p.id === d.pipeId);
      if (pipe) { const at = this.nearestOnPipe(pipe.points, this.contentPoint(ev)); if (at) this.moveFitting(d.fittingId, at); } // keep it on the path
    } else if (d.kind === 'pipeMove') {
      if (!d.moved && Math.hypot(ev.clientX - d.startClientX, ev.clientY - d.startClientY) < 3) return;
      d.moved = true;
      this.movePipeRoute(d, (ev.clientX - d.startClientX) / z, (ev.clientY - d.startClientY) / z);
    } else if (d.kind === 'pipeVtx') {
      this.movePipeVtx(d.pipeId, d.index, this.contentPoint(ev));
    } else if (d.kind === 'pipeSeg') {
      this.movePipeSegment(d, (ev.clientX - d.startClientX) / z, (ev.clientY - d.startClientY) / z);
    } else if (d.kind === 'equipmentPort') {
      const box = this.boxById().get(d.boxLocalId);
      if (box) {
        this.updateEquipmentPort(d.boxLocalId, d.portId, this.projectEquipmentPort(box, this.contentPoint(ev)));
        this.syncAttachedPipeEndpoints(d.boxLocalId);
      }
    } else if (d.kind === 'boundaryPort') {
      const boundary = this.st.boundary();
      if (boundary) {
        const at = this.projectRectPort(boundary, this.contentPoint(ev));
        this.st.boundaryPorts.update(list => list.map(port => port.id === d.portId ? { ...port, ...at } : port));
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
    if (d.kind === 'pipeMove') {
      if (d.moved) void this.finishPipeMove(d.pipeId);
      return;
    }
    if (d.kind === 'pipeVtx' || d.kind === 'pipeSeg') {
      void this.persistChangedPipes(this.syncMovedPipeBranches(d.pipeId));
      return;
    }
    if (d.kind === 'equipmentPort' || d.kind === 'move' || d.kind === 'resize') {
      this.savePipes(); return;
    }
    if (d.kind === 'boundaryPort') {
      void this.st.setBoundaryPorts(this.st.boundaryPorts()); return; // persist the slid connector to the parent
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
        // Intersection (touch), not containment — grazing a box/pipe selects it, which is what people expect.
        const hits = this.st.boxes()
          .filter(b => r.x < b.x + b.width && r.x + r.w > b.x && r.y < b.y + b.height && r.y + r.h > b.y)
          .map(b => b.localId);
        const prev = this.st.selectedLocalIds();
        this.st.setSelection(d.additive ? [...prev, ...hits.filter(i => !prev.includes(i))] : hits);
        // Pipes join the marquee too — they're the main content, so a drag-select must be able to grab & delete them.
        const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
        const pipeHits = new Set<string>();
        for (const p of this.pipeGeos()) {
          if (p.parentId === parent && p.points.length >= 2 && this.pathHitsRect(p.points, r)) pipeHits.add(p.id);
        }
        this.selectedPipeIds.set(d.additive ? new Set([...this.selectedPipeIds(), ...pipeHits]) : pipeHits);
        if (pipeHits.size) this.selectedPipeId.set(null);
      }
    }
    // move / resize were persisted live via setBoxRect's debounced save
  }

  /** Draw-to-create: a rubber-banded footprint becomes a brand-new child object at that size/position,
   *  then jumps straight into inline naming so you type its name in one motion (no "New object"). */
  private async createDrawnObject(r: { x: number; y: number; w: number; h: number }) {
    const shape = this.drawShape();
    const min = this.minSize(shape);
    const c = this.clampRectToBoundary(r.x, r.y, Math.max(min.w, r.w), Math.max(min.h, r.h)); // keep new shapes in bounds
    const created = await this.st.createChild({ name: this.defaultDrawName(shape), type: this.newType });
    if (!created) return;
    const localId = this.st.placeChild(created.id, c.x, c.y, shape);
    if (localId == null) return;
    this.st.setBoxRect(localId, c.x, c.y, c.w, c.h);
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
  async removeSelectedBox() {
    const id = this.st.selectedLocalId();
    if (id != null) await this.removeBoxesCleanly([id]);
  }

  /** Delete a whole marquee/keyboard selection at once — the on-canvas pipes first, then the boxes. */
  private async deleteSelection(boxIds: number[], pipeIds: string[]) {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    for (const id of pipeIds) {
      const pipe = this.pipeGeos().find(p => p.id === id);
      if (pipe && pipe.parentId === parent) await this.deletePipe(id);
    }
    this.selectedPipeIds.set(new Set());
    if (boxIds.length) await this.removeBoxesCleanly(boxIds);
  }

  private async removeBoxesCleanly(localIds: number[]) {
    for (const localId of localIds) {
      const box = this.boxById().get(localId);
      if (!box) continue;
      try {
        for (const port of box.ports ?? []) {
          await firstValueFrom(this.topologyApi.deleteEquipmentPort(box.childId, port.id));
          this.removeGeneratedContinuationFromLocalState(box.childId, port.id);
        }
        this.topologyConnections.update(list => list.filter(connection =>
          connection.kind !== 'EQUIPMENT_PORT' || connection.equipmentObjectId !== box.childId));
        this.st.removeBox(localId);
      } catch (error: any) {
        this.st.error.set(error?.error?.message || error?.message || 'Could not clean the shape connections. The shape was kept on the map.');
        return;
      }
    }
  }

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
    const insideObject = !!this.st.boundary();
    this.bgUploading.set(true);
    try {
      const ok = await this.st.uploadBackground(file, did);
      if (ok && insideObject) this.pendingBgFit = true; // fit it to the boundary once onBgLoad reports its size
    }
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
