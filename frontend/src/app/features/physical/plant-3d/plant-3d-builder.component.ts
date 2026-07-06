import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { firstValueFrom } from 'rxjs';
import { EquipmentFactory3dService } from './services/equipment-factory-3d.service';
import { Plant3dStore } from './services/plant-3d-store.service';
import { ModelFileRef, Plant3dModelService } from './services/plant-3d-model.service';
import { PRIMITIVE_KINDS, PrimitiveKind, SceneObject, ShapeDef } from './models/shape-3d.model';
import { PhysicalObjectApiService } from '../../../services/physical/physical-object-api.service';
import { NodeWriteRequest, PhysicalObjectNode, PO_TYPE_OPTIONS } from '../../../models/physical/physical-object.models';
import { ValueDto } from '../../../models/value.model';

type GizmoMode = 'translate' | 'rotate' | 'scale';

/** One row of the hierarchical add-equipment picker. */
interface TreeRow { node: PhysicalObjectNode; depth: number; hasChildren: boolean; expanded: boolean; placed: boolean; }

/**
 * The 3D plant BUILDER. Place real PhysicalObjects into a shared 3D scene, move/rotate/scale them with a gizmo,
 * and assign each one a reusable shape from a library (primitive shapes now; uploaded GLB models next). Persists
 * to a dedicated scene Diagram via Plant3dStore. Each placed item IS a PhysicalObject (pick from the tree or
 * quick-create). Simple primitives are the automatic fallback when a piece has no shape assigned.
 */
