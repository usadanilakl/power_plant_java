# PhysicalObject ↔ Maximo Integration — Design

Status: **proposed** (design review before code)
Related: [refactor-plan.md](../global/refactor-plan.md) Phases 1 (hierarchy) + 4 (external refs) + 5 (Object Dialog Maximo tab)

## Context & goal

The refactor introduces **PhysicalObject** as the canonical asset record forming the tree
`Plant → Section → System → Skid → Equipment → Location`, to which every domain object attaches
(Files, Permits, LOTO, Logs, Defects, SDS, Live Data, Schedules) plus the Maximo records we've built
(WOs, PMs, SRs, inventory). This doc covers **how PhysicalObject is created and bound to Maximo**, and
how the Maximo features we already shipped plug into it.

## Key insight: Maximo already holds the hierarchy

The plan's Phase 1 reconstructs the tree by backfilling from LotoPoint + `Value` rows (messy: `system` is a
string on LotoPoint, a `Value` FK on Equipment; SKID/LOCATION have no data source and must be hand-built).

**We don't need to reconstruct it.** Live-verified against JG: `mxapioperloc` (Maximo operating locations)
is the complete plant tree, each node carrying:

- `spi:location` (code, e.g. `00-DMW-RO`), `spi:description` ("REVERSE OSMOSIS SKID")
- `spi:parent` (`00-DMW`) — the direct parent → the whole tree `00-DMW-RO → 00-DMW → 00 → JG`
- `spi:type` / `spi:type_description`, `spi:children`, `spi:haschildren`, `spi:hasparent`
- `spi:locancestor` (full ancestor chain), `spi:systemid` (= `PRIMARY` hierarchy)

…and every `mxasset` sits in a location via `spi:location`. So **Maximo seeds PhysicalObject's structure
accurately and completely, and the Maximo link becomes inherent** (a PhysicalObject *is* a Maximo location or
asset) instead of a fragile after-the-fact name match. This collapses "Phase 1 backfill" + "Phase 4 Maximo
linkage" into one move.

## Decisions (locked)

1. **Authority = local-owned, Maximo-seeded.** Maximo seeds structure + supplies link keys, but the tree is
   ours. Re-seeding only **inserts new** Maximo nodes and refreshes descriptions on Maximo-keyed rows — it
   never clobbers local edits or hand-added nodes (floors/levels/skids Maximo lacks). This is required for the
   Phase-5 level selector and any non-Maximo node.
2. **Naming:** `PhysicalObject` (working name from the plan; revisit before code if a better one emerges — the
   plan lists `Asset`/`Node` as fallbacks).
3. **Data binding = typed FK *into* PhysicalObject.** PhysicalObject owns only its identity; each domain entity
   gets a nullable `@ManyToOne physicalObject` and "everything about this object" is a computed fan-out
   (`PhysicalObjectAggregateService`). No `@OneToMany` god-collections; no single polymorphic attachment table.
   Cross-cutting entities already keyed by `entityType + entityId` (Comment, EmailCorrespondence, FireImpairment)
   attach with `entityType="PhysicalObject"`. (See *Data binding model*.)
