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
  LinkedFile, PhysicalObjectNode, PO_TYPE_OPTIONS, poColor, WorkAreaOption, WorkAreaRef,
} from '../../../models/physical/physical-object.models';
import { environment } from '../../../../environments/environment';
import { RfFileApiService } from '../../files/refactored/services/rf-file-api.service';
import { FileDto } from '../../../models/file/file.model';
import { SharedDataService } from '../../../services/shared-data.service';
import { ValueDto } from '../../../models/value.model';
import { MaximoAssetPickerComponent } from '../../maximo/maximo-asset-picker/maximo-asset-picker.component';
import { MaximoLocationPickerComponent } from '../../maximo/maximo-location-picker/maximo-location-picker.component';
import { MaximoAsset, MaximoLocation } from '../../../models/maximo/maximo.models';
import { GhostBox, MapBox, PlantMapStateService } from './services/plant-map-state.service';
import {
  PLANT_GLYPHS, PLANT_GLYPH_BY_KEY, SERVICE_COLORS, PlantGlyph,
  FootprintShape, FOOTPRINT_SHAPES, hexToRgba, normFootprint,
} from './plant-glyphs';
import { DiagramPlacementApiService } from '../../diagram-builder/services/diagram-placement-api.service';

/** One child of a nested container (in the container's OWN diagram coords) — for recursive zoom-nesting. */
interface NestChild {
  childId: number; name: string; color: string; shape: FootprintShape;
  x: number; y: number; w: number; h: number;
  hasChildren: boolean; diagramId: number | null;  // to recurse into it as you keep zooming
}
/** A nested descendant to render, mapped into content coords, at a given depth. */
interface NestItem { x: number; y: number; w: number; h: number; childId: number; name: string; color: string; shape: FootprintShape; depth: number; }

/** A pipe = a guided, elbowed route (a polyline). Phase 1: geometry stored locally per canvas node; later it
 *  promotes to a synced PhysicalObject + placement, gains fittings (child objects on the path) and branches. */
interface PipeGeo { id: string; parentId: number; points: { x: number; y: number }[]; color?: string; width?: number; name?: string; }

/** In-progress pointer gesture on the canvas. */
type Drag =
  | { kind: 'move' | 'resize'; localId: number; startClientX: number; startClientY: number; origX: number; origY: number; origW: number; origH: number }
  | { kind: 'connect'; localId: number }
  | { kind: 'draw'; startX: number; startY: number }
  | { kind: 'pan'; startClientX: number; startClientY: number; startPanX: number; startPanY: number; moved: boolean }
  | { kind: 'waypoint'; edgeId: number; index: number };