@Component({
  selector: 'app-plant-3d-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './plant-3d-builder.component.html',
  styleUrls: ['./plant-3d-builder.component.css'],
})
export class Plant3dBuilderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  private factory = inject(EquipmentFactory3dService);
  private store = inject(Plant3dStore);
  private models = inject(Plant3dModelService);
  private api = inject(PhysicalObjectApiService);

  readonly primKinds = PRIMITIVE_KINDS;
  readonly typeOptions = PO_TYPE_OPTIONS;

  shapes = signal<ShapeDef[]>([]);
  objects = signal<SceneObject[]>([]);
  selectedLocalId = signal<number | null>(null);
  selected = computed(() => this.objects().find(o => o.localId === this.selectedLocalId()) ?? null);
  selectedShape = computed(() => {
    const o = this.selected(); if (!o || o.shapeLocalId == null) return null;
    return this.shapes().find(s => s.localId === o.shapeLocalId) ?? null;
  });

  gizmoMode = signal<GizmoMode>('translate');
  snap = signal(false);
  loading = signal(true);
  saving = signal(false);
  dirty = signal(false);
  status = signal('');

  // add-equipment picker (hierarchical tree; flat filtered list while searching)
  tree = signal<PhysicalObjectNode[]>([]);
  search = signal('');
  expanded = signal<Set<number>>(new Set());

  private childrenOf = computed(() => {
    const m = new Map<number | null, PhysicalObjectNode[]>();
    for (const n of this.tree()) {
      const k = n.parentId ?? null;
      const arr = m.get(k); if (arr) arr.push(n); else m.set(k, [n]);
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    return m;
  });

  treeRows = computed<TreeRow[]>(() => {
    const placed = new Set(this.objects().map(o => o.physicalObjectId));
    const q = this.search().trim().toLowerCase();
    if (q) {
      return this.tree()
        .filter(n => (n.name ?? '').toLowerCase().includes(q) || (n.tagNumber ?? '').toLowerCase().includes(q))
        .slice(0, 200)
        .map(n => ({ node: n, depth: 0, hasChildren: false, expanded: false, placed: placed.has(n.id) }));
    }
    const kids = this.childrenOf(), exp = this.expanded(), rows: TreeRow[] = [];
    const walk = (parentId: number | null, depth: number) => {
      for (const n of kids.get(parentId) ?? []) {
        const hasChildren = (kids.get(n.id)?.length ?? 0) > 0;
        const isExp = exp.has(n.id);
        rows.push({ node: n, depth, hasChildren, expanded: isExp, placed: placed.has(n.id) });
        if (isExp && hasChildren) walk(n.id, depth + 1);
      }
    };
    walk(null, 0);
    return rows;
  });

  toggleExpand(id: number, ev: Event): void {
    ev.stopPropagation();
    this.expanded.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  newName = signal('');
  newType = signal<string>('EQUIPMENT');
  newParentId = signal<number | null>(null);

  // shape editor
  editingShape = signal<ShapeDef | null>(null);
  // model (GLB) upload
  glbEnabled = signal<boolean | null>(null);
  fileTypeOpts = signal<ValueDto[]>([]);
  vendorOpts = signal<ValueDto[]>([]);
  existingModels = signal<ModelFileRef[]>([]);
  modelFileTypeId = signal<number | null>(null);
  modelVendorId = signal<number | null>(null);
  uploading = signal(false);
  modelMsg = signal('');
  private modelOptsLoaded = false;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private orbit!: OrbitControls;
  private gizmo!: TransformControls;
  private raycaster = new THREE.Raycaster();
  private frame = 0;
  private groups = new Map<number, THREE.Object3D>();
  private diagramId: number | null = null;
  private seq = 1;
  private spawnN = 0;
  private saveTimer: any = null;
  private ro?: ResizeObserver;
  private onResize = () => this.resize();

  ngAfterViewInit() { this.initThree(); this.load(); }

  ngOnDestroy() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
    this.ro?.disconnect();
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.gizmo?.dispose();
    this.orbit?.dispose();
    this.renderer?.dispose();
  }

  // ── three.js setup ──
  private initThree(): void {
    const host = this.hostRef.nativeElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x141a20);

    this.camera = new THREE.PerspectiveCamera(55, host.clientWidth / host.clientHeight, 0.1, 3000);
    this.camera.position.set(22, 20, 28);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.shadowMap.enabled = true;
    host.appendChild(this.renderer.domElement);

    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.target.set(0, 1, 0);

    this.scene.add(new THREE.HemisphereLight(0xbfd4e6, 0x2a3038, 0.95));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(30, 50, 20); sun.castShadow = true;
    this.scene.add(sun);
    this.scene.add(new THREE.GridHelper(200, 100, 0x2c333b, 0x21262c));
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x191f26, roughness: 1, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.userData['ground'] = true;
    this.scene.add(ground);

    this.gizmo = new TransformControls(this.camera, this.renderer.domElement);
    this.gizmo.addEventListener('dragging-changed', (e: any) => (this.orbit.enabled = !e.value));
    this.gizmo.addEventListener('objectChange', () => this.onGizmoChange());
    this.scene.add(this.gizmo.getHelper());

    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPick(e));
    window.addEventListener('resize', this.onResize);
    // The center column reflows when the inspector panel appears/disappears (no window resize fires) — keep the
    // canvas matched to its container so it never overflows over the side panels.
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);

    const animate = () => { this.frame = requestAnimationFrame(animate); this.orbit.update(); this.renderer.render(this.scene, this.camera); };
    animate();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [scene, tree] = await Promise.all([this.store.loadScene(), firstValueFrom(this.api.getTree())]);
      this.diagramId = scene.diagramId;
      this.tree.set(tree ?? []);
      let shapes = scene.shapes;
      if (!shapes.length) shapes = this.defaultShapes();      // seed a starter library on first use
      this.shapes.set(shapes);
      this.objects.set(scene.objects);
      this.seq = Math.max(0, ...shapes.map(s => s.localId), ...scene.objects.map(o => o.localId)) + 1;
      for (const o of scene.objects) this.addGroup(o);
      this.status.set(scene.objects.length ? `Loaded ${scene.objects.length} items` : 'Empty scene — add equipment from the left');
    } catch (e: any) {
      this.status.set('Load failed: ' + (e?.message ?? e));
    } finally {
      this.loading.set(false);
    }
  }

  private defaultShapes(): ShapeDef[] {
    const mk = (name: string, prim: PrimitiveKind, color: string): ShapeDef => ({ localId: this.seq++, name, kind: 'primitive', prim, color, metalness: 0.35, roughness: 0.6 });
    return [ mk('Box', 'box', '#8a97a6'), mk('Tank / drum', 'cylinder', '#5b9bd5'), mk('Vessel (sphere)', 'sphere', '#66bb6a'), mk('Pump / motor', 'capsule', '#ab47bc'), mk('Hopper', 'cone', '#ffa726') ];
  }

  // ── scene object <-> three group ──
  private addGroup(o: SceneObject): void {
    const shape = o.shapeLocalId != null ? this.shapes().find(s => s.localId === o.shapeLocalId) ?? null : null;
    const g = this.factory.buildSceneObject(o, shape);
    this.groups.set(o.localId, g);
    this.scene.add(g);
  }

  private rebuildGroup(o: SceneObject): void {
    const old = this.groups.get(o.localId);
    if (old) { this.scene.remove(old); this.gizmo.object === old && this.gizmo.detach(); }
    this.addGroup(o);
    if (this.selectedLocalId() === o.localId) this.gizmo.attach(this.groups.get(o.localId)!);
  }

  /** Rebuild every object using a given shape (after the shape's look changes). */
  private rebuildUsers(shapeLocalId: number): void {
    for (const o of this.objects()) if (o.shapeLocalId === shapeLocalId) this.rebuildGroup(o);
  }

  // ── add / remove equipment ──
  addFromTree(node: PhysicalObjectNode & { placed?: boolean }): void {
    const existing = this.objects().find(o => o.physicalObjectId === node.id);
    if (existing) { this.select(existing.localId); return; }        // don't place the same object twice
    this.spawn(node.id, node.name, node.type);
  }

  async quickCreate(): Promise<void> {
    const name = this.newName().trim();
    if (!name) { this.status.set('Enter a name for the new equipment'); return; }
    const node = await firstValueFrom(this.api.createNode({ name, type: this.newType(), parentId: this.newParentId() }));
    if (!node) { this.status.set('Create failed'); return; }
    this.tree.update(t => [...t, node]);
    this.newName.set('');
    this.spawn(node.id, node.name, node.type);
  }

  private spawn(physicalObjectId: number, name: string, type: string | null): void {
    const t = this.orbit.target;
    const container = type === 'PLANT' || type === 'SECTION' || type === 'SYSTEM';
    const col = this.spawnN % 5, row = Math.floor(this.spawnN / 5); this.spawnN++;
    const size = container ? { w: 8, h: 3, d: 8 } : { w: 2, h: 2, d: 2 };  // areas start large + see-through
    const o: SceneObject = {
      localId: this.seq++, physicalObjectId, name, type, shapeLocalId: null,
      pos: { x: Math.round(t.x) + (col - 2) * 4, y: size.h / 2, z: Math.round(t.z) + row * 4 },
      rot: { x: 0, y: 0, z: 0 }, size, shell: container,
    };
    this.objects.update(list => [...list, o]);
    this.addGroup(o);
    this.select(o.localId);
    this.markDirty();
    this.status.set(`Placed ${name}`);
  }

  removeSelected(): void {
    const o = this.selected(); if (!o) return;
    const g = this.groups.get(o.localId);
    if (g) { this.gizmo.detach(); this.scene.remove(g); this.groups.delete(o.localId); }
    this.objects.update(list => list.filter(x => x.localId !== o.localId));
    this.selectedLocalId.set(null);
    this.markDirty();
  }

  // ── selection + gizmo ──
  private onPick(ev: PointerEvent): void {
    if ((this.gizmo as any).axis) return;                 // grabbing a gizmo handle — not a selection click
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects([...this.groups.values()], true);
    for (const h of hits) {
      let n: THREE.Object3D | null = h.object;
      while (n && n.userData['localId'] == null) n = n.parent;
      if (n) { this.select(n.userData['localId']); return; }
    }
    this.select(null);
  }

  select(localId: number | null): void {
    this.selectedLocalId.set(localId);
    const g = localId != null ? this.groups.get(localId) : null;
    if (g) { this.gizmo.attach(g); this.gizmo.setMode(this.gizmoMode()); this.applySnap(); }
    else this.gizmo.detach();
  }

  setMode(m: GizmoMode): void { this.gizmoMode.set(m); if (this.gizmo.object) this.gizmo.setMode(m); }
  toggleSnap(): void { this.snap.update(s => !s); this.applySnap(); }
  private applySnap(): void {
    const on = this.snap();
    this.gizmo.setTranslationSnap(on ? 1 : null);
    this.gizmo.setRotationSnap(on ? THREE.MathUtils.degToRad(15) : null);
    this.gizmo.setScaleSnap(on ? 0.25 : null);
  }

  /** Gizmo dragged → read the transform back into the SceneObject. */
  private onGizmoChange(): void {
    const g = this.gizmo.object as THREE.Object3D | undefined;
    if (!g) return;
    const o = this.objects().find(x => x.localId === g.userData['localId']);
    if (!o) return;
    o.pos = { x: round(g.position.x), y: round(g.position.y), z: round(g.position.z) };
    o.rot = { x: g.rotation.x, y: g.rotation.y, z: g.rotation.z };
    o.size = { w: round(g.scale.x), h: round(g.scale.y), d: round(g.scale.z) };
    this.objects.set([...this.objects()]);            // notify (inspector reads live values)
    this.markDirty();
  }

  // ── inspector edits (numeric) ──
  setPos(axis: 'x' | 'y' | 'z', v: string): void { const o = this.selected(); if (!o) return; o.pos = { ...o.pos, [axis]: +v || 0 }; this.applyTransform(o); }
  setSize(axis: 'w' | 'h' | 'd', v: string): void { const o = this.selected(); if (!o) return; o.size = { ...o.size, [axis]: Math.max(0.05, +v || 0.05) }; this.applyTransform(o); }
  setRotDeg(axis: 'x' | 'y' | 'z', v: string): void { const o = this.selected(); if (!o) return; o.rot = { ...o.rot, [axis]: THREE.MathUtils.degToRad(+v || 0) }; this.applyTransform(o); }
  private applyTransform(o: SceneObject): void {
    const g = this.groups.get(o.localId);
    if (g) { g.position.set(o.pos.x, o.pos.y, o.pos.z); g.rotation.set(o.rot.x, o.rot.y, o.rot.z); g.scale.set(o.size.w, o.size.h, o.size.d); }
    this.objects.set([...this.objects()]);
    this.markDirty();
  }
  rotDeg(axis: 'x' | 'y' | 'z'): number { const o = this.selected(); return o ? Math.round(THREE.MathUtils.radToDeg(o.rot[axis])) : 0; }

  assignShape(shapeLocalId: number | null): void {
    const o = this.selected(); if (!o) return;
    o.shapeLocalId = shapeLocalId;
    this.objects.set([...this.objects()]);
    this.rebuildGroup(o);
    this.markDirty();
  }

  setColor(v: string): void { const o = this.selected(); if (!o) return; o.color = v; this.objects.set([...this.objects()]); this.rebuildGroup(o); this.markDirty(); }
  setShell(v: boolean): void { const o = this.selected(); if (!o) return; o.shell = v; this.objects.set([...this.objects()]); this.rebuildGroup(o); this.markDirty(); }

  openObject(): void { const o = this.selected(); if (o) window.open(`/plant/map/${o.physicalObjectId}`, '_blank'); }

  // ── hierarchy: edits the SHARED PhysicalObject via updateNode (patch: absent fields unchanged) ──
  private treeNode(): PhysicalObjectNode | undefined { const o = this.selected(); return o ? this.tree().find(n => n.id === o.physicalObjectId) : undefined; }
  objectParentId(): number | null { return this.treeNode()?.parentId ?? null; }
  objectLevel(): number | null { return this.treeNode()?.floorIndex ?? null; }
  parentName(): string { const pid = this.objectParentId(); return pid == null ? '— root —' : (this.tree().find(n => n.id === pid)?.name ?? '?'); }

  /** Indented node list for the parent pickers; `skip` drops a node and its whole subtree (no cycles). */
  parentOptions = computed(() => this.indentedOptions(this.selected() ? new Set([this.selected()!.physicalObjectId]) : new Set<number>()));
  allParentOptions = computed(() => this.indentedOptions(new Set<number>()));
  private indentedOptions(skip: Set<number>): { id: number; label: string }[] {
    const kids = this.childrenOf(), out: { id: number; label: string }[] = [];
    const walk = (pid: number | null, depth: number) => {
      for (const n of kids.get(pid) ?? []) {
        if (skip.has(n.id)) continue;                 // skip node + its subtree (can't parent under self/descendant)
        out.push({ id: n.id, label: ' '.repeat(depth) + n.name + (n.type ? ` · ${n.type}` : '') });
        walk(n.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  }

  setName(v: string): void { if (v.trim()) this.patchNode({ name: v.trim() }); }
  setType(v: string): void { this.patchNode({ type: v }); }
  moveUnder(parentId: number | null): void { if (parentId != null) this.patchNode({ parentId }); }
  setLevel(v: string): void { if (v !== '' && v != null) this.patchNode({ floorIndex: Math.round(+v) }); }

  private async patchNode(patch: NodeWriteRequest): Promise<void> {
    const o = this.selected(); if (!o) return;
    const updated = await firstValueFrom(this.api.updateNode(o.physicalObjectId, patch));
    if (!updated) { this.status.set('Update failed'); return; }
    this.tree.update(t => t.map(n => n.id === updated.id ? updated : n));
    const typeChanged = o.type !== updated.type;
    o.name = updated.name; o.type = updated.type;
    this.objects.set([...this.objects()]);
    if (typeChanged) this.rebuildGroup(o);            // fallback primitive depends on PhysicalObject type
    this.markDirty();                                  // keep the Object3D placement's name in sync
    this.status.set('Updated ' + updated.name);
  }

  // ── shape library ──
  newShape(): void { this.editingShape.set({ localId: this.seq++, name: 'New shape', kind: 'primitive', prim: 'box', color: '#8a97a6', metalness: 0.35, roughness: 0.6 }); }
  editShape(s: ShapeDef): void { this.editingShape.set({ ...s }); if (s.kind === 'model') this.ensureModelOptions(); }

  setShapeKind(kind: 'primitive' | 'model'): void { this.patchEditingShape({ kind }); if (kind === 'model') this.ensureModelOptions(); }

  /** Lazily load model-upload options: is GLB enabled, file-type + vendor Values, and already-uploaded models. */
  private async ensureModelOptions(): Promise<void> {
    if (this.modelOptsLoaded) return;
    this.modelOptsLoaded = true;
    try {
      this.glbEnabled.set(await this.models.glbEnabled());
      const [fts, vns, existing] = await Promise.all([this.models.fileTypes(), this.models.vendors(), this.models.existingModels()]);
      this.fileTypeOpts.set(fts); this.vendorOpts.set(vns); this.existingModels.set(existing);
      this.modelFileTypeId.set((fts.find(f => /3d|model/i.test(f.name)) ?? fts[0])?.id ?? null);
      this.modelVendorId.set(vns[0]?.id ?? null);
    } catch { this.modelOptsLoaded = false; }
  }

  pickExistingModel(fileId: number | null): void {
    if (fileId == null) return;
    const m = this.existingModels().find(x => x.id === fileId);
    if (m) this.patchEditingShape({ kind: 'model', modelFileId: m.id, modelUrl: m.url });
  }

  async onModelFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const ft = this.modelFileTypeId(), vn = this.modelVendorId();
    const es = this.editingShape();
    if (!es) return;
    if (ft == null || vn == null) { this.modelMsg.set('Pick a file type and vendor first.'); input.value = ''; return; }
    this.uploading.set(true); this.modelMsg.set('Uploading…');
    try {
      const ref = await this.models.upload(file, ft, vn, es.name || file.name);
      this.patchEditingShape({ kind: 'model', modelFileId: ref.id, modelUrl: ref.url });
      this.existingModels.update(list => [ref, ...list.filter(m => m.id !== ref.id)]);
      this.modelMsg.set('Uploaded ' + ref.name);
    } catch (e: any) {
      this.modelMsg.set('Upload failed: ' + (e?.error?.message ?? e?.message ?? e));
    } finally {
      this.uploading.set(false); input.value = '';
    }
  }
  cancelShape(): void { this.editingShape.set(null); }
  saveShape(): void {
    const s = this.editingShape(); if (!s) return;
    this.shapes.update(list => list.some(x => x.localId === s.localId) ? list.map(x => x.localId === s.localId ? s : x) : [...list, s]);
    this.rebuildUsers(s.localId);
    this.editingShape.set(null);
    this.markDirty();
  }
  deleteShape(s: ShapeDef): void {
    for (const o of this.objects()) if (o.shapeLocalId === s.localId) { o.shapeLocalId = null; this.rebuildGroup(o); }
    this.shapes.update(list => list.filter(x => x.localId !== s.localId));
    this.objects.set([...this.objects()]);
    this.markDirty();
  }
  patchEditingShape(patch: Partial<ShapeDef>): void { const s = this.editingShape(); if (s) this.editingShape.set({ ...s, ...patch }); }

  // ── save ──
  private markDirty(): void {
    this.dirty.set(true);
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 1500);
  }
  async save(): Promise<void> {
    if (this.diagramId == null || this.saving()) return;
    if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    this.saving.set(true);
    try {
      await this.store.saveScene(this.diagramId, this.shapes(), this.objects());
      this.dirty.set(false);
      this.status.set('Saved');
    } catch (e: any) {
      this.status.set('Save failed: ' + (e?.message ?? e));
    } finally {
      this.saving.set(false);
    }
  }

  private resize(): void {
    const host = this.hostRef.nativeElement;
    const w = host.clientWidth, h = host.clientHeight;
    if (!this.renderer || w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

function round(v: number): number { return Math.round(v * 100) / 100; }
