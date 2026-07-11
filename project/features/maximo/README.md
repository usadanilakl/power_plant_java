# Maximo Integration

Read/write integration between the plant app and IBM Maximo (OSLC REST). Lets operators view
Maximo assets / service requests / work orders, attach files, record labor + worklog, **check out
parts** (create a WO and issue material), **return/issue** material to correct mistakes, and
**complete** work orders — all from the Angular UI, without logging into Maximo.

## Docs in this folder
- **[oslc-verified-behavior.md](oslc-verified-behavior.md)** — the hard-won, live-probed OSLC rules
  (auth, MERGE-vs-AddChange, changeStatus, no-parens/OR, the orderBy `+` trap, reference-data
  sources). Start here before touching any Maximo query.
- **[inventory-checkout-api.md](inventory-checkout-api.md)** — parts-checkout / issue / return
  end-to-end, **plus the full test matrix proving `MATUSETRANS.QUANTITY` is read-only to the
  integration** (why a qty-N issue is sent as N single-unit rows), per-storeroom OBSOLETE status,
  and the exact object-structure fix a Maximo admin must make. Read before touching material issue.
- **[backend-reference.md](backend-reference.md)** — every adapter, service, REST endpoint, DTO, and
  the access facade.
- **[frontend-reference.md](frontend-reference.md)** — routes, pages, components, the api service,
  models, and UX patterns.
- **[pm-auto-assignment-design.md](pm-auto-assignment-design.md)** — design + phased plan for the
  upcoming PM auto-assignment feature (not yet built).

## Architecture in one breath
```
Angular (features/maximo) ──▶ NgMaximoController (/ng/maximo/*) ──▶ adapters (sevice/maximo)
                                                                   └▶ MaximoAccessService ──apikey──▶ Maximo OSLC
```
- `MaximoConfig` is gated by `@ConditionalOnProperty(name="maximo.api-key")`; with no key the whole
  feature (controller + beans) is absent. Secrets live in `application-secrets.properties`
  (`maximo.base-url`, `maximo.api-key`, `maximo.default-site=JG`).
- `MaximoAccessService` is the only thing that talks HTTP to Maximo (auth, GET/POST/PATCH/action,
  binary). Entity-specific logic lives in adapters; cross-source flows live in services
  (`MaximoBundleService`, `MaximoPartsCheckoutService`).
- Identity bridge: `User.getMaximoPersonid()` (explicit `maximoPersonidOverride` else uppercased
  `windowsUsername`) = the Maximo `laborcode` / `lead` personid.

## What was built in the 2026-06-28 session

**Complete a work order** (WO detail dialog → *Complete* tab)
- Record actual **labor** (person dropdown of plant people + hours) and a **worklog** (summary +
  details), then `changeStatus → COMP`. One call: `POST /ng/maximo/work-orders/{href}/complete`.

**Parts checkout** (new standalone page `/maximo/parts-checkout`)
- Pick location, description, work type; search inventory and add item lines; one **Check Out
  Parts** button runs the full Maximo flow: **create WO → APPR → issue material → COMP**, returning
  the WO number + material cost. `POST /ng/maximo/parts-checkout`.
- **Recent checkouts** panel (localStorage, last 15) — click a row to open that WO's dialog for
  corrections.

**Material return + issue** (WO detail dialog → *Materials* tab)
- Lists the WO's material transactions; **Return** any issued line (issuetype RETURN — credits cost,
  restores stock) and **Add a part (issue)** for a forgotten part or a swap. Works on a COMP WO.
- `GET /work-orders/{href}/materials`, `POST …/return-material`, `POST …/issue-material`.

**Reference-data search** (used by parts checkout)
- `GET /ng/maximo/locations`, `/work-types`, `/inventory`, `/labor-people` — debounced
  search-as-you-type with an **AND word-bucket** (e.g. `02 acc` → `02-ACC`). Implemented as
  per-field single queries merged in Java, because OSLC has no parens/OR.

**Lead Operator WOs page fixes**
- Was silently capped at 100 mixed-status rows and masked WOs (one prolific lead has 500+). Added a
  **status filter** (default APPR), raised the cap, an explicit **truncation warning**, and
  **auto-load on open**.

**Maximo table filter dropdown fix**
- The column-filter suggestion popover was a flex column with a capped height, so flexbox compressed
  the rows below their text height (overlapping/unreadable). Switched to a block scroll container.

See [oslc-verified-behavior.md](oslc-verified-behavior.md) for the API findings that made all of the
above work (MERGE-not-AddChange, the orderBy `+`→space trap, etc.).
