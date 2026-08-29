# Printable Forms — Open Decisions

Generated from the gap analysis of the six paper forms supplied 2026-08-02.
Each item is answerable in one line. **Bold = my recommendation** — answering "yes to all" is valid.

Items marked ⚑ materially change scope or cost. The rest are detail-level; if you don't answer
them I'll proceed on the recommendation shown.

---

## Cross-cutting

1. ⚑ **Typos.** Reproduce the paper's spelling verbatim ("Relased Position", "All Personell
   Excited Space", "Flamable", "Post Entry Critque", "GCFI", "astmospheric", "Reclassifed") or
   silently correct? → **Reproduce exactly.** These are controlled safety documents; a printout
   that doesn't match the approved paper invites "is this the right form?" during an audit. Code
   field keys stay as they are; only the printed static label carries the paper's spelling.
   Separately **do** fix the existing layout's *own* transcription errors that are NOT on the paper
   ("Combustables", "flameble", "ofr", "locke", "Meck/Natural", "Liveline").
2. ⚑ **Page size.** Standardise on 8.5×11, or preserve the existing odd sizes? → **8.5×11 for
   everything we rebuild** (LOTO, LOTO Tag, Safe Work, both Confined Space); **keep 7.7×10.15 on
   Hot Work** since we're salvaging its 88 existing coordinates.
3. **NAES logo.** Add the `image` branch to both runtime renderers (6 lines) and embed a data URI,
   or text placeholders? → **Add the branch, but send me the artwork first** so I can size it before
   it goes into a CRDT-synced CLOB. Text placeholder is a one-container swap later.
4. **Print pagination fix.** One-line filter change in the legacy renderer, or repoint print at the
   refactored renderer? → **One-line change now.** The repoint is right long-term but changes print
   for all 12 existing forms at once — separate increment.
5. Fix the legacy renderer's self-recursive `getContainerStyles`? → **Yes, one line, before
   authoring the Hot Work matrix or CS grid** (both need per-cell borders, which triggers it).
6. Make top-level `radio` honour `FormField.options` (2 lines) so tri-state Yes/No/NA is possible?
   → **Yes** — cheap, widget already supports it, unblocks Hot Work without committing to it.
7. Soft-delete the 670 orphan `FORM_CONTAINER` rows before adding several hundred more? → **Yes.**

## LOTO Record Sheet

