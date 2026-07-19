# Drift Detection & Reconciliation (the "Drift Center")

Field-level sync is best-effort and eventually-consistent. **Drift detection** is the independent
oracle that answers *"is my local state actually equal to the hub (and SharePoint) right now, and if
not, what differs and how do I fix it?"* — measured by **content hash of the synced fields**, NOT by
the `FieldChange` log or row counts. This is the accurate replacement for the old count/timestamp
"sync health" heuristic, which read green while individual fields were silently diverged.

> TL;DR: a background scan hashes every synced row locally and on the hub, persists a `DriftRecord`
> for each divergence, and the **Drift Center** (Sync Dashboard → Drift) + in-table badges + on-form
> flags let you review the exact difference and accept hub / keep local, per-field / whole-row / bulk.

---

## Why content-hash (not FieldChange, not counts)

- **Counts** (`|localCount − serverCount|`) miss same-count divergence and flap on benign skew.
- **Timestamps** (`date_modified` ±window) flap on clock skew and miss field-level drift.
- **FieldChange log** tells you what *should* have propagated, not what *actually* matches now — a
  dropped/misapplied change leaves the log looking fine while the row is wrong.
- **Content hash** compares the real serialized entity state, so it catches drift regardless of how
  it happened (dropped sync, direct DB edit, failed apply). This is why editing the hub DB directly
  (bypassing sync) is detected.

---

## Backend

