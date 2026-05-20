# Red Tag Standards — Feature Plan

A new section under the LOTO Standard feature that digitizes the LOTO
standards currently living only as images inside the external Red Tag
system, reconciles each isolation row against the local LOTO point
database, and lets the user generate a native `LotoStandard` from the
reconciled points.

Source data: `project/features/loto-standard/LOTO Standards.pdf`
(16 pages, ~55 standards).

---

## 1. Confirmed data schema

Every Red Tag standard is a heading followed by one table. Columns:

| Column | Meaning | Maps to |
| ------ | ------- | ------- |
| Tag # | Row index (1, 2, 3 …) | row order |
| Attachment | Tag color/type — observed value: "Danger" | `tagType` |
| Isolation Device Description | Free text | `description` |
| Isolation Device PNID | The device id, e.g. `02-VCCH-301` | **match key → `LotoPoint.tagNumber`** |
| Isolated Position | e.g. CLOSED / OPEN / THROTTLED | `isolatedPosition` |
| Normal Position | e.g. OPEN / CLOSED / THROTTLED | `normalPosition` |

Some standards have a small addendum sub-table below the main one
(observed on "U2 Generator CCW"). Those rows are folded into the same
standard's row list during transcription.

---

## 2. Storage — DB entity

### `RedTagStandard extends BaseAuditEntity`
- `name` — e.g. "U2 Generator CCW"
- `unit` — derived: `U1` / `U2` / `BOP`
- `rowsJson` (TEXT) — JSON array of parsed rows (same pattern as
  `PointPrerequisite` / `SwPermits`: a JSON-serialized POJO list, no
  child entity/table needed)
- `sourceImageFileId` — FK to a `FileObject` holding the cropped image
  of this standard's table (so the UI can show the "actual Red Tag
  version")
- `generatedStandardId` — nullable FK to `LotoStandard`, set once the
  user generates a real standard from this one
- `importNotes` — free text for transcription caveats

### Parsed row POJO (`RedTagStandardRow`, JSON-serialized)
```
rowNumber       int
tagType         String   // "Danger"
description     String
pnid            String   // the match key
isolatedPosition String
normalPosition  String
```

Soft-delete + sync listener come free from `BaseIdEntity`.

Schema migration: a `red_tag_standard` table added to `schema.sql`
(idempotent `CREATE TABLE IF NOT EXISTS`, mirroring
`loto_standard_pending_change`).

---

## 3. Backend

`controller/angular/loto/NgRedTagStandardController` at
`/ng/red-tag-standards`:

- `GET /` / `GET /{id}` / `POST` / `PUT` / `DELETE /{id}` — standard CRUD
- `GET /{id}/matches` — for each parsed row, resolve suggested LOTO
  points by PNID. Returns
  `[{ row, matches: LotoPointDto[], status: MATCHED | MULTIPLE | NONE }]`.
  Matching delegates to `LotoPointRepo.findByTagNumber` (already used by
  `generateCounterpartPreview`).
- `POST /{id}/generate-standard` — body `{ name, lotoPointIds: [] }`.
  Creates a `LotoStandard` from the selected points via the existing
  `NgLotoStandardService` creation path, stamps `generatedStandardId`,
  returns the new standard's DTO.

`sevice/angular/loto/NgRedTagStandardService` — CRUD + the matching and
generate logic. Creating missing LOTO points reuses the existing
`POST /ng/loto-points` endpoint — no new endpoint needed.

DTO: `RedTagStandardDto` / `RedTagStandardIdDto` per project naming.

---

## 4. Frontend

New folder `frontend/src/app/features/loto-standard/red-tag-standards/`,
reached from a new entry in the LOTO Standard section.

**List component** — `TableComponent` over `RedTagStandardDto`, columns
name / unit / row count / "generated?" badge.

**Detail component** — two panes:
- Left: the source image (reuse `InteractiveImageComponent` for
  zoom/pan) — the "actual Red Tag version".
- Right: the parsed table. Each row carries a match badge:
  - ✓ **Matched** — links to the existing `LotoPoint`.
  - ⚠ **Not found** — inline "Create LOTO point" button; opens the
    existing LOTO point form prefilled with `tagNumber = pnid`,
    `description`, `normalPosition`, `isolatedPosition`.
  - ◆ **Multiple** — a small picker when several points share the PNID.
