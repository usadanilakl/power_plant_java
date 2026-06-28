<!-- Generated 2026-06-28 from a code-reading pass over the final repo state; verified OSLC
     behavior was live-probed against maximo.jpowerusa.com. Keep in sync when the Maximo code changes. -->

# Maximo Backend Reference

Spring Boot integration with IBM Maximo via the OSLC REST API. All beans are gated on the `maximo.api-key` property (`@ConditionalOnProperty(name = "maximo.api-key")` on both `MaximoConfig` and `NgMaximoController`) — absent the key, nothing registers. Code lives under `sevice/maximo/` (note the project's intentional package typo `sevice`), DTOs under `dto/maximo/`, the controller at `controller/angular/NgMaximoController.java`, and the `RestTemplate` bean in `config/MaximoConfig.java`.

---

## 1. Configuration — `config/MaximoConfig.java`

`@Configuration` exposing the `maximoRestTemplate` bean (qualifier `"maximoRestTemplate"`).

### Properties
| Property | Default | Field |
|---|---|---|
| `maximo.base-url` | (required) | `baseUrl` |
| `maximo.api-key` | (required — gates the whole module) | `apiKey` |
| `maximo.default-site` | `JG` | `defaultSite` |
| `maximo.connect-timeout-ms` | `10000` | `connectTimeoutMs` |
| `maximo.read-timeout-ms` | `30000` | `readTimeoutMs` |

### RestTemplate construction
- Built on a JDK `HttpClient` (`JdkClientHttpRequestFactory`) with `connectTimeout` from `connect-timeout-ms`, `followRedirects(NORMAL)`, and read timeout from `read-timeout-ms`.
- **Cookie rejection**: a per-client `new CookieManager(null, CookiePolicy.ACCEPT_NONE)` is installed. Rationale (verbatim from code): Maximo issues a `JSESSIONID` on every response; if the shared JVM `CookieHandler` echoes it back, Maximo prefers session auth, finds the session has no credentials, and returns `401 BMXAA0021E`. Rejecting all cookies keeps every call apikey-only.
- **Auth interceptor**: every request gets header `apikey: <apiKey>`, and `Accept: application/json` if not already set.
- Logs `[Maximo] Configured RestTemplate baseUrl=… site=…` at startup.

---

## 2. Access facade — `sevice/maximo/MaximoAccessService.java`

`@Service`. The single channel for all Maximo OSLC communication. Constructor is explicit (not Lombok) specifically so `@Qualifier("maximoRestTemplate")` is honored on the `RestTemplate` parameter — with `@RequiredArgsConstructor`, Lombok would drop the qualifier and Spring could inject the wrong `RestTemplate` (e.g. `sharepointRestTemplate`), yielding `401 BMXAA0021E` for lack of the apikey header.

### URL builders
| Method | Returns |
|---|---|
| `osUrl(objectStructure)` | `baseUrl + "/oslc/os/" + objectStructure` |
| `subUrl(os, href, collection)` | `osUrl(os) + "/" + href + "/" + collection` |
| `buildUri(url, params)` | `UriComponentsBuilder` with each non-null/non-blank query param; `.encode().build().toUri()` |
| `defaultSite()` | `config.getDefaultSite()` (e.g. `JG`) |

### HTTP operations
| Method | Verb / headers | Notes |
|---|---|---|
| `getMap(url, params)` | GET, `Accept: application/json` | Returns the OSLC envelope as `Map<String,Object>`. |
| `postJson(url, params, body)` | POST, `Content-Type: application/json`, **`Properties: *`** | `Properties: *` makes Maximo echo back the created/updated record. Used for create (SR, WO). |
| `addChildren(resourceUrl, body)` | POST, `Content-Type: application/json`, **`x-method-override: PATCH`**, **`patchtype: MERGE`**, `Properties: *` | Adds child rows (labor/worklog/material) to an existing parent resource. MERGE is additive — key-matches child rows by id; a keyless new row is appended, existing rows untouched. (AddChange replaces the collection and is **not** used here.) Often returns 204 / empty body. |
| `invokeAction(resourceUrl, action, body)` | POST `?action=<action>`, `Content-Type: application/json`, **`x-method-override: PATCH`** | Invokes an MBO method (e.g. `wsmethod:changeStatus`). Body carries method params by name (NOT spi-prefixed). Maximo answers 204 on success. |
| `postBinary(url, bytes, headers)` | POST raw bytes | Returns `ResponseEntity<Void>` so callers can read the `Location` response header. Used for doclink uploads. |
| `getBytes(url)` | GET | Returns `byte[]` (attachment download). |
| `getBinaryWithHeaders(url)` | GET | Returns `ResponseEntity<byte[]>` so the proxy can forward `Content-Type`/`Content-Length`/`Content-Disposition`. |

All operations catch `HttpClientErrorException`, log `[Maximo] … failed: <status> <body>`, and rethrow. Private `jsonHeaders()` sets `Accept: application/json`.

---

## 3. REST endpoints — `controller/angular/NgMaximoController.java`

Base path **`/ng/maximo`**. All JSON endpoints return `ResponseEntity<NgApiResponse<T>>` (`NgApiResponse` = `{ data: T, message: String }`); binary endpoints return `ResponseEntity<byte[]>`. `path/{href}` is the OSLC resource id (last segment of `rdf:about`).

| Method | Path | Query / body params | Response data type |
|---|---|---|---|
| GET | `/assets` | `tag?`, `siteid?`, `pageSize=25` | `List<MaximoAssetDto>` |
| GET | `/assets/{assetnum}` | — | `MaximoAssetDto` (null + "not found" if absent) |
| GET | `/assets/{assetnum}/service-requests` | `pageSize=50` | `List<MaximoServiceRequestDto>` |
| GET | `/service-requests` | `status?, assetnum?, location?, priority?, reportedby?, affectedperson?, classstructureid?, reportdateFrom?, reportdateTo?, descriptionContains?, longDescriptionContains?, siteid?, pageSize=50` | `List<MaximoServiceRequestDto>` |
| POST | `/service-requests` | body `CreateMaximoServiceRequestDto` | `MaximoServiceRequestDto` ("created") |
| GET | `/service-requests/{href}` | — | `MaximoServiceRequestDto` (null + "not found" if absent) |
| GET | `/assets/{assetnum}/work-orders` | `pageSize=50` | `List<MaximoWorkOrderDto>` |
| GET | `/work-orders` | `status?, worktype?, assetnum?, location?, priority?, leadCraft?, supervisor?, schedstartFrom?, schedfinishTo?, reportdateFrom?, reportdateTo?, descriptionContains?, longDescriptionContains?, wonumContains?, siteid?, pageSize=50` | `List<MaximoWorkOrderDto>` |
| GET | `/work-orders/{href}` | — | `MaximoWorkOrderDto` (null + "not found" if absent) |
| POST | `/work-orders/{href}/complete` | body `CompleteWorkOrderRequest` | `MaximoWorkOrderDto` ("completed"). Blank `laborcode` rows default to the signed-in user's Maximo personid. Errors → `400` with `NgApiResponse(null, message)`. |
| GET | `/work-orders/{href}/materials` | — | `List<MaximoMaterialTxnDto>` |
| POST | `/work-orders/{href}/return-material` | body `ReturnMaterialRequest` | `List<MaximoMaterialTxnDto>` (refreshed rows, "returned"). Errors → `400`. |
| POST | `/work-orders/{href}/issue-material` | body `IssueMaterialRequest` | `List<MaximoMaterialTxnDto>` (refreshed rows, "issued"). Errors → `400`. |
| GET | `/locations` | `q?, siteid?, pageSize=100` | `List<MaximoLocationDto>` |
| GET | `/work-types` | — | `List<Map<String,String>>` — static list: CM, PM, WAR, REG (each `{value,label}`). |
| GET | `/labor-people` | — | `List<Map<String,String>>` — active users with a Maximo personid, each `{name, personid}`, sorted by name. |
| GET | `/inventory` | `q?, siteid?, storeroom?, pageSize=50` | `List<MaximoInventoryItemDto>` |
| POST | `/parts-checkout` | body `PartsCheckoutRequest` | `PartsCheckoutResult` ("checked out"). Errors → `400`. |
| GET | `/bundle/lead-operators/work-orders` | `pageSize=100`, `status?` | `List<MaximoWorkOrderDto>` |
| GET | `/{parent}/{href}/worklog` | — | `List<MaximoWorklogDto>` |
| GET | `/{parent}/{href}/attachments` | — | `List<MaximoDoclinkDto>` |
| GET | `/{parent}/{href}/attachments/{attachmentId}/content` | — | `byte[]` — proxied binary with upstream `Content-Type`/`Content-Length` and `Content-Disposition: inline`. |
| POST | `/{parent}/{href}/attachments` | multipart `file` (`@RequestPart`), `doctype?` | `MaximoDoclinkDto` ("uploaded") |

**`{parent}` resolution** (`resolveParent`, case-insensitive): `asset`/`assets`/`mxasset` → `mxasset`; `sr`/`service-request`/`service-requests`/`mxapisr` → `mxapisr`; `wo`/`work-order`/`work-orders`/`mxapiwodetail` → `mxapiwodetail`; otherwise passthrough. The worklog endpoint dispatches separately: `sr|service-request|service-requests` → `listForSr`, `wo|work-order|work-orders` → `listForWo`, else empty list.

**`currentUserPersonid()`**: reads `SecurityContextHolder` principal; if it's a `CustomUserDetails`, looks up the `User` by id and returns `User.getMaximoPersonid()`, else null.

---

## 4. Adapters & services

### `MaximoOslcMapper` (static helpers)
Parses the OSLC envelope. Maximo wraps collection members in `rdfs:member` and prefixes fields with `spi:`.
- `members(envelope)` → list under `rdfs:member` (empty if absent).
- `hrefId(record)` → segment after the last `/` of `rdf:about`.
- `str(record, key)` → value at `spi:<key>` falling back to bare `<key>`.
- `strRaw(record, keys…)` → first non-null among already-prefixed keys (no `spi:` auto-prepend).
- `describedBy(record)` → nested `wdrs:describedBy` map (or the row itself) — for doclinks.
- `longVal` / `boolVal` → parse `spi:<key>` to `Long` (tolerates fractional, truncates) / `Boolean`.
- `words(query)` → split on whitespace into non-blank tokens.
- `andLike(field, words)` → AND-chained LIKE clause, each word wrapped `%word%`, e.g. ` and spi:location="%02%" and spi:location="%acc%"` (case-insensitive).

### `MaximoAssetAdapter` — OS `mxasset`
Asset lookup. `SELECT_FIELDS`: assetnum, description, siteid, location, status, assettype, assetid, parent, disabled.
- `search(assetnumPattern, siteid, pageSize)` — `assetnum LIKE %…%` AND `siteid` (AND-joined); both optional.
- `searchByTag(pattern, pageSize)` — `search` scoped to default site.
- `findByAssetnum(assetnum)` — exact assetnum + default site, pageSize 1, first match.
- `findByHref(href)` — GET `mxasset/{href}`.

### `MaximoServiceRequestAdapter` — OS `mxapisr`
SR query + create. `SELECT_FIELDS`: ticketid, description, description_longdescription, status, assetnum, location, siteid, reportedby, reportdate, classstructureid, reportedpriority, affectedperson.
- `listByStatus`, `listForAsset` — convenience wrappers around `listByCriteria`.
- `listByCriteria(c, pageSize)` — AND-chains: status, assetnum, location (`=`); reportedpriority (numeric, unquoted); reportedby, affectedperson, classstructureid (`=`); reportdate `>=`/`<=`; description / description_longdescription LIKE. Adds `siteid` (defaulted). `oslc.orderBy=-spi:reportdate`. Empty criteria → empty list (won't blast the site).
- `create(CreateMaximoServiceRequestDto)` — builds spi-prefixed payload (description, description_longdescription, assetnum, location, siteid[default], reportedby, classstructureid, reportedpriority, affectedperson) **plus `spi:class="SR"`** (required so Maximo creates an SR, not Incident/Problem). `postJson` then `map`.
- `findByHref(href)`.

### `MaximoWorkOrderAdapter` — OS `mxapiwodetail`
The richest adapter. `SELECT_FIELDS`: wonum, description, description_longdescription, status, worktype, assetnum, location, siteid, reportdate, targstartdate, schedstart, schedfinish, lead, supervisor, wopriority.
- `listForAsset`, `listByCriteria(c, pageSize)` — AND-chains status/worktype/assetnum/location (`=`), wopriority (numeric), lead (`=`), **leadIn** via OSLC `in [...]`, supervisor, schedstart `>=`, schedfinish `<=`, reportdate `>=`/`<=`, description/description_longdescription/wonum LIKE. Adds default site. `oslc.orderBy=-spi:reportdate`. Empty → empty list.
- `findByHref(href)`.
- `reportActuals(href, labor, summary, details, logtype)` — builds one MERGE payload: `spi:labtrans` rows (each `spi:laborcode` uppercased + optional `spi:regularhrs`); a single `spi:worklog` row (`spi:description`=summary[or "Note"], `spi:description_longdescription`=details, `spi:logtype`=logtype or **`CLIENTNOTE`**). No-op if nothing to add. Calls `addChildren`.
- `create(description, location, worktype, siteid)` — spi-prefixed `postJson`; new WO returns at status WAPPR.
- `addMaterials(href, lines, storeroom)` → `postMaterial(…, "ISSUE")`; `returnMaterials(…)` → `postMaterial(…, "RETURN")`.
- `postMaterial(...)` (private) — builds `spi:matusetrans` rows (`spi:itemnum`, `spi:quantity` positive, `spi:storeloc`=storeroom or **`WAREHOUSE1`**, `spi:issuetype`). Skips blank itemnum or qty ≤ 0. `addChildren` (MERGE).
- `listMaterials(href)` — GET `…/{href}/uxshowactualmaterial?oslc.select=*`; maps each row to `MaximoMaterialTxnDto` (matusetransid, itemnum, description, issuetype, storeloc, issueunit, quantity, linecost).
- `changeStatus(href, status, memo)` — `invokeAction(…, "wsmethod:changeStatus", {status, memo})`; status uppercased; memo optional.
- `completeWorkOrder(href, CompleteWorkOrderRequest)` — `reportActuals`, then if `complete != false` `changeStatus` to `status` (default **COMP**) with `memo`; returns `findByHref`.

Private query helpers: `addStr` (`=` quoted), `addNum` (`=` unquoted), `addStrOp` (operator + quoted, for dates), `addLike` (`=` + `%…%`), `addStrIn` (`in [..]`, mandatory square brackets), `escape` (escapes `"`).

### `MaximoDoclinksAdapter`
Attachments on a parent (`mxasset`/`mxapisr`/`mxapiwodetail`), sub-collection `doclinks`.
- `list(parentOS, parentHref)` — GET `…/doclinks`; maps via `describedBy` (metadata nested under `wdrs:describedBy`): href, document (`dcterms:identifier`/`spi:document`), title (`dcterms:title`), description (`dcterms:description`/`spi:description`), urlname (`spi:fileName`/`spi:urlname`), url (`spi:url`, WEB-type only), urltype, doctype, doclinksid (`docinfoid`), mimeType (`dcterms:format.rdfs:label`), size (`oslc_cm:attachmentSize`), created/modified dates, createby.
- `upload(parentOS, parentHref, fileName, contentType, bytes, doctype)` — OSLC **binary-body** upload (the multipart endpoint NPEs `BMXAA1649E` on this instance). Headers: `Content-Type`=mime (default octet-stream), `Accept: application/json`, `slug`=fileName, **`x-document-meta`=doctype** (plain string, default `Attachments`). Parses the new id from the `Location` response header (last segment); returns a stub `MaximoDoclinkDto`.
- `download(doclink)` — `getBytes(doclink.url)`.
- `streamBinary(parentOS, parentHref, doclinkId)` — GET `…/doclinks/{id}` with headers (`getBinaryWithHeaders`).

### `MaximoWorklogAdapter`
Worklog notes on a parent. **SR → sub-collection `uxworklog` under `mxapisr`; WO → `woworklog` under `mxapiwodetail`.** (Plain `worklog` on a WO returns the global table — not used for reads.) `listForSr` / `listForWo` → `list(…, oslc.select=*)`; maps to `MaximoWorklogDto` (href, worklogid, description, description_longdescription, logtype, logtype_description, createby, createdate, modifyby, modifydate, clientviewable, recordkey).

### `MaximoLocationAdapter` — OS `mxapioperloc`
Operating-location picker. `SELECT`: location, description, type, status, siteid.
- `search(query, siteid, pageSize)` — site condition always; if no words, one query; else two queries — `andLike("location", words)` and `andLike("description", words)` — **merged** (deduped by location code) because OSLC has no OR/parens. Sorted in Java by location code (ascending), capped to pageSize. (Java-side sort because Maximo's `oslc.orderBy` needs a `+`/`-` sign and Spring sends `+` as a literal space which Maximo rejects.)

### `MaximoInventoryAdapter`
Item/parts picker. `DEFAULT_STOREROOM = "WAREHOUSE1"`.
- `search(query, siteid, storeroom, pageSize)` — queries the **item master** `mxapiitem` (select itemnum, description, issueunit, status) with `spi:status="ACTIVE"`; no-words → one query, else two AND-word queries over `itemnum` and `description`, merged/deduped by itemnum. Sorted in Java by itemnum. Then `enrichBalances`.
- `enrichBalances(items, site, store)` — one batched call to `mxapiinventory` (select itemnum, curbal) with `siteid AND location=store AND itemnum in [...]`; sets `curbal` per item (descriptions come from the item master because `mxapiinventory`'s item join returns null on this instance).

### `MaximoBundleService`
Cross-source aggregation combining local `User` data with Maximo. `LEAD_OPERATOR_ROLE = "LEAD_OPERATOR"`.
- `leadOperators()` — active users with that role (filtered in memory since `users.role` is comma-separated), sorted by name.
- `leadOperatorWorkOrders(pageSize, status)` — collects lead operators' Maximo personids, sets `leadIn` on a WO criteria (single `in [...]` query) + optional status filter; empty if none have a personid. Overload without status.

### `MaximoPartsCheckoutService`
Orchestrates create → APPR → issue → COMP (validated live on WO J26-41383).
- `checkout(PartsCheckoutRequest)` — validates lines + location; (1) `workOrders.create(...)`; (2) `changeStatus(href, "APPR", memo)`; (3) `addMaterials(href, lines, storeroom)` (single additive MERGE); (4) `changeStatus(href, "COMP", memo)`; (5) reads back `wonum, status, actmatcost` and returns a `PartsCheckoutResult`. Material is issued only after APPR and right before COMP because issues decrement inventory immediately and cannot be deleted.

---

## 5. DTOs — `dto/maximo/`

All are Lombok POJOs (`@Getter/@Setter/@NoArgsConstructor` or `@Data`).

**Response / read DTOs**
- **`MaximoAssetDto`**: href, assetnum, description, siteid, location, status, assettype, assetid (Long), parent, disabled (Boolean).
- **`MaximoServiceRequestDto`**: href, ticketid, description, longDescription, status, assetnum, location, siteid, reportedby, reportdate, classstructureid, priority, affectedperson.
- **`MaximoWorkOrderDto`**: href, wonum, description, longDescription, status, worktype, assetnum, location, siteid, reportdate, targetStart (`spi:targstartdate`), schedstart, schedfinish, leadCraft (`spi:lead`), supervisor, priority (`spi:wopriority`).
- **`MaximoWorklogDto`**: href, worklogid (Long), description, longDescription, logtype, logtypeDescription, createby, createdate, modifyby, modifydate, clientviewable (Boolean), recordkey.
- **`MaximoDoclinkDto`**: href, document, title, description, urlname, url, urltype, doctype, doclinksid (Long), mimeType, size (Long), createdDate, modifiedDate, createby.
- **`MaximoLocationDto`**: href, location, description, type, status, siteid.
- **`MaximoInventoryItemDto`**: itemnum, description, issueunit, storeroom, curbal (Double; null when not stocked).
- **`MaximoMaterialTxnDto`**: matusetransid (Long), itemnum, description, issuetype (ISSUE/RETURN), storeloc, issueunit, quantity (Double, signed as Maximo stores it), linecost (Double, signed).
- **`PartsCheckoutResult`**: wonum, href, status, actmatcost (Double). `@AllArgsConstructor`.

**Criteria DTOs**
- **`MaximoServiceRequestCriteria`**: status, assetnum, location, priority (reportedpriority, numeric), reportedby, affectedperson, classstructureid, reportdateFrom, reportdateTo, descriptionContains, longDescriptionContains, siteid.
- **`MaximoWorkOrderCriteria`**: status, worktype, assetnum, location, priority (numeric), leadCraft (`lead`, exact), leadIn (`List<String>`, `in [...]`), supervisor, schedstartFrom, schedfinishTo, reportdateFrom, reportdateTo, descriptionContains, longDescriptionContains, wonumContains, siteid.

**Request DTOs**
- **`CreateMaximoServiceRequestDto`**: description, longDescription, assetnum, location, siteid (defaults to `maximo.default-site`), reportedby, classstructureid, priority, affectedperson.
- **`CompleteWorkOrderRequest`** (`@Data`): labor (`List<LaborEntry>`), summary, details, logtype (default CLIENTNOTE), complete (Boolean, default true in service), status (default COMP), memo. Nested **`LaborEntry`**: laborcode (uppercase personid; blank = signed-in user), regularhrs (Double).
- **`PartsCheckoutRequest`** (`@Data`): description, location, worktype, siteid (default JG), storeroom (default WAREHOUSE1), lines (`List<Line>`), memo. Nested **`Line`**: itemnum, quantity (Double).
- **`IssueMaterialRequest`** / **`ReturnMaterialRequest`** (`@Data`): lines (`List<PartsCheckoutRequest.Line>`), storeroom (default WAREHOUSE1).

**Identity**: `User.getMaximoPersonid()` (transient) returns `maximoPersonidOverride` (uppercased, trimmed) when set, else uppercased `windowsUsername`, else null — this equals the Maximo laborcode / `spi:lead` value.

---

## Verified OSLC behavior (live-probed)

**Auth.** Send only the `apikey` header. `MaximoConfig` builds the `RestTemplate` on a JDK `HttpClient` with a cookie-rejecting `CookieManager` (`CookiePolicy.ACCEPT_NONE`) so each call is apikey-only; otherwise Maximo prefers a credential-less `JSESSIONID` and returns `401 BMXAA0021E`.

**Updates / actions.** Use header `x-method-override: PATCH`. The older `X-HTTP-Method: PATCH` returns `400 oslc#create_on_updateuri` on this instance.

**Add child rows (labor / worklog / material).** POST the parent WO resource with `patchtype: MERGE` (NOT `AddChange`). MERGE is additive — it key-matches child rows by id, so a new keyless row is appended and existing rows are untouched. `AddChange` REPLACES the collection (deletes rows not in the payload): it silently destroyed a pre-existing worklog and returns `400 BMXAA1872E` ("a material issue/return transaction cannot be deleted") on a WO with posted material. The child array KEY and every field must be `spi:`-prefixed (`spi:labtrans`, `spi:worklog`, `spi:matusetrans`); unprefixed keys are silently dropped.

**Labor.** `spi:labtrans` rows need only `spi:laborcode` (= uppercase personid) + `spi:regularhrs`; Maximo derives craft, `transtype=WORK`, startdate, payrate, linecost.

**Worklog.** `spi:worklog` with `spi:description` (Summary), `spi:description_longdescription` (Details), `spi:logtype`. `logtype WORK` is invalid for a WO worklog (silently defaulted); `CLIENTNOTE` works. The read sub-collection URL path is `woworklog` but the inline write key is `spi:worklog`.

**Material issue.** `spi:matusetrans` with `spi:itemnum` + `spi:quantity` (positive) + `spi:storeloc` (storeroom, `WAREHOUSE1`). Stored as NEGATIVE usage; decrements `mxapiinventory.curbal` immediately even before COMP; cannot be deleted.

**Material return.** Same add but with `spi:issuetype="RETURN"` (default `ISSUE`); positive quantity stored positive with NEGATIVE linecost (credit); restores `curbal`. Works on a COMP WO. There is no standalone `mxapimatusetrans` OS (404) — returns go through the WO child collection like issues.

**Status change.** POST `<wo-url>?action=wsmethod:changeStatus` with `x-method-override: PATCH` and body `{"status":"COMP","memo":"..."}` (NOT spi-prefixed — these are method params). COMP is terminal via API: COMP→APPR (`BMXAA4679E`, must be WAPPR) and COMP→INPRG (`BMXAA4638E`, cannot be initiated) both `400`.

**Create WO.** POST `/oslc/os/mxapiwodetail` with `Properties: *` and an spi-prefixed body `{spi:description, spi:location, spi:worktype, spi:siteid}` → `201`; the new WO starts at WAPPR; the href is the last path segment of `rdf:about`.

**OSLC where.** NO parentheses (`400 BMXAA8744E` "Encountered '('"). OR is unreliable (bare `a or b` errors; `and..or..` mis-evaluates). Only all-AND is safe. Code-OR-description search ⇒ run one single-field query per field and merge in Java (Location/Inventory adapters). AND word-bucket ⇒ AND-chain LIKE per word within a field (one query), union across fields. OR-bucket would need per-word fan-out (not implemented).

**OSLC orderBy.** Requires a leading `+`/`-` sort sign, BUT Spring's `UriComponentsBuilder` sends `+` literal and the server URL-decodes it to a SPACE → Maximo rejects "`<space>spi:field`" ("Was expecting SORT_ORDER_SIGN at column 2"). `-spi:field` survives transport (descending date sorts use it). For ascending, OMIT `oslc.orderBy` and sort the small capped result list in Java (Location/Inventory adapters do this).

**Reference data (JG).** Locations = `mxapioperloc` (`spi:location`/`description`/`type`/`status`). Worktypes: the MXDOMAIN OS is NOT API-authorized (`BMXAA9301E`), so options are curated from values in use (`CM`/`PM`/`WAR`/`REG`). Items: master `mxapiitem` (`itemnum` + `description`, supports description LIKE) enriched with balance from `mxapiinventory` (`curbal`/`issueunit`, storeroom `WAREHOUSE1`); `mxapiinventory`'s item `{description}` join returns null so descriptions come from `mxapiitem` separately.

**Personid.** `User.getMaximoPersonid()` = explicit `maximoPersonidOverride` else uppercased `windowsUsername`; this equals the Maximo laborcode. Validated end-to-end on real WOs **J26-39380** (labor + worklog + COMP) and **J26-41383** (parts checkout: create → APPR → issue → COMP, plus a RETURN).