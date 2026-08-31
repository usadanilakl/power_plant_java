# Multiple work areas on one work request — investigation, 2026-08-30

**One package, one Safe Work, several Confined Spaces already works.** Nothing in the permit or
package structure needs changing. The constraint is entirely in the *work request*, which can only
name one area and one space, so it can only ever seed one Confined Space permit.

## What already supports it

| | |
|---|---|
| `DailyPermitPackage` | `Set<SafeWork>`, `Set<HotWork>`, `Set<ConfinedSpace>`, `Set<WorkRequest>` — all collections already |
| Package builder | "Add Confined Space → Create Blank", and `createAndAttachConfinedSpacesToPackage(...)` **already takes an array** |
| Hazard seeding | `seedHazards` already merges the work area's constants with **every** work request on the package |
| Permits map | `PermitMapDto.Item.workAreaIds` is already a list; an item can be drawn on several areas |
| Sync | each Confined Space is its own entity with its own field-change stream — nothing special needed |

So an operator can build exactly the Inspection package described today, by hand. What they cannot
do is have it generated from the request.

## Where "one" is actually enforced

1. `WorkRequest.workArea` — single `@ManyToOne` inherited from `BasePermitEntity`.
2. `WorkRequest.space` — single `String`.
3. PWA `WorkRequest` model — `workAreaId` / `workAreaName` / `spaceToBeEntered`, all scalar.
4. `WorkAreaMapSelectComponent` — a CVA whose value is `AreaRef | string | null`.
5. `PwaWorkRequestDto` + the SharePoint list — `WorkAreaName` and `SpaceToBeEntered` single text columns.
6. **The generation step.** `daily-permit-package-form.component.ts`:
   ```ts
   confinedSpace: Signal<ConfinedSpaceDto> = computed(() =>
     this.confinedSpaceInput?.() ?? ConfinedSpaceDto.generatePermitFromRequest(...));
   ```
   One permit of each type per request. This is the pivot: it has to become a list for Confined
   Space while staying singular for Safe Work.

## Three ways to carry several areas

### A. An additional-areas JSON payload on the request — recommended

`additionalWorkAreasJson` on `WorkRequest`: `[{ id, name, space }]`. The existing FK stays the
**primary** area, so everything that reads it today keeps working untouched — permits-map placement,
the job grouping key, the scored job matcher, hazard seeding, the location resolver.

- SharePoint needs **one** new `payload("WorkAreas")` column. The provisioner already has a
  `payload()` helper and `DeclaredHazards` is the precedent: three hazard blocks travel as one JSON
  envelope precisely so the Power Automate fallback needs no new columns per field.
- No new entity, no join table, no `EntityTableRegistry` entry, and — importantly — **no new
  `@ManyToMany`**, so none of the OR-Set / snapshot-race machinery is involved. It is a scalar text
  column on an entity that already syncs.
- Degrades safely: an older client, or a request that arrived before the column existed, simply has
  no additional areas. Same null-means-no-opinion rule the hazard envelope already uses.

### B. A real association on `WorkRequest`

Relationally cleaner, and wrong for the cost here: new join table, new sync registration, M2M
membership-sync considerations, and SharePoint still cannot represent it without a payload column —
so it buys nothing at that boundary while adding the one class of sync bug this codebase has spent
the most time on.

### C. One request per space, grouped into one package

Zero model change — the package already holds several requests. But the requester fills the form
N times and the scope text is duplicated N times, which is the opposite of what this is for. Worth
naming only because it is the fallback if A is rejected.

## Change list for option A

**Backend**
- `WorkRequest`: `additionalWorkAreasJson` column + typed getter/setter, following the
  `declaredHazardsJson` pattern exactly (never throws on malformed JSON — a request is read on
  every table page).
- `WorkRequestDto` / `NgWorkRequestDto` / `PwaWorkRequestDto`: carry the list.
- `WorkRequestMapper`: both directions, all four mapping paths that already touch `space`.
- `SharePointListProvisioner`: add `payload("WorkAreas")` to the Work Requests list.
- `WorkRequestSharePointAdapter`: read/write it on the cert path (`item.path`) and the PA path
  (`str(map, …)` / `map.put(…)`).
- `NgPermitMapService.place()`: append the additional area ids so a multi-area request draws on all
  of them. `workAreaIds` is already a list, so this is one line.

**Desktop**
- `daily-permit-package-form.component.ts`: `confinedSpace` → `confinedSpaces: Signal<ConfinedSpaceDto[]>`,
  one per declared space, and the template loops. Safe Work and Hot Work stay singular.
