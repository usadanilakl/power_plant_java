# Maximo OSLC — Verified Behavior (live-probed)

Everything here was **confirmed by live probing** the production instance
`https://maximo.jpowerusa.com/maximo` (object structures `mxapiwodetail`, `mxapiitem`,
`mxapiinventory`, `mxapioperloc`) on 2026-06-28, not assumed from the OSLC spec. The codebase
encodes these rules in `MaximoAccessService` and the adapters; this doc is the "why".

End-to-end validated on real WOs: **J26-39380** (labor + worklog + COMP) and **J26-41383**
(parts checkout: create → APPR → issue → COMP, plus a material RETURN).

## Auth
- `apikey` header on every call. `MaximoConfig` builds a dedicated `RestTemplate` with a
  **cookie-rejecting `CookieManager`** so each request is apikey-only. Otherwise Maximo issues a
  `JSESSIONID`, prefers that (credential-less) session on the next call, and returns
  `401 BMXAA0021E`.

## Updates & actions — header
- Use **`x-method-override: PATCH`**. The older `X-HTTP-Method: PATCH` returns
  `400 oslc#create_on_updateuri` on this instance.

## Adding child rows (labor / worklog / material)
POST the **parent WO resource** (`/oslc/os/mxapiwodetail/{href}`) with:
- header `x-method-override: PATCH`
- header **`patchtype: MERGE`** — MERGE is *additive*: it key-matches child rows by id, so a new
  keyless row is **appended** and existing rows are left untouched.
- **`patchtype: AddChange` REPLACES the collection** (deletes rows not in the payload). It silently
  destroyed a pre-existing worklog during testing, and returns
  `400 BMXAA1872E "a material issue/return transaction cannot be deleted"` on a WO with posted
  material. **Do not use AddChange for incremental adds.** (On a *fresh* WO with no actuals the two
  behave the same — which masked this until a second line was added.)
- The child array **key and every field must be `spi:`-prefixed** (`spi:labtrans`, `spi:worklog`,
  `spi:matusetrans`). Unprefixed keys are **silently dropped** (same gotcha as SR-create).

| Child | Inline key | Minimal fields | Notes |
|---|---|---|---|
| Labor | `spi:labtrans` | `spi:laborcode` (= uppercase personid), `spi:regularhrs` | Maximo derives craft, transtype=WORK, startdate, payrate, linecost |
| Worklog | `spi:worklog` | `spi:description` (Summary), `spi:description_longdescription` (Details), `spi:logtype` | `logtype` `WORK` is invalid (silently defaulted); use `CLIENTNOTE`. Read sub-collection URL path is `woworklog` but the inline write key is `spi:worklog` |
| Material issue | `spi:matusetrans` | `spi:itemnum`, `spi:quantity` (positive), `spi:storeloc` (storeroom, `WAREHOUSE1`) | Stored as **negative** usage; decrements `mxapiinventory.curbal` **immediately**, even before COMP; cannot be deleted |
| Material return | `spi:matusetrans` | + `spi:issuetype="RETURN"` (default `ISSUE`) | Positive qty stored positive with **negative** linecost (credit); restores `curbal`; works on a COMP WO |

`laborcode` = the user's Maximo personid = `User.getMaximoPersonid()` (explicit
`maximoPersonidOverride` else uppercased `windowsUsername`).

## Status change (the changeStatus action)
```
POST /oslc/os/mxapiwodetail/{href}?action=wsmethod:changeStatus
headers: x-method-override: PATCH
body:    {"status":"COMP","memo":"..."}      // NOT spi-prefixed — these are method params
```
- **COMP is terminal via the API**: `COMP→APPR` → `BMXAA4679E` (must be WAPPR); `COMP→INPRG` →
  `BMXAA4638E` (cannot be initiated). Validate before completing; don't rely on reopening.
- New WOs created via the API start at **WAPPR**.

## Create a WO
```
POST /oslc/os/mxapiwodetail   (header Properties: *)
body: {"spi:description":"...","spi:location":"01-ACC","spi:worktype":"CM","spi:siteid":"JG"}
→ 201; href is the last path segment of rdf:about; status = WAPPR
```

## `oslc.where` — the big constraints
- **No parentheses.** `( … )` → `400 BMXAA8744E "Encountered '('"`.
- **OR is unreliable.** Bare `a or b` errors; `a and b or c` mis-evaluates (returns wrong/empty).
  Treat **only all-AND** as safe.
- **Consequence — search:** a code-OR-description search is run as **two single-field queries,
  merged in Java**. A multi-word AND bucket is built by **AND-chaining `LIKE` per word within a
  field** (one query), unioned across fields. An OR bucket would need per-word fan-out (not built).
