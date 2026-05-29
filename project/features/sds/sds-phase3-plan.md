# SDS Phase 3 — Document Generation + Guided Intake Wizard (Plan)

Phase 1 + Phase 2 done (`sds-e2e.md`). **Phase 3A (document generation) is DONE; Phase 3B (wizard) is
next.**

## Confirmed decisions (2026-05-29)
1. **Sequence:** docs first, then wizard.
2. **Location:** desktop only. The PWA keeps its simple field-submission (creates Incoming/Pending);
   desktop operators process records through the wizard (printers live at the workstation).
3. **Index sheet:** ONE master alphabetical index across all books — one row per name (a chemical's
   aliases each appear, all pointing to its single Book/Section). Columns: Chemical | Book | Section |
   Location. Matches the existing `SDS INDEX.pdf`.
4. **Title sheet:** designed (not from a template) for user review — all names + all locations +
   Book/Section in the top-right corner.

## Phase 3A — Document generation — DONE
- `features/sds/refactored/services/rf-sds-print.service.ts` — client-side HTML → `window.print()`
  (no backend). `printTitleSheet(chemical)` and `printMasterIndex(chemicals)`.
- Detail dialog "Print Title Sheet" button; page "Print Index" button (`api.getAll()` → master index).
- Index excludes Removed + not-yet-filed; HTML-escaped; multi-page-friendly.
- **Review item:** title-sheet layout is a first pass — adjust fonts/spacing/wording after the user
  sees a printout.

## Phase 3B — Guided intake wizard — DONE (2026-05-29)
Built as `rf-sds-wizard.component.ts` (6 steps, desktop-only, transient). Entry points: "Guided
intake" page button + "Process" detail-dialog button (Incoming/Pending). Decisions taken (the
"open questions" below were resolved with the leans): transient UI; SDS PDF opens in a new tab;
all checklist boxes + final confirm required before Filed; both entry points implemented. Desktop
`ng build` clean. Title-sheet/wizard layout still pending live user review.

### Original plan (for reference)
Stateful "new SDS arrived" flow. Proposed steps (a multi-step dialog/panel driving one `SdsChemical`):
1. **Names** — add one or more names/aliases (textarea, one per line).
2. **Locations** — add one or more storage locations (one per line).
3. **Attach PDF** — the SDS document (reuses the attachment upload). For an Incoming record the PDF is
   already attached — show it.
4. **Save / address** — saves the record; the suggested Book/Section is pre-filled (Phase 2
   `suggest-address`), user approves or edits / "Start new book".
5. **Generate** — show the title sheet + master index (reuse `RfSdsPrintService`) and a
   **manual-steps checklist**: ☐ print title sheet, ☐ print index sheets, ☐ print the SDS PDF.
6. **Confirm** — operator confirms all manual steps done + reviews an overview of all data →
   status set to **Filed**, `processedBy` recorded, wizard closes.

### Open design questions for 3B (confirm before building)
- **Entry points:** "Process" action on an Incoming/Pending row (context menu + detail) and a "New SDS
  (guided)" button on the page? (vs. only one.)
- **State persistence:** is the wizard a transient desktop UI (status reflects done/not-done), or
  should partial progress persist so another user can resume? (Lean: transient UI; status =
  Incoming/Pending until Filed. Confirm.)
- **Printing the SDS PDF:** open the attached PDF in a new tab for printing (vs. just a checklist
  item with no auto-open).
- **Checklist enforcement:** can the operator reach "Filed" without ticking every box, or are they
  required? (Lean: require all ticks + a final confirm.)

## Still deferred
- **Phase 4 — Audit flow.** Select by location / alphabetical → confirm-correct (drops from list) or
  edit; on edit save the OLD snapshot in the hub DB (NOT SharePoint) + audit trail (who/when/comments).
  `lastAuditedAt` already on the entity. Pattern: `DailyPermitPackage.modificationsJson` /
  `PackageModification`.
- **Electron overview** screen (its `/ng/sds-chemicals/unprocessed` endpoint already returns
  Incoming + Pending).
