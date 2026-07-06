# Plant Map, 3D Viewer & 3D Builder

The built realization of the [virtual-plant vision](overview.md): one **PhysicalObject** tree, rendered
three ways. The **2D Plant Map** lays the plant out top-down (footprints, levels, systems, routed pipes +
fittings, cross-section connectors, a no-physics flow sim); the **3D Viewer** is a phone-light read-only
scene; the **3D Builder** places real equipment in 3D, moves/rotates/scales it, assigns reusable shapes,
uploads custom GLB models, and edits the hierarchy in place. All three share one entity and persist through
the same `DiagramPlacement` mechanism — no schema change, no restart (except enabling model upload).

## Routes
- `/plant/map`, `/plant/map/:nodeId` — 2D Plant Map
- `/plant/3d` — 3D Viewer (read-only, sample data)
- `/plant/3d/build` — 3D Builder
- Nav: **Plant** group (router-menu + navigation-card), plus a **Build ›** link in the viewer HUD.

## Architecture in one breath
```
PhysicalObject tree (/ng/physical-object/*) ──┐
                                              ├─▶ 2D Map      plant-map.component + plant-map-state.service
DiagramPlacement (/ng/diagram-placements/*) ──┤   3D Viewer   plant-3d.component (Layout3dService + factory)
Diagram          (/ng/diagrams/*)            ─┘   3D Builder  plant-3d-builder.component (+ store, model svc)
                                                  Models      GLB on disk, served /uploads/** (WebConfigurer)
```
- **One diagram per node** is the node's 2D canvas (`getOrCreateDiagram`). The **3D scene** is a *separate,
  standalone* `Diagram` named `__PLANT_3D_SCENE__` that the builder owns exclusively → `bulkSave` replaces
  the whole scene atomically with no risk of clobbering 2D maps.
- Multiple placement kinds coexist in one diagram, keyed by `sourceEntityType`; geometry rides in the
  `svgPath` **TEXT** column as JSON. `bulkSave/{diagramId}` = upsert-by-`localId` + soft-delete-missing.
- Every placed thing (2D box, pipe, fitting, 3D object) **is a real PhysicalObject**; `sourceEntityId` links
  the placement back to it. Rename/reparent in any tool → visible in the tree, 2D map, systems, Maximo binder.

## Key files
**Frontend**
- `frontend/src/app/features/physical/plant-map/plant-map.component.ts` — 2D map (pipes, fittings, flow sim,
  levels, connectors, reroute, nested zoom).
- `frontend/src/app/features/physical/plant-map/services/plant-map-state.service.ts` — load/save (`loadCanvas`,
  `doSave`), pipe placements (`PIPE_SRC='Pipe'`), levels, systems.
- `frontend/src/app/features/physical/plant-3d/`
  - `models/three-equipment.model.ts` — `ThreeEquipmentInt`, `ConnectionPoint`, `EquipmentConnection`, `PlacementData`.
  - `models/shape-3d.model.ts` — `ShapeDef`, `SceneObject`, `PrimitiveKind`; consts `SCENE_DIAGRAM_NAME`,
    `SHAPE_SRC='Shape3D'`, `OBJECT_SRC='Object3D'`.
  - `data/connection-points.ts` — `connectionPointsFor(type,size)` (generic per-type anchors).
  - `services/layout-3d.service.ts` — `Layout3dService.calculateLayout` (connection-based placement).
  - `services/equipment-factory-3d.service.ts` — primitives per type + `buildSceneObject`, `primGeometry`,
    GLTF loading (`loadModelTemplate`, `normalizeToUnitBox`), shells (`makeShell`, `shellModel`).
  - `services/plant-3d-store.service.ts` — scene diagram get-or-create, load/save `Object3D`+`Shape3D`.
  - `services/plant-3d-model.service.ts` — GLB upload/list/URL (reuses the FileObject pipeline).
  - `plant-3d.component.*` — viewer. `plant-3d-builder.component.*` — builder.
- `frontend/src/app/routes/plant.routes.ts` — routes.

**Backend** (all pre-existing; reused, not modified except the extension whitelist)
- `entities/diagrams/DiagramPlacement.java` — `svgPath`/`description`/`text`/`simParamsJson` are `@Column TEXT`;
  `rotation` is 2D-only; **no 3D fields** (3D transform rides in `svgPath` JSON).
- `entities/physical/PhysicalObject.java` — has an unused `model3dRef` col (not exposed by CreateNodeRequest).
- `controller/angular/diagrams/NgDiagramPlacementController.java` — `/ng/diagram-placements/by-diagram/{id}`,
  `/bulk-save/{id}`.
- `controller/angular/NgPhysicalObjectController.java` — tree/children/create/update(patch)/`/{id}/diagram`.
- `controller/angular/file/NgFileRestController.java` — `/ng/files/multi-upload`, `/allowed-extensions`,
  `/by-extensions`.
