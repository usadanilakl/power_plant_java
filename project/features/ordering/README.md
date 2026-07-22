# Ordering

**Status:** Stages 1–4 built (email core + SharePoint ledger/catalog/provisioning + jg-portal UI + Electron launcher + Rounds→suggestion emission; both layers compile). Not yet live-verified. Last updated 2026-07-22.

A desktop section for placing vendor orders by email, viewing order history across every machine, and
acting on reorder suggestions raised from operator Rounds — **without depending on the plant hub/sync server.**

## Goals
1. View ordering history (consolidated across all desktops).
2. Place vendor orders (email to the vendor, per the [ordering catalog](../users/communication/email/email-reorder.mc)).
3. Surface reorder suggestions when a Rounds reading trips low (separate suggestions inbox).
4. One reorder flow reused everywhere — the existing chem-lab inventory PM and this new section share it.

## Guiding principle — independent of the hub
The feature runs entirely on a desktop's **local** backend (port 8082, started by Electron) plus **M365 cloud**
(email + SharePoint via the shared certificate). It does **not** use the CRDT sync bus and does **not** require the
central hub to be reachable. "In jg-portal" here means the local instance's UI — not the hub.

- **Cross-machine consistency** comes from a cloud **ledger** (a SharePoint list), not from sync.
- The only cloud dependency is M365 (already required to send the order email). If the plant hub/relay is down, ordering still works.

```
Desktop (local 8082) ──cert──▶ M365 Email (order → vendor)
                     └─cert──▶ SharePoint lists  (Orders ledger, OrderCatalog, OrderSuggestions)
Hub (Rounds submit) ──cert──▶ SharePoint OrderSuggestions   (producer only, at submit time)
```

## 1. Shared order-email core — BUILT (Stage 1)
Provider-neutral compose+send, extracted from `ChemInventoryReorderService` so every caller shares one path.

- `sevice/order/OrderEmailService.send(OrderRequestDto)` → `OrderResultDto`. Composes the HTML body and sends via
  `EmailFacadeService` (Graph API, manual-client fallback). Also `renderSummaryText(OrderRequestDto)` for a text record.
- `dto/order/OrderRequestDto` (to/cc/subject/poNumber/shipTo/greeting/intro/note/summaryTitle/lines/attachments),
  `OrderLineDto` (description/qty/unit), `OrderResultDto`.
- `ChemInventoryReorderService` is now an **adapter**: it still parses the `__instock/__desired/__include` + `cfg_*`
  form convention and attaches its inventory summary to the Maximo WO, but delegates compose+send to the core.
  The lab reorder email is **byte-identical** to before (verified: greeting/intro passed explicitly, no line units/note).
- The standalone Ordering caller (Stage 3) builds `OrderRequestDto` directly from the catalog + user picks — no form, no WO.

Gotcha carried forward: `EmailFacadeService` silently falls back to opening a local mail client if Graph API fails —
meaningless on a headless context. The standalone path may want to treat that as a hard failure.

## 2. Persistence — cloud ledger, no CRDT sync — BUILT (Stage 2)
Behind a small `OrderLedger` interface (`sevice/order/OrderLedger`) so the backing store is swappable.

- **`SharePointOrderLedger` (built)** — reads/writes three SharePoint lists via the certificate client
  (`SharePointCertificateAccess`, cert-only), off the CRDT bus. Columns are space-free PascalCase (internal name == Title,
  no `_x0020_`); JSON-shaped values live in multi-line NOTE columns. The lists are declared in
  `SharePointListProvisioner.getAllListDefinitions()` and self-provisioned on first use (`provisionSingle`, idempotent):
  - **Orders** — one row per sent order: `PwaId, OrderDate, OrderedBy, Vendor, CatalogItemKey, PoNumber, Recipient, Cc, Subject, LinesJson(note), EmailSent(bool), EmailError(note), SourceSuggestionId, Status`.
  - **OrderCatalog** — the vendor catalog (§3): `ItemKey, DisplayName, Vendor, ContactEmail, CcEmails, BodyNote(note), BlanketPoNumber, Unit, DefaultQtyPresets(note), TextOptions(note), Active(bool), SortOrder`. Upsert by `ItemKey` (read-then-decide; SharePoint has no native upsert).
  - **OrderSuggestions** — from Rounds (§5): `PwaId, SuggestedAt, CatalogItemKey, Source, RoundQuestionId, Reading, LowLimit, SuggestedQty, Reason(note), Status, ResultingOrderId`.
