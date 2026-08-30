# Permits Monitor — theme fix and map view, 2026-08-29

Two things: the page now paints itself, and it has a second view that draws the same open work on
the plant layout instead of in tables.

## 1. Why the theme was "not set"

Not a colour bug — a missing wrapper. `permits-monitor` was routed bare:

```ts
{ path: 'permits-monitor', component: PermitsMonitorComponent, ... }
```

Every other page renders inside `MainLayoutComponent`, whose `.main-content` is the element that
carries `background-color: var(--primary-background)`. `ThemeService` only toggles a `dark-theme`
class on `<body>`, and **`body` has no background rule anywhere in `styles.css`**. So on this one
page the dark tokens applied to the cards and the text while the page behind them stayed white.
It also had no header, which meant no theme toggle and no router menu.

Three fixes:

77. **Wrapped in `MainLayoutComponent` + `RouterMenuComponent`**, the same shell every other page
    uses. That supplies the background, the theme toggle, the sync indicator and the global nav.
    The page's own `<h1>` went with it (the layout renders the title); the permit sub-nav stayed,
    because it is a different thing from the global menu.
78. **Status pills became semantic tokens.** They were fixed pastels (`#dbeafe` on `#1e40af` and
    friends) written for the light theme, so they were low-contrast blocks in dark mode. There are
    now five `--chip-*-bg/fg` pairs on `:host`, redefined once under
    `:host-context(.dark-theme)` — one definition per colour rather than a second palette sprayed
    through the rules.
    While doing this: **`.badge-building`, `.badge-closed` and `.status-building` were referenced
    in the template and had no rule at all**, so the package cards rendered those states as bare
    unstyled text in both themes. They have rules now.
79. **The Hot Work / Confined Space / LOTO column icons were `rgba(255,255,255,0.05)` on
    `rgba(255,255,255,0.15)`** — written against a dark background, and therefore invisible white
    on white in the light theme. Now `--icon-off-bg` / `--icon-off-fg`, which flip.

> Worth noting separately: the admin tabs (`admin-forms`, `admin-files`, `admin-db-health`, …)
> still hardcode light colours the same way, and `.admin-section` in `theme-styles.css` is a
> *theming* class (it sets the purple accent) that those tabs also use as a plain layout class.
> Not touched here.

## 2. Map view

A **List / Map** switch in the page header. List is unchanged. Map draws the same open work on the
plant layout, with a layer per record type: Work Requests, Safe Work, Hot Work, Confined Space,
LOTO.

### Placement — all three options, in priority order

The question was whether to place things by the work request's location, by each permit's own
location, or by the package's. Picking one is unnecessary: they are not alternatives, they are
fallbacks. Every permit type — WR, SW, HW, CS and LOTO — already inherits a real `workArea` FK from
`BasePermitEntity`, so the FK is rule 1 and text is only what happens when it is absent.

`NgPermitMapService` applies four rules and takes the first that answers:

| | rule | source |
|---|---|---|
| 1 | **AREA** | the record's own `workArea` FK — a person chose this |
| 2 | **TEXT** | its own location text names an area (`WorkAreaLocationResolver`) |
| 3 | **PACKAGE** | inherited from its daily package, which takes its areas from its work requests |
| 4 | **STANDARD** | LOTO only — work areas listing this LOTO's source standard as constant |

Which rule fired travels with each item and is shown in the UI, because the four are not equally
trustworthy: AREA is a recorded fact, TEXT is this system's guess about a sentence. Only the guess
is called out in amber, with the raw location string quoted underneath it so a wrong match is
diagnosable on sight.

**Rule 3 is what makes the package option unnecessary as a separate choice.** A Safe Work generated
from a request usually has no location of its own; it inherits from its package, and the package
takes its areas from its work requests by the *same* AREA-then-TEXT rule the requests themselves
are drawn by. So the layers cannot land in different places for the same job.

**The TEXT rule is deliberately not applied to LOTO.** A LOTO's location-ish field is
`equipmentSystem` — "Unit 1 Feedwater" — which is a system, not a place. Matching that against area
names produces confident nonsense, so LOTO uses structure only (rules 1, 3, 4).

