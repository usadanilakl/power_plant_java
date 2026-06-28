# PM Auto-Assignment — Design & Phased Plan

**Status:** BUILT 2026-06-28 (Phases 0-4), compiles + builds clean. Decisions taken: Java imports the
Excel (durable); standalone `RecurringPm`; assignment = set `spi:lead` + changeStatus APPR; approve
stops at APPR. **Pending live validation** (needs the app running with the Maximo key + SharePoint
cert): catalog refresh against real PM volume, and especially the **Excel parser** (faithful POI port
of the brittle Electron parser — run `POST /ng/schedule/import-from-sharepoint` and check the Schedule
tab). What's built: `spi:pmnum` + paging (`MaximoAccessService.getAllMembers`); `RecurringPm`
entity/repo/`RecurringPmService` (+ sync registration); `PmAssignmentService`; endpoints under
`/ng/maximo/pm/*`; `ScheduleExcelImportService` + `SharePointCertificateAccess.downloadFileByServer
RelativeUrl` + `POST /ng/schedule/import-from-sharepoint` + hub `@Scheduled`; Angular PM Scheduling
page (`/maximo/pm-scheduling`, 3 tabs).
**Goal:** auto-assign waiting-approval recurring-PM work orders to the right people based on the
shift schedule, then let an operator review and approve (all-at-once or per-item, with the ability
to change the assignee).

## The big discovery that shapes this

Most of the plumbing **already exists** and is partly orphaned:

- **A shift-schedule store is already built in Java** — `ShiftDay` entity, `ShiftDayService`,
  `NgScheduleController` (`/ng/schedule/sync|by-date|range|year|unresolved`), and `UserMatchService`
  (fuzzy name → `User`). `POST /ng/schedule/sync` accepts exactly the person-row shape the Electron
  `PersonnelManager` produces — **but nothing in Electron actually calls it.** The receiver has no
  producer; `ShiftDay` is empty in practice.
- **Electron already parses the schedule** — `personnel.manager.ts` downloads
  `/sites/JG/External/60 - Operations/60.05 Ops schedule/{year}/OPS Schedule {year}.xlsx` via
  certificate auth and parses per-person D/N/U/P/T shift rows by A/B/C/D/Rel crew.
- **Java already authenticates to the same SharePoint** (same tenant, `/sites/JG`,
  `data/certificate.pfx`, `.default` scope) via `SharePointCertificateAccess`, and already depends on
  Apache POI. The only missing primitive is a "download file by server-relative path" method (~15 lines).
- **A full Scheduler feature exists** (`Flow`/`Task`/`TaskTemplate`, `TaskType.RECURRING`, Cytoscape
  DAG UI) whose recurrence concept overlaps the recurring-PM list.

So this feature is mostly **wiring existing parts together**, not greenfield.

---

## Data flow (target)

```
Maximo ──1yr PM WOs (all leads)──▶ build RecurringPm catalog (dedupe by pmnum, cadence from mxapipm)
                                    └─ operator sets shift (day/night) per PM  [manual, persisted]
SharePoint Ops Schedule xlsx ──▶ ShiftDay (date → who's on D/N by crew)        [periodic, hub]
Maximo ──WAPPR PM WOs──▶ filter to catalog pmnums ──▶ for each: due date + PM shift
                                                       ⋈ ShiftDay roster ⋈ User ─▶ proposed assignee
Operator review ──Approve (per-item / all)──▶ Maximo: set lead + changeStatus → APPR
```

---

## 1. Schedule source — decision (reuse, don't reinvent)

The schedule data and its Java store already exist. Two ways to populate `ShiftDay`:

- **Path A — Java imports the Excel (recommended, durable).** Add
  `SharePointCertificateAccess.downloadFileByServerRelativeUrl(path)` (~15 lines, mirrors Electron's
  `GetFileByServerRelativeUrl(@a)/$value`), port the `personnel.manager.ts` parse into a Java service
  using POI, and feed `ShiftDayService.importSchedule()`. Run it **hub-only on a schedule** (the hub
  already auto-polls SharePoint every 30s for other entity types — same `@Scheduled` + `isHubMode()`
  pattern). Single source of truth; no dependency on Electron being open; one place to fix the
  brittle layout parsing.
- **Path B — wire Electron → `/ng/schedule/sync` (fast bootstrap).** Electron already parses; just
  add the IPC + `POST /ng/schedule/sync` call. Least new code, unblocks immediately, but keeps the
  parser in Electron and couples ingestion to the desktop app.

**Recommendation:** Path A for the real feature; Path B is acceptable as a same-day bootstrap if we
want to validate the assignment logic before porting the parser. Either way the **assignment code
only ever reads `ShiftDayService`** — so the source choice is swappable and doesn't leak into the
rest of the feature.

