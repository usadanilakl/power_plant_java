# EtaPro EPLog Scraper — Implementation Plan

## Status
**Investigated & de-risked 2026-06-29. Not yet built.** All trigger/settle unknowns
resolved via read-only probes + one live invoke test (see Investigation Summary).

## Goal & Scope
Scrape the EtaPRO **Event Log** (operator/shift log) into the app, as a sibling to the
existing numeric EtaPro scraper. Unlike Live/History (numeric point readings), this pulls
**text log records** (operator journal entries) and stores them as a new entity.

**End goal (all three):** (1) **manual refresh** from the UI, (2) optional **auto-pull**
with a configurable loop-interval setting, (3) **backfill** over an arbitrary date range.

**Build order (decided):** ship **manual refresh first** (v1 = a "Refresh" button in the
Operator Log tab that pulls a window on demand), then add auto-pull, then backfill. The
incremental watermark logic is built in v1 but driven by the manual trigger; auto-pull just
adds a timer on top.

Out of scope (for v1): editing/writing log entries back to EtaPRO; rich UI analytics.

## Investigation Summary (what we proved)

EtaPRO is a **VSTO/COM add-in** (`EtaPRO.ExcelAddIn`, EtaPRO 10 Client) — no VBA, no
CommandBar, and `COMAddIns(...).Object` is null. So the existing recalc/COM trigger paths
do **not** work. The EPLog is **command-driven**: changing the date cells does nothing
until "Refresh EPLog" is clicked.

Confirmed solution (probes `scripts/etapro-eplog-probe*.ps1`, `etapro-eplog-invoke-test.ps1`):
- **Trigger = UI Automation.** Excel has an "EtaPRO" ribbon tab; `Refresh EPLog` button is
  `Invokable=True`. Select the tab (SelectionItemPattern) → invoke the button (InvokePattern).
  Confirmed working: narrowing the window 32h→2h changed the table 12→1 rows, then restored.
- **Settle detection.** A refresh is a **clear-then-repopulate** cycle. For ~1.3s the OLD
  data still shows (naive "poll until stable" would export stale data), then the output
  region (rows 20+) is **wiped** (col-B last row drops to the 'Event Time' label ≈ row 17),
  then repopulates, then stabilizes. Full settle ≈5.4s for a small result.
  → Algorithm: snapshot baseline → after Invoke wait for the **clear/change** → then wait
  **stable-for-N-reads** → export.
- **Constraint:** Excel must be **restored** (not minimized) at invoke time for UIA to see
  ribbon controls.

## Data Shape (from `LOG.xlsx`)
Header params (fixed cells): Server=`192.168.190.85` (C3), Log Name=`Event Log` (F3),
**Event-Time Start=D6 / End=D7** (Excel serial date-times), plus Create-Time start/end,
Event-ID start/end, Max Rows (G15=100), Reverse, Hide Deactivated, text filters
(Description G11=`*`, Area, Location, Label, Created By).

Output table from row 20:
`Description | Area | Location | Created By | Create Time | Deactivated By | Deactivate Time | Crew`
(entries are real operator logs; many contain **embedded newlines**.)

## Reused vs New

| Layer | Reused as-is | New for EPLog |
|-------|--------------|---------------|
| PS process / signal protocol | persistent Excel, request/response.json loop | `template`=`eplog`; `ProcessEpLogRequest`; UIA helper |
| Engine | `EtaProScraperEngine` process mgmt, signal I/O | `Template.EPLOG`; settle-aware path; multi-line CSV parse |
| Entity | pattern: `extends BaseIdEntity`, `@Where(deleted)`, sync | `EtaProLogEntry` + repo + DTO + mapper |
| Orchestration | `EtaProScrapeWorker` single serial thread | 3rd worker branch: scheduled incremental EPLog pull |
| Sync | `FieldChangeEntityListener` auto-tracks BaseIdEntity | register `EtaProLogEntry` in `EntityTableRegistry` |
| Config / flag | `etapro.enabled`, timeout, paths | `etapro.eplog.*` props |
| Frontend | tab pattern, table component | "Operator Log" tab/view |

## Architecture

```
EtaProScrapeWorker (single thread)
  loop: live (priority) -> history -> EPLog (if due, every N min) -> idle
                                         |
                                         v
   EtaProScraperEngine.executeBatch(EPLOG, [], start, end)   [synchronized]
                                         |  signal files
                                         v
   etapro-scrape.ps1  ProcessEpLogRequest:
       1. restore Excel window (xlNormal)
       2. write D6/D7 (Excel serial date-times)
       3. select a log cell -> UIA: select EtaPRO tab -> Invoke "Refresh EPLog"
       4. wait-settle (clear -> repopulate -> stable)
       5. export table -> CSV  (newlines sanitized)
       6. (optional) re-minimize window
                                         |
                                         v
   Engine parse CSV -> dedup by Event ID -> save eta_pro_log_entry -> syncs to hub
```