/** Point on a box's border along the ray toward (tx,ty) — so wires touch edges, not centers. */
function borderPoint(b: MapBox, tx: number, ty: number): { x: number; y: number } {
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = b.width / 2, hh = b.height / 2;
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

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
  private nodesApi = inject(PhysicalObjectApiService);
  private filesApi = inject(RfFileApiService);
  private placementApi = inject(DiagramPlacementApiService);
  private shared = inject(SharedDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ── system layers (feature #3) ──
  systems = signal<ValueDto[]>([]);
  layerActive = computed(() => this.st.activeSystemId() != null);

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

  // ── pan / zoom (map navigation) ──
  zoom = signal(1);
  panX = signal(0);
  panY = signal(0);
  contentTransform = computed(() => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`);

  readonly typeOptions = PO_TYPE_OPTIONS;
  readonly apiBase = environment.baseApiUrl;
  readonly color = poColor;
  readonly glyphs = PLANT_GLYPHS;
  readonly serviceColors = SERVICE_COLORS;
  readonly footprintShapes = FOOTPRINT_SHAPES;

  // which footprint the next right-drag draws
  drawShape = signal<FootprintShape>('rect');
  setDrawShape(s: FootprintShape) { this.drawShape.set(s); }

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
  tempWire = signal<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  rubber = signal<{ x: number; y: number; w: number; h: number } | null>(null);

  // ── inspector: edit fields + documents ──
  editName = ''; editType = ''; editTag = ''; editDesc = ''; editLoc = ''; editFloor = '';
  savingEdit = signal(false);
  files = signal<LinkedFile[]>([]);
  filesLoading = signal(false);
  fileQuery = '';
  fileResults = signal<FileDto[]>([]);
  fileSearching = signal(false);
  private lastSelectedNodeId: number | null = null;

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

  /** How big the scrollable content is — grows to contain every box, the boundary, and the reference image. */
  canvasSize = computed(() => {
    let w = 1600, h = 1000;
    for (const b of this.st.boxes()) { w = Math.max(w, b.x + b.width + 240); h = Math.max(h, b.y + b.height + 240); }
    const bd = this.st.boundary();
    if (bd) { w = Math.max(w, bd.x + bd.w + 80); h = Math.max(h, bd.y + bd.h + 80); }
    const bg = this.bgSize();
    if (bg && this.st.backgroundUrl()) { w = Math.max(w, bg.w + 40); h = Math.max(h, bg.h + 40); } // keep image fixed at origin; just extend the grid to cover it
    return { w, h };
  });

  /** Rendered pipe ROUTES (border → waypoints → border) as polylines, with edit handles when selected. */
  wires = computed(() => {
    const byId = this.boxById();
    const sel = this.st.selectedEdgeLocalId();
    return this.st.edges().map(e => {
      const a = byId.get(e.sourceLocalId), b = byId.get(e.targetLocalId);
      if (!a || !b) return null;
      const wps = e.waypoints ?? [];
      const acx = a.x + a.width / 2, acy = a.y + a.height / 2, bcx = b.x + b.width / 2, bcy = b.y + b.height / 2;
      const ft = wps.length ? wps[0] : { x: bcx, y: bcy };
      const lt = wps.length ? wps[wps.length - 1] : { x: acx, y: acy };
      const p1 = borderPoint(a, ft.x, ft.y);
      const p2 = borderPoint(b, lt.x, lt.y);
      const pts = [p1, ...wps, p2];
      const points = pts.map(p => `${p.x},${p.y}`).join(' ');
      const isSel = e.localId === sel;
      const segMids = isSel ? pts.slice(0, -1).map((p, i) => ({ x: (p.x + pts[i + 1].x) / 2, y: (p.y + pts[i + 1].y) / 2, index: i })) : [];
      const wpHandles = isSel ? wps.map((p, i) => ({ x: p.x, y: p.y, index: i })) : [];
      return { id: e.localId, points, color: e.color || '#7c94b0', width: e.width || 2, sel: isSel, segMids, wpHandles };
    }).filter((w): w is { id: number; points: string; color: string; width: number; sel: boolean;
      segMids: { x: number; y: number; index: number }[]; wpHandles: { x: number; y: number; index: number }[] } => w != null);
  });

  /** All nested descendant items to render (recursive zoom-nesting), flat, in content coords. A container box
   *  reveals its children when it's big enough on screen; each revealed child that's itself big enough reveals
   *  ITS children, and so on — so zooming in continuously surfaces deeper items with no drilling. */
  nestedItems = computed<NestItem[]>(() => {
    this.nestVersion();
    const z = this.zoom();
    const reveal = this.nestReveal();
    const out: NestItem[] = [];
    const walk = (rect: { x: number; y: number; w: number; h: number }, containerId: number, depth: number) => {
      if (depth > this.NEST_MAX_DEPTH) return;
      const shapes = this.nestCache.get(containerId);
      if (!shapes || !shapes.length) return;
      const bb = this.bboxOf(shapes);
      for (const s of shapes) {
        const r = this.mapInto(rect, bb, s);
        out.push({ x: r.x, y: r.y, w: r.w, h: r.h, childId: s.childId, name: s.name, color: s.color, shape: s.shape, depth });
        if (s.hasChildren && r.w * z >= reveal && r.h * z >= 34) walk(r, s.childId, depth + 1);
      }
    };
    for (const b of this.st.boxes()) {
      if (b.width * z >= reveal && b.height * z >= 34) walk({ x: b.x, y: b.y, w: b.width, h: b.height }, b.childId, 1);
    }
    return out;
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

  private bboxOf(shapes: NestChild[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of shapes) { minX = Math.min(minX, s.x); minY = Math.min(minY, s.y); maxX = Math.max(maxX, s.x + s.w); maxY = Math.max(maxY, s.y + s.h); }
    return { minX, minY, maxX, maxY };
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

  /** Connections touching the selected box, named by the other end (for the inspector). */
  selectedConnections = computed(() => {
    const sel = this.st.selectedLocalId();
    if (sel == null) return [];
    const byId = this.boxById();
    const childById = this.st.childById();
    return this.st.edges()
      .filter(e => e.sourceLocalId === sel || e.targetLocalId === sel)
      .map(e => {
        const otherLocal = e.sourceLocalId === sel ? e.targetLocalId : e.sourceLocalId;
        const other = byId.get(otherLocal);
        const child = other ? childById.get(other.childId) : null;
        return { edgeLocalId: e.localId, name: child?.name || child?.tagNumber || `#${other?.childId ?? '?'}` };
      });
  });

  constructor() {
    const nodeId = this.route.snapshot.paramMap.get('nodeId');
    if (nodeId) this.st.openNode(Number(nodeId));
    else this.loadRoots();

    this.shared.loadSystems().subscribe(s => this.systems.set(s ?? []));
    this.nodesApi.getAllWorkAreas().subscribe(w => this.allWorkAreas.set(w ?? []));
    void this.loadTree(); // the "jump anywhere" hierarchy navigator
    this.loadPipes();     // object-to-object connections (local for now)

    // Repopulate the inspector only when the selected object actually changes (not on every drag).
    effect(() => {
      const child = this.st.selectedChild();
      untracked(() => this.onSelectionChanged(child));
    });

    // Keep the tree navigator expanded down to the current node as you navigate.
    effect(() => {
      this.st.currentNode();
      untracked(() => this.expandToCurrent());
    });

    // Reset pan/zoom whenever the open canvas changes (fresh view per node).
    effect(() => {
      this.st.currentDiagramId();
      untracked(() => this.resetView());
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
          if (depth > this.NEST_MAX_DEPTH || containerDid == null) return;
          if (!this.nestFetched.has(containerId)) { void this.fetchNest(containerId, containerDid, did); return; }
          const shapes = this.nestCache.get(containerId);
          if (!shapes || !shapes.length) return;
          const bb = this.bboxOf(shapes);
          for (const s of shapes) {
            const r = this.mapInto(rect, bb, s);
            if (s.hasChildren && s.diagramId != null && r.w * z >= fetchAt && r.h * z >= 28) {
              walkFetch(r, s.childId, s.diagramId, depth + 1);
            }
          }
        };
        for (const b of boxes) {
          if (b.width * z >= fetchAt && b.height * z >= 28) {
            walkFetch({ x: b.x, y: b.y, w: b.width, h: b.height }, b.childId, childById.get(b.childId)?.diagramId ?? null, 1);
          }
        }
      });
    });
  }

  ngOnDestroy() { void this.st.flushSave(); }

  /**
   * Load a container's children (their footprints + names + whether THEY have children) for nested rendering.
   * Reads the container's OWN diagram for positions and getChildren for identity/recursion metadata. Guards on
   * `parentDid` so a fetch that lands after the canvas changed is dropped.
   */
  private async fetchNest(containerId: number, containerDid: number, parentDid: number | null) {
    this.nestFetched.add(containerId);
    try {
      const [kids, pRes] = await Promise.all([
        firstValueFrom(this.nodesApi.getChildren(containerId)).catch(() => [] as PhysicalObjectNode[]),
        firstValueFrom(this.placementApi.getByDiagram(containerDid)),
      ]);
      if (this.nestParent !== parentDid) return;
      const kidById = new Map((kids ?? []).map(k => [k.id, k]));
      const shapes: NestChild[] = (pRes?.responseData ?? [])
        .filter(p => p.sourceEntityType === 'PhysicalObject' && p.sourceEntityId != null && (p.width ?? 0) > 0 && (p.height ?? 0) > 0)
        .map(p => {
          const k = kidById.get(p.sourceEntityId!);
          return {
            childId: p.sourceEntityId!, name: p.label || k?.name || '', color: p.color || poColor(k?.type),
            shape: normFootprint(p.type),
            x: p.x ?? 0, y: p.y ?? 0, w: p.width ?? 0, h: p.height ?? 0,
            hasChildren: k?.hasChildren ?? false, diagramId: k?.diagramId ?? null,
          };
        });
      this.nestCache.set(containerId, shapes);
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
    const c = this.st.selectedChild();
    return c != null && this.st.childInSystem(c.id, systemId);
  }

  toggleSelectedObjectSystem(systemId: number) {
    const c = this.st.selectedChild();
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
  private async loadTree() {
    const all = await firstValueFrom(this.nodesApi.getTree());
    this.treeAllNodes.set((all ?? []).filter(n => n.local !== false));
    this.expandToCurrent();
  }
  /** Expand the tree branches down to the current node so it's visible + highlighted. */
  private expandToCurrent() {
    const cur = this.st.currentNode(); if (!cur) return;
    const byId = new Map(this.treeAllNodes().map(n => [n.id, n]));
    const open = new Set(this.expandedTree());
    let p: number | null = cur.parentId ?? null;
    while (p != null) { open.add(p); p = byId.get(p)?.parentId ?? null; }
    open.add(cur.id); // expand the current node too, to show where you are
    this.expandedTree.set(open);
  }

  // ── pipes: guided, elbowed routes drawn point-by-point (Phase 1: geometry stored locally per canvas node) ──
  pipeGeos = signal<PipeGeo[]>([]);                    // all pipe geometry (local for now)
  pipeMode = signal(false);                            // pipe-draw tool active
  pipeSnap = signal(true);                             // 90° elbow snap while drawing
  pipeDraft = signal<{ x: number; y: number }[]>([]);  // vertices being laid
  pipeCursor = signal<{ x: number; y: number } | null>(null); // cursor → live guide segment
  selectedPipeId = signal<string | null>(null);
  pipeEditName = '';

  togglePipeMode() { this.pipeMode.update(v => !v); this.cancelPipe(); }

  private loadPipes() {
    try { this.pipeGeos.set(JSON.parse(localStorage.getItem('pm-pipe-geo') || '[]')); } catch { this.pipeGeos.set([]); }
  }
  private savePipes() {
    try { localStorage.setItem('pm-pipe-geo', JSON.stringify(this.pipeGeos())); } catch { /* ignore */ }
  }

  /** Snap a point to horizontal/vertical from the previous vertex (clean elbows). */
  private snapPipePoint(p: { x: number; y: number }, from?: { x: number; y: number }): { x: number; y: number } {
    if (!this.pipeSnap() || !from) return p;
    return Math.abs(p.x - from.x) >= Math.abs(p.y - from.y) ? { x: p.x, y: from.y } : { x: from.x, y: p.y };
  }
  /** Add a vertex at the pointer (canvas / box / nested click while in pipe mode). */
  addPipePoint(ev: PointerEvent) {
    const p = this.contentPoint(ev);
    const pts = this.pipeDraft();
    this.pipeDraft.set([...pts, pts.length ? this.snapPipePoint(p, pts[pts.length - 1]) : p]);
  }
  cancelPipe() { this.pipeDraft.set([]); this.pipeCursor.set(null); }
  /** Finish the in-progress pipe → a new pipe on the current canvas. */
  finishPipe() {
    let pts = this.pipeDraft();
    pts = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1].x || p.y !== pts[i - 1].y); // drop dbl-click dup
    this.pipeDraft.set([]); this.pipeCursor.set(null);
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (pts.length < 2 || parent == null) return;
    const id = 'pipe-' + parent + '-' + Date.now();
    this.pipeGeos.update(list => [...list, { id, parentId: parent, points: pts, name: 'Pipe' }]);
    this.savePipes();
    this.selectPipe(id);
  }

  /** Pipes to render on the current canvas (their parent node is the one being shown). */
  viewPipes = computed(() => {
    const parent = this.st.canvasNode()?.id ?? this.st.currentNode()?.id ?? null;
    if (parent == null) return [];
    return this.pipeGeos().filter(p => p.parentId === parent && p.points.length >= 2).map(p => ({
      id: p.id, points: p.points.map(pt => `${pt.x},${pt.y}`).join(' '),
      color: p.color || '#5b9bd5', width: p.width || 8, name: p.name || 'Pipe',
      mid: p.points[Math.floor(p.points.length / 2)], sel: p.id === this.selectedPipeId(),
    }));
  });
  /** The in-progress draft polyline + the live guide segment to the cursor. */
  pipeDraftPoints = computed(() => this.pipeDraft().map(p => `${p.x},${p.y}`).join(' '));
  pipeGuideSeg = computed(() => {
    const pts = this.pipeDraft(); const cur = this.pipeCursor();
    if (!pts.length || !cur) return null;
    const last = pts[pts.length - 1];
    const s = this.snapPipePoint(cur, last);
    return { x1: last.x, y1: last.y, x2: s.x, y2: s.y };
  });

  selectedPipe = computed(() => this.pipeGeos().find(p => p.id === this.selectedPipeId()) ?? null);
  selectPipe(id: string | null) {
    this.selectedPipeId.set(id);
    if (id != null) { this.st.selectBox(null); this.st.selectedNestedNode.set(null); }
    this.pipeEditName = this.pipeGeos().find(x => x.id === id)?.name || '';
  }
  savePipeName() {
    const id = this.selectedPipeId(); if (id == null) return;
    const name = this.pipeEditName.trim() || 'Pipe';
    this.pipeGeos.update(l => l.map(p => (p.id === id ? { ...p, name } : p))); this.savePipes();
  }
  setPipeColor(color: string) { const id = this.selectedPipeId(); if (id != null) { this.pipeGeos.update(l => l.map(p => (p.id === id ? { ...p, color } : p))); this.savePipes(); } }
  setPipeWidth(width: number) { const id = this.selectedPipeId(); if (id != null) { this.pipeGeos.update(l => l.map(p => (p.id === id ? { ...p, width } : p))); this.savePipes(); } }
  deletePipe(id: string) {
    this.pipeGeos.update(l => l.filter(p => p.id !== id)); this.savePipes();
    if (this.selectedPipeId() === id) this.selectedPipeId.set(null);
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
  isSelected(b: MapBox): boolean { return this.st.selectedLocalId() === b.localId; }

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

  private boxAt(x: number, y: number): MapBox | null {
    const list = this.st.boxes();
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) return b;
    }
    return null;
  }

  /** Empty-canvas press: LEFT drag pans the map; RIGHT drag draws a new object. Either way, deselect. */
  onCanvasDown(ev: PointerEvent) {
    // Pipe tool: left-click lays a vertex, right-click finishes. (Boxes/nested are click-through in pipe mode.)
    if (this.pipeMode()) {
      if (ev.button === 2) this.finishPipe(); else this.addPipePoint(ev);
      return;
    }
    this.st.selectedLocalId.set(null);
    this.st.selectedEdgeLocalId.set(null);
    this.st.selectedNestedNode.set(null);
    this.selectedPipeId.set(null);
    if (ev.button === 2) {
      const p = this.contentPoint(ev);
      this.drag = { kind: 'draw', startX: p.x, startY: p.y };
      this.rubber.set({ x: p.x, y: p.y, w: 0, h: 0 });
    } else {
      this.drag = { kind: 'pan', startClientX: ev.clientX, startClientY: ev.clientY, startPanX: this.panX(), startPanY: this.panY(), moved: false };
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
    ev.stopPropagation();
    this.st.selectBox(b.localId);
    this.drag = { kind: 'move', localId: b.localId, startClientX: ev.clientX, startClientY: ev.clientY, origX: b.x, origY: b.y, origW: b.width, origH: b.height };
  }

  onResizeDown(ev: PointerEvent, b: MapBox) {
    ev.stopPropagation();
    this.st.selectBox(b.localId);
    this.drag = { kind: 'resize', localId: b.localId, startClientX: ev.clientX, startClientY: ev.clientY, origX: b.x, origY: b.y, origW: b.width, origH: b.height };
  }

  onPortDown(ev: PointerEvent, b: MapBox) {
    ev.stopPropagation();
    this.drag = { kind: 'connect', localId: b.localId };
    const c = this.contentPoint(ev);
    this.tempWire.set({ x1: b.x + b.width / 2, y1: b.y + b.height / 2, x2: c.x, y2: c.y });
  }

  /** Press on a pipe segment: select it (for styling), don't start a canvas draw. */
  onWireDown(ev: PointerEvent, edgeLocalId: number) {
    ev.stopPropagation();
    this.st.selectEdge(edgeLocalId);
  }

  /** Drag an existing route bend. */
  onWpDown(ev: PointerEvent, edgeId: number, index: number) {
    ev.stopPropagation();
    this.drag = { kind: 'waypoint', edgeId, index };
  }

  /** Press a segment midpoint → insert a bend there, then drag it. */
  onWpAddDown(ev: PointerEvent, edgeId: number, insertIndex: number) {
    ev.stopPropagation();
    const c = this.contentPoint(ev);
    this.st.insertWaypoint(edgeId, insertIndex, c.x, c.y);
    this.drag = { kind: 'waypoint', edgeId, index: insertIndex };
  }

  removeWaypoint(edgeId: number, index: number) { this.st.removeWaypoint(edgeId, index); }

  onBoxDblClick(b: MapBox) { void this.st.navigate(b.childId); }

  /** Click a rendered interior item (in a box's LOD mini-map) → drill straight into that item's level. */
  drillToDescendant(childId: number, ev: Event) {
    ev.stopPropagation();
    if (childId) void this.st.navigate(childId);
  }

  @HostListener('window:keydown.escape')
  onEscapeKey() { if (this.pipeMode() && this.pipeDraft().length) this.cancelPipe(); }
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
      this.st.setBoxRect(d.localId, nx, ny, d.origW, d.origH);
    } else if (d.kind === 'resize') {
      const min = this.minSize(this.boxById().get(d.localId)?.shape ?? 'rect');
      const nw = Math.max(min.w, d.origW + (ev.clientX - d.startClientX) / z);
      const nh = Math.max(min.h, d.origH + (ev.clientY - d.startClientY) / z);
      this.st.setBoxRect(d.localId, d.origX, d.origY, nw, nh);
    } else if (d.kind === 'waypoint') {
      const c = this.contentPoint(ev);
      this.st.moveWaypoint(d.edgeId, d.index, c.x, c.y);
    } else if (d.kind === 'connect') {
      const c = this.contentPoint(ev);
      const src = this.boxById().get(d.localId);
      this.tempWire.set({ x1: src ? src.x + src.width / 2 : c.x, y1: src ? src.y + src.height / 2 : c.y, x2: c.x, y2: c.y });
    } else if (d.kind === 'draw') {
      const c = this.contentPoint(ev);
      this.rubber.set({ x: Math.min(d.startX, c.x), y: Math.min(d.startY, c.y), w: Math.abs(c.x - d.startX), h: Math.abs(c.y - d.startY) });
    }
  }

  @HostListener('window:pointerup', ['$event'])
  onPointerUp(ev: PointerEvent) {
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    if (d.kind === 'connect') {
      const c = this.contentPoint(ev);
      const target = this.boxAt(c.x, c.y);
      this.tempWire.set(null);
      if (target && target.localId !== d.localId) {
        const eid = this.st.connect(d.localId, target.localId);
        if (eid != null) this.st.selectEdge(eid);   // select the new pipe so it can be styled right away
      }
    } else if (d.kind === 'draw') {
      const r = this.rubber();
      this.rubber.set(null);
      // long-enough drag; min-side allows thin pipe runs, long-side rejects accidental taps
      if (r && Math.max(r.w, r.h) >= 24 && Math.min(r.w, r.h) >= 6) void this.createDrawnObject(r);
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
    return shape === 'run' ? { w: 8, h: 8 } : { w: 28, h: 16 };
  }

  /** Too small to fit a readable name plate — hide the label (shape + color still identify it). */
  isTiny(b: MapBox): boolean { return Math.min(b.width, b.height) < 24; }

  private defaultDrawName(shape: FootprintShape): string {
    return shape === 'run' ? 'Pipe run' : shape === 'circle' ? 'Tank' : 'Area';
  }

  // ── inline rename (name-in-place on the footprint) ──
  isEditingBox(b: MapBox): boolean { return this.editingBoxLocalId() === b.localId; }

  startRenameBox(b: MapBox, ev?: Event) {
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
  }

  // ── inspector: work areas (safety) ──
  private async loadWorkAreas(nodeId: number) {
    this.waLoading.set(true);
    try { this.workAreas.set(await firstValueFrom(this.nodesApi.getNodeWorkAreas(nodeId))); }
    catch { this.workAreas.set([]); }
    finally { this.waLoading.set(false); }
  }

  async linkWorkArea(wa: WorkAreaOption) {
    const c = this.st.selectedChild();
    if (!c) return;
    await firstValueFrom(this.nodesApi.linkWorkArea(c.id, wa.id));
    this.waPickerOpen.set(false);
    await this.loadWorkAreas(c.id);
    await this.st.reloadChildWorkAreas();
  }

  async unlinkWorkArea(wa: WorkAreaRef) {
    const c = this.st.selectedChild();
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
    const c = this.st.selectedChild();
    if (!c) return;
    await this.st.linkMaximo(c.id, { assetnum: a.assetnum, location: a.location, siteid: a.siteid, maximoType: a.assettype });
    this.mxPickerOpen.set(false);
  }

  async onLocationPicked(l: MaximoLocation) {
    const c = this.st.selectedChild();
    if (!c) return;
    await this.st.linkMaximo(c.id, { location: l.location, siteid: l.siteid, maximoType: (l as any).type });
    this.mxPickerOpen.set(false);
  }

  async unlinkMaximo() {
    const c = this.st.selectedChild();
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
    await this.st.updateNodeData(child.id, {
      name: this.editName.trim() || undefined,
      type: this.editType || undefined,
      tagNumber: this.editTag.trim() || undefined,
      description: this.editDesc.trim() || undefined,
      specificLocation: this.editLoc.trim() || undefined,
      floorIndex: floor === '' ? undefined : (Number.isFinite(Number(floor)) ? Number(floor) : undefined),
    });
    this.savingEdit.set(false);
  }

  drillSelected() { const c = this.st.selectedChild(); if (c) void this.st.navigate(c.id); }
  removeSelectedBox() { const id = this.st.selectedLocalId(); if (id != null) this.st.removeBox(id); }

  // ── inspector: appearance (footprint shape + equipment badge + color) ──
  setShape(shape: FootprintShape) { const id = this.st.selectedLocalId(); if (id != null) this.st.patchBox(id, { shape }); }
  setGlyph(key: string) { const id = this.st.selectedLocalId(); if (id != null) this.st.patchBox(id, { glyph: key }); }
  setColor(color: string) { const id = this.st.selectedLocalId(); if (id != null) this.st.patchBox(id, { color }); }

  // ── reference underlay (satellite / plot plan) ──
  onPickBackground(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.st.error.set('The reference must be an image file.'); return; }
    if (file.size > 3 * 1024 * 1024) { this.st.error.set('Image too large (max 3 MB) — crop or screenshot a smaller area.'); return; }
    const did = this.st.currentDiagramId(); // snapshot: drop the write if the user drills away before the read lands
    const reader = new FileReader();
    reader.onload = () => { this.st.error.set(null); this.st.setBackgroundImage(String(reader.result), did); };
    reader.onerror = () => this.st.error.set('Could not read that image.');
    reader.readAsDataURL(file);
  }
  clearBackground() { this.st.clearBackgroundImage(); }
  setBgOpacity(v: number) { this.st.setBackgroundOpacity(v); }

  // ── inspector: legacy box-to-box connection (edge) style ──
  setEdgeColor(color: string) { const id = this.st.selectedEdgeLocalId(); if (id != null) this.st.patchEdge(id, { color }); }
  setEdgeWidth(width: number) { const id = this.st.selectedEdgeLocalId(); if (id != null) this.st.patchEdge(id, { width }); }
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
    const c = this.st.selectedChild();
    if (!c) return;
    await firstValueFrom(this.nodesApi.linkFile(c.id, f.id));
    this.fileResults.set([]); this.fileQuery = '';
    await this.loadFiles(c.id);
  }

  async unlinkFile(file: LinkedFile) {
    const c = this.st.selectedChild();
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