- **`MailboxOrderLedger` (documented alternative, not built)** — history = Graph read of tagged sent-items from
  `jgportal@jpowerusa.com`. Zero extra storage, but needs a new Graph **`Mail.Read`** app permission and a send-time tag to
  filter/parse, and can't hold the catalog. Drop-in via the same interface if you'd rather not stand up lists.
- A thin **local cache** (per desktop) of recent orders/suggestions for offline viewing is a Stage-3 refinement; the SharePoint list is authoritative.

Why not the CRDT sync bus: it would re-introduce the hub dependency and add `EntityTableRegistry`/`ServiceFacade`
registration + silent-drop risk — the opposite of the "independent of server" goal.

**Stage-2 surface (`NgOrderingController` @ `/ng/ordering`):** `GET /status`, `POST /catalog/seed`, `GET /catalog`,
`GET /orders`, `GET /suggestions?openOnly`. To bring the lists up on a machine with the certificate: `POST /ng/sharepoint/provision-lists`
(or the Admin "Create All Missing"; the ledger also self-provisions on first call), then `POST /ng/ordering/catalog/seed`.

## 3. Vendor catalog + seed
Catalog fields (from `email-reorder.mc`): itemKey, displayName, vendor, contactEmail, ccEmails, bodyNote, blanketPoNumber,
unit, defaultQtyPresets (JSON), textOptions (JSON — free/fixed/**seasonal** with month ranges), active, sortOrder.

Seed the 5 vendors (CO2, Hydrogen, Demin trailers, Demin chemicals=Bleach/Caustic/Sodium Bisulfite, Diesel/Gasoline) into
the OrderCatalog list on first run (idempotent upsert by itemKey). Data gaps to model nullable: Demin-trailers contact=TBD,
Hydrogen/Demin-trailers no unit, diesel EDG/DFP no default qty. Univar needs both a CC and a body note ("Tag @Greg Voigt in
body"). Encode diesel's Oct–Apr winterized note as a seasonal text option, not a hardcoded branch. Blanket PO#s (J25-35xx)
stay in the seed (business data, already in the committed `.mc`).

## 4. UI — jg-portal feature + Electron launcher — BUILT (Stage 3)
- `frontend/src/app/features/ordering/` — a single **`OrderingWorkbenchComponent`** (route `/ordering/workbench`) with four tabs:
  **Place Order** (pick a catalog item → line rows pre-filled from its presets, editable qty/unit → FIXED/SEASONAL text-option
  checkboxes + free note → confirm → send), **Order History** (`TableComponent` from the ledger), **Reorder Suggestions**
  (open suggestions with "Order this" → prefills Place Order + links the suggestion / "Dismiss"), **Catalog Admin** (`TableComponent`
  + a scalar-field editor + "Seed standard catalog"). Plain `models/ordering.model.ts` interfaces (not `BaseDto` — string-keyed
  ledger data) + `services/ordering.service.ts`. Registered in `routes/ordering.routes.ts`, `app.routes.ts` (fullAccessGuard), and
  a `GROUPED_MAIN_MENU` "Ordering" group. Reuses `TableComponent`/`MainLayoutComponent`/`RouterMenuComponent`; the dynamic
  place-order form and nested-JSON catalog editor are custom (they don't fit `SmartFormComponent`'s flat field-list).
- `NgOrderingController` @ `/ng/ordering`: `status`, `catalog[/seed]` (GET/POST/DELETE), `orders` (GET), `place-order` (POST),
  `suggestions` (GET) + `suggestions/{id}/status` (POST). `OrderingService.placeOrder` resolves the vendor from the catalog
  (recipient/cc/PO/body-note server-authoritative, never client-supplied), sends via `OrderEmailService`, records to the ledger,
  and marks a linked suggestion ORDERED on success.
- Electron: one sidebar entry in `electron-manager/.../layout/sidebar.component.ts` deep-linking the pid-app iframe
  `?path=ordering/workbench` (copies the "Lead Op WOs" item). No native manager page.
- **Stage-3 gaps (refinements):** the Catalog Admin editor edits scalar vendor fields only — presets/text-options are shown
  read-only and set via the seed (a preset/option editor is a follow-up). "Ordered by" is a free-text field (not yet auto-filled
  from the auth user). Known pre-existing Electron limit: `SpringBootUiComponent` reads the deep-link path once in its constructor,
  so switching between two `/pid-app` launchers without a reload won't re-navigate the iframe (shared by "Lead Op WOs").

## 5. Rounds-driven reorder suggestions — BUILT (Stage 4)
- `RoundQuestion.reorderCatalogKey` (nullable) maps a checkpoint to a catalog item (nothing did before — `physicalObjectId`
  is an asset). Set it in the desktop **round editor** (a "Reorder item key" field), plumbed through `RoundQuestionDto` +
  `UpdateQuestionRequest` + `RoundAdminService.updateQuestion`.
- Hook: `RoundPerformService.submit` at the issue-open point. It **recomputes `numericValue < lowLimit`** (`computeOutOfRange`
  returns a bare boolean and discards direction — a *high* trip must not suggest a reorder), collects a `ReorderSuggestionDto`,
  and emits it **after commit** (`TransactionSynchronization.afterCommit`) so the SharePoint write never runs inside/blocks the
  DB transaction and only fires when the round actually persists. Best-effort — a failure is logged, never breaks the submit.
  Fires once per low episode (tied to the issue-open, not the ongoing branch); requires `trackIssues=true` on the question.
- Delivery: `orderLedger.addSuggestion(...)` → SharePoint `OrderSuggestions` list. The desktop **Reorder Suggestions** tab
  (Stage 3) reads it → "Order this" prefills Place Order and marks the suggestion ORDERED on send. Hub is a producer at submit
  time only, never a runtime dependency of the desktop app.

## Build stages
1. ✅ Extract `OrderEmailService` core + repoint `ChemInventoryReorderService` (done, compiles, no behavior change).
2. ✅ `OrderLedger` + `SharePointOrderLedger` + `OrderCatalogSeeder` + 3 list definitions in `SharePointListProvisioner` + `NgOrderingController` (done, compiles). Live provision + seed pending (needs cert/network — see Open items).
3. ✅ jg-portal Ordering workbench (Place Order / History / Suggestions / Catalog Admin) + write endpoints + Electron launcher (done; frontend `ng build` + backend `mvn compile` clean). Live-verify pending.
4. ✅ `reorderCatalogKey` on `RoundQuestion` + editor field + after-commit suggestion emission from `RoundPerformService.submit` to the ledger (done; both layers compile). The Suggestions tab already consumes it. Live-verify pending.

## Open items / to verify (no guessing — confirm on the plant/Azure side)
- **Live verification of Stage 2** (needs the certificate + network — code compiles, not yet run live): boot a backend with the cert, `POST /ng/sharepoint/provision-lists` (creates the 3 lists), `POST /ng/ordering/catalog/seed`, then `GET /ng/ordering/catalog` to confirm the 5 vendors round-trip. The new beans depend only on existing SharePoint beans, so context wiring should be fine, but a boot smoke test hasn't been run here.
- Certificate app has SharePoint **write** to the target site (desktops already read/write SharePoint, so likely yes — confirm; provisionAll reports per-list errors rather than throwing).
- `getListItems` caps at `$top=5000` with no paging — fine now; add a `$filter`/skiptoken loop before Orders history can exceed 5000 rows.
- Only if choosing the mailbox alternative: grant Graph **`Mail.Read`** on the shared mailbox (scoped via application access policy).
