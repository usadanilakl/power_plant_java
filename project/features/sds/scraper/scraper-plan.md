# SDS eBinder Scraper — Plan & Status

Source of truth: the VelocityEHS **ChemManagement eBinder** for Jackson Generation
(`chemmanagement.ehs.com/9/<guid>/ebinder/?nas=True`, anonymous token link). Scrape steps in
`scraper.md`. Goal: (1) load names + SDS PDFs into the SDS system, (2) auto-audit against our DB.

## Decisions (2026-05-29)
- **Access:** anonymous token link (no login).
- **Match key:** **`sourceId`** = the eBinder item id (e.g. `148009872`, from the row checkbox id /
  `<a href>`). Switched from name → id for stable matching.
- **Import target:** new items → status **Incoming** with the SDS PDF attached; existing (same
  sourceId) → refresh names/manufacturer/revision. Names/locations/book/section/status otherwise kept.
- **Audit:** source-reconcile report — **new** (in eBinder, not in DB), **revised** (Revision Date
  changed), **missingFromSource** (active in DB with a sourceId no longer in the eBinder). Shown in the
  Electron overview + downloadable. Distinct from the Phase 4 human campaign audit.

## Backend — DONE (Phase 5A, compiles)
- `SdsChemical` + DTO/mapper: added `sourceId` (indexed match key), `manufacturer`, `sourceRevisionDate`.
- `SdsChemicalRepo.findFirstBySourceIdOrderByIdAsc`.
- `dto/sds/SdsImportItemDto` (names, manufacturer, revisionDate, sourceItemId, pdf) +
  `SdsImportReportDto` (sourceCount, created, updated, pdfsAttached, newChemicals, revisedChemicals,
  missingFromSource).
- `NgSdsChemicalService.importFromSource(items)` — upsert by sourceId + reconcile; `normalizeNames`
  splits comma (eBinder) or newline lists; PDF attached with SHA-256 dedup.
- `POST /ng/sds-chemicals/import` → returns the reconcile report.

## Scraper — BUILT (Electron main, `build:main` clean) — 2026-05-29
- `electron-manager/src/main/managers/webview-sds.manager.ts` — `WebViewSdsManager`: headless window,
  `applyLocation()` (All Locations → type → radio → Apply), paginate-scrape (BEM selectors), **PDF via
  `setWindowOpenHandler` → `net.request` w/ session cookies → base64** (View PDF opens a new tab),
  batched `/import` + `/source-reconcile`, disk cache + diagnostics.
- Wiring: `shared/types` (`SdsScraperConfig`/`SdsScrapeReport`/`SdsScrapeStatus`), `constants`
  (`DEFAULT_SDS_SCRAPER_CONFIG`), `ipc/events` (`IPC_SDS_SCRAPE_*`), `ipc/handlers`
  (`registerSdsScrapeHandlers` + instantiate), `preload` (`sdsScrapeRun/GetStatus/GetConfig/SaveConfig`).
- Invokable now via `window.electronAPI.sdsScrapeRun()` (devtools). Expect live tuning of
  `applyLocation()` + PDF capture (manager logs `DIAG`). List-row BEM selectors should be stable.

## Seed → Gap report → Close gaps — BUILT — 2026-05-29 (replaces the earlier CSV-merge page)
The book was built FROM the website, so "in book, not on website" is not a real category. The flow is:
**(1) admin seeds the matched book chemicals, (2) Electron reports what's still missing, (3) Electron
scrapes to close the gaps.** The book↔eBinder name matching was done ONCE, by hand (smart match — book
names are abbreviations/typos of the official product name), and baked into a bundled resource.

### Bundled seed data (backend resources)
- `src/main/resources/sds/ebinder-export.csv` — the full eBinder catalog (118 website chemicals;
  `Document ID` = sourceId).
- `src/main/resources/sds/sds-book-map.json` — curated mapping: `matched[]` = 85 book slots →
  `{sourceId, book, section, names[]}` (aliases at one slot share a sourceId; duplicate filings keep the
  first slot; B4/S34 holds two distinct chemicals → two entries); `unmatched[]` = ~32 book entries with
  no row in this export (paints/solvents/Oatey primers/legacy) — surfaced in the seed report, NOT loaded.

### Backend
- `SdsSeedService.seed()` — loads catalog + map, builds `SdsImportItemDto`s (eBinder names+mfr+rev +
  book/section, **no PDF**), calls `NgSdsChemicalService.importFromSource()` (upsert by sourceId →
  status **Filed** since book+section present). Idempotent. → `SdsSeedReportDto` (created/updated/
  matchedSlots/unmatchedBookEntries). Records reach SharePoint via the hub outbound sweep.
- `SdsSeedService.gapReport()` — `SdsGapReportDto`: `missingFromDb` (catalog sourceIds not in DB =
  website chemicals not yet filed) + `missingPdf` (active DB chemicals with no attachment = the seeded
  book items). Endpoints: `POST /ng/sds-chemicals/seed`, `GET /ng/sds-chemicals/gap-report`.

### Frontend admin tab
- `frontend/.../pages/admin/tabs/admin-sds.component.ts` (`AdminSdsComponent`, admin tab **"SDS"**, route
  `admin/sds`) — "Seed SDS Inventory" button → `POST /seed`; shows created/updated/matched + the
  unmatched-book-entries list.

