# Inventory / Parts-Checkout API — setup, verified behavior, and the MATUSETRANS quantity limitation

**Status:** current as of 2026-07-09. Verified live against `https://maximo.jpowerusa.com/maximo` with the
project apikey (resolves to Maximo user **DKLOKOV**, `adminmode 0`).

This document covers three things:

1. What the app does today (endpoints, flow, code map).
2. The exact Maximo OSLC contract it uses.
3. **Every payload variant tested for setting the material-issue quantity — what succeeded, what failed, and
   the root cause.** This is the handoff material for whoever administers Maximo.

---

## 1. Current app setup

All endpoints live under `/ng/maximo` (`NgMaximoController`) and are gated on `ROLE_PLANT` / `ROLE_ADMIN`.

| Endpoint | Purpose |
|---|---|
| `POST /parts-checkout` | Full checkout flow (create WO → issue → complete) |
| `GET  /work-orders/{href}/materials` | List a WO's material transactions |
| `POST /work-orders/{href}/issue-material` | Issue additional material on an existing WO |
| `POST /work-orders/{href}/return-material` | Return material (corrects an over/wrong issue) |
| `GET  /inventory?q=&storeroom=&pageSize=` | Search the cached stocked-item catalog (in-memory; never blocks) |
| `GET  /inventory/storerooms` | Distinct warehouses holding stock (also **warms the catalog**) |
| `GET  /inventory-catalog/status` | `{ready, building, rows, …}` — tells "still building" from "no match" |
| `GET  /inventory/{itemnum}` | **Live** stock detail (levels, cost, usage stats) — the balance/status authority |
| `GET  /inventory/{itemnum}/usage` | Material-use history for an item |

### Checkout flow — `MaximoPartsCheckoutService.checkout()`

1. `create` WO (`POST /oslc/os/mxapiwodetail`)
2. `changeStatus` → **APPR**
3. `addMaterials(href, lines, storeroom)` → issues the material
4. `changeStatus` → **COMP**
5. Read back `wonum` / `status` / `actmatcost` for the confirmation banner

### DTOs

```java
PartsCheckoutRequest { description, location, worktype, siteid, storeroom, List<Line> lines, memo }
PartsCheckoutRequest.Line { itemnum, quantity (Double), storeroom }   // storeroom is PER-LINE
IssueMaterialRequest  { List<PartsCheckoutRequest.Line> lines, storeroom }
ReturnMaterialRequest { List<PartsCheckoutRequest.Line> lines, storeroom }
MaximoInventoryItemDto { itemnum, description, issueunit, storeroom, binnum, curbal, status }
```

### The three (and only three) issue/return call sites

| Surface | Action | Path |
|---|---|---|
| **Check Out Parts** page | issue | `checkoutParts` → `addMaterials` → `postMaterial` |
| **WO dialog** → Materials tab | issue | `issueMaterial` → `addMaterials` → `postMaterial` |
| **WO dialog** → Materials tab | return | `returnMaterial` → `returnMaterials` → `postMaterial` |
| **Inventory** page | — | no direct issue; its "Check out" button navigates to Check Out Parts |

Everything funnels through the single `MaximoWorkOrderAdapter.postMaterial(...)`.

### Inventory catalog (`MaximoInventoryCatalogService`)

Site-wide stocked catalog (one row per item × warehouse), keyed `itemnum|location`, held in memory and
mirrored to a **gzipped JSON snapshot** at `data/cache/maximo-inventory-catalog.json.gz` (gitignored — it is a
rebuildable cache, deliberately **not** an H2 table and **not** on the CRDT sync bus). Written atomically
(temp file + rename). `MaximoInventoryAdapter` is now stateless and just fetches.

**Why cache at all:** Maximo serves ~110 rows/sec *regardless of page size*, so ~6,000 stock lines plus the
description pass is a **~100-second** build. That cost can never be on a user's first search.

| Phase | Cost | What happens |
|---|---|---|
| Boot | ~50 ms | snapshot loaded from disk → search works immediately |
| Change probe (every 5 min) | ~0.1 s | `count=1` + `statusdate > watermark` → `totalCount` only |
| Incremental merge (only if >0) | ~2 s | fetch just the changed rows; descriptions only for itemnums never seen |
| Drift probe (every 5 min) | ~0.1 s | `count=1` `totalCount` vs `sourceCount` → mismatch means a **deletion** → full rebuild |
| Full rebuild | ~100 s | first ever run, drift, or `maximo.inventory.full-rebuild-hours` (default 12) elapsed |

