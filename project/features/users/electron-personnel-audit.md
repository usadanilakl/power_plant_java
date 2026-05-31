# Electron Personnel Section — Audit

Snapshot of the Electron-side personnel/contacts/schedule/gate-log code that informs the upcoming "Contractors" tab and backend persistence work.

## Personnel page

`electron-manager/src/renderer/src/app/pages/personnel/personnel.component.ts` (~545 lines)

**Tabs today:**
- **Schedule** (default) — "On Shift Now", "On Call Manager", month selector, full roster schedule table grouped by shift group (A/B/C/D/Rel/OCM).
- **Contacts** — emergency contact list (name, title, phone, secondary phone, emergency contact, relation).

**New Contractors tab** slots in cleanly: add another button to `.tabs` div + an `*ngIf="activeTab === 'contractors'"` content block. The async load pattern (`loadContacts()`) is already there to copy.

## Schedule (existing)

- **Source:** SharePoint Excel file `/sites/JG/External/60 - Operations/60.05 Ops schedule/{YEAR}/OPS Schedule {YEAR}.xlsx`.
- **Auth:** Direct SharePoint cert auth from Electron main process (`SharePointManager` — `electron-manager/src/main/managers/sharepoint.manager.ts`).
- **Parsing:** Excel → `PersonnelEntry[]` with 365-day shift code arrays (`D` day, `N` night, `U` unscheduled, `P` PTO, `T` training, `OCM` on-call manager).
- **Refresh:** Auto at 05:00 and 17:00 CT via timer; manual via `personnel:refresh` IPC.
- **Display:** Schedule table + month picker, "On Shift Now" derived from today's shift code, on-call manager pulled from `OCM` rows.

## Contacts (existing)

- **Source:** SharePoint Excel file `/sites/JG/External/10 - Administration/PERSONNEL/EMERGENCY CONTACT LIST - EDITED 11_2024.xlsx`.
- **Data shape:**
  ```ts
  { name; title?; phone?; secondaryPhone?;
    emergencyContact?; emergencyPhone?; emergencyRelation? }
  ```
- **IPC channel:** `personnel:get-contacts` (invoke) returns `PersonnelContact[]`.

There is also a `contacts-widget` on the home dashboard (`electron-manager/src/renderer/src/app/pages/home/widgets/contacts-widget.component.ts`) but it is **hardcoded static info** (Jackson Generation address, control room phone, radio channel) — no data binding.

## Gate Log (OnLocation integration)

`electron-manager/src/main/managers/gate-log.manager.ts` (~456 lines).

**Credentials:** `gate-log-config.json` in working dir (per-install config, gitignored). Keys:
- `onLocationApiKey` (user-provisioned)
- `onLocationBaseUrl` — `https://api.whosonlocation.com/v1`
- `gateWebUrl` — `https://10.56.80.80/` (LAN gate website)
- `autoRefresh`, `intervalMinutes`

**OnLocation endpoints called:**
- `GET /visitor/event` — visitor sign-in events
- `GET /sp/member/movement` — contractor movements (active when `signed_out == null`)
- `GET /sp/member` — contractor member directory (name, email, mobile, `sp_orgs[]`)
- `GET /sp/org` — contractor org names (id → company lookup)

**Caching:**
- Contractor member directory cached in memory + disk (`contractor-members-cache.json`, 1h TTL).
- Resilient fallback: stale cache used if fetch fails.

**Returned shape (`GateLogEntry`):**
```ts
{ name, company, checkIn?, checkOut?, location?, duration?,
  email?, phone?, source: 'gate' | 'onlocation' }
```

**IPC channels:**
- `gate-log:get-people` (invoke) → cached `GateLogEntry[]`
- `gate-log:get-status` (invoke) → `GateLogStatus`
- `gate-log:refresh` (invoke) → triggers fetch, returns entries
- `gate-log:set-auto-refresh` (invoke)
- `gate-log:get-config` / `gate-log:save-config`
- `gate-log:people-updated` (broadcast) — fired after auto-refresh

## SharePoint access from Electron

Electron has **direct** SharePoint cert-based auth — independent of the Spring Boot backend's own cert auth.

- Class: `SharePointManager` (`electron-manager/src/main/managers/sharepoint.manager.ts`)
- Auth: `ClientCertificateCredential` from `@azure/identity`
- Config file: `sharepoint-config.json` (per-install, gitignored)
- Token cache: 5-minute expiry buffer
- Used for: schedule Excel, emergency contacts Excel, TOI/TMOD files, PJM Day-Ahead Awards list

## IPC contract for personnel

In `electron-manager/src/main/ipc/handlers.ts` (~lines 1709–1735):

| Channel | Returns |
|---|---|
| `personnel:get-status` | `IpcResult<PersonnelStatus>` |
| `personnel:refresh` | `IpcResult<PersonnelStatus>` |
| `personnel:get-contacts` | `IpcResult<PersonnelContact[]>` |

`PersonnelStatus`:
```ts
{ status: 'available' | 'loading' | 'error';
  lastUpdate?: string; error?: string;
  onShiftNow: PersonnelEntry[];
  allPersonnel: PersonnelEntry[];
  currentShiftLabel: string; }
```

`PersonnelEntry`:
```ts
{ name; group; todayShift;
  schedule: { date; shift }[];
  groupByMonth?; monthOrder?; }
```

## Backend reachability

- Spring Boot manager exposes `getStatus()` via IPC — returns port + state.
- `syncStatusManager.getSyncStatus()` can be reused as a "is hub reachable" check.
- No dedicated "ping backend" call for personnel data exists today; we'll add a small helper or piggyback on sync status.

## Gaps for the upcoming work

**For the new Contractors tab:**
- No contractor-specific UI exists; gate-log mixes visitors + contractors.
- Need a new IPC channel (e.g. `personnel:get-contractors`) or reuse gate-log's member-directory output filtered to contractors only.
- No persistent UI state for contractor notes/assignment/status — display will be live + an optional "pending changes" panel pulled from backend.

**For backend persistence:**
- No POST/PUT handlers in Electron today for schedule or contacts — both are read-only.
- Need a thin "send-to-backend-when-running" layer: detect reachability, POST to `/ng/schedule/sync`, `/ng/contacts/sync`, `/ng/contractors/sync`; queue locally on failure.
- IPC handler additions in `handlers.ts`, renderer-side service in `app/services/`, preload bridge in `main.preload.ts`.

**For two-way SharePoint writes (later):**
- Current cert grants read access; SP list writes need `Contribute` permission on the relevant lists. Out of scope for this phase but worth noting.

## Decisions implied for the plan

1. **Display layer stays independent** — Electron continues pulling SP/OnLocation directly; backend persistence is an additive side-effect.
2. **The Contractors tab can reuse the existing OnLocation client** in `gate-log.manager.ts` — extract a `getContractors()` helper that filters/joins members + orgs, expose via new IPC channel.
3. **Backend needs its own OnLocation client** for the nightly reconciler — Electron's lives in a different process and isn't always running.
4. **No new SharePoint client on Electron** — schedule + contact fetching is already wired.
5. **Reachability check** — reuse `syncStatusManager.getSyncStatus()` rather than build a new ping.
6. **Personnel IPC contract pattern** — add `personnel:sync-to-backend` (invoke, returns success/queued) and broadcast `personnel:backend-synced` after drain.
