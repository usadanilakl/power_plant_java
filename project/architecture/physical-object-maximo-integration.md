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
4. **Rendering reuses the existing Pixi canvas.** A map surface = a backdrop image (site plan / floor plan /
   P&ID) + child markers at coordinates, rendered by the `diagram-builder` canvas machinery; the map is
   recursive (drill node → node). It "looks like the plant" because backdrops are **real images**, not
   hand-drawn. (See *Rendering model*.)
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

The map engine already exists: `diagram-builder`'s Pixi canvas (`DiagramCanvasComponent`) renders a **backdrop
image + markers at coordinates**, and `InteractiveImageComponent` does image + shape drawing/selection. A floor
plan is just a new backdrop *type* for the same machinery.

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

### Slice 3+ — Object Dialog + 2D map (plan Phase 5).
9. `ObjectMarker` (rename/extend `Equipment`) placement model + representation FK wiring.
10. Recursive **map renderer** (reuse the Pixi canvas) + build mode (upload backdrop, place markers) +
    navigation UX; aggregate badges (incl. Maximo open-WO counts per subtree).
11. *(Later)* `PhysicalObjectConnection` edges (flow/schematic); 3D model binding.

## Fit with the 6-phase plan

This **replaces the Phase-1 backfill source** (Maximo instead of LotoPoint/Value) and **pulls Phase-4's Maximo
linkage forward into Phase 1** (it's free once seeded). Phases 2 (Equipment→ObjectMarker), 3 (LotoPoint
composes PhysicalObject), and 5 (map + dialog) proceed as written; the app-side binding in "Binding existing
app data" above is the Phase 3–4 work. Phase 0 (safety net) and the sync-regression discipline still apply —
the seeder + FK adds are all `FieldChangeEntityListener`-visible.