- **Never evicted, never blocking.** Refreshes run on a private daemon thread and publish by swapping one
  `volatile` reference; a search always reads a complete catalog, old or new. `@Scheduled` only calls `warm()`
  — a 100 s rebuild inline would park Spring's single-threaded scheduler and stall every other job.
- **Watermark** = Maximo's own newest `statusdate` (its clock, so no timezone guessing), probed at
  `truncatedTo(SECONDS).plusSeconds(1)` — see the sub-second trap in `oslc-verified-behavior.md`.
- **Drift baseline is `sourceCount`** (raw member count Maximo last reported), *not* `rows.size()`: rows are
  de-duplicated by `itemnum|location`, and any collapse would read as permanent drift → a rebuild storm.
- **Balances are not authoritative here.** `INVENTORY` has **no `changedate`**, so a `curbal` change is
  invisible to the watermark; a cached balance is only as fresh as the last full rebuild. Anything about to act
  on stock re-reads it live via `getStock(itemnum, siteid, storeroom)` — the checkout page does this the moment
  a part is added (and blocks OBSOLETE). Status *is* tracked, because a status flip bumps `statusdate`.
- **Live exact-itemnum fallback** (~0.2 s): a single-token query with no cached hit is looked up live against
  `mxapiinventory`, so a part stocked minutes ago is findable before the next refresh. A cached search alone
  can never surface a not-yet-indexed item.
- Descriptions are enriched from `mxapiitem` via `itemnum in [...]` in chunks of **250**.
- Page cap is derived from the live `totalCount` (`total/500 + 2`), replacing the old fixed
  `CATALOG_MAX_PAGES = 20` — a **10,000-row ceiling against 5,991 actual rows** that would have silently
  truncated the catalog. A shortfall now logs an error.
- `GET /ng/maximo/inventory-catalog/status` → `{ready, building, rows, site, builtAt, fullBuiltAt}` so the UI
  can tell "still building" from "no match". Requesting it also warms the catalog.
- `DEFAULT_STOREROOM = "WAREHOUSE1"` (used only as a last-resort fallback).

---

## 2. Maximo OSLC contract used

- **Base:** `https://maximo.jpowerusa.com/maximo/oslc/os`
- **Auth:** `apikey: <key>` header. (Cookies must NOT be sent — a stale `JSESSIONID` causes `401 BMXAA0021E`.)

```
# Create a WO
POST /mxapiwodetail
headers: Properties: *
body:    {"spi:description":"…","spi:location":"01-ACC","spi:worktype":"CM","spi:siteid":"JG"}
→ 201, returns spi:wonum + rdf:about (href = last path segment). New WO starts at WAPPR.

# Add child rows (labor / worklog / MATERIAL)
POST /mxapiwodetail/{href}
headers: x-method-override: PATCH ; patchtype: MERGE
body:    {"spi:matusetrans":[{"spi:itemnum":"4370","spi:storeloc":"WAREHOUSE2","spi:issuetype":"ISSUE"}]}
→ 204

# Change status
POST /mxapiwodetail/{href}?action=wsmethod:changeStatus
headers: x-method-override: PATCH
body:    {"status":"COMP","memo":"…"}      // NOT spi-prefixed — these are method params
→ 204
```

Notes that bit us:
- `x-method-override: PATCH` is required (the older `X-HTTP-Method` → `400 oslc#create_on_updateuri`).
- `patchtype: MERGE` is the correct **additive** primitive. `AddChange` **replaces** the collection and 400s
  (`BMXAA1872E`) on a WO with posted material.
- Every child array key **and** every field must be `spi:`-prefixed; unprefixed keys are silently dropped.
- A material **issue transaction cannot be deleted** — reversing requires a RETURN.
- Returns **do** work on a COMP WO.
- `CAN` / `COMP` via the API are **rejected (400)** on a WO that already has material transactions.

---

## 3. THE PROBLEM — the material-issue `quantity` cannot be set through the integration

### Symptom

Every material issue posted through `mxapiwodetail` records **`quantity = −1` / `qtyrequested = 1`**, no matter
what quantity is sent. The Maximo UI (**WO → Actuals → Materials**, which writes the *same* MATUSETRANS) sets
any quantity fine — historical rows on this instance show single transactions of `−12`, `−30`, `−44`, etc.

This was masked for a long time because the original implementation only ever issued quantity **1**, which
happens to equal Maximo's default.

### Test matrix

Run live against test WOs **J26-41830** / **J26-41831**, item **4370** @ **WAREHOUSE2**. Every issue was
matched by a return (net-zero inventory).

