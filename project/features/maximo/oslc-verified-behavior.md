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

## Reference data (site JG)
| Need | Source | Notes |
|---|---|---|
| Locations | `mxapioperloc` | `spi:location/description/type/status`, filter `spi:siteid="JG"`. ("U1 ACC" = `01-ACC`.) |
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