> No SharePoint **write** conflict either way (the Ops Schedule is read-only, human-maintained).
> Pick a single `ShiftDay` writer (hub) to avoid CRDT churn — `ShiftDay` is currently *not* in
> `EntityTableRegistry.SYNC_ORDER` (local-only per device); keep it that way and let each node import,
> or centralize on the hub and read via `/ng/schedule/*`.

## 2. Recurring-PM catalog — data model

Maximo WOs spawned from a PM master carry **`spi:pmnum`** (e.g. `JG-1183`) — the stable identity that
every recurrence shares (`wonum` is per-occurrence). Dedupe a year of WOs by `pmnum` → the catalog.

New entity (decoupled from the Scheduler DAG — simplest match to the requirement):

```java
class RecurringPm extends BaseAuditEntity {     // sync-tracked, soft-delete, audit
    @Column(unique = true) String pmnum;        // e.g. "JG-1183" — the dedupe key
    String description;                          // latest occurrence's description (label)
    String lead;                                 // Maximo lead personid seen on occurrences
    @Enumerated(STRING) RecurrenceCadence cadence;  // DAY | WEEK | MONTH | OTHER
    Integer interval;                            // every N (from mxapipm frequency)
    @Enumerated(STRING) ShiftPreference shift;   // DAY | NIGHT | EITHER  — set manually in app
    Integer lastSeenCount;                       // # occurrences in the trailing year
    String lastWonum;                            // most recent occurrence
    Instant catalogRefreshedAt;
}
```
- **Cadence** is **inferred from occurrence spacing** within each `pmnum` group (median gap between
  `targstartdate`/`reportdate` → DAY/WEEK/MONTH). ⚠️ The PM master object structure **`mxapipm` is NOT
  API-readable on this instance** (`BMXAA0024E "action READ is not allowed on object PM"`, probed
  2026-06-28), so `frequency`/`frequnit` are unavailable — inference is the only automatic source.
  The operator can override cadence in the app. (Inference is reliable for frequent PMs with several
  occurrences in the trailing year, e.g. JG-1183 dated 05-02/06-02/07-02 → ~30d → MONTHLY; rare PMs
  with ≤1 occurrence default to OTHER and are set manually.)
- **Shift (day/night)** and the finer "day-of-week / week / month day-vs-night" are **operator-set in
  the app** per the requirement — stored on `RecurringPm` (extend with a small JSON map if per-cadence
  detail is needed, e.g. `{"MON":"DAY","WED":"NIGHT"}`).
- **Sync:** if the catalog is plant-wide and edited on one device, register `RecurringPm` in
  `EntityTableRegistry.SYNC_ORDER` so it propagates to all desktops (like `Task`). If per-device,
  omit it (like `ShiftDay`). *Recommend: sync it* — the manual cadence/shift classification is
  expensive to redo per device.
- **Alternative:** extend the existing Scheduler `TaskTemplate` with recurrence fields instead of a
  new entity. More reuse, but couples PMs to the Flow/DAG model — heavier than needed. Prefer the
  standalone entity unless we want PMs to participate in the scheduler's dependency graph.

## 3. Maximo plumbing — required additions

These are prerequisites and are independently useful:

1. **Add `spi:pmnum`** to `MaximoWorkOrderAdapter.SELECT_FIELDS` and `MaximoWorkOrderDto` (+ `map()`).
   Without it there is no dedupe key. (Also probe whether `spi:frequency`/`spi:frequnit` are exposed
   on `mxapiwodetail` — if so, skip the `mxapipm` round-trip.)
2. **Add real paging** to `MaximoAccessService` — a `pageno` loop with fixed `oslc.pageSize` and the
   existing `-spi:reportdate` stable sort, merging `rdfs:member` across pages until a short/empty page,
   with an iteration cap. The current single-`getMap` **silently truncates** a 1-year all-leads query
   → would miss PM items (a correctness bug for a catalog). Keep the constraints: AND-only `where`,
   bracketed `in [...]`, `-` orderBy.
3. ~~PM master adapter~~ — **not possible**: `mxapipm` READ is blocked (`BMXAA0024E`). Cadence is
   inferred from occurrence spacing in the catalog build (no extra Maximo call).
4. **Set the assignee on a WO** — **confirmed (probed 2026-06-28): assignment is the `spi:lead`
   field.** A WO's `showassignment` (labor) collection is empty on real PM WOs; the responsible
   person is carried on `spi:lead` (the same field the Lead Operator page filters on). Assign by
   setting `{"spi:lead":"<personid>"}` via a MERGE PATCH at the WO root, then `changeStatus → APPR`.
   No labor/`woactivity` rows needed.

## 4. Backend — new endpoints (under `/ng/maximo`)

- `POST /pm/catalog/refresh` → pull 1yr PM WOs for all leads (paged) + cadence from `mxapipm`,
  upsert `RecurringPm` by pmnum. Hub-gated `@Scheduled` variant for periodic refresh (every few days).