4. **Rendering reuses the existing Canvas2D `InteractiveImageComponent`** (the production LOTO/equipment marker
   surface — *not* `DiagramCanvasComponent`, which is coupled to the Diagram + simulation model and uses absolute
   pixels; the doc's earlier "Pixi canvas" wording was stale). A map surface = a backdrop image + child markers
   at **image-relative** coordinates; the map is recursive (drill node → node). It "looks like the plant"
   because backdrops are **real images**, not hand-drawn. (See *Rendering model* + *Renderer build*.)
5. **Placement & connections are separate entities, not fields on PhysicalObject.** Placement = `ObjectMarker`
   (the renamed `Equipment`: one row per object × backdrop × coordinates). The node's own backdrop = FK
   *reference* fields on PhysicalObject. Object-to-object **edges** (flow/adjacency) = a deferred
   `PhysicalObjectConnection` mirroring `FileConnector`. (See *Placement, connections & representation*.)

## The PhysicalObject entity

```
PhysicalObject extends BaseAuditEntity          // → FieldChangeEntityListener, soft-delete, device-prefixed id
  name                 String
  type                 enum { PLANT, SECTION, SYSTEM, SKID, EQUIPMENT, LOCATION }
  parent               @ManyToOne PhysicalObject          // the tree (index parent_id)
  tagNumber            String
  description          String
  specificLocation     String

  ── Maximo binding ──────────────────────────────────────────────
  maximoSiteid         String   // "JG"
  maximoLocation       String   // "00-DMW-RO"      (set on hierarchy nodes)
  maximoAssetnum       String   // "00-DWT-FLT-02A" (set on EQUIPMENT nodes)
  maximoType           String   // Maximo location/asset type (informational)
  maximoKey            String   // computed natural key (see below); indexed, non-unique
  localUuid            String   // for nodes NOT from Maximo (hand-added floors/skids)

  ── representation (Phase 5 placeholders, schema-only for now) ──
  sitePlanFileId, floorPlanFileId, pidFileId  // FileObject refs
  model3dRef           String
  floorIndex           Integer  // level-selector ordering
```

**Natural key (`maximoKey`)** — same pattern as `RecurringPm.pmKey`:
- Maximo location node → `"{siteid}|LOC:{location}"`
- Maximo equipment node → `"{siteid}|AST:{assetnum}"`
- local-only node → null; dedup on `localUuid` instead (same as `InstrumentLog.localUuid`)

Set `maximoKey` on save (like `RecurringPm.keyFor`). It's what makes re-seed idempotent and keeps the binding
stable across CRDT sync.

## Sync registration (the 4 places — RecurringPm is the template)

1. **Entity** extends `BaseAuditEntity` → picks up `FieldChangeEntityListener` + `DevicePrefixedIdGenerator`
   automatically. `@Table(name="physical_object")`, `@Where(clause="deleted IS NOT TRUE")`.
2. **`EntityTableRegistry`** — `ENTITY_TYPE_TO_TABLE` entry `("PhysicalObject","physical_object")` +
   `SYNC_ORDER` in **Tier 1** (self-referential, depends on nothing external; its own `parent` FK is resolved
   by the existing three-pass ManyToOne-retry apply).
3. **`ServiceFacade`** — `@Lazy PhysicalObjectSyncService` constructor param + `serviceMap.put(...)`, backed by
   a thin `PhysicalObjectSyncService implements SyncableService<PhysicalObject>` (copy `RecurringPmSyncService`).
4. **`DedupKeyResolver.NATURAL_KEYS`** — `("PhysicalObject", [maximoKey OR localUuid])` so inbound CREATEs
   reconcile instead of duplicating (critical: the seeder runs per-hub and syncs out).

SharePoint adapter: **defer.** PhysicalObject is Maximo-seeded + locally edited; it doesn't need a SharePoint
round-trip in the first slices. Add later only if the hierarchy must live in SharePoint too.

## Maximo seeder (structure + link)

`PhysicalObjectMaximoSeeder` — hub-only (`@ConditionalOnProperty sync.role=hub` or an admin-triggered endpoint),
idempotent, upsert by `maximoKey`:

1. **Locations** — new `MaximoLocationAdapter.getAllLocations(site)` (page `mxapioperloc`, select
   `location,description,parent,type`; the paged `getAllMembers` we already use). Upsert one PhysicalObject per
   location; set `parent` by resolving the parent location's PhysicalObject (`spi:parent`); map `type` from
   Maximo type / depth (JG→PLANT, `00`→SECTION, `00-DMW`→SYSTEM, `00-DMW-RO`→SKID, deeper→LOCATION — refine
   with `spi:type`).
2. **Assets** — `MaximoAssetAdapter.getAllAssets(site)` (paged). Upsert one EQUIPMENT PhysicalObject per asset,
   `parent` = the PhysicalObject for its `spi:location`, `maximoAssetnum` set.
3. **Idempotent + non-destructive:** existing rows matched by `maximoKey` get description/parent refreshed;
   new Maximo nodes inserted; local-only nodes and local edits untouched. Runs on hub → propagates via sync.

Reuse: `MaximoLocationAdapter`, `MaximoAssetAdapter`, `MaximoAccessService.getAllMembers`. The site-wide asset
list is the same shape as the inventory catalog we already build.

## Data binding model

**Principle — PhysicalObject owns identity; domain data points *in*; aggregation is a query.** PhysicalObject
holds only its own identity + representation refs. It does **not** own `@OneToMany` collections of files /
permits / LOTO (that makes it a god-entity coupled to every module and bloats sync), and there is **no single
polymorphic attachment table**. Instead each domain entity gets a nullable `@ManyToOne physicalObject` FK —
typed, indexed, queryable, and each entity keeps its own lifecycle/service/sync. "Everything about this object"
is a fan-out assembled by a `PhysicalObjectAggregateService` (**computed, not stored**): one query per type,
filtered by `physicalObject` and its subtree.

This is the "attached like Comment/Log" idea you described — data attaches to the anchor — but implemented as
typed FKs rather than one generic table, because the domain entities are already first-class synced entities.
The genuinely cross-cutting entities that *already* use the polymorphic `entityType + entityId` pattern —
**Comment, EmailCorrespondence, FireImpairment** — keep doing exactly that, just with `entityType="PhysicalObject"`.
No new mechanism, no god-entity.

### Backfilling the FKs (per-entity, additive)

Domain data attaches to "what/where" today via (a) `Value` FKs — `Equipment.system/location`,
`FileObject.system/systems`, `BasePermitEntity.system` + `equipment` ManyToMany; (b) strings —
`LotoPoint.system`, `SdsChemical.locations`, `Instrument.location`; (c) `Equipment` ManyToMany.

Bind incrementally, additive, one entity at a time (plan Phases 3–4):
- Add nullable `@ManyToOne PhysicalObject physicalObject` to each attachment point.
- **Backfill by mapping** the existing `Value.name` / `tagNumber` → PhysicalObject, reusing the **alias +
  unresolved-list pattern** we built for schedule name-matching (`User.scheduleName`, the unresolved panel):
  match local system/location names to PhysicalObject `description`/`name`/`maximoLocation`; unmatched rows go
  to an admin "unmapped" panel for manual pairing, or become local-only nodes.
- Old `Value`/string columns become derived getters through `physicalObject`; dropped in Phase 6.
- LotoPoint/Equipment tags: bind to the EQUIPMENT PhysicalObject by `tagNumber ↔ maximoAssetnum` where they
  match (needs the verification below), else by system.

## The Maximo dimension of the Object Dialog (reuses what we shipped)

For a PhysicalObject with a Maximo link, the Maximo tab is our existing adapters, scoped by the link:
- **EQUIPMENT node** → `listWorkOrdersForAsset(maximoAssetnum)` + PM `RecurringPmService.occurrences` for the
  asset + inventory usage (the workbench we built).
- **Location / skid / system node** → WOs/PMs/inventory where `spi:location in [subtree location codes]`
  (verified: `spi:location in [...]` works; the subtree codes come from the PhysicalObject children).
- **Create WO / SR from the dialog** → pre-fill `assetnum` (equipment) or `location` (node) from the link — the
  pickers we built, but with no search needed.
- **Reverse "Show in binder"** → from any Maximo record (assets/WO/SR/inventory pages), look up PhysicalObject
  by `maximoAssetnum` / `maximoLocation` → jump to the node (the "2 spots" idea, generalized).

Aggregate badges (plan Phase 5) include Maximo counts (open WOs in a subtree) via the same
`location in [subtree]` query, cached + invalidated like the plan's `PhysicalObjectAggregateService`.

## Rendering model (2D / 3D)

The map engine already exists as the **Canvas2D `InteractiveImageComponent`**
(`shared/image/refactored/interactive-image/`): it renders a backdrop image + `RfShape` overlays at
**image-relative** coordinates (viewport-independent — the coordinate math `DrawingService.clientToImageCoords`
is exactly what backdrops need) with pan / zoom / draw / drag / resize / rotate / select, gated by a preset
capability matrix (`VIEW_ONLY` for the navigator, a `FILE_EDITOR`-style preset for the builder). This is the
same surface the LOTO builder uses for P&ID markup and equipment placement. (`diagram-builder`'s
`DiagramCanvasComponent` is **not** reused — it is bound to the `Diagram` entity + absolute pixels + a
simulation payload.) A floor plan is just a new backdrop for the same `InteractiveImageComponent`.

- **A surface** = one PhysicalObject's backdrop image with its **children rendered as markers** at coordinates.
- **Recursive drill-down:** open PLANT (its site plan) → SECTION regions are clickable markers → SYSTEM/SKID
  → a SKID with LOCATION-floor children shows a **level selector** (left rail, ordered by `floorIndex`) →
  floor plan with EQUIPMENT markers → click a valve → Object Dialog. Clicking a child marker either **drills
  in** (if it has its own backdrop/children) or **opens the dialog** (leaf).
- **Building it (admin/edit mode):** for a node, upload a backdrop image, then place its child PhysicalObjects
  as markers by clicking on the image — **the exact marker-placement the diagram-builder already does for
  P&IDs**, just on a floor-plan backdrop. The plant likeness comes from using real site photos / floor plans /
  P&IDs as backdrops, not from drawing.
- **Navigation UX:** breadcrumb (`Plant › Unit 1 › HRSG › L2`), up/back, zoom/pan (Pixi has it), and
  **search-a-tag → jump to the node** (breadcrumb shows the path). "Show on" toggles the same object between
  site plan / floor plan / P&ID / 3D.
- **Component shape:** a recursive map component takes a PhysicalObject id → renders its backdrop + child
  markers; drives navigation via the tree.

## Placement, connections & representation

"Connection" is two different things; **neither lives as a field on PhysicalObject**:

- **Placement (where an object is depicted)** = **`ObjectMarker`** — the renamed `Equipment` you already have
  (`coordinates`, `rotation`, `symbolId`, `svgPath`, backdrop `file`). One PhysicalObject has **many** markers,
  one per surface (site plan, each floor plan, each P&ID). Composite key `(physical_object_id, file_id)`. This
  *is* the object↔depiction connection, and it is already its own entity.
- **The node's own backdrop (representation)** — start as FK *reference* fields on PhysicalObject
  (`sitePlanFileId`, `floorPlanFileId`, `pidFileId`, `model3dRef`, `floorIndex`). Promote to a small
  `Representation` table only if a node needs several backdrops of the same kind.
- **Object-to-object edges (flow / adjacency)** — a **deferred** `PhysicalObjectConnection`
  `{from, to, type, + optional per-surface path/coords}`, mirroring the existing **`FileConnector`** (typed
  edges with coordinates/symbol between files). **Defer** until the renderer needs flow/schematic lines — the
  tree (`parent`) + markers render the first maps fine.
- **3D** = a model-ref field (on PhysicalObject or `Representation`); spatial relationships live *inside* the 3D
  model and a node binds to a model element by id. Defer.

## Verification / open questions (resolve before or during slice 1)

1. **Tag ↔ asset match rate.** How well do local `LotoPoint.tagNumber` / `Equipment.tagNumber` line up with
   Maximo `assetnum`? Drives whether app-side binding is mostly automatic or mostly manual. Probe: sample N
   LotoPoint tags, check existence as Maximo assets. (Recommended standalone probe.)
2. **Type mapping.** Confirm `spi:type` values on `mxapioperloc` map cleanly to PLANT/SECTION/SYSTEM/SKID/
   LOCATION, or whether depth-in-tree is the better heuristic.
3. **WorkArea vs Location** (plan Phase 4 open item) — treat WorkArea as a permit-attached LOCATION-type
   PhysicalObject, or keep WorkArea referencing PhysicalObject. Decide when permits bind.
4. **Level/floor nodes** are local-only (Maximo has no per-floor locations here) — hand-added under a SKID,
   ordered by `floorIndex`.

## Order of implementation

Built in dependency order, each step compiling/shippable. **Slice 1 touches nothing existing** — new entity,
new endpoints, new page only.

### Slice 1 — Structure (backbone + Maximo panel). *BUILT 2026-07-01 — compiles; pending runtime verify (restart → reseed → probe).*
1. **Entity + repo** — `PhysicalObject extends BaseAuditEntity`, `PhysicalObjectType` enum,
   `PhysicalObjectRepo` (`findByMaximoKey`, `findByParent`, `findByType`, `findByMaximoLocation/Assetnum`),
   `keyFor(...)` + `@PrePersist/@PreUpdate` to set `maximoKey`. Compile.
2. **Sync registration (4 places)** — `EntityTableRegistry` (Tier 1), `ServiceFacade` +
   `PhysicalObjectSyncService` (copy `RecurringPmSyncService`), `DedupKeyResolver` (`maximoKey`/`localUuid`).
   Compile — this is the highest-risk-to-get-wrong step; verify against the `RecurringPm` template.
3. **Seeder** — `MaximoLocationAdapter.getAllLocations(site)` + `MaximoAssetAdapter.getAllAssets(site)` (paged,
   like the inventory catalog) → `PhysicalObjectMaximoSeeder` (locations pass, then assets pass; upsert by
   `maximoKey`; parent resolution; idempotent, non-destructive). Hub-only bean + admin endpoint
   `POST /ng/physical-object/reseed`.
4. **Read API** — `NgPhysicalObjectController`: `GET /ng/physical-object/tree` (roots + children),
   `GET /{id}`, `GET /{id}/maximo` (WOs/PMs/inventory via the link — reuse the Maximo adapters/services).
5. **Frontend** — model/DTO + service; tree-browser page (reuse `RfToggleMenuComponent`) with a node panel
   whose **Maximo tab** reuses the components we shipped (detail dialog / attachments / workbench pieces) +
   "Show on assets / checkout" links; route + nav entry.
6. **Seed + verify** — run the seeder, eyeball the tree; run the **tag↔asset match probe**
   (`GET /ng/physical-object/probe/tag-match`, also a one-click button on the page) which reports exact +
   separator-insensitive match rates of `LotoPoint`/`Equipment` tags vs seeded `maximoAssetnum`s → decides
   Slice 2's auto-vs-manual split.

**Slice-1 files (all additive — nothing existing was modified in behavior):**
`entities/physical/{PhysicalObject,PhysicalObjectType}.java`, `repository/physical/PhysicalObjectRepo.java`,
`sevice/physical/{PhysicalObjectSyncService,PhysicalObjectMaximoSeeder}.java`,
`dto/physical/PhysicalObjectDto.java`, `controller/angular/NgPhysicalObjectController.java`; 4-place sync reg in
`EntityTableRegistry`, `DedupKeyResolver`, `ServiceFacade`; `getAllLocations`/`getAllAssets` added to the
location/asset adapters (+ `parent` on `MaximoLocationDto`); reseed + per-node Maximo-tab endpoints appended to
`NgMaximoController`. Frontend: `models/physical/physical-object.models.ts`,
`services/physical/physical-object-api.service.ts`, `features/physical/physical-object-browser/*`, route
`/maximo/hierarchy` + nav.

### Slice 2 — App data binding (additive FKs + mapping).
7. Nullable `@ManyToOne physicalObject` on **FileObject** first; backfill via the alias + unresolved-panel
   pattern; old `Value` columns become derived getters. Then **LotoPoint** (tag-match where possible), then
   **permits**, then **SDS / Instrument**.
8. `PhysicalObjectAggregateService` + an **Overview tab** on the node panel (files/LOTO/permits/logs counts +
   lists) — the fan-out query, computed.

### Slice 3 — Renderer: navigator + builder (2D map). *Decided from the code mapping 2026-07-02.*

> **⚠ PIVOT 2026-07-02 (user correction).** The map is NOT a backdrop image + markers. The user's vision is a
> **blank, from-scratch interactive schematic** (like a DCS/simulator plant-layout screen): shapes drawn on an
> empty canvas, each shape *is* a child PhysicalObject (carrying its data), drillable level→level, with
> **connections** between shapes. Images are only optional icons, never the background. → **Reuse the
> diagram-builder**, not `InteractiveImageComponent`: each PhysicalObject node owns a blank **`Diagram`**; its
> children are **`DiagramPlacement`s** linked via `sourceEntityType="PhysicalObject"`, `sourceEntityId=childId`;
> double-click a shape drills into that child's Diagram; edges are **`DiagramConnection`s**; icons are symbols.
> **KEEP** the PhysicalObject model + hierarchy + CRUD/nav endpoints + tree browser (Slice 1) + the left-rail
> build workflow (breadcrumb/levels/create-child/palette). **DROP** the `ObjectMarker` entity + its 4-place sync
> reg + `NgObjectMarker*` + `object-marker-*` frontend + the `InteractiveImageComponent` wiring + the
> backdrop/representation endpoints. The image-canvas subsections below are SUPERSEDED — retained for history; the
> concrete pivot plan lives in the `map-diagram-builder-reuse` workflow output + is folded in on build.

**BUILT 2026-07-02 (both layers compile clean; adversarial-reviewed + fixes applied — not yet runtime-tested).**
Review fixes: guarded `DiagramStateService.saveNow` so a stale parent-diagram save can't clobber `currentDiagram`
after a drill (was a data-corruption path); pessimistic-lock `findByIdForUpdate` in get-or-create (no orphan
Diagram under concurrent calls); reset `lastPlacementsSig` on diagram switch; removed the now-dead backdrop
FK fields. The 4 shared-canvas hooks were confirmed regression-free for the LOTO overlay + standalone builder.
Backend: `PhysicalObject.diagramId`
(plain Long) + `GET /ng/physical-object/{id}/diagram` (get-or-create a blank `Diagram` via `NgDiagramService`,
idempotent, `@Transactional`); the whole ObjectMarker layer + its 4-place sync reg + representation endpoints removed.
`DiagramCanvasComponent` gained 4 additive hooks (no-ops for the LOTO overlay / standalone builder):
`armedSourceEntity` input (stamps the next drawn shape's `sourceEntity`), `placementDoubleClicked` output (drill),
`placementsChanged` output (placed/unplaced palette, deduped), `flushSave()` (persist before drill). Frontend
`features/physical/plant-map/` rewritten to embed `<app-diagram-canvas [backgroundImageUrl]="null"
[embeddedMode]="editMode?'builder':'renderer'" [embeddedDiagramId]="currentDiagramId" [armedSourceEntity]="armed()">`;
left rail = mode toggle + breadcrumb + level selector + child palette (arm-to-place) + create-child. The canvas
auto-saves placements/connections itself.

**Top-level section (2026-07-02, user):** Plant Map + Hierarchy are NOT under Maximo — PhysicalObject is the global
binder that Maximo ties *into*. Routes moved to `/plant/map`, `/plant/map/:nodeId`, `/plant/hierarchy` (own "Plant"
nav group). Bootstrap: creating a top-level node opens it (a root has no parent canvas). Usable builder: arming a
child auto-activates the rectangle tool and labels/colors the drawn box with the child — "arm → drag" just works.

**[SUPERSEDED — image-canvas approach] Reuse verdict — adapt-by-extraction** (not reuse `DiagramCanvasComponent` directly, not a parallel stack):
- **Canvas = `InteractiveImageComponent`** (Canvas2D, image-relative), + its `ShapeManager`/`CanvasRender`/
  `Drawing`/`ZoomPan` services transitively. `VIEW_ONLY` preset = navigator; a new `PHYSICAL_OBJECT_BUILDER`
  preset (draw+drag+resize+rotate) = builder.
- **Placement = new additive `ObjectMarker` entity** — `{physicalObjectId, fileId, coordinates,
  originalPictureSize, rotation, symbolId, svgPath, label, markerKey}`, mirroring `Equipment`'s coordinate
  storage but composite-keyed on **(physicalObjectId, fileId)** so ONE object appears on N backdrops (site plan,
  each floor, each P&ID) — the gap neither `Equipment` (single `mainFile`) nor `DiagramPlacement` (single
  `Diagram` FK) can express. **Do NOT rename `Equipment` now** (that's the plan's flagged Phase-2 migration; it
  touches LOTO ManyToMany + Value FKs + SharePoint adapters).
- **Coordinates = image-relative** (Equipment-style `coordinates` string + `originalPictureSize`), so
  `EquipmentMapperService`'s parse/format is reused line-for-line; **not** DiagramPlacement absolute pixels.
- **Representation = keep the inline FK fields** (`sitePlanFileId`/`floorPlanFileId`/`pidFileId` + `floorIndex`);
  add a read endpoint (FK→`FileDto` + kind flags) + a write endpoint (assign backdrop). Multiple floors =
  LOCATION child nodes each with their own `floorPlanFileId`, ordered by `floorIndex` — not multiple backdrops
  on one node. Promote to a `Representation` table only if a node ever needs several backdrops of one kind.
- **Shell/state = fork the LOTO-builder** container + `LotoBuilderStateService` into `features/plant-map/` with a
  `PlantMapStateService` (signals: `currentNode`, `currentBackdrop`, `backdropKind`, `childMarkers`,
  `breadcrumb`, `levels`, `selectedLevelIndex`, `editMode`; `drillDown/drillUp/selectLevel/switchBackdrop`).
- **Upsert = copy `NgDiagramPlacementService.bulkSave`** (index-by-key, update/insert/soft-delete-omitted),
  keyed on `markerKey`.

**Builder UX (per user — guided, top-down, manual; no auto-layout).** The layout is built by hand, one node at
a time, drilling down: place the sections (U1/U2/BOP) on the plant backdrop → drill into a section → place *its*
children on *its* backdrop → drill again. For the node being built, the **palette = that node's direct children**,
split **placed** (already have an `ObjectMarker` on this backdrop) vs **unplaced**; the user drags an unplaced
child onto the backdrop to create its marker (this is "connect existing" — the children are the Maximo-seeded
structure, i.e. the "correct assets/locations proposed from Maximo" for the current parent). The builder also
**creates new child nodes** inline (name/type/tag → new local-owned `PhysicalObject` under the current parent,
`localUuid` set) — needed for non-Maximo nodes (floors/levels/skids) and to bootstrap the top of the tree before
a Maximo seed exists. So `NgPhysicalObjectController` gains write endpoints: `POST` (create child), `PUT /{id}`
(rename/type/specificLocation/floorIndex/parent), `DELETE /{id}` (soft). No cross-object edges in this slice.

**Build order:** (1) `ObjectMarker` entity + repo → (2) **sync reg — the 4 places** (Tier after PhysicalObject
+ FileObject; `DedupKeyResolver` on a synthesized `markerKey = "PO:{poId}|F:{fileId}"` set in `@PrePersist`,
same trick as `maximoKey`) → (3) `NgObjectMarkerService.bulkSave` + `NgObjectMarkerController` → (4) representation
+ navigation endpoints on `NgPhysicalObjectController` (`/{id}/representation`, `/{id}/children-as-markers/{fileId}`,
`/{id}/breadcrumb`, `/{id}/levels`, `PUT /{id}/representation`) → (5) FE api + models → (6) `PlantMapStateService`
→ (7) `ObjectMarkerMapperService` (fork `EquipmentMapperService`) → (8) `PlantMapContainerComponent` + left rail
(breadcrumb + level selector + child list) + right pane → (9) navigator wiring (dblclick→drill, breadcrumb,
levels, "show on" backdrop toggle) → (10) builder wiring (assign backdrop via `RfMultiUploadComponent`,
draw→child-picker→marker, drag/resize→persist) → (11) route `/plant-map` + nav. Verify with an adversarial review
of the sync reg + coordinate round-trip.

### Deferred (do NOT build in Slice 3)
- **`PhysicalObjectConnection`** object-to-object edges (flow/adjacency) — mirror `FileConnector` (incl. its
  `pairKey` bidirectional pairing) when flow/schematic lines are needed. Schema pre-designed.
- **Unified Object Dialog** + aggregate badges (Maximo open-WO subtree counts) — the renderer emits an
  `openObjectDialog(nodeId)` event and stops there.
- **3D** — bind `model3dRef` into the existing `/3d-models` feature later.

## Fit with the 6-phase plan

This **replaces the Phase-1 backfill source** (Maximo instead of LotoPoint/Value) and **pulls Phase-4's Maximo
linkage forward into Phase 1** (it's free once seeded). Phases 2 (Equipment→ObjectMarker), 3 (LotoPoint
composes PhysicalObject), and 5 (map + dialog) proceed as written; the app-side binding in "Binding existing
app data" above is the Phase 3–4 work. Phase 0 (safety net) and the sync-regression discipline still apply —
the seeder + FK adds are all `FieldChangeEntityListener`-visible.