- `config/WebConfigurer.java` — static handler `/uploads/**` → `file:./uploads/`.
- `src/main/resources/application.properties` — `files.allowed-extensions` (now includes `glb,gltf`).

---

## 2D Plant Map

- **Navigation** — recursive zoom-nesting (containers reveal children in-footprint as you zoom, any depth);
  **Detail −/+** LOD; rail **tree navigator** + breadcrumb (jump anywhere, auto-expand); nested single-click =
  info, double-click = drill in.
- **Building blocks** — draw a box = create a child PhysicalObject with a footprint (rect / round / circle /
  pipe-run); move/resize handles; name-in-place; local reference-image underlay (per-device, not uploaded).
- **Levels** — a leveled node renders **view-from-top**: top deck solid, lower decks outline-only where they
  overhang. Ordered by `floorIndex`; a lower item is hidden only when *fully* covered. **Peeler** switches the
  edited deck; dashed **Base** entry holds pre-level content.
- **Systems & work areas** — Systems are a cross-cutting **overlay** (not tree parenting); toggle to highlight.
  Work areas bind a permit safety profile → children carry a safety badge.
- **Pipes & fittings** — a **pipe is a real PhysicalObject** drawn as a routed line (`sourceEntityType='Pipe'`,
  path+fittings+ports in `svgPath` JSON); **fittings** (valve/drain/vent/instrument/spray) are child objects
  anchored along the path. Draw: pipe tool → left-click vertices (90° guide snap) → right-click/`Enter`/finish,
  `Esc` cancel. **Branch/tee** = start a pipe on an existing one; **connect** = end on one (junction dots).
  **Reroute** tool: drag vertex to move, drag segment midpoint to add a bend, dbl-click vertex to remove.
- **Cross-section connectors** — explicit **ports** (`PipePort {linkId, at, section}`): **Continue in another
  area** arms a link, navigate to the next section, keep drawing; the two ends share a `linkId` (true
  counterparts). Source = pipe END, dest = next pipe START. Double-click a connector to jump; the far end
  **pulses**. P&ID-page-connector style.
- **Flow simulation (visual, no physics)** — node-edge graph: pipes split at endpoints/valves/junctions into
  edges; BFS from a clicked **source**; flow stops at a **closed** valve and **routes around** it (bypass);
  spans sections via matching `linkId` ports; whole run animates in the parent view. Valves clickable even
  when zoomed out. **Valve colour is intentionally inverted: green = closed, red = open.** Caveat: a
  parent-view valve toggle is session-wide in the sim but only persists for the section being edited.
- **Snap to grid** — 28px grid; pipe vertices + box move/resize snap; branch-snap onto a pipe still wins.
- **Inspector** — every object (box/pipe/fitting) opens the same binder: **Systems / Safety (work areas) /
  Maximo (WO+SR) / Documents (files)**.

## 3D Viewer (`/plant/3d`)

Read-only, phone-light (DPR capped at 2). Orbit / scroll-pinch zoom / tap-for-info. Runs on
`data/sample-plant.ts`. Demonstrates **connection-based layout**: `Layout3dService.calculateLayout` places a
child by aligning its `ConnectionPoint` to a parent's; logical `EquipmentConnection` links draw as colored
lines. Info panel shows type / tag / status / size / position, and for connection-placed items a note that the
engine computed the position.

## 3D Builder (`/plant/3d/build`)

Three panels: **add equipment + shape library** (left), **scene** (center), **inspector** (right, on select).
Autosaves ~1.5s after changes via `Plant3dStore.saveScene` (one `bulkSave` of shapes+objects).

- **Placing equipment** — left rail = collapsible hierarchy of every PhysicalObject (`getTree`; ▸/▾ chevrons,
  search flattens to matches; ✓ = already placed, won't duplicate). Or **quick-create** (name + type + parent
  picker → `createNode`). Containers (PLANT/SECTION/SYSTEM) spawn large (8×3×8) + **see-through**; equipment
  spawns compact. New items scatter near the camera target.
- **Transform** — click to select → **TransformControls** gizmo (r181 API: `getHelper()`; `dragging-changed`
  disables orbit; `objectChange` writes pos/rot/size back). Toolbar **Move / Rotate / Scale**; **⊞ Snap**
  (1 m / 15° / 0.25). Inspector has typed Size (w×h×d, m), Position (x,y,z), Rotation (°). Elevation = Y.
- **Hierarchy · shared** — edits the underlying PhysicalObject via `updateNode` (patch: absent fields
  unchanged): rename, change type (updates the fallback primitive), **Move under** (reparent; picker hides
  self+subtree → no cycles), Level (`floorIndex`). **Remove from scene** ≠ delete — the PhysicalObject is
  untouched. *Reparent-to-root unsupported* (patch null=unchanged); set root parentage at create time.
- **Shape library** — a **ShapeDef** is a reusable look; assign one to many objects (change once → all update).
  Object with no shape → auto primitive by type. **Primitives:** box / cylinder / sphere / cone / torus /
  capsule + color + metalness/roughness. Unit-sized, scaled per instance. Seeds 5 starters on first run.