| # | Target | Payload (inside `spi:matusetrans[]`) | HTTP | Recorded result |
|---|---|---|---|---|
| 1 | WO | `{itemnum, quantity: 2, storeloc, issuetype:"ISSUE"}` — *the app's original payload* | 204 | ❌ `quantity −1`, `qtyrequested 1` |
| 2 | WO | `{…, enterquantity: 2, issuetype:"ISSUE"}` | 204 | ❌ `quantity −1`; `enterquantity` isn't even a recognized field (reads back null) |
| 3 | WO | `{…, qtyrequested: 3, issuetype:"ISSUE"}` | 204 | ❌ `quantity −1` — **but `qtyrequested` stored as 3** ← key diagnostic |
| 4 | WO | `{…, quantity: -2}` (signed, no `issuetype`) | 204 | ❌ `quantity −1` |
| 5 | WO | `{…, quantity: 2}` (positive, no `issuetype`) | 204 | ❌ `quantity −1` |
| 6 | WO | kitchen sink: `{quantity, enterquantity, qtyrequested, linetype:"ITEM", conversion:1}` | **400** | ❌ rejected (a companion field is invalid) |
| 7 | WO | **N identical single-unit rows in one payload** | 204 | ✅ **each row issues 1 → N rows = N units** (the workaround) |
| 8 | WO | create the row, then **UPDATE** it: `{matusetransid: X, quantity: -3}` (mirrors the UI's "defaults to 1, then edit") | **204** | ❌ **quantity stayed −1** — accepted and silently ignored |
| 9 | Inventory | `POST /mxapiinventory/{invHref}` MERGE `{quantity: 2, issuetype:"ISSUE", storeloc, refwo:"J26-41831"}` | 204 | ⚠️ **`quantity −2` HONORED** — but **`refwo` = null**, no WO cost rollup |
| 10 | Inventory | same + `reforgid` + `refsiteid` | 204 | ⚠️ quantity honored, `refwo` **still null** |
| 11 | Inventory | RETURN `{quantity: 3, issuetype:"RETURN", storeloc}` | 204 | ✅ `+3` to `curbal` (quantity honored) |
| 12 | `mxapiinvuse` | `GET` | **400** | ❌ `BMXAA0024E — The action READ is not allowed on object INVUSE` |
| 13 | `mxapiinvuse` | `POST` (create header) | **400** | ❌ `BMXAA0024E — The action ADD is not allowed on object INVUSE` |

### The diagnostic fingerprint

- Row **#3**: `qtyrequested` **is writable** through the integration (it stored `3`).
- Rows **#1–#5, #8**: `quantity` is **not writable** — neither on **insert** nor on **update**, and the update
  even returns `204` while discarding the value.

⇒ The `MATUSETRANS.QUANTITY` **attribute specifically** is read-only to the integration on this instance.

### Why the UI works and the API doesn't

The UI edits `QUANTITY` on the live MBO, which runs Maximo's field logic and commits the entered value. The
integration bulk-sets the inbound fields and treats `QUANTITY` as read-only, so the value is dropped.

### Root cause / what a Maximo admin must fix

Pick either path:

**A. (preferred) Make `QUANTITY` writable on the object structure**
- **Object Structures → `MXAPIWODETAIL` → the `MATUSETRANS` child object**: confirm `QUANTITY` is
  **included** and **not** flagged read-only / restricted / excluded.
- Check for an **automation script** on `MATUSETRANS` (Init / Add / Save launch point, or an OS processing
  class) that defaults or resets the quantity for integration-created transactions.

**B. Enable the Inventory Usage route**
- Grant DKLOKOV's security group the **Inventory Usage** application (object `INVUSE`, actions **READ +
  INSERT**), and ensure `MXAPIINVUSE` is exposed to the integration.
- Then issue via **INVUSE → INVUSELINE** (`quantity` + *Issue To* = the work order). `INVUSELINE` carries the
  entered quantity; completing the document generates a correct, WO-charged MATUSETRANS.
- Note: this is the *modern* Maximo issue model, but since the plant issues from **WO → Actuals → Materials**
  (classic MATUSETRANS), **option A is the direct fix**.

Once either is done, the app change is a **one-liner**: drop the row-expansion loop in `postMaterial` and send
`spi:quantity: N` per line. The whole-units limitation disappears too.

---

## 4. Current workaround in the code

