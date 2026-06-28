<!-- Generated 2026-06-28 from a code-reading pass over the final repo state; verified OSLC
     behavior was live-probed against maximo.jpowerusa.com. Keep in sync when the Maximo code changes. -->

# Maximo Frontend Reference (Angular 19)

Exhaustive reference of the Maximo feature as it exists in `frontend/src/app`. All pages are standalone components wrapped in `MainLayoutComponent` + `RouterMenuComponent`, guarded by `authGuard` + `fullAccessGuard`, and talk to one injectable service (`MaximoApiService`) hitting `${baseApiUrl}/ng/maximo`.

---

## 1. Routes & Navigation

### Route table — `routes/maximo.routes.ts`
Wired into `app.routes.ts` as `...MAXIMO_ROUTES.map(...)`; every non-redirect route gets `canActivate: [authGuard, fullAccessGuard]`.

| Path | Component |
|---|---|
| `maximo` | redirect → `maximo/assets` (`pathMatch: 'full'`) |
| `maximo/assets` | `MaximoAssetsPageComponent` |
| `maximo/service-requests` | `MaximoServiceRequestsPageComponent` |
| `maximo/work-orders` | `MaximoWorkOrdersPageComponent` |
| `maximo/parts-checkout` | `MaximoPartsCheckoutPageComponent` |
| `maximo/bundles/lead-operators` | `MaximoLeadOperatorWosPageComponent` |
| `maximo/api-test` | `MaximoApiTestPageComponent` |

### Nav menu — `models/ui/router-menu.model.ts` → `GROUPED_MAIN_MENU`
Top-level group **"Maximo"** (icon `engineering`, color `#26C6DA`, `defaultRoute: /maximo/assets`, `requiresFullAccess: true`). Items:

| Label | Route | Icon | Notes |
|---|---|---|---|
| Assets | `/maximo/assets` | precision_manufacturing | |
| Service Requests | `/maximo/service-requests` | support_agent | |
| Work Orders | `/maximo/work-orders` | assignment | |
| Parts Checkout | `/maximo/parts-checkout` | inventory_2 | |
| Lead Operator WOs | `/maximo/bundles/lead-operators` | groups | `separator: true` |
| API Test | `/maximo/api-test` | api | `separator: true` |

The group + every item carry `requiresFullAccess: true`, so the whole Maximo menu is hidden unless `currentUser.accessLevel === 'FULL'`. `RouterMenuComponent` is rendered `[layout]="'row'"` in each page header; it supports `Alt+<n>` keyboard navigation to a group's `defaultRoute`.

---

## 2. Pages & Components

### 2.1 `MaximoAssetsPageComponent` (`maximo/assets`) — landing page
**Purpose:** search assets, then drill into an asset's SRs / WOs / attachments and submit a new SR inline.
**Key state (signals unless noted):** `searchTag`/`searchSite='JG'`/`searchSize=25` (plain), `searching`, `searchError`, `results: MaximoAsset[]`, `selected: MaximoAsset|null`, `activeTab: 'sr'|'wo'|'att'`, `srs`/`wos`/`atts`, `tabLoading`, `tabError`, `showSrForm`, `newSr: CreateMaximoServiceRequest` (plain), `submittingSr`, `uploadDoctype='Attachments'`, `uploading`. `selectedHasNoData` is a `computed()` over the active tab's list.
**Flow:** Search bar → `search()` → `MaximoTableComponent` (ASSET_COLUMNS, single-click `rowClicked` → `select(a)`). `select()` resets the new-SR template and loads the SR tab. Tabs (`setTab` → `loadTab`) lazy-load per type. The Attachments tab here renders its own inline table (Name/Description/Doctype/Type) with an inline upload row, and only links `d.url` directly (no proxy fallback). `openSrForm()` opens an inline SR form (`submitSr()` → `createServiceRequest`, prepends to `srs`). This page does **not** use the detail dialog or the richer `MaximoSrSubmitComponent` — it has its own minimal tables/form.