- **See-through shells** — `SceneObject.shell`: faint transparent fill (`depthWrite=false` so it never
  occludes) + `EdgesGeometry` outline. Containers default on. Inspector checkbox.

### GLB / GLTF model upload
Reuses the FileObject pipeline (`plant-3d-model.service.ts` → `RfFileApiService.uploadMultipleFiles`).
- **Requires one restart:** `.glb`/`.gltf` were added to `files.allowed-extensions` (application.properties);
  `@Value` is read at startup, so **restart the backend once** to accept uploads. (`stl,obj,3mf` were already
  whitelisted.) Everything else — shells, rendering, picking an existing model — works on frontend reload.
- **Flow:** shape editor → kind **3D model** → *Use existing* (any already-uploaded GLB, via
  `getByExtensions(['glb','gltf'])` — reuse across shapes) **or** upload new (pick **File Type** + **Vendor**
  Values, then the `.glb`). A `.glb` hits `DirectUploadStrategy` → stored **byte-for-byte**, no image
  processing.
- **Rendering:** `GLTFLoader` (from `three/examples/jsm/loaders/GLTFLoader.js`), cached per URL,
  `normalizeToUnitBox` (center + fit to 1×1×1 so `group.scale`=size behaves like a primitive), async
  placeholder→model swap. Fetch URL = `encodeURI('/' + fileLink)` (root-relative; served by `/uploads/**`).
- **Not supported (v1):** DRACO-compressed GLB (no DRACOLoader → stays a wireframe box). Export without Draco.
- Value resolution: file types/vendors come from `SharedDataService.loadFileTypes()/loadVendors()` (categories
  `'fileType'`/`'vendor'`). **Not auto-created** — the frontend `CategoryDto` has no values, and the
  `/of-category/{key}` key vs display-name mismatch is unresolved, so the user picks from existing. A dedicated
  "3D Model" fileType (made in the Files area) auto-selects here.

---

## Anchor points & connections
- **Engine — implemented; Viewer uses it. Builder — not yet.** A `ConnectionPoint` = named local position +
  outward direction (`InletConn`/`OutletConn`/`SuctionConn`/`DischargeConn`/`TopConn`). `Layout3dService`
  snaps a child's anchor to a parent's (position + opposing direction) and resolves a chain outward.
  `connectionPointsFor(type,size)` gives **generic per-type** anchors. The 3D **viewer** runs on this.
- **Gaps:** the **builder** uses the free gizmo (parent=logical hierarchy, not a geometric snap); **uploaded
  GLBs are normalized to a box and their `*Conn` empties are NOT harvested** (three-plant's GLB
  connection-point extraction was not ported).
- **Author models anchor-ready now:** real scale, **+Y up**, origin at a base face/centreline; an empty at each
  nozzle named with a `Conn` suffix, oriented so its axis points **out** of the connection; clean root
  hierarchy. Connection records double as the 2D flow graph — one convention feeds flow sim + 3D layout.
- **Next builds:** (1) per-shape named anchors + harvest `*Conn` empties from GLB; (2) an anchor-snap
  placement mode in the builder reusing `Layout3dService`.

## Recommended build workflow
Coarse-to-fine, containers first; use the 2D map as the ground-plane layout, then lift into 3D.
1. Fix scale (1 unit = 1 m) + a datum (a building corner / turbine centreline = origin; matters for later
   geometry import). +Y up, ground = X–Z.
2. Block out big volumes (PLANT/SECTION/SYSTEM as large see-through boxes) — envelope, not detail.
3. Establish decks — set each deck's elevation (Y) + Level (`floorIndex`); parent equipment to its deck.
4. Place major equipment roughly to scale on the right deck; parent-as-you-go so the tree stays true.
5. Leave small stuff + connectivity to the 2D pipe tool (same object graph, faster).
6. Swap primitives → real GLB models last; one uploaded model updates every instance.

The 2D footprints already **are** the top-down layout (x/y → 3D x/z). A planned **"seed 3D from 2D
footprints"** import would drop a 2D-drawn section straight into the scene.

## Deferred / not built
- Anchor-snap placement + per-shape/model anchors in the builder (see above).
- "Seed 3D from 2D footprints" importer.
- DRACO GLB support; reparent-to-root; a dedicated "3D Model" fileType + auto-filing.
- InstancedMesh at plant-scale (30–50k items).
- Cross-section persistence of parent-view valve toggles in the 2D flow sim.

## History
- Design + decisions recorded in [overview.md](overview.md) and the Slice-1 → routed-pipe evolution.
- 2D map (footprints, levels, systems, pipes/fittings, connectors, flow sim, snap) — built 2026-07-03…05.
- 3D viewer (ported from the external `three-plant` prototype) — 2026-07-05.
- 3D builder + transparent shells + GLB upload — 2026-07-05.