- **Never LIKE a multi-word phrase.** `description="%unit 2 sample panel%"` requires the words to be
  contiguous *and in order*: it finds 6 WOs, while the AND word bucket
  (`%unit%` AND `%2%` AND `%sample%` AND `%panel%`) finds 62 — every
  `UNIT 2 MONTHLY SAMPLE PANEL MAINTENANCE` is missed by the phrase, because `MONTHLY` splits it.
  Use `MaximoOslcMapper.likeWordConditions(field, value)`. The one legitimate use of a contiguous
  phrase is **identity matching** (a PM's own generated WOs — `descriptionPhrase`), where a word
  bucket would drag in unrelated WOs that merely share the same words.
- `in [ "A","B" ]` uses **square brackets**, never parens. Used for `spi:lead in [...]`.
- LIKE: `spi:field="%term%"` (case-insensitive).

## `oslc.orderBy` — the `+` trap
- Maximo **requires a leading sort sign** (`+`/`-`); unsigned → `BMXAA8744E … Was expecting
  <SORT_ORDER_SIGN>`.
- BUT Spring's `UriComponentsBuilder` leaves `+` literal in the query and the server URL-decodes it
  to a **space** → Maximo sees `‹space›spi:field` and rejects it (error at column 2).
- **`-spi:field` (descending) survives transport** (that's why the WO/SR `-spi:reportdate` works).
- For **ascending**, do **not** send `+` through `MaximoAccessService` — **omit `oslc.orderBy` and
  sort the (small, capped) result list in Java** (Location/Inventory adapters do this).

## `count=1` — a real count query (cheap)
- `count=1` + `oslc.pageSize=1` returns a **top-level `totalCount` with zero members**, in **~0.1 s**, whatever
  the collection size. Without `oslc.pageSize=1` it still materialises a full page (~1.1 s).
- This is what makes incremental refresh viable: probe first, fetch only when the count says something changed.
  Used by `MaximoInventoryAdapter.countStockLines/countChangedSince` and to size the page cap of a paged fetch
  so it can never silently truncate.

## Timestamps — `statusdate`, and the sub-second trap
- `mxapiinventory` exposes **no `changedate`/`changeby`** — asking for them returns nothing. `spi:statusdate` is
  the only timestamp, and it stamps **row creation and status transitions**, not every edit. So it detects new
  stock lines and ACTIVE↔OBSOLETE flips, but a **`curbal` / description / bin change is invisible to it**.
- Maximo stores statusdate with **sub-second precision but only ever emits whole seconds**. A row that reads back
  as `09:07:55` really is `09:07:55.412`, so `spi:statusdate>"2026-06-29T09:07:55"` **still matches that row**
  (verified: `totalCount:1`). A watermark probe at the raw max therefore reports "1 changed" on **every tick,
  forever**. Round the boundary up: `truncatedTo(SECONDS).plusSeconds(1)` → `totalCount:0` (verified).
- Filter values are **naive local** (`yyyy-MM-dd'T'HH:mm:ss`); an offset is not accepted. Responses *do* carry an
  offset and it varies with DST (`-05:00` in CDT, `-06:00` in CST) — parse as `OffsetDateTime` and compare by
  instant, then format the winner's own local fields back into the filter.

## Hierarchy: assets are flat, locations are not
- **Every asset's `spi:parent` is null** — verified across all 3,614 assets at site JG. There is no asset tree
  on this instance. Every asset *does* carry a `spi:location`.
- **`mxapioperloc` carries the real hierarchy**: `spi:parent`, `spi:hasparent`, `spi:haschildren`, and a
  `spi:locancestor` child collection listing every ancestor code (including the location itself and the site).
  Example: `01-FE-BFW407A` (ORIFICE PLATE) → location `01-FDW-INST` (INSTRUMENTATION) → `01-FDW`
  (UNIT 01 FEEDWATER) → `01` (UNIT 01 - LEVEL 1) → `JG` (site).
- **Consequence:** "the parent of this asset" only has an answer via its location. When the broken thing isn't
  an asset (a flange, an attemperator ring), file the ticket against a **location** with no assetnum — a valid,
  normal Maximo shape. `MaximoLocationAdapter.ancestors()` returns the chain in two calls (locancestor, then
  one `location in [...]` batch to order it by `parent`).
- Maximo **derives location from assetnum**, so a ticket must not carry a wrong asset alongside a deliberately
  broader location — the asset wins. Clear `assetnum` when aiming at a parent location.
- `putIfPresent` drops blank values from the create payload, so an omitted `spi:assetnum` is safe.

## Reference data (site JG)
| Need | Source | Notes |
|---|---|---|
| Locations | `mxapioperloc` | `spi:location/description/type/status/parent`, filter `spi:siteid="JG"`. ("U1 ACC" = `01-ACC`.) Hierarchical — see above. |
| Work types | — | The `MXDOMAIN` OS is **not API-authorized** (`BMXAA9301E`). Options are **curated** from values in use: CM, PM, WAR, REG. |
| Items | `mxapiitem` | `itemnum` + `description` (supports `description` LIKE). |
| Stock balance | `mxapiinventory` | `curbal`, `issueunit`, storeroom `spi:location` (main = `WAREHOUSE1`). `mxapiinventory`'s `item{description}` join returns **null** → descriptions must come from `mxapiitem` separately. |

## Known gaps (relevant to future work)
- `MaximoAccessService.getMap()` reads **one OSLC page only** — no `pageno` loop, no `responseInfo`
  next-page handling. A large query (e.g. a year of PM WOs across all leads) is **silently
  truncated**. Real paging must be added for catalog-style queries.
- `spi:pmnum` (the PM-master id, e.g. `JG-1183`) is **not** in `MaximoWorkOrderAdapter.SELECT_FIELDS`
  nor on `MaximoWorkOrderDto` — it's the stable dedupe key for recurring PMs and must be added.
- PM recurrence cadence lives on the PM master (`mxapipm`: `frequency` + `frequnit`), reachable via a
  second `spi:pmnum in [...]` query.
