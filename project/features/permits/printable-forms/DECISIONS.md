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