### The oracle
- **`SyncComparisonService.compareEntityTypeByContent(type)`** — cheap per-type digest probe first
  (`GET /api/sync/entity-content-hash-summary/{type}` → `{count, typeDigest}`); only on mismatch does
  it fetch the hub's full `id → rowHash` map (`/entity-content-hashes/{type}`) and diff. Classifies
  each id as `differing` / `missingLocally` (hub has it, we don't) / `missingOnHub` (we have it, hub
  doesn't).
- **`SyncContentHasher`** — canonicalizes the serialized fields (sorts collection-id arrays
  numerically so HashSet order doesn't matter, drops local-only fields like `refactorNotes`, sorts by
  field name, null→sentinel), SHA-256 per row, and a per-type digest over the row hashes. Hub and
  client use the **byte-identical** serializer (`serializeEntityFields`, excluding
  `id/version/dateCreated/dateModified/objectType`) so identical state hashes identically.
- **SharePoint peer** — `EntityVerificationService.verify()` for SP-backed types only; row-presence
  drift (missing-from-SP). SP is a **backup**, not authoritative, so SP-only drift is a soft warning.

### Persistence & lifecycle
- **`DriftDetectionService`** turns the oracle into durable, triageable records (RoundIssue-style
  lifecycle): `FLAGGED → ACKNOWLEDGED → RECONCILED`, self-healing auto-reconcile (a row that comes
  back into agreement is closed; a reconciled row that drifts again re-opens), and it **never flags
  against an unreachable peer** (a hub/SP probe failure is skipped, not treated as "everything drifts").
- **`DriftRecord`** — a plain `@Entity` (NOT `BaseIdEntity`, so it never itself syncs). Row-level
  records use `fieldName = "_entity_"` (the sentinel that drives the badge); `peer` ∈ {HUB,
  SHAREPOINT}; `kind` ∈ {DIFFERING, MISSING_LOCALLY, MISSING_ON_PEER}; `status` ∈ {FLAGGED,
  ACKNOWLEDGED, RECONCILED}. Unique on `(entityType, entityId, fieldName, peer)`.
- **`DriftScanState`** — per-type bookkeeping (`lastScannedAt`, `spBacked`, `flaggedCount`,
  `lastError`) so a freshly-loaded table can show a confident green ✓ ("scanned, in sync") instead of
  an ambiguous "not checked yet".
- **`DriftScanScheduler`** — `@Scheduled` background scan (20s after boot + every 15 min, configurable
  via `sync.drift.scan-*`), gated on a sync server being configured (a no-op on the hub itself, which
  has nothing to compare against). Tables/badges just render the cached results; the manual "Re-check
  drift" button is an on-demand refresh.

### Resolution (`SyncResolutionService` + `NgSyncResolutionController`)
- **Whole-row**: accept-remote / accept-local / accept-sp.
- **`execute-pull/{type}/{id}` → `pullWithDependencies`** — the dependency-aware "Use Hub". A
  relationship field pointing at a locally-missing entity can't resolve with a bare FK write, so the
  pull does a **hub-seeded transitive BFS**: parse relationship ids from the hub payload, pull the
  locally-missing referenced entities (cap 500), tag `relationshipType`, and apply **per-entity in
  `SYNC_ORDER`, each in its own transaction** — so one bad row (missing NOT-NULL FK, a leaf past the
  cap) fails alone instead of rolling back the whole "Use Hub" and reporting a hollow success. The
  frontend re-scan after the pull is the source of truth for whether the badge clears.
- **Per-field** (`accept-field/{type}/{id}/{field}?source=hub|local`) — emits exactly one field's
  change (no whole-entity clobber). A relationship field whose target is missing locally triggers a
  dependency pull of that target first; on a `MISSING_LOCALLY` row (no local entity to write a field
  to) "accept hub" routes through the whole-entity dependency pull.

### API (`/ng/sync/drift/*`, controller `NgDriftController`)
| Endpoint | Purpose |
|---|---|
| `POST /scan` / `POST /scan/{type}` | run detection (all / one type; hub + SP scanned **independently** so a hub-probe failure can't swallow SP records) |
| `GET /overview` | per-type `DriftScanState` (drives the rail + "last scan") |
| `GET /status/{type}` | active `DriftRecord`s for a type (drives the per-row badge map) |
| `GET /row/{type}/{id}` | every record for one row (form/row drill-down) |
| `GET /summary` | global `{flagged, acknowledged, reconciled}` counts |
| `GET /breakdown` | **what is drifting, by direction**: `hubDiffers` / `onHubNotLocal` / `localNotOnHub` / `sharePoint` |
| `POST /hub-labels/{type}` | friendly labels (tag/name/…) for hub-only rows the local list can't render |
| `POST /acknowledge/{id}` | leave the drift, stop nagging |

The 3-way field diff reuses `GET /ng/sync/compare/verify/{type}/{id}/diff`
(`EntityVerificationService.threeWayFieldDiff`) — Local / Hub / SharePoint side by side.

---

## Frontend

`DriftService` (`services/drift.service.ts`) is the single front door: signals for `summary`,
`breakdown`, `scanState`, per-row `statusForType`, the 3-way `fieldDiff`, and the reconcile calls.

### The Drift Center (Sync Dashboard → Drift — the default sync tab)
The consolidated admin tool (`features/sync/drift-center/`): a **direction breakdown bar** (differ
from hub / on hub not here / here not on hub / not on SharePoint), an overview rail (drifting + clean
types), a drifted-rows table (grouped, checkboxes, bulk bar), and a **compare drawer** — click a row
to see the 3-way field diff *before* deciding, with whole-row actions (Use Hub / Keep Local / Push /
Acknowledge) and per-field accept together. Honors a `?type=` deep-link.

### In-table badge (opt-in `driftEntityType` on the refactored `app-table`)
A dedicated **Sync** column: an H/SP badge on drifting rows (click → field-diff popover + actions), a
green ✓ on scanned-clean rows, a "checked Xm ago" readout, and a **"N rows on the hub, not here"
strip** above the table for `MISSING_LOCALLY` rows (which have no local row to badge) with per-row +
bulk Pull and friendly labels. Reactive: a 30 s poll refreshes badges when a background scan lands.
Currently wired on the LotoPoint and WorkRequest tables.

### On-form flags (opt-in `driftEntityType` on `SmartFormComponent` and `RfReactiveFormComponent`)
Each field that differs from the hub shows a small **H flag** in its corner; click → Local/Hub(/SP)
popover with per-field Use Hub / Keep Local. Wired on the LOTO point, Loto detail, and Safe/Hot/
Confined-space forms.

### Header sync badge (`SyncIndicatorComponent`)
The traffic-light is now driven by the accurate drift signal (peer breakdown): **HUB drift → red**,
SharePoint-only or acknowledged drift → orange, none → green. Connectivity (server-reachable /
pending backlog, from `/api/field-sync/status`) and the SSE recent-updates counter are unchanged and
orthogonal. The popover links to the Drift Center.

### Other sync surfaces
- **Overview tab** — **retired** (redundant with the Drift Center once re-sourced onto `DriftService`).
- **Recovery tab** — its old count-delta "Drift Report" was retired and links to the Drift Center;
  the resync/backup/files/integrity remediation machinery is untouched.
- **Activity tab** — kept (live SSE event feed = "what's flowing now", a different question than
  drift) + a per-row deep-link into the Drift Center.

---

## Entity coverage (what syncs, what's excluded)

Every concrete `BaseIdEntity` subtype emits `FieldChange`s and is drift-scannable. **Coverage is
complete and self-enforcing**: `SyncRegistryValidator` runs at `ApplicationReadyEvent`, enumerates
every concrete `BaseIdEntity` subtype (minus `@LocalOnlyEntity` opt-outs), and asserts each has an
`EntityTableRegistry` entry **and** a `SyncableService` in `ServiceFacade`. Any gap is logged loudly
and surfaced on `/health` (`isDegraded()` / `getGaps()`); with `sync.registry.strict=true` the hub
hard-fails at boot. This turns the old class of silent per-type drops (which lost
`LotoStandardApprovalEvent`, `ShiftDay`, `WorkCategoryProfile`) into a boot-time signal.

**Excluded from sync** (by simply not extending `BaseIdEntity`, or the listener's local-only set):
device-local ESP **command** queue (`WledCommand`), the drift records themselves (`DriftRecord`,
`DriftScanState`), and hub-local plain entities (the Rounds detail entities, walkdown evidence). Note
the ESP **config** (`EspDevice`, `LedStrip`) *does* sync — only the ESP command/communication is
excluded.

---

## Known limitations / follow-ups

- **On-form flag field-name mapping** — the flag keys off the entity Java field name (what the diff
  returns via `field.getName()`); a DTO form field whose `name` differs won't flag (and hub-accept
  can't patch a control it can't find). The standard scalar fields (tag/description/…) match; renamed/
  nested form fields need an explicit map.
- **Dependency pull, per-entity isolation** — a `@ManyToMany`/`@OneToMany` link to a *sibling* that
  sorts LATER in `SYNC_ORDER` within the same pull can be left unset (no cross-entity retry across the
  isolated transactions); a second "Use Hub" or a reconciling second pass closes it.
- **Pulled hub-only rows** — after a strip Pull the badge map refreshes but the table's data rows
  aren't refetched until a manual reload (the `driftEntityPulled` event lets a parent opt into
  reloading).
- **Deferred sync-engine items** (broader than drift; see `project/sync.md`): full same-tx atomicity
  for CREATE/DELETE emission (currently `REQUIRES_NEW` + afterCommit, deferred to a beforeCommit
  approach); LWW re-check on the Pass-4 ManyToOne retry; durable dead-letter on the OneToMany /
  ManyToOne-retry no-service branches; hub broadcast gated on durable apply.

---

## Testing drift

Because drift = actual content (not the change log), you can rig it by editing the **hub** DB
directly (sync won't pick it up, but the content-hash scan will):

1. Stop the hub, edit a synced row on `db/proddb` (e.g. change a tag), restart the hub.
2. On a desktop: Sync Dashboard → Drift → Scan now (or wait for the background scan) → the row shows
   as `DIFFERING`; open it to see Local vs Hub; Use Hub / Keep Local resolves it.
3. For a `MISSING_LOCALLY` graph (Use-Hub dependency pull), insert a new Standard → Point → Value +
   ZeroEnergy on the hub only; "Use Hub" on the standard cascades the whole graph down.