- `GET /pm/catalog` → list the catalog (for the management grid).
- `PUT /pm/catalog/{pmnum}` → set shift/cadence overrides (manual classification).
- `GET /pm/pending-assignments` → WAPPR PM WOs filtered to catalog pmnums, each annotated with the
  **proposed assignee** (resolved via `ShiftDayService.getByDate(dueDate)` + the PM's shift + crew →
  `User`). Returns editable rows.
- `POST /pm/assign` → body `[{wonum/href, personid}]`: for each, set `spi:lead` and
  `changeStatus → APPR`. Drives both "Approve All" and per-item approve.

Reuse: `MaximoBundleService.leadOperators()` (the personid list), `ShiftDayService` +
`UserMatchService` (roster → person), the existing changeStatus/MERGE primitives.

## 5. Frontend — new "PM Scheduling" area

Three views (Angular standalone, reusing `TableComponent`/`SmartFormComponent`/signals per CLAUDE.md):

- **Catalog** — table of recurring PMs (pmnum, description, cadence, occurrences/yr) with inline
  edit of **shift (day/night)** and cadence overrides; a "Refresh catalog" button.
- **Pending assignments** — table of WAPPR PMs with the proposed assignee (a people dropdown,
  pre-filled, editable), per-row **Approve** and a header **Approve All**. On approve → `/pm/assign`,
  row drops out (now APPR).
- **Schedule view (part e)** — a calendar/grid rendered from `ShiftDay` (date → D/N rosters by crew).
  Could reuse the Scheduler UI shell or a simple month grid. Read-only; for at-a-glance context.

## 6. Phased plan (each phase independently shippable)

- **Phase 0 — Maximo plumbing:** add `spi:pmnum` + paging + `MaximoPmAdapter`. Probe the assignment
  field and `frequnit` exposure. *(No UI; de-risks everything.)*
- **Phase 1 — Schedule populated:** Path A (Java import, hub) or Path B (Electron push). Verify
  `ShiftDayService.getByDate()` returns real rosters.
- **Phase 2 — Catalog:** `RecurringPm` entity/repo + `/pm/catalog*` + the catalog UI (build from
  Maximo, manual shift/cadence). *Shippable on its own — a maintained recurring-PM list.*
- **Phase 3 — Assignment + approval:** `/pm/pending-assignments` + `/pm/assign` + the review UI
  (Approve All / per-item / change assignee). *The core value.*
- **Phase 4 — Schedule render** (part e).

## Open decisions (need your input before building)

1. **Schedule source:** Path A (port the Excel parse into Java, hub-scheduled — durable) or Path B
   (wire Electron's existing parse to `POST /ng/schedule/sync` — fast)? *Recommend A; B as bootstrap.*
2. ~~Assignment mechanism~~ — **RESOLVED (probed):** set `spi:lead` + `changeStatus → APPR`.
   `showassignment` is empty; `lead` is the assignee field. (Still open: should approve also go to
   INPRG, or stop at APPR? Default APPR.)
3. **Recurring-PM model:** standalone `RecurringPm` (recommended, simple) vs extend the existing
   Scheduler `Task`/`TaskTemplate` (more reuse, heavier)?
4. **Catalog sync:** propagate the recurring-PM list (with its manual shift/cadence) across desktops
   via CRDT sync, or keep it hub/local-only? *Recommend sync — the manual classification is costly.*
5. **Assignment granularity:** assign to the **specific person** on the PM's shift that date, or to a
   **crew**? If multiple qualify, how to pick (row order = lead/CRO/AO is available in the Excel)?
6. **Catalog freshness:** how often to auto-refresh the 1-year catalog (the requirement says "every
   few days") — and on hub only?

## Key files to build on
- Maximo: `sevice/maximo/{MaximoWorkOrderAdapter,MaximoBundleService,MaximoAccessService}.java`,
  `dto/maximo/{MaximoWorkOrderDto,MaximoWorkOrderCriteria}.java`, `controller/angular/NgMaximoController.java`
- Schedule (built, unwired): `entities/users/ShiftDay.java`, `sevice/users/{ShiftDayService,UserMatchService}.java`,
  `controller/angular/NgScheduleController.java`, `dto/users/{ScheduleImportRequest,ShiftEntry}.java`
- SharePoint (same cert/site): `sevice/sharepoint/SharePointCertificateAccess.java` (needs a
  `downloadFileByServerRelativeUrl`), `config/SharePointConfig.java`
- Electron parser to port/reuse: `electron-manager/src/main/managers/{personnel,sharepoint}.manager.ts`
- Scheduler (recurrence overlap): `entities/scheduler/{Task,TaskTemplate}.java`, `project/.../SCHEDULER-DESIGN.md`,
  `frontend/src/app/features/scheduler/**`
- Persistence/sync: `entities/base_entities/BaseIdEntity.java`, `sevice/sync/EntityTableRegistry.java`