### Why the PWA needs rule 2 at all

`work-request-form.component.ts` lets the requester pick an area **on this same plant map**, then
`applyMapValue` folds it into `workAreaId` + `workAreaName` + a composed
`"<Area Name> - <detail>"` string in `locationOfWork`. `PwaWorkRequestService.convertToEntity` sets
the FK when the payload carried an id — but requests arriving through SharePoint or the Power
Automate fallback have no id, and **the area survives only inside that string**. Rule 2 recovers
it.

### Matching rules (`WorkAreaLocationResolver`)

Conservative on purpose — a wrong match draws a job where it is not happening, which is worse than
leaving it off the map.

- Text and area names are normalised: lower-cased, every non-alphanumeric run collapsed to one
  space, padded at both ends. That makes `Unit 1 - Boiler`, `Unit-1/Boiler` and `UNIT 1: BOILER`
  the same string, and makes the boundary check a plain `contains`.
- **Word-boundary aware** — `Boiler` does not match `Reboiler Deck`.
- **Longest name wins** — an area named `Boiler Feed Pump Room` beats one named `Boiler`.
- **Ties break to the smaller id**, so two nodes resolving the same string independently agree.
  Duplicate area names exist in this database; without this the same permit could appear in
  different places depending on which desktop you were sitting at.
- **Names under 3 characters are never matched.** `U1` turns up inside ordinary prose constantly,
  and one false placement costs more than every true one such a name would find.

Covered by `WorkAreaLocationResolverTest` (9 cases, all passing).

### What the view shows

- **Layer chips** with plant-wide counts; click to toggle. Turning the last one off isolates it
  rather than blanking the map.
- **Shape colour** — with one layer showing, that layer's signature colour; with several, a heat
  scale on the total (a per-layer colour would be a lie about a shape holding a mix). Areas with
  nothing open keep a grey outline rather than disappearing.
- **Count badge** per shape, via the existing `RfBaseShape.pointIndex` badge. Counted **distinct**:
  a shape carrying two work areas would otherwise count an item present in both of them twice.
- **Side panel** — click an area for its items; otherwise a busiest-areas rollup.
- **"Not on the map"** — items that matched no rule at all. Listed with their raw location text.
  They are real open work and must not silently vanish because the placement failed.
- **"Areas with no shape drawn"** — work areas that have open items but nothing on the map to draw
  them on, which is otherwise invisible.

Clicking an item opens it where it is actually edited: WR → the WR detail dialog, LOTO →
`/loto/loto?id=`, and SW/HW/CS → their daily package, since those three have no page of their own
that takes an id. That is why `packageId` is on the payload.

### An item can be in more than one area

`workAreaIds` is a list. A LOTO reached through two packages in two parts of the plant is genuinely
in both, and picking one arbitrarily would hide live isolation from whoever is looking at the
other. An area's badge therefore counts items **touching** it, not items "belonging" to it.

## Shape geometry is now shared, not copied

`WorkAreaMapStateService.mapShapeToRf` held the only parser for the stored `coordinates` string —
which exists in two formats, real JSON and a bare-key variant. Rather than copy it, it moved to
`work-area-shape.util.ts` (`parseWorkAreaShapeGeometry` / `workAreaShapeToRf` /
`workAreaShapeToCoordinates`) and both maps call it. Two parsers would let the editor and the
monitor disagree about where an area is, which is the one thing a map must not do.

## Staying current

The map refetches on SSE for all five entity types, and on `reconnected$` — SSE is at-most-once, so
a broadcast during a disconnect window is simply lost and only a refetch recovers it. A map of what
is happening *right now* is worse than useless when stale: an operator reads "nothing open here"
off an hour-old snapshot and walks into live work.

## Surface

- `GET /ng/work-areas/permit-map` — one call for all five layers. Five independent requests would
  let the layers disagree with each other while they landed, and would put the placement rules in
  the client.
- Falls under the existing `/ng/**` authenticated rule; no new security rule needed.

## Query note