## 1. Excel template — `template-eplog.xlsx`
- One EPLog at a **fixed anchor** (same layout as probed `LOG.xlsx`: header B3.., output B20..).
- **Add an `Event ID` output column** (via EtaPRO's EPLog insert dialog) → gives a stable
  dedup key + watermark. If Event ID cannot be an output column, fall back to a composite
  natural key (Create Time + Created By + Description hash) — **verify during template build.**
- Set Server / Log Name to plant values; leave Start/End empty (script writes them).
- Max Rows: keep 100 for incremental; raise for backfill (or page).
- Provision like the other templates: `electron-manager/etapro-defaults/` (gitignored xlsx),
  copied to working dir on first launch; `etapro.eplog.template.path` property.

## 2. PowerShell — `ProcessEpLogRequest`
New branch in `scripts/etapro-scrape.ps1` (dispatched on `template == "eplog"`):
1. `$excel.WindowState = -4143` (xlNormal) — required for UIA.
2. Write `D6` = start, `D7` = end as **`[double]` Excel serials** (use `.ToOADate()` on the
   Java-supplied ISO date, or convert in PS) to avoid locale/date-parse issues.
3. Select a cell inside the log (e.g. `B21`).
4. `Invoke-EtaProRibbonButton -buttonName "Refresh EPLog"` (helper from the test script;
   selects EtaPRO TabItem then InvokePattern.Invoke()). Fallback: "Refresh Sheet".
5. **Wait-settle**: capture baseline fingerprint (last row + first-row sample) before invoke;
   poll ~400ms until the output region clears/changes, then until stable for 4 reads;
   timeout = `etapro.scrape.timeout.seconds`.
6. Export `B20`-anchored table to CSV via `ExportPivotSheetToCsv`. **Sanitize embedded
   newlines** in cell text (replace CR/LF with a sentinel like ` \n ` or a space) so the
   CSV is one physical line per record (simplest fix for the line-based Java parser).
7. (Optional) re-minimize the window.

UIA helper + settle logic already prototyped in `scripts/etapro-eplog-invoke-test.ps1`.

## 3. Signal protocol additions
Reuse the existing request schema; `template`=`"eplog"`. `startDate`/`endDate` used as the
Event-Time window. `pointIds` unused (empty). Response unchanged (`status`, `lineCount`).

## 4. Java backend

**`EtaProScraperEngine.Template`** — add `EPLOG("eplog")`. In `executeBatch`, the EPLog path
skips the points cap (no points) and routes CSV parsing to the new log parser.

**Entity `EtaProLogEntry extends BaseIdEntity`** (mirror `EtaProReading`):
```
String  eventId;          // dedup key / watermark (if available)
String  description;      // multi-line text
String  area;
String  location;
String  createdByName;    // EtaPRO "Created By" (NOT the audit createdBy)
LocalDateTime createTime; // EtaPRO Create Time (Excel serial -> LocalDateTime)
String  deactivatedBy;
LocalDateTime deactivateTime;
String  crew;
String  scrapeSessionId;
```
- `@Where(clause = "deleted IS NOT TRUE")`, index on `eventId` (unique-ish) and `createTime`.
- `description` likely needs `@Column(length = ...)`/`@Lob` (long multi-line text).

**Repo / DTO / mapper** — `EtaProLogEntryRepo` (`existsByEventId`, `findMaxCreateTime`,
range queries), `EtaProLogEntryDto`, `UniversalMapper` usage like other DTOs.

**CSV parser** — new method on the engine (or a small parser) that handles the log columns.
Because we sanitize newlines in PS export, the existing `parseCsvLine` (quoted-field aware)
works per physical line; map columns by header name. Dedup by `eventId` (or composite key).

**Incremental pull service** — `EtaProLogPullService`:
- Watermark = `MAX(createTime)` from `eta_pro_log_entry` (stateless; no extra table).
- Each pull: `start = watermark - overlap(e.g. 1h)`, `end = now`; call
  `engine.executeBatch(EPLOG, [], start, end)`; dedup by eventId handles the overlap.
- First run (empty table): `start = now - configurable backfill (e.g. 30d)`; if a window
  could exceed Max Rows=100, page by shrinking the window / advancing watermark and log a
  warning if truncation is suspected (no silent caps).

**Trigger model (manual-first):**
- **v1 (manual):** UI "Refresh" button → controller → `pullService.pullIncremental(window)`
  → `engine.executeBatch(EPLOG, ...)`. Runs on the same serial Excel process; if a live/
  history batch is mid-flight the engine's `synchronized` serializes them. Returns the
  imported count to the UI.
- **Later (auto-pull):** add a 3rd branch to `EtaProScrapeWorker.loop()` after history:
  ```
  else if autoPull enabled AND (now - lastEpLogTick >= etapro.eplog.interval.ms):
      lastEpLogTick = now; pullService.pullIncremental(); didWork = true
  ```
  Interval is a user setting (default off). Keeps single-thread/serial + one Excel process.
- **Later (backfill):** a job-based date-range pull (reuse `EtaProScrapeJob` mode=EPLOG_BACKFILL
  or a small dedicated job), paging by window/Event-ID when a range exceeds Max Rows=100.

**Sync** — register `EtaProLogEntry` -> `eta_pro_log_entry` in `EntityTableRegistry`
(mapping + syncable list), exactly like `EtaProReading`, so entries replicate to the hub.

**Config** (`application.properties`, default off via `etapro.enabled`):
```
etapro.eplog.template.path=${user.dir}/etapro/template-eplog.xlsx
etapro.eplog.interval.ms=600000        # pull every 10 min
etapro.eplog.backfill.days=30          # first-run window
etapro.eplog.window.overlap.minutes=60 # re-pull overlap for boundary safety
```

## 5. Window-state handling (key design point)
Live/History minimize Excel (`xlMinimized`); EPLog needs it **restored** for UIA.
**Recommended:** keep ONE Excel process; the EPLog branch **restores before invoke and
re-minimizes after**. Since the worker is single-threaded and EPLog is infrequent
(~10 min), the occasional restore/minimize flicker is acceptable.
**Fallback** if flicker is unacceptable: a dedicated second Excel process for EPLog (own
signal dir, always restored) — heavier (2nd add-in load) but fully isolated.

## 6. Frontend (brief)
New "Operator Log" view under the EtaPro feature (or the app's "Logs" area):
- Table from `EtaProLogEntryDto.toTableColumns()` (Create Time, Area, Location, Crew,
  Created By, Description), date-range + text filter, paginated.
- Read-only v1. Reuse `TableComponent`, `SharedDataService` patterns.
- (Decision: standalone EtaPro tab vs. merge into existing "Logs" feature — see below.)

## 7. Decisions (resolved 2026-06-29)
1. **Pull model:** end goal = manual + auto-pull (configurable interval) + backfill;
   **build manual refresh first**, add auto-pull then backfill later.
2. **UI home:** new EtaPro **"Operator Log" tab** (alongside Live/History/Points).
3. **Process model:** **single Excel process**, EPLog branch restores window for the
   refresh then re-minimizes.
4. **Sync:** yes — `EtaProLogEntry extends BaseIdEntity`, registered in `EntityTableRegistry`
   (assumed; mirrors `EtaProReading`).
5. **Event ID as output column:** to be verified during template build (P1); composite-key
   fallback defined if unavailable.

## 8. Phased rollout (manual-first)
- **P1 — Template + PS branch:** build `template-eplog.xlsx` (incl. Event ID column),
  add `ProcessEpLogRequest` + UIA helper + settle; verify end-to-end via manual
  `request.json` (no Java). *Template creation is a manual step on the plant machine.*
- **P2 — Entity + parse + persist:** `Template.EPLOG`, `EtaProLogEntry` + repo/DTO/mapper,
  multi-line CSV parse, dedup by Event ID, sync registration; a `pullIncremental(window)`
  service + manual pull endpoint.
- **P3 — Operator Log tab (manual refresh):** new EtaPro tab with a filterable table and a
  **Refresh** button (default window = last N days; date-range picker). Delivers the working
  manual-refresh feature end-to-end.
- **P4 — Auto-pull:** worker branch + user setting (enable + interval), default off.
- **P5 — Backfill:** date-range job with paging; retention if needed.

## 9. Risks / open items
- **Multi-line CSV** — mitigated by sanitizing newlines in PS export (chosen) vs. a true
  multi-line parser (heavier). Decide in P2.
- **Max Rows=100** — fine incrementally; backfill must page or it silently truncates → log.
- **Window toggle flicker** — acceptable at 10-min cadence; revisit if operators complain.
- **Ribbon name brittleness** — target button by Name "Refresh EPLog"; if EtaPRO renames it
  in an update, the lookup throws loudly (no silent failure). Add to setup-guide.
- **Dedup key** — depends on Event ID column; composite fallback defined.

## 10. Testing
- PS: manual `request.json` with `template=eplog` → assert CSV + settle timing (reuse the
  invoke-test's poll log).
- Java: `EtaProScraperServiceCsvTest`-style test for the log-CSV parser incl. embedded
  newlines + quoted commas; dedup-by-eventId test (mirror `EtaProDedupTest`).
- Integration: incremental pull advances watermark; overlap re-pull produces no dupes.
```