- Row checkboxes for selection. A "+ Add other point" affordance reuses
  `BulkSearchDialogComponent` to pull any DB point not in the table.
- "Generate Standard" — confirms the selected point set, calls
  `POST /{id}/generate-standard`, then navigates to the new standard in
  the existing LOTO standard form.

**State** — a `CurrentRedTagStandardService` (BehaviorSubject + signals)
per the `Current*Service` convention.

Reused, not rebuilt: `TableComponent`, `SmartFormComponent`/the LOTO
point form, `InteractiveImageComponent`, `BulkSearchDialogComponent`,
`SharedDataService` dropdowns, `PopupComponent`.

---

## 5. Ingestion

`RedTagStandardImportService` (or a one-time seeder) loads a transcribed
seed file `red-tag-standards-seed.json` on first run when the table is
empty — idempotent, like the LOTO box seeder.

Per-standard cropped images: rendered from the PDF (PyMuPDF) and stored
as `FileObject`s referenced by `sourceImageFileId`.

Transcription scope (per the chosen "a few first" approach):
- **Pass 1** — transcribe ~3-4 standards (U2 Generator CCW, Unit 2
  Generator, Unit 2 GSU, Unit 2 Seal Oil), build + verify the full
  vertical slice end-to-end.
- **Pass 2** — bulk-transcribe the remaining ~50 once the schema and UI
  are proven.

---

## 6. Phases

| Phase | Deliverable |
| ----- | ----------- |
| A | Entity + schema + DTO + repo; transcribe Pass-1 standards to seed JSON; crop + store source images; import service. |
| B | Controller + service: CRUD, `/matches`, `/generate-standard`. |
| C | Frontend: list, detail (image + parsed table + match badges), create-missing, generate-standard, `Current*Service`, section entry point. |
| D | Verify the vertical slice on the Pass-1 standards (match → create missing → generate → land on the new standard). |
| E | Pass-2: bulk-transcribe the remaining ~50 standards into the seed. |

---

## Status — IMPLEMENTED

All phases A–E are complete.

- **Backend**: `RedTagStandard` entity + `RedTagStandardRow`,
  `RedTagStandardDto` / `RedTagStandardMatchDto`, `RedTagStandardRepo`,
  `NgRedTagStandardService`, `NgRedTagStandardController`
  (`/ng/red-tag-standards`: CRUD, `POST /import`, `GET /{id}/matches`,
  `POST /{id}/generate-standard`). Table created by `ddl-auto=update`.
- **Frontend**: route `/red-tag-standards` (+ `/:id`), nav entry,
  `RedTagStandardService`, list + detail components.
- **Seed**: `src/main/resources/red-tag-standards/seed.json` — 46
  standards, 562 rows, 46 source images. Import is manual + idempotent
  (`POST /import`), never auto-run, so multi-client sync can't duplicate.
- **Tests**: `RedTagStandardIT` — 4 passing (idempotent import,
  rows+image stored, PNID matching, generate-standard).

### Transcription provenance

- **11 standards hand-verified** — the 4 Pass-1 standards plus 7 small
  tables OCR couldn't read (their images were single thin strips). These
  have `importNotes = null`.
- **35 standards OCR-drafted** (RapidOCR, `ocr_redtag.py`). PNIDs — the
  match key — are largely accurate; descriptions may have run-together
  words or occasional misreads. These carry
  `importNotes = "OCR draft — verify rows against the source image."`
  The detail view shows the source screenshot beside the rows so a
  reviewer can correct them; row edits persist via `PUT /{id}`.

Three standards (Ignitor 2026, both Air Compressors) print their
position columns in Normal-then-Isolated order; the hand transcription
accounts for this. Any OCR-drafted standard with the same swap will show
isolated/normal flipped until corrected in the UI — flagged by the
`importNotes` marker.

### Pipeline scripts (provenance, not turn-key)

`ocr_redtag.py` (RapidOCR table reconstruction) and `merge_seed.py`
(assemble final seed + stitch images) document how the seed was built
from `LOTO Standards.pdf`. Re-running them requires re-extracting the
per-standard images from the PDF first.