Every status filter is an explicit `LEFT JOIN`. `e.permitStatus.name` in a WHERE clause is an
implicit INNER join in JPQL and silently drops every row whose status FK is null — and a null
status is not an edge case here, it is how "not started yet" is stored. That exact mistake made
the stale-package sweep see 5 of 159 packages a fortnight ago.

## Placing items from the map

"Not on the map" is where an operator sees the whole unplaced backlog at once with the plant
layout in front of them, so that is where the fix belongs rather than in five separate record
forms. `POST /ng/work-areas/permit-map/assign` writes the `workArea` FK, which promotes the item
to placement rule 1 — from then on it is drawn from a recorded decision, not a guess.

### Two pieces of state, either order

Staging an item and choosing a target area are **independent**. Pick an area on the map and click
through everything that belongs to it, or tick a few items and then click where they go — the same
two pieces of state, so neither direction is a special case. A mis-click is undone by clicking
again, before anything is written. Escape backs out entirely.

- Clicking a shape focuses the panel **and** nominates it as the target. A shape carrying several
  work areas nominates nothing — the operator picks which, because placing into the wrong one of
  two overlapping areas is silent and wrong.
- The commit bar also carries a full area dropdown, which is the only way to reach an area that has
  no shape drawn.
- Only items **not** matched by AREA can be re-pinned from the map. An assigned area is a decision
  somebody recorded; it gets changed on the record, not on a map.

### The location text is left alone

Assigning writes the FK and nothing else. The operator's own words are not this action's to
rewrite, and the FK already outranks them in the placement ladder.

> This exposed a real bug. `SafeWorkMapper.convertToDto` **unconditionally** overwrote
> `dto.setLocation(...)` with the work area's name whenever the FK was set — the exact clobber that
> `HotWorkMapper` and `ConfinedSpaceMapper` already carry a guarded fix for and that this mapper was
> missed by. Every Safe Work placed from the map would have had its typed location replaced by the
> area name on the next reload. Now a fallback, matching its siblings.

### Validate everything, then write everything

Two passes: a bad reference rejects the whole request before a single entity is touched. The
obvious alternative — assign what you can and report the rest — is precisely the shape that broke
the stale-package sweep two weeks ago: a `@Transactional` method that throws inside a transaction
marks it rollback-only, so catching and carrying on **guarantees** that everything the batch
"succeeded" at is discarded at commit. Validating first removes the partial-failure path rather
than trying to survive it, and a rejected batch leaves the operator's selection intact to retry.

Mutation goes through the persistence context, not an UPDATE query, so `FieldChangeEntityListener`
fires and the assignment syncs. `@PostUpdate` does fire for a `@ManyToOne` repoint — the FK column
lives on the entity's own row, so it dirties it. (This is not the `@ManyToMany`-only case that
emits nothing.)

## Fix — work requests were losing their work area on every list call

Found in the production log while investigating a blank map: 117 of these in one afternoon, two a
minute, driven by the monitor's own 60-second poll.

```
ERROR c.d.p.mappers.permits.WorkRequestMapper - Work request 2000029689 could not be mapped;
      returning it without its associations
org.hibernate.LazyInitializationException: failed to lazily initialize a collection of role:
      WorkArea.constantLotos: could not initialize proxy - no Session
```

**`spring.jpa.open-in-view=false`** (set in `application.properties`, again in
`application-hub.properties`), so the persistence session closes when a service method returns. The
work-request controllers took **entities** from the service and mapped them themselves — mapping
detached objects. `WorkRequestMapper` embeds a full `WorkAreaDto`, and `WorkAreaMapper` reads
`WorkArea.constantLotos` and `WorkArea.locations`, both lazy `@ManyToMany`. First touch, exception.

The per-row `try/catch` in `convertToNgDtos` is why nobody noticed: the page still rendered, minus
the associations.

**Only requests that HAVE a work area were affected** — which is why it stayed a curiosity at two
rows. The map's assign feature turns that into the common case, so this had to be fixed before it
ships.