### Electron SDS Import page (reworked; CSV merge removed)
- `pages/sds-import/sds-import.component.ts` (route `/sds-import`, sidebar "SDS Import"): **Run report**
  → `electron.sdsGapReport()` scrapes the eBinder list FRESH (no PDFs) and POSTs it to `/gap-report`
  (live data, not the bundled snapshot — so it can't go stale); shows the two gap lists (names + ids).
  **Close gaps** → `electron.sdsScrapeRun()` (full scrape: creates missing entries + downloads/attaches
  PDFs; dedup skips existing).
- Electron wiring: `WebViewSdsManager.getGapReport()` (scrapes list-only via `collectFromEbinder(false)`
  then POSTs), `IPC_SDS_GAP_REPORT`, preload `sdsGapReport`, `ElectronService.sdsGapReport`, shared
  `SdsGapReport`/`SdsGap`. Obsolete `importMerge`/`IPC_SDS_IMPORT_MERGE`/`sdsImportMerge` removed.
- Backend `POST /ng/sds-chemicals/gap-report` takes the scraped `List<SdsImportItemDto>` (sourceId+names);
  falls back to the bundled catalog if empty. `SdsSeedService.loadCatalog()` strips the UTF-8 BOM (the
  first header cell was `﻿Product Name`, so the name column wasn't found → empty names — fixed).
- `SdsImportItemDto` still carries optional `bookNumber`/`sectionNumber`; `importFromSource` promotes new
  items with both set to **Filed** (the scrape's PDF pass leaves the address untouched).

### Scraper DOM fix (2026-05-29) — STILL NEEDS A LIVE RE-RUN
First live run found 0 rows: the old `applyLocation()` typed "jackson generation" into the eBinder's
**product search**, filtering the list to "no results". The eBinder already loads "eBinder for All
Locations" with every chemical, so location-typing was actively breaking it. Replaced with
`ensureListLoaded()`: do NOT type a location; if rows are absent, click "Reset Search" to clear any stale
filter, then wait for `tr.data-table__tr`. (If the anonymous token covers multiple plants and this
over-pulls, add proper location-popup selectors from a fresh `DIAG` of the popup.) PDF capture still
unverified against the live site.

### SharePoint with hub off (NOT a bug)
Seeding from a desktop with the hub OFF will not push to SP — `SdsOutboundSharePointSync` is
`@ConditionalOnProperty(sync.role=hub)`. Seeded records are sync-tracked (localUuid stamped); they sync
to the hub when it's online and the hub's outbound sweep pushes them to SP. To get SP rows: run the hub.

All builds clean: `mvn compile`, electron `build:main`, electron renderer + Spring Boot frontend `ng build`.

## Original build outline (reference)
New `WebViewSdsManager` (headless `BrowserWindow`, `persist:` partition, diagnostics + polling helpers
copied from the AMS manager):
1. `loadURL(eBinder)` → click **All Locations** (by visible text/title) → in the popup type
   "Jackson Generation" into the search input → Enter → select first radio → click **Apply**.
2. **Scrape loop** over `tr.data-table__tr` using the stable BEM classes:
   - `sourceId` = the `<input type=checkbox>` id (or last segment of `.data-table__td--primary a[href]`).
   - `names` = `.data-table__td--primary a` text (comma-separated aliases → backend splits).
   - `manufacturer` = `.data-table__subdata`.
   - `revisionDate` / CAS / `dateAdded` = `.data-field` cells matched by `.data-field__label` text.
   - **PDF** = the "View PDF" button (`.icon--ghs-pdf`). ⚠️ **OPEN QUESTION — needs one live check:**
     does it (a) trigger a file download, or (b) open a PDF URL in a new tab? The manager will handle
     **both** (capture `ses.on('will-download')` AND `setWindowOpenHandler` + `downloadURL`), read the
     file → base64.
   - Next page: `.pagination__item[title="Next page"] button`; repeat until absent.
3. **Send to backend** (best-effort, health-check first, like AMS `pushToSpringBoot`):
   - PDFs are large → **batch** the `POST /ng/sds-chemicals/import` calls (~20 items/batch; sum
     created/updated/revised). Then one final reconcile pass for `missingFromSource`.
   - ⚠️ Backend refinement needed for batching: add `POST /ng/sds-chemicals/source-reconcile`
     (`List<String> sourceIds` → missing list), since per-batch `/import` can't compute "missing"
     correctly. (One-shot `/import` works only if the full snapshot fits under the 50 MB request cap.)
4. Cache the last report to disk; expose via IPC; show in the Electron overview with a download button.

### Wiring checklist (Electron)
- `shared/types.ts`: `WebViewSdsConfig` + status/report types.
- `constants.ts`: `DEFAULT_SDS_SCRAPER_CONFIG` (url, locationName="Jackson Generation", showScrapeWindow).
- `ipc/events.ts` + `ipc/handlers.ts`: `IPC_SDS_SCRAPE_*` (refresh/getStatus/getReport) + register +
  `new WebViewSdsManager()`.
- `preload` + renderer: a "Scrape eBinder" button + report view in the Electron SDS overview.

### Expect live iteration
Like the AMS scraper, the search-popup interaction and the PDF capture will need tuning against the
live site (the manager logs `DIAG (...)` snapshots for this). The list-row BEM selectors should be
stable.