8. Which duplicate survives? → **Keep 2000030330; soft-delete 2000015727 AND clear its
   `IS_PRIMARY`** (no `@Where` on PrintableForm, so soft-delete alone won't fix the 500).
9. ⚑ Page 3 is landscape. → **Split into its own PrintableForm (`form_type='LotoSignOn'`, 11×8.5)
   and have PrintService pass `{landscape}`.** Per-page orientation is ~6 files and still wouldn't
   print without `preferCSSPageSize`.
10. Is "Reason for LOTO" the same as `workScope`? → **Yes.** The certification paragraph refers to
    "the Scope of Work above", pointing at that line.
11. Page-2 "Tag #" column: row ordinal 1–7, or the real tag number? → **Real tag number.**
12. "Lock # Placed" / "Lock # Removed" — nothing flags a Control Authority lock. → **Hand-filled.**
13. The four grey transfer rows. → **Hand-filled for v1.** Paper hard-codes two transfer pairs; the
    app allows unbounded transfers, overflow undefined.
14. "Authorization to Remove LOTO, Requestor" → `requestorReleasedBy`? → **Yes.**
15. "Completed By" beside Zero Energy Verification Method → **`pointVerifiedBy`.**
16. EID third sub-line binds `eidNumber`, which exists nowhere. → **Drop the line.**
17. Page-1 Notes box. → **Hand-filled.**
18. LOTO Position / Released Position source. → **Fallback chain: plain-String
    `isolatedPosition`/`normalPosition` first, resolved `isoPosName`/`normPosName` second.**

## LOTO Tag

19. ⚑ **Vehicle:** PrintableForm `form_type='LotoTag'` (form-array of cards, N-up on letter), or a
    bespoke HTML print service? → **PrintableForm**, unless you need true card stock. Bespoke is the
    only thing here that can emit a non-letter page, but it isn't designer-editable.
20. ⚑ **I need the card's physical width × height in inches**, and whether cut marks / border rules
    should print between cards.
21. Which cells are pre-printed vs hand-written? → **Pre-print Lockbox #, LOTO #, Tag #, Isolation
    Point, Isolation Position, Location; rule blanks for Lock #, Date, Hung By, Verified By.**
22. QR code on the tag? → **No for v1.** It forces the `image` branch plus per-card base64, and
    would tip the decision to bespoke HTML.
23. Will per-point lock assignment ever be built? (`assignLocks()` has no UI caller, 0/895 rows
    have `ASSIGNED_LOTO_POINT_ID`) → **Assume no; Lock # stays hand-written.**
24. Where does the operator trigger a batch? → **"Print Tags" button on the LOTO permit form,
    beside the existing "Print P&IDs".**
25. Retire the legacy `PrintTagFormComponent`? → **Yes, but confirm nobody uses that screen** — it
    still writes real data via `/ng/loto-points/tagging`. Fix `BradyController`'s singleton instance
    fields either way (live cross-user race).

## Safe Work

26. ⚑ **Biggest scope call:** page-1 7-row sign table + page-2 28-row sheet — bound (new repeating
    JSON column + both DTOs + form-array) or unbound ruled rows? → **Unbound for v1.** If bound
    later, model on `Loto.personnelJson`/`getPersonnel()`, *not* the seeder's dead
    `signOnSignOffJson`.
27. ⚑ Permit Number: sample reads `34748` (5 digits) but the app generates `D03-26-03-21-028`. Is
    the printed number `permitNumber` or `redTagNum`? → **I believe `redTagNum`** — the shape
    matches. Confirm; it decides which field I add to the Angular DTO.
28. Signatures (Work Authority / Plant Manager / Requestor). → **Wet-ink.** No signature widget
    exists.
29. Print `requestedBy` above the "Requestor X ___" line? → **Yes.** Note it activates a `required`
    validator on the Print/Submit guard.
30. "Safe Work Permit Released. Work Authority / Date-Time" → new fields or blanks? → **Blanks.**
31. ⚑ **Could not determine from the scan:** are there write-in blanks beside "Weather Hazards" and
    "Venting/Purging Procedure"? The DTO has `weatherHazardDescription` and
    `ventingPurgingDescription`. → **Tell me yes/no.** If no, those two fields become orphaned.
32. Checkbox rendering: single X-square for all 72 booleans, or keep Yes/No pairs on Permits/PPE?
    → **Single X-square everywhere** (matches the new paper); drop the five stray "Yes No" captions.
    The only place a pair belongs is the sign-table's "Work Completed" column.
33. Soft-delete the two dead SafeWork rows (1000008056, 1000008206)? Does the new form replace
    1000008169 as primary? → **Soft-delete both dead rows; keep 1000008169 non-primary and
    non-deleted** as an archive for permits already issued against it.

## Hot Work

34. Wire the four dead fields (`isAirMonitoringRegisteredOnConfinedSpace`, `isFireWatchRequired`,
    `timeOfInitialTest`, `initialTestResult`) through the Java DTO + mapper? → **Yes.** They back
    real paper cells and have silently eaten data across 39 permits.
35. If wired, push to SharePoint? (`HotWorkSharePointAdapter` maps only 10 fields) → **No** —
    desktop-only, or you need new SP list columns.
36. Permit #: print real `permitNumber` or the DB id? 31 of 39 rows have NULL. → **Print
    `permitNumber`, blank when null.** No backfill — a fabricated permit number is worse than blank.
37. ⚑ Cal Date currently binds the **same path** as the permit Date, so editing either clobbers the
    other. → **Add a dedicated `meterCalDate` field.** Doing nothing is not an option.
38. The 50 Time/Reading cells (10 on p1, 40 across four p2 fire-monitor blocks). → **Hand-filled
    blanks.** Fixed counts, no pagination risk, zero backend work — but tell me if they're actually
    filled before printing.
39. Six signature/date-time slots. → **All wet-ink.**
40. Cancellation section repeats Name of Requestor / Fire Watch (same FormControl drives both
    copies today). → **Separate hand-filled blanks.**
41. Y/NA checklist: keep 2-state boolean, or migrate to tri-state strings? → **Keep 2-state.**
    Migration means a data migration across 34 existing `measuresJson` blobs.
42. ⚑ Angular defaults all 12 measures to `true`, so a fresh permit prints with every Y box ticked.
    Intended? → **I'd make them null so a blank permit prints empty** — needs nullable `Boolean`
    server-side. Say the word.
43. Page-2 factor matrix representation. → **Individual `text` containers for the matrix; pre-wrap
    block for the two Definitions paragraphs.** An image prints blank; pre-wrap can't draw cell rules.
44. Confirm **salvage** rather than rebuild? → **Yes** — a seed mints a new id and forces
    soft-deleting a hub-synced row.

## Confined Space

45. ⚑ **The variant question:** two PrintableForm rows (`ConfinedSpace` +
    `ConfinedSpaceReclassified`) or one form with conditional containers? → **Two rows.** Verified:
    the container model has no conditional-visibility mechanism at all — `FormField.showWhen` is
    read only by SmartForm's validation service, never by any printable-form renderer. One-form is
    not buildable. This also means `CurrentConfinedSpaceService` must become `csType`-reactive
    instead of its hard-coded `getPrimaryFormByType('ConfinedSpace')` — **confirm that's acceptable.**
46. ⚑ Fix `csType` so it can be written (2 lines in `ConfinedSpaceMapper`), or have the operator
    pick the variant at print time? → **Fix it.** `grep setCsType` returns **zero hits** — all 58
    rows are PERMIT_REQUIRED. It also un-breaks the gas-monitoring flags in
    `NgDailyPermitPackageService` and the RedTag automation, both silently seeing PERMIT_REQUIRED.
47. ⚑ Atmospheric grid — 12 rows × 5 columns = 60 cells against 10 flat scalars. (a) new child
    entity, (b) `testsJson` list POJO alongside the existing three, (c) bind only the Initial Test
    column and hand-fill 48? → **(c) for v1.** The paper wants five timestamped rounds; today's
    model supports one, and only 8 of 12 rows in it. If you want it captured, **(b)** matches the
    existing `hazardsJson`/`ppeJson`/`precautionsJson` pattern.
48. Row 10 is labelled "Other" on paper but the field is `ammonia`. → **Keep the field name, print
    "Other."**
49. "Meter Cal Date" / "Meter Bump Test" have no backing field. → **Add `meterCalDate` and
    `meterBumpTest`; leave the existing boolean `calibrated` alone.**
50. Section 3: is there a check blank *before* "Lockout/Tagout" and "Hot Work Permit", or is the "#"
    blank the only mark? No boolean exists for either. → **I've assumed "#" is the only mark.**
    Confirm.
51. Entry Supervisor blocks (sections 6, 7, 14 — nine fields). → **Wet-ink.**
52. Attendant log (30 cells), entrant entry/exit record (44), FME record (20). → **Hand-filled.**
    Three new child collections for 94 cells, and it overlaps the PWA LOTO/walkdown work.
53. Permit # reads "14 / 1048" but `PermitNumberGenerator` produces `D%02d-yy-MM-dd-%03d`. →
    **Same question as #27** — I suspect `redTagNum` on both.
54. ⚑ Page 3 prints sideways. Separate landscape form, or genuinely rotated-on-portrait via CSS?
    → **Separate landscape form.** Rotation *is* mechanically expressible (both renderers spread
    `container.style` unfiltered) but **zero containers in the entire DB use `transform`**, print
    clips the post-rotation bbox at `.form-sheet{overflow:hidden !important}`, and there's no
    per-page element to style — so "rotate the page" means hand-compensating ~60 transforms.
55. Section numbers jump 6 → 12 → 14. Reproduce the gaps or renumber? → **Reproduce verbatim.**
56. "Space to be Entered": plain `space` text, not `work-area-select`? → **Yes, plain text.**
    `workArea` isn't on the Angular DTO, so a work-area-select renders empty *and nulls the
    association on save*. Note `ConfinedSpaceMapper:46-49` overwrites `space` with
    `workArea.getName()` on every read.

---

## Could not determine — needs you or a runtime check

- Safe Work write-in blanks beside "Weather Hazards" / "Venting/Purging Procedure" (#31)
- Whether "34748" and "14 / 1048" are `redTagNum` (#27, #53)
- LOTO Tag physical dimensions (#20)
- Whether Hot Work monitoring cells are filled before printing (#38)
- CSS page rotation is **mechanically expressible but completely unexercised** — 0 `transform`
  usages in 2,041 container rows. Treat any estimate for that path as a guess until one throwaway
  container is print-previewed.

---

## RESOLVED 2026-08-05 — permit edit locking

**Policy: "Active locks most fields, a few stay open."**

- `Building` — fully editable (draft).
- `Active` — scope/hazard/PPE sections FROZEN; operational sections stay writable
  (sign-on/sign-off, monitoring readings, closure comments, cancellation).
- `Closed` / `Cancelled` / `Revoked` / `Expired` / `Processed` — fully locked.

**Enforcement: both layers — frontend `readOnly` on the paper renderer AND a server-side guard on
save. Scheduled AFTER the remaining forms are built**, as one coherent pass rather than a UI-only
gate that the PWA, scripts or a direct POST would bypass.

**Consequence for seeding (acted on now):** the policy is per-SECTION, so every seeded container
carries a `groupId` identifying its section. `FormContainer.groupId` already exists and was unused
by the seeder. Tagging while authoring avoids re-authoring every form when the lock lands.

Convention:
- `frozen:<section>`  — locked once the permit leaves Building
- `ops:<section>`     — stays writable while Active
- untagged            — static text, never editable either way

**Context this resolves:** no edit gating existed at ANY layer for the six non-LOTO permit types
(verified 2026-08-05: zero frontend matches, zero backend guards; only JHA/WorkRequest have
revoke/cancel state checks, and only LOTO has a real FSM). For SafeWork the gate was not even
buildable before, because `permitStatus` was mapped in neither mapper direction so the client never
received it — fixed in the same session.

## RESOLVED 2026-08-29 — Confined Space built

Seeded as **three** `PrintableForm` rows from one authoring source:

| formType | pages | size |
|---|---|---|
| `ConfinedSpace` | 1–2 | 8.5 × 11 |
| `ConfinedSpaceReclassified` | 1–2 | 8.5 × 11 |
| `ConfinedSpaceEntryRecord` | 1 | 11 × 8.5 (landscape) |

`seedConfinedSpaceForm(name, reclassified)` emits both portrait variants, so the layout has a
single author and the two rows cannot drift. The four variant branches are exactly the four
differences off the master: title-bar colour/wording, section 7, the attendant rail
(RED "REQUIRED" vs BLUE "OPTIONAL"), and the cancel-line typo — reproduced verbatim in both
spellings per #55's reproduce-the-document rule.

**Closes #45** — `CurrentConfinedSpaceService` is now `csType`-reactive: it subscribes to
`selectedConfinedSpace$` and swaps the paper form, caching per type. The old
`getPrimaryFormByType('ConfinedSpace')` ran once in the constructor, so a Reclassified permit
printed the Permit-Required sheet.

**Closes #46** — `csType` maps both directions.

**Closes #49** — `meterCalDate` / `meterBumpTest` added through entity → DTO → mapper (both
directions) → Angular model → form field → table column, and the two grid rows are now bound
rather than ruled blanks. `calibrated` untouched.

**Closes #53** — bound to the generated `permitNumber`, not `redTagNum`, matching the Hot Work
correction. This required *adding* `permitNumber` to the Angular Confined Space model: it exists on
`BasePermitEntity`/`BasePermitDto` and is generated server-side, but the client model never declared
it, so it was dropped on every round trip and was unbindable.

**Supersedes #50** — the assumption there was wrong. `precautions.lockOutTagOut` and
`precautions.hotWorkPermit` are **text** on `ConfinedSpacePrecautions`, not booleans, so they seed
as labelled write-in lines with no tick. A filled permit number *is* the mark. Seeding them as
checkboxes would have written a boolean into a String slot.

57. Widget type must match `toFormFields`, not just the field name. Three bindings had drifted
    (`time` and `timeOfSample` seeded `text` against model `time`; `workScope` seeded `text`
    against `textarea`). Centralised in `csFieldType(key)` so the loops cannot drift again.
58. `lotoNum` / `hotWorkNum` are **DTO-only** — no entity column. `RedTagStepExecutionService`
    sets them on the same `csRef` during the `cs-open` step that `ConfinedSpaceBuildFlow` later
    reads, so that path is correct and was **not** changed. They are deliberately absent from
    `toFormFields`, which is why the paper form binds the persisted `precautions.*` pair instead.

**Verification** (the standing two-part check, plus a third): 49 bindings — 0 unresolved against
`toFormFields`, 0 missing from the default `fields` array that gates option merging, 0 widget-type
mismatches. Prefixed bindings are 11 hazards + 12 PPE + 8 precautions = 31, matching the POJO field
counts set-for-set. All 18 scalars confirmed present in entity, DTO, both mapper directions,
`toJson` and `fromJson`.

**Not yet done:** nothing is seeded into any database — run it from Admin → Forms, where the three
new types now appear in the dropdown automatically (they are registered in `SEED_TYPES`). The
rendered output has not been eyeballed against the screenshots.

## REBUILT 2026-08-29 — Confined Space and Safe Work, on the designer geometry

The first seeded rebuild of Confined Space was rejected on sight: *"my old form I built manually
[is] way closer to the screenshot."* That was correct, and the reason was structural, not cosmetic.

**What the hand-built masters do that the seeder did not.** Dumping `printable_form` 1000008193
(Confined Space, 201 containers) and 1000008169 (Safe Work Main, 205) out of `proddb` showed a
completely different construction:

| | designer-built masters | first seeded attempt |
|---|---|---|
| page size | **7.7 × 10.15in** (739 × 974px) | 8.5 × 11in (816 × 1056) |
| section | one **bordered box carrying the title**, content laid inside it | loose text runs, no box |
| rails | a `Sider` container, `writingMode: vertical-rl` | invented per form |
| fields | **underline-only**, light fill | full box |
| font size | `contentStyle.fontSize` as a **number** | `style.fontSize` as a `px` string |
| borders | **all four side widths always explicit** | shorthand only |

That last row is the one that keeps biting. `FormContainerDto`'s constructor spreads a default of
`borderTopWidth/Right/Bottom/Left = 1px`, so a style that merely omits a side does not get "no
border" — it gets a hairline that no amount of `borderStyle` tweaking removes.

**Decision: adopt the designer geometry wholesale.** New helpers (`designerForm`, `dStyle`/`dBox`/
`dUnder`/`dNone`, `dText`/`dField`/`dInput`/`dTick`/`dRule`/`dLbl`/`dRail`/`dSection`) reproduce the
hand-built shape exactly, so seeded and hand-built forms are now indistinguishable in construction.
Content follows the **new** SMP masters (the hand-built forms are the previous revision — they still
carry `8. NOT-PERMIT CANCELLATION/CLOSURE` where the current master has `14. PERMIT CANCELED/CLOSED`,
and they lack the Communication Plan block that moved onto page 1).

**Confined Space** — 49 bindings, two variants from one method, plus the landscape page 3.
**Safe Work** — 79 bindings, rebuilt to SMP-17 Rev 1; page 2 is the sign on/off continuation.

59. Geometry is now verified mechanically, not by eye: a reflective harness calls the layout
    methods on a bare `PrintableForm` and asserts every container falls inside 739 × 974. It
    caught the RECLASSIFIED page overflowing by 3px (section 7 was 120 tall at y=857), which no
    amount of reading the code would have shown.
60. Re-seeding is safe. `PrintableFormService#save` calls `resetPrimary`, which demotes every other
    form of that `formType` before promoting the new one — so seeding over the earlier attempt
    cannot produce the two-primaries state that makes `findByFormTypeAndIsPrimary` throw and takes
    the paper form offline.
61. `permits.ventingPurgingDescription` is deliberately **unbound on paper**. The previous revision
    printed "Venting/Purging Required #____"; SMP-17 Rev 1 dropped the write-in and prints only the
    tick. The field stays reachable on the web form. Same reasoning inverted for the Excavation
    reference: the master *does* print a write-in there but `SwPermits` has no matching text field,
    so it seeds as a ruled blank rather than being bound to an unrelated slot.

**Verification.** Confined Space 49 bindings / Safe Work 79 bindings; both 0 unresolved, 0 missing
from the default `fields` array that gates option merging, 0 widget-type mismatches. Group coverage
against the POJOs: CS 11 hazards + 12 PPE + 8 precautions = 31/31; SW 32 hazards + 17/18 permits +
22 PPE. Page extents: CS 737×857, RECLASSIFIED 737×973, SW 739×957 / 739×620 — all inside 739×974.

**Not verified:** neither form has been rendered since the rebuild, and there is no screenshot of
Safe Work page 2 — the roster continuation is 30 rows by choice, not by measurement.

## ADDED 2026-08-29 — designer backdrop (trace a form from its screenshot)

Load or paste a photo/screenshot of the paper form behind the designer sheet and place containers
directly over it. Motivated by the Confined Space rebuild, where geometry was guessed from an image
by eye and had to be recovered from the database instead.

62. **Not a FormContainer, despite `image` already being a supported `contentType`.** Reusing it
    was the obvious move and is the wrong one. A container is a CRDT-synced row: a full-page
    screenshot is several hundred KB of base64 that would sit in `content_json`, replicate over SSE
    to every desktop, print on the finished permit, appear in the container list, and be draggable
    and deletable by accident. This database has already been inflated once by exactly that kind of
    base64 write-amplification. (For the record: zero `image` containers exist in prod today.)
63. **Storage is IndexedDB on the authoring machine**, keyed `formId:page` — survives reload, never
    syncs, never prints, never leaves the designer canvas. A full or unavailable IndexedDB degrades
    to "backdrop does not persist" rather than breaking the designer.
64. **Per page, not per form.** Page 2 of a permit is a different sheet and wants its own reference.
65. **Two-point calibration, not fit-to-sheet.** Eyeballing the fit leaves a scale error that
    compounds down the page — containers traced near the bottom land progressively wrong. The
    operator clicks the form's top-left and bottom-right printed corners and the transform is
    solved so that rectangle maps onto the sheet. Degenerate clicks (same point, or dragged the
    wrong way) are rejected rather than throwing the image off the sheet. `Fit` and `Stretch`
    remain as coarse starting points.

**Where it lives.** `services/form-backdrop.service.ts` plus a layer, overlay and toolbar group in
`form-designer-canvas`. The layer sits inside the scaled sheet so it zooms with the containers, is
`pointer-events: none` so it cannot intercept a drag, and paints below `.form-content`. Absolutely
positioned containers resolve against `.form-content`'s padding box, so container coordinates and
backdrop coordinates share one origin — the sheet's top-left — with no 20px padding offset.

Controls: Load / paste (Ctrl+V) / Clear / Show-Hide / Align (calibrate) / opacity / Fit / Stretch /
2% zoom steps / 1px nudge. Escape cancels calibration.

**Known interaction:** containers with an opaque `backgroundColor` (the designer masters use
`#f9f9f9`) will hide the backdrop behind them. Toggle `Hide`/`Show` when checking alignment against
existing work.

## FIXED 2026-08-29 — dead fields on the seeded Confined Space and Safe Work forms

Reported after first render: *"a lot of fields are not working - all the unchecked checkboxes are
not interactive. some fields are not fillable."* Values displayed correctly; clicks did nothing.

**Root cause: seeded containers carried no `zIndex`, and `PrintableForm.formContainers` is a
`HashSet`.** `FormContainer` overrides neither `equals` nor `hashCode`, so iteration order is
identity-hash order — arbitrary, and emphatically not creation order. With no z-index the renderer
stacks by DOM order, so a section-wrapping box could arrive *after* the fields it surrounds and
paint on top of them. The box is a plain `div` with no `pointer-events: none`, so it swallowed
every click inside its rectangle. Rendering was unaffected, which is why the form looked right in a
screenshot while half of it was dead.

The designer-built masters set an explicit z-index on all 201 containers, which is exactly why they
have never shown this. The rebuild adopted their section-box construction but not their z-order.

66. **Fix: stamp a monotonically increasing `zIndex` on every seeded container**, in creation order,
    reset per form in `seedForm` (now `synchronized`, so two concurrent admin seeds cannot
    interleave the counter). Applied in all four container factories — `text`/`field` and
    `dText`/`dField` — so the legacy forms get it too. This is the designer's own convention, and
    it makes stacking independent of how the collection happens to serialise.
67. **Rejected: `pointer-events: none` on non-field containers.** It would have been a belt-and-
    braces second layer, but container `style` is shared with the designer canvas, where
    `.draggable-container` needs to receive clicks to select and drag. It would have fixed the
    paper form by breaking authoring.
68. **Not changed: the `HashSet` itself.** Switching to `LinkedHashSet` + `@OrderBy` would make
    wire order deterministic, but it is an entity change that touches sync, and with explicit
    z-indexes the ordering no longer matters.

**Two further defects the new guard caught**, both invisible in review:
- Safe Work PPE column 3 ran 9px past its section box, putting the `GFCI` tick underneath the
  Special Instructions panel. Hazards had slack to donate, so `hzH` 205→195 and `peH` 112→124; the
  page total still fell from 957 to 959 within the 974 budget.
- Long labels wrapped and overlapped the row beneath: Confined Space `Lockout/Tagout (#` and
  `Hot Work Permit (#` (onto Ventilation), Safe Work `Energized Electrical WP`,
  `Air Monitoring within Safe Limits`, and `Fall Protection(Restraint/Lanyard/SRL)` — the last is
  the longest label on the sheet and is the one place that drops to 11px.

**Guard: `PermitFormLayoutTest`.** Drives each layout method reflectively against a seeder built
with null dependencies (they touch no collaborator, so no Spring context is needed) and asserts, per
page: every container has a z-index, nothing runs past the page edge, and — simulating the browser
hit test — no field's centre is covered by anything with a higher z-index. Covers Confined Space,
Reclassified, Safe Work and Hot Work, on their respective page sizes. It reproduced both defects
above before the fix. Tests are skipped by default; run with
`mvn test -DskipTests=false -Dtest=PermitFormLayoutTest`.
