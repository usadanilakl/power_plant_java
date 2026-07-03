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
import { MapBox, PlantMapStateService } from './services/plant-map-state.service';
import { PLANT_GLYPHS, PLANT_GLYPH_BY_KEY, SERVICE_COLORS, PlantGlyph } from './plant-glyphs';
import { DiagramPlacementApiService } from '../../diagram-builder/services/diagram-placement-api.service';

/** One scaled child-placement rect for a box's mini-map preview. */
interface MiniShape { x: number; y: number; w: number; h: number; color: string; }

/** In-progress pointer gesture on the canvas. */
type Drag =
  | { kind: 'move' | 'resize'; localId: number; startClientX: number; startClientY: number; origX: number; origY: number; origW: number; origH: number }
  | { kind: 'connect'; localId: number }
  | { kind: 'draw'; startX: number; startY: number };

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
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
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

  // ── mini-map previews (feature #1) ──
  private previewCache = new Map<number, MiniShape[]>();  // childId → its interior placement rects
  private previewFetched = new Set<number>();             // childIds already fetched (or in-flight)
  private previewParent: number | null = null;            // parent diagram the cache belongs to
  private previewsVersion = signal(0);                    // bumped when a fetch lands, to re-render minis
  private readonly MINI_MIN_W = 110;
  private readonly MINI_MIN_H = 78;

  @ViewChild('content') contentRef?: ElementRef<HTMLElement>;

  readonly typeOptions = PO_TYPE_OPTIONS;
  readonly apiBase = environment.baseApiUrl;
  readonly color = poColor;
  readonly glyphs = PLANT_GLYPHS;
  readonly serviceColors = SERVICE_COLORS;

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

  /** How big the scrollable content is — grows to contain every box. */
  canvasSize = computed(() => {
    let w = 1600, h = 1000;
    for (const b of this.st.boxes()) { w = Math.max(w, b.x + b.width + 240); h = Math.max(h, b.y + b.height + 240); }
    return { w, h };
  });

  /** Rendered pipe segments (border-to-border), color-coded, with per-edge width + selection flag. */
  wires = computed(() => {
    const byId = this.boxById();
    const sel = this.st.selectedEdgeLocalId();
    return this.st.edges().map(e => {
      const a = byId.get(e.sourceLocalId), b = byId.get(e.targetLocalId);
      if (!a || !b) return null;
      const p1 = borderPoint(a, b.x + b.width / 2, b.y + b.height / 2);
      const p2 = borderPoint(b, a.x + a.width / 2, a.y + a.height / 2);
      return {
        id: e.localId, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
        color: e.color || '#7c94b0', width: e.width || 2, sel: e.localId === sel,
      };
    }).filter((w): w is { id: number; x1: number; y1: number; x2: number; y2: number; color: string; width: number; sel: boolean } => w != null);
  });

  /** Per-box mini-map: the child's interior placements, scaled to fit inside a big enough showChildren box. */
  miniMaps = computed(() => {
    this.previewsVersion();                 // re-run when a preview fetch lands
    const childById = this.st.childById();
    const out = new Map<number, { vb: string; shapes: MiniShape[] }>();
    for (const b of this.st.boxes()) {
      if (!b.showChildren || b.width < this.MINI_MIN_W || b.height < this.MINI_MIN_H) continue;
      if (!childById.get(b.childId)?.diagramId) continue;
      const shapes = this.previewCache.get(b.childId);
      if (!shapes || !shapes.length) continue;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const s of shapes) {
        minX = Math.min(minX, s.x); minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.w); maxY = Math.max(maxY, s.y + s.h);
      }
      const pad = 10;
      out.set(b.localId, { vb: `${minX - pad} ${minY - pad} ${(maxX - minX) + 2 * pad} ${(maxY - minY) + 2 * pad}`, shapes });
    }
    return out;
  });

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

    // Repopulate the inspector only when the selected object actually changes (not on every drag).
    effect(() => {
      const child = this.st.selectedChild();
      untracked(() => this.onSelectionChanged(child));
    });

    // Fetch child interiors for showChildren boxes; reset the cache when the parent canvas changes.
    effect(() => {
      const did = this.st.currentDiagramId();
      const boxes = this.st.boxes();
      const childById = this.st.childById();
      untracked(() => {
        if (did !== this.previewParent) {
          this.previewParent = did;
          this.previewCache.clear();
          this.previewFetched.clear();
        }
        for (const b of boxes) {
          if (!b.showChildren || this.previewFetched.has(b.childId)) continue;
          const diagramId = childById.get(b.childId)?.diagramId;
          if (diagramId != null) void this.fetchPreview(b.childId, diagramId, did);
        }
      });
    });
  }

  ngOnDestroy() { void this.st.flushSave(); }

  /**
   * Load a child's interior placement rects (x/y/w/h/color) for its mini-map preview. Cached per childId.
   * Guards on `parentDiagramId` so a fetch that lands after the user navigated away is dropped (its cache was
   * already cleared) rather than repopulating a stale entry / triggering a spurious re-render.
   */
  private async fetchPreview(childId: number, diagramId: number, parentDiagramId: number | null) {
    this.previewFetched.add(childId);
    try {
      const res = await firstValueFrom(this.placementApi.getByDiagram(diagramId));
      if (this.previewParent !== parentDiagramId) return;
      const shapes: MiniShape[] = (res?.responseData ?? [])
        .filter(p => (p.width ?? 0) > 0 && (p.height ?? 0) > 0)
        .map(p => ({ x: p.x ?? 0, y: p.y ?? 0, w: p.width ?? 0, h: p.height ?? 0, color: p.color || '#8aa0b6' }));
      this.previewCache.set(childId, shapes);
    } catch {
      if (this.previewParent === parentDiagramId) this.previewCache.set(childId, []);
    } finally {
      if (this.previewParent === parentDiagramId) this.previewsVersion.update(v => v + 1);
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
    const roots = all.filter(n => n.parentId == null);
    this.roots.set(roots);
    this.noNodes.set(all.length === 0);
    if (roots.length === 1) this.st.openNode(roots[0].id);
  }

  navigate(id: number) { void this.st.navigate(id); }

  // ── box rendering helpers ──
  boxLabel(b: MapBox): string {
    const c = this.st.childById().get(b.childId);
    return c?.name || c?.tagNumber || `#${b.childId}`;
  }
  boxType(b: MapBox): string | null { return this.st.childById().get(b.childId)?.type ?? null; }
  boxColor(b: MapBox): string { return b.color || poColor(this.boxType(b)); }
  boxGlyph(b: MapBox): PlantGlyph | undefined { return PLANT_GLYPH_BY_KEY.get(b.glyph || 'none'); }
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

  // ── pointer interaction ──
  private contentPoint(ev: PointerEvent): { x: number; y: number } {
    const el = this.contentRef?.nativeElement;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  private boxAt(x: number, y: number): MapBox | null {
    const list = this.st.boxes();
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) return b;
    }
    return null;
  }

  /** Empty-canvas press: deselect (box + pipe) and start a draw-to-create rubber band. */
  onCanvasDown(ev: PointerEvent) {
    const p = this.contentPoint(ev);
    this.st.selectedLocalId.set(null);
    this.st.selectedEdgeLocalId.set(null);
    this.drag = { kind: 'draw', startX: p.x, startY: p.y };
    this.rubber.set({ x: p.x, y: p.y, w: 0, h: 0 });
  }

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

  onBoxDblClick(b: MapBox) { void this.st.navigate(b.childId); }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(ev: PointerEvent) {
    const d = this.drag;
    if (!d) return;
    if (d.kind === 'move') {
      const nx = Math.max(0, d.origX + (ev.clientX - d.startClientX));
      const ny = Math.max(0, d.origY + (ev.clientY - d.startClientY));
      this.st.setBoxRect(d.localId, nx, ny, d.origW, d.origH);
    } else if (d.kind === 'resize') {
      const nw = Math.max(90, d.origW + (ev.clientX - d.startClientX));
      const nh = Math.max(52, d.origH + (ev.clientY - d.startClientY));
      this.st.setBoxRect(d.localId, d.origX, d.origY, nw, nh);
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
      if (r && r.w >= 24 && r.h >= 24) void this.createDrawnObject(r);
    }
    // move / resize were persisted live via setBoxRect's debounced save
  }

  /** Draw-to-create: a rubber-banded rectangle becomes a brand-new child object at that size/position. */
  private async createDrawnObject(r: { x: number; y: number; w: number; h: number }) {
    const created = await this.st.createChild({ name: 'New object', type: this.newType });
    if (!created) return;
    const localId = this.st.placeChild(created.id, r.x, r.y);
    if (localId != null) this.st.setBoxRect(localId, r.x, r.y, Math.max(90, r.w), Math.max(52, r.h));
  }

  // ── inspector: edit ──
  private onSelectionChanged(child: PhysicalObjectNode | null) {
    const id = child?.id ?? null;
    // Only reset the form when the selected OBJECT actually changes — never when the effect re-runs for the
    // same object (e.g. after a save refreshes the child list), so in-progress typing is never clobbered.
    if (id === this.lastSelectedNodeId) return;
    this.lastSelectedNodeId = id;
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

  // ── inspector: appearance (box glyph + color) ──
  setGlyph(key: string) { const id = this.st.selectedLocalId(); if (id != null) this.st.patchBox(id, { glyph: key }); }
  setColor(color: string) { const id = this.st.selectedLocalId(); if (id != null) this.st.patchBox(id, { color }); }

  // ── inspector: pipe (connection style) ──
  setPipeColor(color: string) { const id = this.st.selectedEdgeLocalId(); if (id != null) this.st.patchEdge(id, { color }); }
  setPipeWidth(width: number) { const id = this.st.selectedEdgeLocalId(); if (id != null) this.st.patchEdge(id, { width }); }
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