80. **Fetch and map in the same transaction.** `NgWorkRequestService` gains DTO-returning methods
    (`getAllNgDtos`, `getNgDtoPage`, `searchNgDtoPage`, `saveAllFromDtoAsNgDtos`,
    `softDeleteAsNgDto`) alongside the `getAllNgDtosByStatus` that already existed and already had
    it right. Seven call sites across `WorkRequestController` and `WorkRequestRestController` now
    use them: list, by-status, paginated, search, save, get-by-id and delete.

81. **`WorkAreaMapper` degrades instead of exploding.** Controller-level mapping is this codebase's
    house style — 81 sites across 25 controllers — so the same hazard exists anywhere else a
    `WorkArea` is mapped detached (`JobLogMapper` does exactly this). The two lazy collections are
    now read through a guard that returns **null** on `LazyInitializationException`, so a caller
    loses those two lists rather than the entire work area.

    Null, not empty, and that distinction is load-bearing: `NgWorkAreaService.saveFromDto` reads
    null as "no opinion, leave it alone" and a non-null list as "replace it". An empty list would
    **wipe** every standard and location on the area if such a DTO were ever posted back.

## Verification

- `WorkAreaLocationResolverTest` — 9 cases on the matching rules (boundaries, longest-wins,
  determinism, short-name floor).
- `PermitFormLayoutTest` — 8 cases, unchanged, still green.
- `PermitMapIT` — 6 cases through the real controllers on in-memory H2. This is the one that
  matters for deployment: **JPQL in `createQuery` is only parsed on first execution**, so a typo
  compiles fine and 500s in production. It covers the endpoint running at all (all five layer
  queries plus three lookup projections), TEXT placement end to end, unplaced reporting, assign
  writing the FK and re-placing as AREA, and all-or-nothing batch rejection.

All 23 pass. The whole backend (1616 files) compiles.

**One honest limit:** `PermitMapIT` does not reproduce the detachment above — reverting the
controller fix leaves it green, so the MockMvc harness keeps a persistence context open somewhere
the real request does not. It guards the contract ("a request with an area lists with that area"),
not that specific defect. The evidence for the defect is the production stack trace; the fix is
correct for `open-in-view=false` regardless of what the harness can observe.

## Empty-state diagnosis

First run on the hub drew nothing. The console said it plainly:

```
[InteractiveImage] Selection effect - selectedId: null shapes.length: 1
```

One shape, no placements, 56 items in "Not on the map". Not a failure — the endpoint had answered
and the layer counts were populated. That instance simply has no work areas linked to shapes, so
there was nothing the map could draw.

The problem was that a blank plant drawing looks exactly like a quiet day. Three additions:

82. **A notice over the drawing** when no area is drawn, and it distinguishes the two causes,
    because they need different actions: *no work areas exist at all* (create them — and note that
    with no area names to match, every item necessarily falls to "Not on the map") versus *areas
    exist but none has a shape* (draw them; placement via the dropdown still works meanwhile).
83. **A "Map coverage" line, always visible** — `N work areas · M drawn · S shapes`. Previously the
    areas-without-a-shape list was gated on those areas having items, which hid the answer in
    precisely the situation where it mattered: when nothing is placed, "how much of the plant is
    actually drawn" is the first question.
84. Assignment does **not** depend on shapes. The commit bar's dropdown lists every work area, so a
    backlog can be cleared even on a plant with nothing drawn yet.

> Worth a separate look: `WorkAreaGitHubPublisher.publishAll()` runs from `saveFromDto`, `saveShape`,
> `deleteShape` and `uploadMapImage` — but **not** from the CRDT apply path. A work area that
> arrives by sync therefore never refreshes the PWA's `work-areas.json`, so that dataset can go
> stale on any node that receives areas rather than creating them. Not touched here.

## Not done

- **No automatic write-back.** A TEXT match stays a display-time guess until a person places it.
  Making the guess permanent is a decision, and it should be an operator's rather than a batch
  job's.
- `PwaWorkRequestService.convertToEntity` still drops `workAreaId` on the Power Automate /
  SharePoint paths, because those payloads never carried one. Rule 2 papers over it; it does not
  fix it.