`MaximoWorkOrderAdapter.postMaterial(...)` expands a line quantity of **N into N single-unit matusetrans rows**,
all sent in one MERGE payload (test #7).

```java
private static final int MAX_UNITS_PER_LINE = 500;
// ...
long units = Math.round(qty);                 // whole units only
for (long i = 0; i < units; i++) {
    rows.add(Map.of("spi:itemnum", itemnum, "spi:storeloc", store, "spi:issuetype", issuetype));
}
```

**Properties of the workaround**
- ✅ Correct total quantity, correct `actmatcost`, correct inventory decrement, correctly linked to the WO.
- ✅ Applies to **issue and return**, across **all three** surfaces (checkout, WO-dialog issue, WO-dialog return).
- ⚠️ The WO shows **N material rows** instead of one (cosmetic / audit noise).
- ⚠️ **Whole units only.** A fractional quantity is rounded (`Math.round`) — this API path cannot issue a
  partial unit at all, so fluids/measure items are not properly supported here.
- ⚠️ Capped at `MAX_UNITS_PER_LINE = 500` per line (throws above that).

---

## 5. Related behaviors verified along the way

**Inventory `status` is PER-STOREROOM, not per item-master.** Item `4370` is item-master `ACTIVE`, but stocked
`WAREHOUSE1 → OBSOLETE (curbal 0)` and `WAREHOUSE2 → ACTIVE`. Issuing an obsolete inventory line is rejected by
Maximo ("this action is not allowed since the item … is obsolete"). Therefore **every issue/return line must
carry the exact `storeloc` the user picked** — hence `PartsCheckoutRequest.Line.storeroom`, dedupe by
`itemnum + storeroom`, and the UI surfacing/blocking OBSOLETE lines.

**`oslc.orderBy` requires a sort sign.** A sign-less field → `400 BMXAA8744E … Was expecting <SORT_ORDER_SIGN>`.
`-spi:field` survives transport; `+` gets URL-decoded to a space by `UriComponentsBuilder` and is rejected. For
ascending, **omit `oslc.orderBy`** and sort the (capped) result list in Java. This is why `listTasks` sorts by
`taskid` in Java.

**Work-order tasks** are child WOs (`istask=true`, `parent=<parent wonum>`), queried from `mxapiwodetail`.

---

## 6. Test artifacts & inventory state (be honest about this)

Two test work orders were created by the API during this investigation. Both are described
"API TEST … safe to cancel".

| WO | Status | actmatcost | Material rows | Notes |
|---|---|---|---|---|
| **J26-41830** | CAN | $0 | 5 ISSUE + 5 RETURN (+ manual 4/4) | Balanced. Clean. |
| **J26-41831** | COMP | **$1300** | **2 ISSUE, 0 RETURN** | ⚠️ **Known ledger discrepancy — see below.** |

**J26-41831 discrepancy.** Its two test issues were restored to stock via **inventory-side** RETURN
transactions (`mxapiinventory`), which are **unassigned** (`refwo = null`) and therefore **never post to the
work order**. Physical inventory is unaffected (the session's net inventory impact is zero), but the WO's ledger
overstates consumption by 2 units (~$1300). There is no longer a perfectly clean reversal: returning on the WO
now would re-credit stock, which would then need an offsetting unassigned issue — relocating the artifact rather
than removing it.

### ✅ Correct procedure for any future live test

1. Create a test WO → `changeStatus APPR`.
2. Issue the material **on the WO** (`mxapiwodetail` matusetrans).
3. Read back `spi:matusetrans` and `mxapiinventory.curbal` to observe the behavior.
4. **RETURN on the SAME work order** (WO-side, N single-unit rows with `issuetype: "RETURN"`).
   **Do NOT return via `mxapiinventory`** — that credits stock but does not post to the WO, leaving the WO
   ledger unbalanced and the return invisible on the work order.
5. Confirm `curbal` is back to baseline **and** the WO's `actmatcost` is back to `$0`.

---

## 7. Bottom line

- The app **works today**: quantities are honored end-to-end (checkout, WO issue, WO return) — but each unit is
  a separate matusetrans row.
- The single-row fix is **blocked in Maximo**, not in this codebase: `MATUSETRANS.QUANTITY` is read-only to the
  integration on `MXAPIWODETAIL`.
- It is **not** a permission problem with the apikey, **not** a Maximo product bug, and **not** related to
  INVUSE for this plant's workflow. It's an object-structure / automation-script configuration on this instance.
- Fix that one attribute → delete the expansion loop, send `spi:quantity: N`, and issues become single clean
  rows with fractional support.
