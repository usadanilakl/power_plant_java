# Refactor Plan: Toward the Informational Binder Model

This is a high-level execution plan for evolving the current codebase toward the end state described in [global-idea.md](global-idea.md). It is a strangler-fig refactor — new structure is introduced alongside the existing one, consumers migrate feature-by-feature, and legacy is deleted only after nothing references it. The app stays fully usable throughout.

## End-State Summary

- A new entity, **PhysicalObject**, is the canonical asset record. It forms the hierarchy **Plant → Section → System → Skid → Equipment → Location**, with `parent` self-reference and a `type` enum.
- Every other domain object (Files, Permits, LOTO, Logs, Defects, SDS, Live Data, Schedules) attaches to a PhysicalObject.
- **LotoPoint** keeps existing — it becomes the LOTO *aspect* of a PhysicalObject of type=EQUIPMENT, via composition (`@ManyToOne PhysicalObject`). Its canonical asset fields (tagNumber, description, system, location, etc.) migrate *out* of LotoPoint and onto PhysicalObject. LotoPoint retains LOTO-specific fields only.
- **Equipment** keeps existing but is renamed to **ObjectMarker** (working name) — its current de-facto role. It represents "a PhysicalObject placed on a drawing/image at coordinates." It is generalized: any PhysicalObject can have markers, not just equipment. Composite uniqueness: `(physical_object_id, file_id)`.
- The **2D map** is recursive navigation through the PhysicalObject tree. Each node optionally carries a *representation* (site plan, floor plan, P&ID reference, 3D model reference). Drilling into a node renders its representation with children placed as markers. Multi-level structures get a **level selector** when their children are type=LOCATION floors. **3D** is a toggle on the same view, not a separate app.
- Aggregate badges (active permits, defects, fire impairments) render on map regions, computed from subtree queries.
- Thymeleaf, parallel `refactored/` Angular components, and the vestigial data fields on the renamed Equipment entity are deleted last.

## Current State Recap (so the plan reads correctly)