- Package creation attaches all of them — `createAndAttachConfinedSpacesToPackage` already accepts
  an array.

**PWA**
- `WorkAreaMapSelectComponent`: a `multiple` input; value becomes `AreaRef[]`. Keep the single-select
  behaviour as the default so the equipment picker and every other host is unaffected.
- Wizard step 1: "Add another area" after the first pick, with the picked areas listed.
- `WorkAreaSeedService.applyAreaSeeding`: loop the selected areas. The merge is already additive and
  keyed on declined hazards, so a union across areas needs no new rules.
- Confined-space step: one space name per selected area that is a confined space.

**Power Automate — the one change outside this repo**
The flow is not defined in the repository. Adding `WorkAreas` to the Work Requests list means the
flow's own column mapping has to be extended by hand. Until that is done, requests arriving through
the PA fallback carry the primary area only — which is the correct degradation, not a failure.

## Worth deciding before building

- **Which area is "primary"?** It drives the job grouping key, the scored job match, and where the
  request is drawn on the permits map. First-picked is the obvious answer; it should be reorderable.
- **Does a multi-area request produce one Safe Work or one per area?** The Inspection case says one.
  A job whose areas have very different constant hazards might warrant more, but a single Safe Work
  carrying the union is the honest reading of "same scope, same crew".
- **LOTO.** The union of the areas' constant LOTO standards is the natural default, and can get
  large quickly. Worth showing the count before submission.

---

# Implementation — backend + generation, 2026-08-30

Built to the agreed shape: option A (JSON payload), primary = first picked, per-area flags for
Confined Space and Hot Work, hot-work detail asked once.

## `WorkRequestArea`

`{ id, name, primary, confinedSpaceEntry, spaceName, hotWork }`, stored on `WorkRequest` as
`workAreasJson`. Two flags and nothing else, because that is all that decides how many permits
exist. The hot-work detail stays on the request: same crew, same job, so the kind of welding does
not change between areas — asking five times produces five copy-pasted answers, which is worse
information than one honest one.

### The summary booleans stay in step

`setWorkAreas` also turns on `isHotWorkRequired` / `isConfinedSpaceEntryRequired` when any area
needs them. Those two are what SharePoint, the Power Automate flow, the work-request table and the
permit generator all read — none of them knows about areas, and none of them has to. They are only
ever turned **on**: a requester who answered "yes, hot work" for the job as a whole is not
contradicted because no individual area happened to be ticked. A gap in their answer is not a
retraction of it.

## Where it flows

- `WorkRequestDto` (SharePoint wire), `NgWorkRequestDto` (desktop), `PwaWorkRequestDto` — all carry it.
- `WorkRequestMapper` — all eight sites that already mapped `space`.
- `SharePointListProvisioner` — one new `payload("WorkAreas")` column on the Work Requests list.
- `WorkRequestSharePointAdapter` — both read paths (certificate + Power Automate) and the write path.
- `PwaWorkRequestService` — carried on submit and into the SharePoint fallback payload, so a request
  that reaches SharePoint through Power Automate keeps its extra areas.

## Generation

`daily-permit-package-form.component.ts` was the single place any permit was generated from a
request, and it made exactly one of each. Now:

| | |
|---|---|
| Confined Space | one per area with `confinedSpaceEntry`, each carrying its own space name |
| Hot Work | one per area with `hotWork` — usually a subset |
| Safe Work | one spanning, with an operator toggle for one-per-area |

A multi-area request shows a banner with the counts and the Safe Work split control, so the operator
sees what they are about to issue before issuing it. Requests with no declared areas fall back to
the single request-level permit — which is every request submitted before this existed.

Hazards are not seeded per area here: the package builder's `seedHazards` already merges the area's
constants when a permit is attached, and duplicating that would give two places to disagree.

`WorkRequestFieldName` now excludes `workAreas` — it is structural data that decides how many
permits exist, not something a form input or a table cell could render.

## Per-area generation lives in the shared service

`CurrentDailyPermitPackageService.generate{SafeWork,HotWork,ConfinedSpace}FromCurrentRequest` is what
the live builder's "Generate from WR" buttons call — not the package *form* component, which is only
reachable from the older work-request popup. `generatePerArea` handles three cases, and the middle
one is the easy mistake:

- **no areas declared** — every request from before this existed. One permit, exactly as before.
- **areas declared, none needs this type** — a real answer meaning "no hot work here", not missing
  data. Generates nothing. Treating it as the legacy case produces a phantom permit.