### 2.2 `MaximoServiceRequestsPageComponent` (`maximo/service-requests`)
**Purpose:** criteria-based SR search + new-SR submission.
**Key state:** `criteria: MaximoServiceRequestCriteria` (plain mutable object, seeded by `emptyCriteria()`), `pageSize=50`, `loading`/`error`/`list`/`loaded` signals, `showForm`, `selectedSr`. Date pickers bridged via `toLocal`/`fromLocal` (the date util). `statusOptions = ['', NEW, QUEUED, INPROG, PENDING, RESOLVED, CLOSED]`.
**Flow:** Filter panel (status/priority/page, asset/location/site, reportedby/affectedperson, report-date range, description/long-description contains). `apply()` requires `hasAnyCriteria()` (else error "Set at least one filter"), calls `listServiceRequestsByCriteria`. `activeFilterCount()` is a **plain method** (criteria is a mutable object, not a signal, so a computed wouldn't re-run). `clear()` resets. "+ New SR" toggles `MaximoSrSubmitComponent` (passed `tagNumber=criteria.assetnum`, `defaultSite=criteria.siteid||'JG'`); on `(submitted)` the new SR is prepended to the list. Results → `MaximoTableComponent` (SR_COLUMNS), `(rowDoubleClicked)` → `MaximoDetailDialogComponent [parent]='sr'`.

### 2.3 `MaximoWorkOrdersPageComponent` (`maximo/work-orders`)
**Purpose:** criteria-based WO search.
**Key state:** `criteria: MaximoWorkOrderCriteria` (plain), `pageSize=50`, `loading`/`error`/`list`/`loaded`, `selectedWo`. `statusOptions=['', WAPPR, APPR, INPRG, COMP, CLOSE, CAN]`, `worktypeOptions=['', CM, PM, EM, INSP]`. Same date bridge.
**Flow:** Larger filter panel (status/worktype/priority/page; asset/location/leadCraft/supervisor/site; sched-start≥, sched-finish≤; reported≥/≤; WO#-contains, description-contains, long-description-contains). `apply()` guards on `hasAnyCriteria()`, calls `listWorkOrdersByCriteria`. Results → `MaximoTableComponent` (WO_COLUMNS), `(rowDoubleClicked)` → detail dialog `[parent]='wo'`. Dialog `(completed)` → re-runs `apply()` to refresh.

### 2.4 `MaximoPartsCheckoutPageComponent` (`maximo/parts-checkout`)
**Purpose:** end-to-end "pull parts" flow — one POST (`checkoutParts`) does create WO → set location/desc/worktype → approve → issue lines → complete.
**Key state:** form: `description`, `worktype='CM'`, `workTypes` (signal). Location picker: `locQuery`, `locResults`, `locSearching`, `selectedLocation`. Inventory picker: `itemQuery`, `itemResults`, `itemSearching`. `lines: CheckoutLine[]` (signal; `{itemnum, description, issueunit, curbal, quantity}`). Submit: `submitting`, `error`, `result: PartsCheckoutResult|null`. Recent: `recentCheckouts: RecentCheckout[]`, `selectedWo`. Constants: `DEBOUNCE_MS=300`, `MIN_CHARS=2`, `RECENT_KEY='maximo.recentCheckouts'`, `RECENT_MAX=15`.
**Flow:** Three cards — (1) Work order: location is a search-as-you-type picker (not a `<label>`, deliberately, to avoid click-forwarding), description, worktype `<select>` from `getWorkTypes()`. (2) Parts: debounced inventory search; results table with per-row "add" (`addLine`, dedup by itemnum). (3) Checkout lines: editable qty inputs, `overStock(l)` row warning (`curbal != null && quantity > curbal` — warns, never blocks), remove. `canSubmit` getter = location set + ≥1 line + all qty>0 + not submitting. `checkout()` posts, sets `result`, pushes to recents, resets form (keeps result banner). Result banner shows wonum/status/material cost + "Start another".

### 2.5 `MaximoLeadOperatorWosPageComponent` (`maximo/bundles/lead-operators`)
**Purpose:** read-only bundle — all WOs Maximo assigns to any local user with the `LEAD_OPERATOR` role. No filter panel (it's a curated view, not ad-hoc search).
**Key state:** `PAGE_SIZE=500` (static), `columns=WO_COLUMNS`, `status='APPR'` (plain), `statusOptions` (APPR / WAPPR / INPRG / COMP / '' all), `loading`/`error`/`list`/`loaded`/`lastLoaded` signals, `truncated` = `computed(() => list().length >= 500)`, `selectedWo`.
**Flow:** `ngOnInit` → `load()` (auto-load on open). Status `<select>` auto-reloads via `(ngModelChange)="loaded() && load()"`. `load()` calls `listLeadOperatorWorkOrders(500, status||undefined)`. Truncation banner when `truncated()` ("Showing the first N — results were capped… Narrow by status"). Results → `MaximoTableComponent` `(rowDoubleClicked)` → dialog `[parent]='wo'`; `(completed)` → `load()`.

### 2.6 `MaximoDetailDialogComponent` (shared dialog, parent `'sr'|'wo'`)
**Purpose:** backdrop modal showing full record details + lazy subcollections; for WOs it also drives Materials (return/issue) and Complete.
**Inputs/Outputs:** `@Input parent` (required), `@Input sr`, `@Input wo`, `@Output closed`, `@Output completed: EventEmitter<MaximoWorkOrder>`.
**Tabs:** `'details' | 'notes' | 'attachments' | 'complete' | 'materials'`. Materials & Complete tabs only render for WOs; Complete only when `canComplete` (status in `COMPLETABLE_WO_STATUSES = [APPR, INPRG, WMATL, WSCH, WPCOND]`, case-insensitive). `setTab()` lazy-loads each subcollection once (`*Loaded` signals).
**Key getters:** `isWo`, `title`, `description`, `longDescription`, `href`, `detailFields` (per-type `[label,value]` pairs). Backdrop click closes only when the click target is the `.mx-backdrop`. `downloadUrl(d)` returns `d.url` for WEB doclinks, else builds a Spring proxy stream URL `…/{parent}/{href}/attachments/{doclinkHref}/content` (adds apikey server-side, so `<a target=_blank>` works without exposing creds). `fmtSize` formats B/KB/MB/GB.
**Materials tab** (see §3 UX). **Complete tab** (see §3 UX). **Attachments tab:** doctype input + hidden file input upload (`onUpload` → `uploadAttachment`, prepends), table with proxy "open" links. **Notes tab:** worklog list.

### 2.7 `MaximoSrSubmitComponent` (embedded SR form)
**Purpose:** self-contained "New SR" with tiered asset auto-match and attachment dropzone. Embedded on the SR page (and intended for a future plant-map wizard).
**Inputs/Outputs:** `@Input tagNumber`, `@Input defaultSite='JG'`, `@Output submitted: MaximoServiceRequest`, `@Output cancel`.
**Key state:** `sr: CreateMaximoServiceRequest` (`empty()` template, priority `'3'`), `match: AssetMatchState` (discriminated union: idle/loading/exact/candidates/none/error), `pending: PendingFile[]`, `isDragOver`, `submitting`, `submitError`, `attachmentProgress`.
**Flow:** `ngOnChanges` on `tagNumber` → `lookupAsset` → `MaximoAssetLocatorService.locate()`. On exact/wildcard/partial single hit, `applyAsset()` prefills assetnum+location (+siteid if blank). On multiple candidates, renders a picker (`pickCandidate`); each option may show "matched: <segments>". Banners per tier via narrowing getters (`matchExact`/`matchCandidates`/`matchErrorMsg`/`matchKind`) because Angular templates can't narrow unions; `tierLabel()` humanizes exact/wildcard/`partial match on "<term>"`. Drag-drop or browse → `addFiles` (default doctype `Attachments`). `submit()` creates the SR first; if that fails it aborts. If the SR is created, it chains attachment uploads sequentially, updating per-file `status` and `attachmentProgress` ("Uploading i of n…"); upload failures are surfaced per-file but do **not** fail the submit (SR already exists). Then emits `submitted` and `reset()`s (re-running the lookup if a tagNumber is set).

### 2.8 `MaximoApiTestPageComponent` (`maximo/api-test`) — dev harness
**Purpose:** manual exercising of each API method. Numbered panels each holding a `PanelState` (`idle|loading|ok|error` + payload/error), e.g. search assets, get asset by tag, asset-locator (same `MaximoAssetLocatorService` the SR form uses), SRs for asset / by status / by criteria, WO criteria, attachments by parent, create SR, etc. Uses `toDatetimeLocal`/`fromDatetimeLocal` for the criteria date inputs. Not part of normal user flow.

### 2.9 `MaximoTableComponent` — lightweight list table
Self-contained table over already-fetched local data (no services/persistence). Inputs: `columns: Column[]`, `items: any[]`, `emptyMessage`. Outputs: `rowClicked`, `rowDoubleClicked`. State: `globalSearch`, `globalSearchLogic: 'AND'|'OR'`, `columnFilters: Record<id,string>`, `sortColumn`/`sortDir`, `focusedColumn` (signal). `MAX_SUGGESTIONS=50`. Behaviors: header click cycles asc→desc→unsorted (`onHeaderClick`); `cell()` resolves via `accessorFn`/`accessorKey`/`id`; `visibleItems()` (plain method, recomputes each CD cycle) applies per-column AND'd substring filters → global tokenized search (whitespace-split, every/some per AND/OR) → sort (numeric if both cells parse as numbers, else `localeCompare`). Explicitly the lightweight alternative to the shared `rf-table` (the doc-comment says use rf-table for virtual scroll / server pagination / persisted sort). See §3 for the suggestion dropdown.

---

## 3. Notable UX Behaviors

### Debounced word-bucket search (parts checkout + materials issue)
Both the parts-checkout location/inventory pickers and the dialog's add-part search debounce keystrokes (`DEBOUNCE_MS=300`) and require `MIN_CHARS=2` (clearing results below that). Timers are cleared on each change and on pick. Placeholders explicitly advertise multi-word narrowing — e.g. `type to search — words narrow (e.g. "02 acc")` and `(e.g. "gel desiccant")` — the backend buckets space-separated words. `(keyup.enter)` triggers an immediate search bypassing the debounce. `pickLocation`/`pickItem` clear the pending timer to avoid a late search overwriting the chosen value.

### Materials tab — return + issue (detail dialog, WO only)
`loadMaterials()` fetches `listWoMaterials`; `MaximoMaterialTxn.quantity` is **signed** (ISSUE negative, RETURN positive). Each ISSUE row seeds `returnQty[matusetransid] = abs(quantity)`. `netOut(itemnum)` sums `-quantity` across rows (issued minus returned). **Return:** per-ISSUE-row qty input + "Return" button → `returnMaterial(href, {lines:[{itemnum, qty}]})`; `returningId` signal disables all return buttons during the call; the refreshed rows replace `materials` and re-seed `returnQty`. The hint explains issues can't be deleted, so a RETURN transaction (credits line cost, restores stock) is the correct correction. **Issue (add a part):** debounced inventory search (`mItemQuery`, 300ms, ≥2 chars) → results table with a per-row qty `#qty` template ref + "Issue" → `issueMaterial(...)`; `issuingItem` signal guards concurrency; on success clears the search.

### Complete tab — labor people dropdown (detail dialog, WO only)
On first open, `prefillLaborcode()` runs `getLaborPeople()` + `auth.getProfile()` in parallel. The labor `<select>` is populated `name (personid)` with a blank "— select person —" option; if the signed-in user's `maximoPersonid` is in the list and no code is chosen yet, it's auto-selected (server defaults a blank code to the current user anyway, so failure here is non-fatal). Form fields: labor person, regular hours (step 0.25), log summary, optional log details. `submitComplete()` builds a labor array only if a code or hours is present, posts `completeWorkOrder(href, {labor, summary, details, complete:true})`, replaces `this.wo` with the returned WO, emits `completed`, sets `completeDone` (shows "✓ Work order completed. Status is now …"), and invalidates `notesLoaded` so the worklog reloads next time.

### Recent-checkouts localStorage panel (parts checkout)
A `RecentCheckout[]` is persisted in `localStorage['maximo.recentCheckouts']` (max 15, newest first, deduped by `href`). `loadRecent()` reads on construct (swallows corrupt/blocked storage); `pushRecent()` writes after a successful checkout. The "Recent checkouts (this device — click to return / add parts)" table shows WO#/status/material-$/location/description/when. Clicking a row → `openRecent()` fetches the live WO via `getWorkOrder(href)` (falling back to a `minimalWo(rec)` synthesized from the cached fields if the fetch fails) and opens the **detail dialog** so the user can use the Materials tab to return/issue parts as corrections.

### Lead-operator status filter + auto-load + truncation warning
`ngOnInit` auto-loads on `APPR` (actionable default). The doc-comment on `listLeadOperatorWorkOrders` warns that omitting status returns ALL statuses (dominated by historical CLOSE WOs) and truncates badly at the page cap. The status `<select>` auto-reloads once data has loaded (`loaded() && load()`). Because the bundle is a single un-paginated Maximo call, hitting exactly `PAGE_SIZE=500` means results were cut off — surfaced by the `truncated` computed and a banner advising the user to narrow by status. A "Refresh"/"Load" button and a `last loaded HH:MM:SS` timestamp are shown.

### maximo-table filter-suggestion dropdown
Each per-column filter input shows a value-suggestion popup while focused (`focusedColumn` signal set on `onFilterFocus`, cleared on `onFilterBlur` via a 150ms `blurTimer` so an option's `mousedown`+`click` registers before blur). `uniqueValuesFor(col)` collects distinct non-empty cell values (sorted); `suggestionsFor(col)` filters those by what's already typed and caps at `MAX_SUGGESTIONS=50`, returning `{items, truncated}`. The dropdown renders each value as a button (`pickSuggestion` sets the column filter and closes), shows "No matches" when empty, and "+N more — keep typing to narrow" when truncated. A `×` clear button (`clearColumnFilter`) appears when a filter has text. Options use `(mousedown)…$event.preventDefault()` to win the blur race.

---

## 4. API Service — `services/maximo/maximo-api.service.ts`
`MaximoApiService` (`providedIn: 'root'`), base `${baseApiUrl}/ng/maximo`; every method unwraps `SpringApiResponse<T>.responseData` (defaulting to `[]`/`null`).

| Method | Description |
|---|---|
| `searchAssets({tag?, siteid?, pageSize?})` | GET `/assets` — wildcard asset search (`%tag%`). |
| `getAsset(assetnum)` | GET `/assets/{assetnum}` — exact asset by tag, or null. |
| `listServiceRequestsByStatus(status, pageSize=50)` | Convenience → `listServiceRequestsByCriteria({status})`. |
| `listServiceRequestsByCriteria(c, pageSize=50)` | GET `/service-requests` with all SR criteria params. |
| `listServiceRequestsForAsset(assetnum, pageSize=50)` | GET `/assets/{assetnum}/service-requests`. |
| `getServiceRequest(href)` | GET `/service-requests/{href}`. |
| `createServiceRequest(body)` | POST `/service-requests` → created SR. |
| `listLeadOperatorWorkOrders(pageSize=100, status?)` | GET `/bundle/lead-operators/work-orders` (Lead-Operator-assigned WOs). |
| `listWorkOrdersByCriteria(c, pageSize=50)` | GET `/work-orders` with all WO criteria params. |
| `listWorkOrdersForAsset(assetnum, pageSize=50)` | GET `/assets/{assetnum}/work-orders`. |
| `getWorkOrder(href)` | GET `/work-orders/{href}`. |
| `completeWorkOrder(href, body)` | POST `/work-orders/{href}/complete` — report labor+worklog, change status (default COMP). |
| `listWoMaterials(href)` | GET `/work-orders/{href}/materials` — signed issue/return rows. |
| `returnMaterial(href, body)` | POST `/work-orders/{href}/return-material` → refreshed material rows. |
| `issueMaterial(href, body)` | POST `/work-orders/{href}/issue-material` → refreshed material rows. |
| `searchLocations(q, pageSize=25)` | GET `/locations` — location picker search. |
| `getWorkTypes()` | GET `/work-types` → `MaximoWorkType[]`. |
| `getLaborPeople()` | GET `/labor-people` → `{name, personid}[]` for the labor dropdown. |
| `searchInventory(q, pageSize=25)` | GET `/inventory` — inventory item search. |
| `checkoutParts(body)` | POST `/parts-checkout` — full create→approve→issue→complete flow. |
| `listWorklog(parent, href)` | GET `/{sr|wo}/{href}/worklog` → `MaximoWorklog[]`. |
| `listAttachments(parent, href)` | GET `/{asset|sr|wo}/{href}/attachments` → `MaximoDoclink[]`. |
| `uploadAttachment(parent, href, file, doctype?)` | POST multipart `/{parent}/{href}/attachments` (doctype as form field only — never also a query param, to avoid Maximo's 16-char DOCTYPE join error). |

### Related services
- **`MaximoAssetLocatorService`** (`locate(tag)` → `LocatorResult`): tiered match — (1) exact `getAsset`; (2) wildcard `searchAssets` (1 hit → single, >1 → candidates); (3) fuzzy: `extractSegments(tag)` (split on `-_/`, keep ≥2-char segments containing a letter, longest first), parallel per-segment wildcard searches (`PARTIAL_PAGE_SIZE=50`), merge/dedupe by assetnum, score by sum of matched-segment char lengths (tiebreak: more distinct segments, then assetnum alpha), return `TOP_K=20`. Returns first non-empty tier with `partialTerm`/`candidateScores` metadata.
- **`maximo-date.util.ts`**: pure `toDatetimeLocal(iso)` (Maximo ISO 8601 → `yyyy-MM-ddTHH:mm`) and `fromDatetimeLocal(local)` (→ ISO 8601 with browser TZ offset, zero seconds). Used by SR/WO criteria date pickers and the API-test panels.

---

## 5. Model Interfaces — `models/maximo/maximo.models.ts`

- **`MaximoAsset`** — `href, assetnum, description, siteid, location, status, assettype, assetid:number, parent, disabled:boolean`.
- **`MaximoServiceRequest`** — `href, ticketid, description, longDescription, status, assetnum, location, siteid, reportedby, reportdate, classstructureid, priority, affectedperson`.
- **`MaximoWorkOrder`** — `href, wonum, description, longDescription, status, worktype, assetnum, location, siteid, reportdate, targetStart, schedstart, schedfinish, leadCraft, supervisor, priority`.
- **`MaximoDoclink`** — `href` (doclink id), `document, title, description, urlname, url` (WEB-type only; FILE-type uses backend stream proxy), `urltype` (FILE/WEB), `doctype, doclinksid:number, mimeType, size:number, createdDate, modifiedDate, createby`.
- **`CreateMaximoServiceRequest`** — `description` (req) + optional `longDescription, assetnum, location, siteid, reportedby, classstructureid, priority, affectedperson`.
- **`MaximoLaborEntry`** — `laborcode?` (blank = signed-in user, resolved server-side), `regularhrs?:number`.
- **`CompleteWorkOrderRequest`** — `labor?:MaximoLaborEntry[], summary?, details?, logtype?` (default CLIENTNOTE), `complete?:boolean` (default true), `status?` (default COMP), `memo?`.
- **`MaximoLocation`** — `href, location, description, type, status, siteid`.
- **`MaximoInventoryItem`** — `itemnum, description, issueunit, storeroom, curbal:number|null`.
- **`MaximoWorkType`** — `value, label`.
- **`PartsCheckoutLine`** — `itemnum, quantity:number`.
- **`PartsCheckoutRequest`** — `description?, location` (req), `worktype?, siteid?, storeroom?, lines:PartsCheckoutLine[], memo?`.
- **`PartsCheckoutResult`** — `wonum, href, status, actmatcost:number|null`.
- **`MaximoMaterialTxn`** — `matusetransid:number, itemnum, description:string|null, issuetype` (ISSUE/RETURN), `storeloc, issueunit, quantity:number` (signed: issue negative, return positive), `linecost:number|null`.
- **`ReturnMaterialRequest`** / **`IssueMaterialRequest`** — `{ lines:PartsCheckoutLine[], storeroom? }`.
- **`MaximoWorklog`** — `href, worklogid:number, description, longDescription, logtype, logtypeDescription, createby, createdate, modifyby, modifydate, clientviewable:boolean, recordkey`.
- **`MaximoServiceRequestCriteria`** — `status?, assetnum?, location?, priority?, reportedby?, affectedperson?, classstructureid?, reportdateFrom?, reportdateTo?` (ISO 8601), `descriptionContains?, longDescriptionContains?, siteid?`.
- **`MaximoWorkOrderCriteria`** — `status?, worktype?, assetnum?, location?, priority?, leadCraft?, supervisor?, schedstartFrom?, schedfinishTo?, reportdateFrom?, reportdateTo?` (ISO 8601), `descriptionContains?, longDescriptionContains?, wonumContains?, siteid?`.
- **Type aliases:** `MaximoAttachmentParent = 'asset'|'sr'|'wo'`; `MaximoTicketParent = 'sr'|'wo'`.

### Column configs — `maximo-table-configs.ts`
Shared `Column[]` (from `models/column.model.ts`: `id, header, accessorKey?, accessorFn?, width?, filterable?, sortable?`): `WO_COLUMNS` (wonum/description/status/worktype/assetnum/location/leadCraft/supervisor/reportdate/targetStart/schedstart/priority), `SR_COLUMNS` (ticketid/description/status/assetnum/location/reportdate/reportedby/priority), `ASSET_COLUMNS` (assetnum→"Tag"/description/siteid/location/status). All columns `sortable:true, filterable:true`; plain `accessorKey` only (formatting deferred).

---

**Relevant file paths (all absolute):**
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\routes\maximo.routes.ts`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\models\maximo\maximo.models.ts`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\services\maximo\maximo-api.service.ts`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\services\maximo\maximo-asset-locator.service.ts`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\services\maximo\maximo-date.util.ts`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-table\maximo-table.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-table-configs.ts`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-detail-dialog\maximo-detail-dialog.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-parts-checkout-page\maximo-parts-checkout-page.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-lead-operator-wos-page\maximo-lead-operator-wos-page.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-work-orders-page\maximo-work-orders-page.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-service-requests-page\maximo-service-requests-page.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-assets-page\maximo-assets-page.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-sr-submit\maximo-sr-submit.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\features\maximo\maximo-api-test-page\maximo-api-test-page.component.{ts,html}`
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\models\ui\router-menu.model.ts` (Maximo nav group)
- `c:\Users\usada\my_projects\power_plant_java\frontend\src\app\app.routes.ts` (guard wiring)