- `Equipment.java` today carries both placement fields (`coordinates`, `rotation`, `mainFile`, `symbolId`, `svgPath`) *and* data fields (`eqType`, `vendor`, `system`, `location`, `specificLocation`). In *usage* the data fields are vestigial — the canonical equipment record lives on `LotoPoint`. The original split decision (Equipment-as-connector between LotoPoint and FileObject) already happened; the data fields just weren't removed.
- `LotoPoint.java` today is the de-facto asset record, but its name is wrong: not every plant asset is a LOTO point (gauges, transmitters, instruments, structural items aren't), and it carries duplicated/denormalized references (`equipmentIds` as comma-separated string, copied `tagNumber`/`description`/`system`).
- There is no hierarchy entity. `system`/`location` are Value lookups (string-like category values), not navigable nodes.

The refactor formalizes the asset role into a properly-named `PhysicalObject`, generalizes it past LOTO, and lets the existing Equipment-as-connector code keep doing what it already does under a clearer name.

## Guiding Principles

1. **Additive first.** Build new structure next to the old. Never mutate existing entities in-place if it can be avoided.
2. **App stays shipped.** Each phase ends with a working build deployed to desktops. No long-lived branches.
3. **Sync infrastructure is sacred.** `FieldChangeEntityListener`, the 22 merge services, and the 17 SharePoint adapters represent hard-won correctness. Entities migrate around them, not the other way around.
4. **Migrate consumers, not data.** Backfill scripts run once; the app code that *uses* the new shape is the slow part.
5. **Delete only after.** Old fields/entities/components stay readable (often as derived getters) until every consumer is cut over. Then they go in one sweep.
6. **One phase at a time.** Don't parallelize structural changes — sync regressions compound.

## Phase 0 — Safety Net (~1 week)

**What:** Stand up the testing and rollback machinery needed to refactor a live, syncing system without breaking it.

**Why:** Every entity schema change fires `FieldChangeEntityListener` events, which fan out across 51 sync classes, 22 merge services, and 17 SharePoint adapters. Without a safe place to test and a way to roll back, the first migration becomes the last.

**Approach:**
- Hub clone environment (separate H2 database + port) that mirrors prod sync flow without touching real SharePoint. Document the bring-up steps.
- Baseline snapshot of current sync behavior: capture `FieldChange` log for a representative session (create LotoPoint, add equipment marker on a P&ID, attach file, submit permit) on the clone. This is the regression bar.
- Backup/restore drill: time how long a cold resync takes from hub backup, document the recovery path.
- Decide on feature-flag conventions (likely `@ConditionalOnProperty` for backend, environment-toggled for Angular) for phase rollouts.
- One-page "sync impact checklist" template — every PR that touches a synced entity gets it filled in.

**Exit criteria:** I can break the schema on the clone, observe the failure, restore, and try again — without touching prod.

## Phase 1 — PhysicalObject Hierarchy (~2-3 weeks)

**What:** Introduce a new `PhysicalObject` entity that models the Plant → Section → System → Skid → Equipment → Location tree, including the asset-level data fields. Nothing else changes yet — neither LotoPoint nor Equipment is touched.

**Why:** This is the missing backbone of the whole vision. Without a hierarchical, properly-named asset record, the rest of the refactor has nothing to point at.

**Approach:**
- New entity `PhysicalObject` with: `id`, `name`, `type` enum (PLANT, SECTION, SYSTEM, SKID, EQUIPMENT, LOCATION), `parent` self-ref `@ManyToOne`, `tagNumber`, `description`, `specificLocation`, plus `@ManyToOne` references to `eqType`, `vendor` (initially `Value`-typed, replaced in Phase 4), and standard `BaseAuditEntity` fields.
- Sync adapter: extends `BaseIdEntity`, picks up `FieldChangeEntityListener` automatically. New `PhysicalObjectMergeService` following the existing per-entity merge pattern.
- SharePoint adapter (cert + Power Automate pair) following the existing 17-adapter pattern. Decide which fields are sync-eligible (probably name, tagNumber, description, type, parent, vendor).
- Admin UI: a tree builder under `frontend/src/app/features/physical-object/` to create/edit/move nodes. Standalone — no other feature consumes it yet.
- Optional `representation` field(s) — placeholder for Phase 5 (site plan / floor plan / P&ID ref / 3D model ref). Schema-only in this phase, no UI consumption.
- **Backfill:** the seed is critical, since LotoPoint is the existing canonical record.
  - For each `LotoPoint`, create one `PhysicalObject` of type=EQUIPMENT with name=`tagNumber` (or `description` if no tag), parent left null initially, copying tagNumber/description/system-name/etc. The PhysicalObject's id is independent of the LotoPoint's id — they'll be linked in Phase 3.
  - Create PLANT root, U1/U2/BOP/External SECTION nodes from existing `unit` Value column on LotoPoint/Equipment.
  - Create SYSTEM nodes from distinct `system` Value rows; reparent the type=EQUIPMENT PhysicalObjects under them.
  - SKID and LOCATION nodes are created manually post-backfill (no existing data source — admin builds them).
  - Backfill script is idempotent and runs on hub once, then propagates via sync.

**Exit criteria:** PhysicalObject tree is populated, editable, syncs across desktops and to SharePoint. LotoPoint and Equipment are untouched. No consumer yet uses PhysicalObject — it's a parallel record.

## Phase 2 — Rename and Re-target Equipment → ObjectMarker (~1-2 weeks)

**What:** Rename the existing `Equipment` entity to `ObjectMarker` (working name — final naming decided during the phase) and switch its primary FK from LotoPoint to PhysicalObject. Drop the vestigial data fields. This is mostly a rename + a FK swap; the placement role already exists in the code.

**Why:** The current Equipment entity has been functioning as a "marker on a drawing" for a while — that's its real role. Renaming makes it readable, generalizing it past LOTO points lets *any* PhysicalObject (a skid, a system, a level) have markers on overview diagrams, and the FK swap is what connects placements to the new asset tree.

**Approach:**
- Rename `Equipment` → `ObjectMarker` at the class level. JPA `@Entity(name=...)` or `@Table(name=...)` keeps the DB table name `equipment` initially to avoid a schema rename during sync (rename the table in Phase 6 cleanup).
- Add `@ManyToOne PhysicalObject physicalObject` FK alongside the existing `@ManyToMany lotoPoints`. Initially nullable.
- Backfill: for each ObjectMarker that has a LotoPoint in its `lotoPoints` set, set `physicalObject` to the PhysicalObject that was created from that LotoPoint in Phase 1 backfill. (LotoPoint→PhysicalObject mapping comes from the Phase 1 backfill output.)
- Drop the vestigial data fields (`eqType`, `vendor`, `location`, `system`, `specificLocation`) from ObjectMarker — they're already not the source of truth. Keep them as `@Transient` derived getters that read through `physicalObject` if any code still references them.
- Generalize uniqueness: enforce `(physical_object_id, file_id)` uniqueness — one marker per asset per drawing.
- Diagram canvas (`features/diagram-builder/components/diagram-canvas/`) starts reading PhysicalObject via the new FK for label/data lookups. Coordinates/rotation/symbol still come from ObjectMarker.
- ObjectMarker can now be created for SKID/SYSTEM/SECTION PhysicalObjects too (not just EQUIPMENT). Used in Phase 5 for placing systems on overview diagrams.

**Risk markers:**
- Renaming is sync-visible. Validate `FieldChangeEntityListener` still picks it up (it does — listener is on `BaseIdEntity`, not on the class name).
- The 17 SharePoint adapters reference `Equipment` by class — update the registry. Some adapters are LOTO-attached and may need lighter changes.

**Exit criteria:** Equipment is renamed, points at PhysicalObject, and continues to work for P&ID markup. Vestigial data fields are gone (or reduced to derived getters). Diagram canvas reads asset names from PhysicalObject through the marker.

## Phase 3 — LotoPoint Composes PhysicalObject (~2-3 weeks)

**What:** Make LotoPoint a true LOTO aspect of a PhysicalObject via `@ManyToOne PhysicalObject` FK. Move the canonical asset fields from LotoPoint *to* PhysicalObject (data flows out of LotoPoint, not the other way around). Retain only LOTO-specific data on LotoPoint.

**Why:** Today LotoPoint carries fields that conceptually belong to the asset (tagNumber, description, system, location, equipmentIds string). With PhysicalObject created in Phase 1 and the LotoPoint→PhysicalObject mapping established by the Phase 1 backfill, LotoPoint can shed those fields and become what its name actually implies: the LOTO aspect (tagged status, standard, dual-form 01/02 counterpart, zero-energy refs, related-points, lock state).

**Approach:**
- Add `@ManyToOne PhysicalObject physicalObject` to LotoPoint. Backfill from the Phase 1 mapping (one PhysicalObject was created per LotoPoint).
- For the duplicated/asset fields on LotoPoint (`tagNumber`, `description`, `specificLocation`, `system`, `equipment` string, `equipmentIds` string, `fileIds` string): convert to derived getters that read through `physicalObject`. Keep the columns initially for sync stability.
- Retain on LotoPoint: `tagged`, `standard`, `unit`, dual-form 01/02 counterpart logic, ZeroEnergy refs, related-LotoPoints list, lock state. These are genuinely LOTO concepts.
- Update `LotoPointService`, search endpoints, bulk operations, dual-form transfer, Brady label printing, engraver CSV generation — each one verified to still work via the derived getters before columns are removed.
- LotoPoint↔Equipment (now ObjectMarker) ManyToMany joins: replaced by `LotoPoint.physicalObject ← markers (1:many)` — the markers reach the LotoPoint via PhysicalObject, not directly.
- Once stable, drop the duplicated columns in a separate cleanup release inside this phase. The `equipmentIds`/`fileIds` strings die here.
- Counterpart logic (01/02 transfer, related points, zero-energy template substitution) operates on PhysicalObject identity now, not on string parsing.

**Exit criteria:** Editing a PhysicalObject's description updates everywhere LotoPoint displays it. `equipmentIds` string field gone. Brady labels still print correctly. Bulk edits don't drift.

## Phase 4 — Migrate Value-based References (~1-2 weeks)

**What:** Replace remaining Value-based `system`/`location`/`workArea` references across other entities (Permits, Defects, WorkAreas, Logs, SDS) with PhysicalObject FKs.

**Why:** Phase 1 created PhysicalObject SYSTEM nodes from Value rows, but only Equipment/LotoPoint were rewired to use them. Other entities still pull system/location from `Value`. As long as that's the case, those entities can't participate in subtree queries (e.g., "show all permits in the BFP skid"), can't attach to a hierarchy node, and can't benefit from the new navigation.

**Approach:**
- For each entity referencing system/location/workArea via Value: add `@ManyToOne PhysicalObject` FK. Backfill from the existing Value reference (Value.name → PhysicalObject.name lookup within the relevant type).
- Resolve **WorkArea vs Location** category split: WorkArea seems to be a permit-scoped concept; Location is physical. Treat WorkArea as a permit-attached PhysicalObject of type=LOCATION, or keep WorkArea as its own entity that *references* PhysicalObject. Decide in this phase.
- `CategoryValueMergeService` simplifies — fewer Value rows are created on the fly for system/location.
- Old Value columns become derived getters during transition; dropped in Phase 6.

**Exit criteria:** Searching "what's happening in HRSG U1" returns equipment, files, permits, LOTO points, defects, SDS records, and live-data tags — all matched via PhysicalObject subtree, not via string match.

## Phase 5 — 2D Map and Unified Object Dialog (~5-7 weeks)

**What:** Build the recursive map navigation experience: user drills through the PhysicalObject tree, each node renders an appropriate visual (site plan, floor plan, P&ID, level selector, or list fallback), and clicking any object opens a unified dialog with all attached info.

**Why:** This is the user-facing payoff. Phases 1-4 build the data model; this phase exposes it as navigation. It also resolves the "how do you depict a multi-level HRSG on a 2D map" question — the map isn't one flat picture, it's recursive drill-down.

**Concrete UX (the example flow):**
1. User opens the app → **plant overview** (top-down footprint of PLANT root). SECTION nodes render as clickable regions with aggregate badges (active permits/defects/fire-impairments counts).
2. User clicks Unit 1 → drills into the SECTION → sees its children SYSTEM/SKID nodes, again as clickable regions with badges.
3. User clicks HRSG → it's a multi-level structure. Map switches mode: left-side **level selector** lists LOCATION children (Below Grade, Grade, L1, L2, L3, Roof) with badges. Right pane renders the selected level's floor plan.
4. User picks Level 2 → sees floor plan with EQUIPMENT-type PhysicalObjects placed as `ObjectMarker`s. Active-permit/defect badges render on individual markers.
5. User clicks a valve marker → **Object Dialog** opens: tabs for Overview, Files, Permits, LOTO, Defects, Logs, SDS, Live Data, Scheduled. Each tab queries by the object's subtree (so clicking on a skid shows everything in its child equipment, too).
6. Dialog has "Show on" buttons: [2D map] [3D model] [P&ID]. 3D toggles the right pane to the 3D viewer with the object highlighted. P&ID jumps to the diagram-builder canvas with the marker selected.
7. **Search-driven entry** alternative: user types a tag → search returns the PhysicalObject directly → clicking opens the dialog OR navigates the map (breadcrumb shows the path).

**Approach:**
- **Representations** on PhysicalObject: one node can have multiple — site plan image, floor plan image, P&ID file ref, 3D model ref. Exact entity shape (a `Representation` table vs. inline fields) decided during the phase. Each representation drives one map-zoom level for that node.
- **Recursive map component**: a new top-level Angular feature (`features/plant-map/`) that takes a PhysicalObject id and renders the appropriate view for it (region map with children, floor plan with markers, level selector, or list fallback if no representation is set). Recursive because the children rendered as markers are themselves PhysicalObjects whose children can be drilled into.
- **Three visual surfaces**, distinct but interlinked:
  - *Site/floor plan view* — new. Backdrop image + ObjectMarkers placed at coordinates. Built on the same machinery as the existing diagram-builder canvas.
  - *P&ID view* — existing `features/diagram-builder/`. Logical/schematic, not geographic. Same ObjectMarker model. Object Dialog "Show on P&ID" jumps here.
  - *3D view* — existing `features/model-3d/`. Toggled from the map. Bound to PhysicalObject identity.
- **Level selector** triggers when a PhysicalObject has children of type=LOCATION and they represent floors (heuristic: order by `floorIndex` field or by name). Renders the level list with badges; selected level's floor plan loads into the main pane.
- **Unified Object Dialog**: replaces the existing per-feature equipment/loto/permit dialogs. Tabs query by PhysicalObject subtree. Old dialogs stay readable during the transition; consumers migrate one route at a time.
- **Aggregate badges** computed by a `PhysicalObjectAggregateService` — given a PhysicalObject id, return active counts across its subtree for permits/defects/fire-impairments/etc. Cached and invalidated by `FieldChange` events on the relevant entity types.
- **Pixi.js diagram canvas** (already in place) is the rendering engine for both site plans and P&IDs. Floor plans are just a new backdrop type. 3D viewer stays as its own component.

**Risk markers:**
- This is the largest user-visible change. Roll out per-section behind a flag (e.g., enable map navigation for Unit 1 first, then expand).
- Performance: subtree-aggregate queries against H2 need indexes on `parent_id` and the relevant entity FKs. Profile before declaring done.
- Floor plan images: missing for most levels initially. Fallback is a list view of children, with an "upload floor plan" admin action.

**Exit criteria:** The example flow above works end-to-end on at least one real section (Unit 1 HRSG with one floor plan). Search returns PhysicalObjects and jumps the map to them. Object Dialog shows attached data correctly per tab. The old per-feature list pages still exist as a fallback.

## Phase 6 — Cleanup (~1-2 weeks)

**What:** Delete the legacy surface that's been kept alive only for the migration.

**Why:** 52 Thymeleaf templates, parallel `refactored/` and non-refactored Angular components, derived-getter columns, and the `equipment` DB table name (vs the renamed `object_marker` class) all drag on every change. They were intentionally kept readable through phases 1-5 — now they go.

**Approach:**
- Rename DB table `equipment` → `object_marker`. Sync-visible — coordinated release.
- Delete `src/main/resources/templates/` and any controllers that only serve Thymeleaf views. Confirm no JWT-authed PWA endpoints depend on them.
- For each `features/<x>/refactored/` directory: confirm the non-refactored sibling has no remaining imports anywhere, then delete the old sibling and rename `refactored/` to canonical. Routes update accordingly.
- Drop the derived-getter columns kept alive in Phases 2-3 (vestigial fields on ObjectMarker, the duplicated `tagNumber`/`description`/`system`/`equipmentIds` columns on LotoPoint).
- Remove the dual `form-designer/` + `form-designer-refactored/` parallel modules — pick one.
- Old Java services tied to Thymeleaf flows (controller-by-controller) get deleted as their templates go.
- Reduce the 22 entity-specific merge services to whatever's still genuinely needed — several should be unnecessary post-refactor.
- Drop or repurpose Value rows that were system/location/workArea references (now PhysicalObjects).

**Exit criteria:** Codebase has one canonical implementation per feature. Grep for "refactored" returns zero hits. ObjectMarker, LotoPoint, PhysicalObject are the three asset-side entities and their roles are clean.

## Cross-Cutting Concerns

**Sync regressions are the dominant risk.** Every phase ends with a Phase 0 baseline replay. If the `FieldChange` log diverges from the baseline in unexpected ways, halt and diagnose before merging.

**SharePoint adapters need per-entity attention.** Field renames are silent failures — the adapter writes to the old column name and nobody notices for a week. Add a "verify field names from a fresh SP query" step to each adapter change. The Equipment→ObjectMarker rename will touch the Equipment SharePoint adapter directly.

**Merge services encode incidents.** The reason `CategoryValueMergeService` exists is some past dedup bug. Read the merge logic before assuming a service can be deleted — the comments and conditions are documenting history.

**Feature flags or parallel schemas, not long branches.** Anything that takes more than a week ships behind a flag and gets enabled per-desktop. Long branches against a syncing app become unmergeable.

**Data integrity passes between phases.** After each phase, run a script that verifies (a) no orphaned FKs, (b) no PhysicalObject cycles, (c) ObjectMarker.physicalObject matches LotoPoint.physicalObject when both reference the same asset, (d) subtree-aggregate queries return consistent counts vs entity-level queries.

**Naming.** `PhysicalObject` and `ObjectMarker` are working names. If they don't survive the design review, `Asset`/`AssetMarker`, `Node`/`NodeMarker`, or similar are fine. Pick once, before Phase 1 ships.

## Out of Scope

- 3D model integration (`features/model-3d/`). Can advance in parallel — the PhysicalObject tree it would bind to is being built here, but the renderer itself is an independent track.
- EtaPro live data pipeline. Already well-isolated; bind to PhysicalObject in Phase 4 or 5 if cheap, otherwise defer.
- Permit numbering or LOTO standards workflow changes. Mature systems — touch only where they reference renamed fields.
- PWA (`ng-ui`) restructuring. Consumes backend APIs; updates only when APIs change.

## Rough Sizing

| Phase | Estimate | Risk |
|-------|----------|------|
| 0 — Safety Net | 1 week | low |
| 1 — PhysicalObject hierarchy + backfill | 2-3 weeks | low (additive) |
| 2 — Rename Equipment → ObjectMarker | 1-2 weeks | medium |
| 3 — LotoPoint composes PhysicalObject | 2-3 weeks | medium |
| 4 — Value-based references → PhysicalObject | 1-2 weeks | low-medium |
| 5 — 2D map + unified Object Dialog | 5-7 weeks | medium-high |
| 6 — Cleanup | 1-2 weeks | low |
| **Total** | **13-20 weeks part-time** | |

Phases 1, 3, 4 can each release independently to users. Phase 2 ships behind a flag and stays dual-path until verified. Phase 5 is the only phase users will visibly notice; the rest are quiet structural work.

## Decision Log Placeholder

Major decisions made during execution (final entity naming, WorkArea vs Location resolution, Representation entity shape, whether ObjectMarker syncs to SharePoint, which merge services survive, level-selector heuristic) should land here or in `project/architecture/` as they're made.