- **areas declared and some need it** — one each, seeded from and bound to its OWN area.

Safe Work gets a **"One per area (N)"** button beside "Generate from WR", shown only when the
request covers more than one area — Confined Space and Hot Work are always per-area, so only Safe
Work needs asking about.

## Codex review

Eleven findings across two passes, all fixed. The ones worth remembering:

- **`List.of` is immutable** and the multi-area loop called `add()` on it — an
  `UnsupportedOperationException` that would have failed the ENTIRE permits-map response for any
  text-placed request with a second area.
- **Generated permits carried no area identity.** The backend resolves a permit's area from
  `dto.workArea.id` alone, and the frontend DTOs' `toJson` whitelists fields — so every per-area
  permit would have persisted against the primary area. A five-space package would have reported
  all five spaces as being in the first one.
- **A blank SharePoint value wiped local areas.** `fromJson("")` is an empty list and
  `setWorkAreas([])` clears the column, so the first sync pass after provisioning — when every
  existing row returns empty for the new column — would have erased every multi-area declaration.
  Now `applyWorkAreasEnvelope`, which no-ops on blank/`"null"`/unreadable and honours only an
  explicit `[]`. Same rule `applyDeclaredHazardsEnvelope` already followed.
- **`computed(() => value)` in a template-called method** minted a fresh signal every change
  detection pass and captured rather than tracked, leaving reused form slots stale. Now one stable
  signal per slot that reads through to the current list.
- **The per-area fallback bound everything to the primary** when the work-area list was unavailable.
  Now a minimal stub carrying the declared area's own id: no hazards to seed from, but the right
  identity — which is the part that cannot be recovered later by looking at the permit.

## Still to build



- **PWA capture.** The map picker is single-select and the wizard collects one area, so nothing
  will produce a multi-area request yet. This is the remaining piece: a `multiple` mode on
  `WorkAreaMapSelectComponent` (default off, so every other host is unaffected), and a wizard step
  that adds areas after the primary with the two toggles each.
- **`NgPermitMapService.place()`** — append the additional area ids so a multi-area request draws on
  all of them. `workAreaIds` is already a list; it is one line.
- **The Power Automate flow** — not in this repository. Its column mapping needs `WorkAreas` adding
  by hand. Until then, requests arriving on that path carry the primary area only, which is correct
  degradation rather than failure.

---

# Power Automate: enabling multi-area submissions

The flow is not in this repository, so this is the one part that has to be done by hand. Until it
is, requests arriving on the PA path carry the primary area only — correct degradation, not failure.

## 1. Provision the SharePoint column (do this first)

The column definition is already in `SharePointListProvisioner`. Create it on the live list:

```
POST /ng/sharepoint/provision-list?title=Work Requests      (ADMIN)
GET  /ng/sharepoint/list-status                             (verify)
```

It creates **`WorkAreas`** as a multi-line text (Note) field, hidden from the default view — the
same shape as `DeclaredHazards`, because a wall of JSON makes the list unreadable.

Confirm it exists in SharePoint before touching the flow; the flow cannot map a column that is not
there yet, and the failure looks like an unrelated flow error.

## 2. Add it to the Work Request flow

In Power Automate, open the flow behind `pwa.powerAutomate.v2.workRequest`:

1. Open the **Create item** (and **Update item**, if the flow has one) action on the Work Requests
   list. The new `WorkAreas` field appears once step 1 has run — use *refresh* on the action if it
   does not.
2. Map it to the incoming payload's **`WorkAreas`** property:
   `triggerBody()?['data']?['WorkAreas']`
   The PWA sends it under `data`, alongside `DeclaredHazards`, in the same V2 request envelope.
3. It is already a JSON **string** when it arrives — do not `json()` it, and do not rebuild it field
   by field. Pass it through verbatim. The hub parses it on the way back in.
4. Save, and submit one multi-area request with the hub deliberately unreachable to confirm the
   round trip.

## 3. What to expect

- A **single-area** request sends `WorkAreas` as an empty string. That is deliberate: only requests
  covering more than the primary area populate it, so nothing about existing submissions changes.
- An older PWA build sends no `WorkAreas` at all. The hub reads absent as "no opinion" and keeps
  whatever it already had, so a stale client cannot blank out areas by staying silent.
- The hub polls the item back in and parses the envelope. `isHotWorkRequired` and
  `isConfinedSpaceEntryRequired` are repaired from it on the way in, so those two columns cannot
  stay stale-false when an area says otherwise.
