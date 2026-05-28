# SDS Phase 2 — Book/Section Numbering + Incoming Queue (Plan)

Status: **planned, not yet built.** Phase 1 (core CRUD/sync/SP/UI) is done — see `sds-e2e.md`.
Supersedes earlier capacity-rollover idea after reviewing the real index sheet (`SDS INDEX.pdf`).

## What the real index sheet taught us
Columns: **Chemical Name | Book | Section | Location**. 4 books, filled in parallel; current max
section: **Book 1→23, Book 2→30, Book 3→27, Book 4→40**.
- **(Book, Section) = the unique address of ONE chemical.** "Section" = the laminated title number.
- Multiple rows sharing a Book+Section are the **same chemical listed under different names/aliases**
  (one chemical, many names — exactly the Phase 1 model). So the alphabetical index sheet (Phase 3)
  renders one row per *name*, all of a chemical's names pointing to its single Book/Section.
- There is **no capacity cap / auto-rollover** in reality (Book 4 is at 40). New books are started by
  a human decision.

## Confirmed decisions (2026-05-28)
1. **Numbering = suggest-then-approve, derived from data + a seed baseline.** On a new chemical the
   system suggests `(latestBook, nextSection)`; the **user approves or edits** it. Address is fully
   editable. NO automatic book increment, NO capacity rollover.
2. **Continue from existing books.** First suggestion must be **Book 4 / Section 41**. Seed via config
   (the DB is empty today; the 4 physical books aren't in it yet).
3. **"Add new book" is a manual user action** — a button that proposes `(latestBook+1, Section 1)` for
   the chemical being filed. No persistent counter; filing the first chemical in the new book
   establishes it in the data.
4. **Rename `chemicalIndex` → `sectionNumber`** everywhere (entity/DTO/mapper/SP/frontend), SP column
   `ChemicalIndex` → `Section`, UI label "Section" — to match the physical sheet and the user's
   language. Safe: feature is pre-deployment, no production data yet.
5. **"Incoming" status** added for the admin PDF-dump queue (see below).

## Numbering mechanism
`SdsAddressService.suggestNextAddress()` (derive-from-synced-data + config baseline floor; no mutable
counter — counters drift across offline instances):
- `latestBook = max(bookNumber over all chemicals, config sds.book.current-book-number)`
- `nextSection`:
  - if `latestBook == config current-book-number`:
    `max(max(sectionNumber in latestBook), config sds.book.current-max-section) + 1`
  - else: `max(sectionNumber in latestBook) + 1`
- New-chemical form pre-fills `bookNumber` + `sectionNumber` with the suggestion (via
  `GET /ng/sds-chemicals/suggest-address`); user approves/edits. Runs identically on hub + desktop
  (both have synced data + same config). Collisions from concurrent offline filing are corrected
  manually.
- **"Add new book"** button → sets `bookNumber = latestBook + 1`, `sectionNumber = 1` in the form.

### Seed config (application.properties — hub + desktop share these)
```
sds.book.current-book-number=4
sds.book.current-max-section=40   # next suggestion = Book 4 / Section 41
```

### Workflow rule (consistency)
Before physically filing a sheet, the operator must confirm the last section already in that physical
book (offline-assigned sections can collide). Surface a reminder on the detail/intake screen.

## Incoming queue (admin dumps PDFs → operators process)
- **Status lifecycle becomes: Incoming → Pending → Filed → Removed.**
  - `Incoming` = admin dumped a raw PDF, no metadata yet.
  - `Pending` = operator entered metadata but hasn't filed (no confirmed address / sheets).
  - `Filed` = address assigned + sheets printed.
  - `Removed` = out of inventory (record kept).
- Add `Incoming` to `SdsValueSeeder`. `getUnprocessed()` returns **Incoming + Pending** (currently
  Pending only) — this is the "needs processing" count.
- **Admin bulk dump (desktop):** a "Dump SDS PDFs" button → multi-file picker → creates one
  `SdsChemical` per PDF at status `Incoming` (PDF as attachment; names/locations/address empty).
- **Operator processing:** opens an Incoming item → fills names/locations (existing form) → approves
  suggested address → marks `Filed`. (The full guided intake *wizard* is Phase 3; for now the form +
  status chips + address suggestion cover it.)
- **Electron overview** (separate, still deferred): shows the Incoming/Pending count + list, links to
  the desktop SDS UI. Backend endpoint already exists (`/ng/sds-chemicals/unprocessed`, to be widened
  to Incoming+Pending).
- Optional desktop "Incoming" status tab on the SDS page.

## Build checklist (when approved)
1. Rename `chemicalIndex` → `sectionNumber` (backend entity/DTO/mapper/SP adapter+syncable/frontend
   models + table/detail); SP column `Section`; UI label "Section".
2. `SdsValueSeeder`: add `Incoming`. `NgSdsChemicalService.getUnprocessed()` → Incoming + Pending.
3. `SdsAddressService.suggestNextAddress()` + config props; `GET /ng/sds-chemicals/suggest-address`.
4. Desktop New-Chemical form: editable Book + Section fields pre-filled from suggestion + "Add new
   book" button.
5. Desktop "Dump SDS PDFs" bulk upload → Incoming records (page button + service method/endpoint).
6. "Check last filed section before filing" reminder on the detail dialog.
7. `mvn compile` + desktop/PWA `ng build`; update `sds-e2e.md` Phase 2 status.

## Still deferred
- Phase 3: title-sheet + alphabetical index-sheet HTML generation; guided intake wizard.
- Phase 4: audit flow (snapshot to hub DB, audit trail).
- Electron overview screen itself.
